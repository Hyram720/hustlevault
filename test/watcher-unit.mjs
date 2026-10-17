// Pricing Watcher unit tests — offline (local fixture server on 127.0.0.1 only; no real emails, no AI calls).
// Run: node test/watcher-unit.mjs
import fs from "node:fs";
import http from "node:http";
import zlib from "node:zlib";
import { validateUrl, isPrivateIp, safeLookup, safeGet, robotsAllows, __allowLoopbackForTests } from "../netlify/lib/watcher/net.mjs";
import { extract, checkWatch, fetchPricingPage, DEFAULT_PLAN } from "../netlify/lib/watcher/core.mjs";
import { diffTiers, describeChange } from "../netlify/lib/watcher/diff.mjs";
import { validateAiTiers, htmlToLines, pricingRegion } from "../netlify/lib/watcher/extract.mjs";
import { alertEmail, sendEmail, emailConfigured } from "../netlify/lib/watcher/email.mjs";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };
const F = (n) => fs.readFileSync(new URL(`./fixtures/watcher/${n}.html`, import.meta.url), "utf8");
const throwsCode = async (fn, code) => { try { await fn(); return false; } catch (e) { return e.code === code; } };

// ---------- extraction ----------
const base = await extract(F("base"));
const names = base.tiers.map((t) => t.name).join(",");
ok(base.method === "parser" && names === "Business,Enterprise,Free,Pro,Starter", `base: 5 tiers extracted (${names})`);
const P = Object.fromEntries(base.tiers.map((t) => [t.key, t.prices[0]]));
ok(P.free.amount === 0 && P.free.period === "free" && P.starter.amount === 1900 && P.starter.period === "month" && P.pro.amount === 4900 && P.business.amount === 9900 && P.enterprise.period === "custom",
  "base: prices/periods normalized (Free, $19/mo, $49 per month, $99/month, Contact sales)");
ok(!base.tiers.some((t) => t.prices.some((p) => p.amount === 99900 || p.amount === 1000)), "base: price inside <script> and '(+$10 per 1,000)' footnote ignored");
ok(base.tiers.find((t) => t.key === "starter").limits.includes("5 projects"), "base: key limits captured for display");

// ---------- normalized diff per fixture ----------
const d = async (n) => diffTiers(base.tiers, (await extract(F(n))).tiers);
let c = await d("price-change"); ok(c.length === 1 && c[0].type === "price_changed" && c[0].to[0].amount === 5900, "price change detected: " + c.map(describeChange));
c = await d("tier-added"); ok(c.length === 1 && c[0].type === "tier_added" && c[0].tier === "Team", "tier added detected: " + c.map(describeChange));
c = await d("tier-removed"); ok(c.length === 1 && c[0].type === "tier_removed" && c[0].tier === "Business", "tier removed detected: " + c.map(describeChange));
c = await d("period-change"); ok(c.length === 2 && c.some((x) => x.type === "period_added" && x.period === "year") && c.some((x) => x.type === "period_removed"), "billing period change detected: " + c.map(describeChange).join("; "));
c = await d("wording-only"); ok(c.length === 0, "wording-only change (copy, badges, timestamps, build id): no diff");
c = await d("layout-change"); ok(c.length === 0, "layout-only change (cards -> table, reordered): no diff");
const js = await extract(F("js-rendered")); ok(js.noPrices && js.tiers.length === 0, "JS-rendered page: flagged as no prices (not 'all tiers removed')");

// ---------- confirm-before-alert flow ----------
const plan = { ...DEFAULT_PLAN };
let page = "base";
const deps = (extra = {}) => ({ fetchHtml: async () => F(page), now: Date.parse("2026-10-17T12:00:00Z"), ...extra });
let w = { id: "w_test", url: "https://example.com/pricing", label: "Acme", history: [] };
let r = await checkWatch(w, plan, deps()); w = r.watch;
ok(w.snapshot && w.status === "ok" && !r.alert && w.history[0].event === "baseline", "first check stores baseline, no alert");
ok(Date.parse(w.nextCheckAt) - Date.parse(w.lastCheckAt) === 24 * 3600e3, "next check scheduled 24 h later (daily)");
page = "wording-only"; r = await checkWatch(w, plan, deps()); w = r.watch;
ok(!r.alert && !w.pending && w.history[0].event === "no_price_change", "wording-only: no alert, nothing pending");
page = "layout-change"; r = await checkWatch(w, plan, deps()); w = r.watch;
ok(!r.alert && !w.pending, "layout-only: no alert, nothing pending");
page = "price-change"; r = await checkWatch(w, plan, deps()); w = r.watch;
ok(!r.alert && w.status === "pending" && w.pending.changes.length === 1, "price change seen once: pending, NOT alerted yet");
ok(Date.parse(w.nextCheckAt) - Date.parse(w.lastCheckAt) === 60 * 60e3, "pending change re-checked in 60 min to confirm");
r = await checkWatch(w, plan, deps()); w = r.watch;
ok(r.alert && r.alert.changes[0].type === "price_changed" && !w.pending && w.snapshot.tiers.find((t) => t.key === "pro").prices[0].amount === 5900, "price change seen twice in a row: alert + snapshot updated");
r = await checkWatch(w, plan, deps()); ok(!r.alert && r.watch.history[0].event === "unchanged", "same page again: no duplicate alert");
// A/B test / rotating promo: change appears once, then disappears
let w2 = (await checkWatch({ id: "w2", url: "https://x.com/p", history: [] }, plan, { ...deps(), fetchHtml: async () => F("base") })).watch;
w2 = (await checkWatch(w2, plan, { ...deps(), fetchHtml: async () => F("tier-added") })).watch;
ok(w2.status === "pending", "flip-flop: tier added once -> pending");
r = await checkWatch(w2, plan, { ...deps(), fetchHtml: async () => F("base") });
ok(!r.alert && !r.watch.pending && r.watch.history.some((h) => h.event === "pending_discarded"), "flip-flop: gone on re-check -> discarded, no alert (A/B test / promo noise)");
// different change on confirmation -> becomes new pending, not an alert
w2 = (await checkWatch(r.watch, plan, { ...deps(), fetchHtml: async () => F("tier-added") })).watch;
r = await checkWatch(w2, plan, { ...deps(), fetchHtml: async () => F("tier-removed") });
ok(!r.alert && r.watch.pending && r.watch.pending.changes[0].type === "tier_removed", "different change on re-check: restarts confirmation, no alert");
r = await checkWatch(r.watch, plan, { ...deps(), fetchHtml: async () => F("tier-removed") });
ok(r.alert && r.alert.changes[0].type === "tier_removed", "tier removed confirmed on 2nd sighting -> alert");
// JS page / fetch error never wipe the snapshot
r = await checkWatch(w, plan, { ...deps(), fetchHtml: async () => F("js-rendered") });
ok(!r.alert && r.watch.status === "no_prices" && r.watch.snapshot.tiers.length === 5, "JS-rendered response: status no_prices, snapshot kept, no alert");
r = await checkWatch(w, plan, { ...deps(), fetchHtml: async () => { const e = new Error("Couldn't reach the site"); e.code = "network"; throw e; } });
ok(!r.alert && r.watch.status === "error" && Date.parse(r.watch.nextCheckAt) - Date.parse(r.watch.lastCheckAt) === 3600e3, "fetch error: status error, retry in 1 h, no alert");

// ---------- AI path (fake model; no network) ----------
let calls = 0;
const fakeChat = (variant) => async () => { calls++; return { data: variant(calls), usage: { in: 1500, out: 200 } }; };
const good = () => ({ tiers: [{ name: "Free", price: 0, currency: "USD", period: "free" }, { name: "Starter", price: 19, currency: "USD", period: "month" }, { name: "Pro", price: 49, currency: "USD", period: "month" }, { name: "Business", price: 99, currency: "USD", period: "month" }, { name: "Enterprise", price: null, period: "custom" }, { name: "Ultra", price: 999, currency: "USD", period: "month" }, { name: "Pro", price: 44, period: "month" }] });
const ai = await extract(F("base"), { chat: fakeChat(good) });
ok(ai.method === "ai" && ai.tiers.length === 5 && ai.dropped === 2, `AI output validated against page text: hallucinated 'Ultra $999' and 'Pro $44' dropped (${ai.dropped} dropped)`);
ok(diffTiers(base.tiers, ai.tiers).length === 0, "AI and deterministic parser agree on base page");
calls = 0;
let wa = (await checkWatch({ id: "wa", url: "https://x.com/p", history: [] }, plan, { ...deps(), fetchHtml: async () => F("base"), chat: fakeChat(good) })).watch;
const before = calls;
r = await checkWatch(wa, plan, { ...deps(), fetchHtml: async () => F("base"), chat: fakeChat(good) });
ok(calls === before && r.watch.history[0].event === "unchanged", "unchanged page text: AI not called again (cost control)");
const wobble = (n) => (n % 2 ? { tiers: [...good().tiers.slice(0, 4), { name: "Enterprise", price: null, period: "custom" }].map((t) => (t.name === "Pro" ? { ...t, price: 59 } : t)) } : good());
calls = 0;
r = await checkWatch(wa, plan, { ...deps(), fetchHtml: async () => F("wording-only"), chat: fakeChat(wobble) });
ok(!r.alert && !r.watch.pending && r.watch.history[0].event === "extraction_unstable", "AI gives different answers on same text: treated as noise, nothing pending");
ok(r.watch.ai.calls >= 3, `AI usage tracked per watch (${r.watch.ai.calls} calls, ~$${((r.watch.ai.in * 0.15 + r.watch.ai.out * 0.6) / 1e6).toFixed(5)})`);
ok(validateAiTiers({ tiers: [{ name: "<img src=x onerror=alert(1)>Pro", price: 49 }] }, "Pro\n$49/mo").tiers.length === 0, "AI tier names not present in page are rejected");

// ---------- URL validation + SSRF ----------
const bad = ["file:///etc/passwd", "ftp://example.com/", "http://localhost/", "http://127.0.0.1/", "http://10.0.0.5/pricing", "http://169.254.169.254/latest/meta-data/", "http://[::1]/", "http://[fd00::1]/", "http://[::ffff:10.0.0.1]/", "https://user:pw@example.com/", "https://example.com:8443/", "http://intranet.corp/", "http://printer.local/", "http://0.0.0.0/", "http://100.64.1.1/", "javascript:alert(1)", "http://2130706433/"];
let allBad = true; for (const u of bad) { try { validateUrl(u); allBad = false; console.log("  not rejected:", u); } catch {} }
ok(allBad, `rejects ${bad.length} unsafe URLs (file:, private IPs, metadata IP, IPv6 ULA/loopback, creds, odd ports, .local/.corp, decimal IP)`);
ok(validateUrl("https://www.example.com/pricing#plans").href === "https://www.example.com/pricing", "accepts public https URL (fragment dropped)");
ok(["10.1.2.3", "172.20.0.1", "192.168.1.1", "127.0.0.1", "169.254.1.1", "::1", "fe80::1", "fc00::1", "::ffff:192.168.0.1", "64:ff9b::10.0.0.1", "224.0.0.1"].every(isPrivateIp) && !["8.8.8.8", "1.1.1.1", "2606:4700::1111", "172.32.0.1"].some(isPrivateIp), "isPrivateIp classifies private/public v4+v6");
ok(await new Promise((res) => safeLookup("localhost", {}, (e) => res(e?.code === "blocked_host"))), "DNS that resolves to loopback is refused at connect time (DNS-rebinding safe)");

// ---------- local fixture server (loopback allowed for tests only) ----------
let robots = "User-agent: *\nDisallow: /private\n\nUser-agent: HustleVaultPricingWatcher\nDisallow: /nobots\n";
const srv = http.createServer((q, s) => {
  if (q.url === "/robots.txt") return s.writeHead(200, { "content-type": "text/plain" }).end(robots);
  if (q.url === "/pricing") return s.writeHead(200, { "content-type": "text/html", "content-encoding": "gzip" }).end(zlib.gzipSync(F("base")));
  if (q.url === "/redirect-meta") return s.writeHead(302, { location: "http://169.254.169.254/latest/meta-data/" }).end();
  if (q.url === "/redirect-private") return s.writeHead(301, { location: "http://10.0.0.1/" }).end();
  if (q.url === "/cf") return s.writeHead(403, { server: "cloudflare", "content-type": "text/html" }).end("<title>Just a moment...</title>");
  if (q.url === "/huge") { s.writeHead(200, { "content-type": "text/html" }); return s.end("x".repeat(3_000_000)); }
  if (q.url === "/pdf") return s.writeHead(200, { "content-type": "application/pdf" }).end("%PDF");
  if (q.url === "/ua") return s.writeHead(200, { "content-type": "text/html" }).end(q.headers["user-agent"]);
  s.writeHead(404).end("nope");
});
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const B = `http://127.0.0.1:${srv.address().port}`;
const cacheMap = new Map(); const cache = { get: async (k) => cacheMap.get(k), set: async (k, v) => cacheMap.set(k, v) };
ok((await throwsCode(() => fetchPricingPage(B + "/pricing"), "bad_url")) && (await throwsCode(() => fetchPricingPage("http://127.0.0.1/pricing"), "blocked_host")), "without the test switch, even our own loopback server is blocked");
__allowLoopbackForTests(true);
const html = await fetchPricingPage(B + "/pricing", { robotsCache: cache });
ok((await extract(html)).tiers.length === 5, "fetches gzip page through safe client and extracts tiers");
ok(String((await safeGet(B + "/ua")).body).includes("HustleVaultPricingWatcher/1.0"), "identifies itself with a clear User-Agent");
ok(await throwsCode(() => fetchPricingPage(B + "/redirect-meta", { robotsCache: cache }), "blocked_host"), "redirect to cloud metadata IP blocked");
ok(await throwsCode(() => fetchPricingPage(B + "/redirect-private", { robotsCache: cache }), "blocked_host"), "redirect to private 10.x blocked");
ok(await throwsCode(() => fetchPricingPage(B + "/nobots", { robotsCache: cache }), "robots"), "robots.txt group for our bot is honored (Disallow /nobots)");
ok(await throwsCode(() => fetchPricingPage(B + "/cf", { robotsCache: cache }), "bot_blocked"), "Cloudflare challenge detected -> 'blocked', no bypass attempt");
ok(await throwsCode(() => fetchPricingPage(B + "/huge", { robotsCache: cache }), "too_large"), "pages over 2 MB refused");
ok(await throwsCode(() => fetchPricingPage(B + "/pdf", { robotsCache: cache }), "not_html"), "non-HTML content refused");
robots = "User-agent: *\nDisallow: /\n"; cacheMap.clear();
ok(await throwsCode(() => fetchPricingPage(B + "/pricing", { robotsCache: cache }), "robots"), "robots.txt 'Disallow: /' for * honored");
ok(robotsAllows("User-agent: *\nDisallow: /\nAllow: /pricing", "/pricing") && !robotsAllows("User-agent: *\nDisallow: /pri*", "/pricing") && robotsAllows("User-agent: *\nDisallow:", "/pricing") && robotsAllows("", "/x") && robotsAllows("User-agent: *\nDisallow: /pricing$", "/pricing/team"),
  "robots rules: longest match wins, wildcards, $ anchor, empty Disallow");
__allowLoopbackForTests(false);

// ---------- email (mock Resend endpoint; nothing real is sent) ----------
const alert = { url: "https://acme.com/pricing", label: "Acme", changes: diffTiers(base.tiers, (await extract(F("price-change"))).tiers), firstSeenAt: "2026-10-17T12:00:00Z", confirmedAt: "2026-10-17T13:00:00Z" };
const em = alertEmail(alert, { unsubscribeUrl: "https://hustlevault.app/api/watcher/unsubscribe?t=abc" });
ok(/Acme/.test(em.subject) && em.text.includes("Pro: $49/month → $59/month") && em.html.includes("Stop these emails") && em.text.includes("unsubscribe?t=abc"), "alert email: subject, change line, unsubscribe link");
delete process.env.HV_RESEND_API_KEY; delete process.env.HV_EMAIL_FROM;
ok(!emailConfigured(), "email reports not configured when HV_RESEND_API_KEY/HV_EMAIL_FROM unset");
let got = null;
const mock = http.createServer(async (q, s) => { let b = ""; for await (const ch of q) b += ch; got = { auth: q.headers.authorization, body: JSON.parse(b) }; s.writeHead(200, { "content-type": "application/json" }).end('{"id":"mock_1"}'); });
await new Promise((r) => mock.listen(0, "127.0.0.1", r));
process.env.HV_RESEND_API_URL = `http://127.0.0.1:${mock.address().port}/emails`; process.env.HV_RESEND_API_KEY = "re_test_dummy"; process.env.HV_EMAIL_FROM = "Hustle Vault <alerts@example.com>";
const id = await sendEmail({ to: "owner@example.com", ...em, unsubscribeUrl: "https://hustlevault.app/api/watcher/unsubscribe?t=abc" });
ok(id === "mock_1" && got.auth === "Bearer re_test_dummy" && got.body.to[0] === "owner@example.com" && got.body.headers["List-Unsubscribe"].includes("unsubscribe"), "Resend REST payload correct (mock server) incl. List-Unsubscribe header");
delete process.env.HV_RESEND_API_KEY; delete process.env.HV_EMAIL_FROM; delete process.env.HV_RESEND_API_URL;

srv.close(); mock.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

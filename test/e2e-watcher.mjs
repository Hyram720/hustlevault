// Pricing Watcher end-to-end against local `netlify dev` (never production). No real emails are sent:
// run with HV_RESEND_API_KEY/HV_EMAIL_FROM unset so alerts land in-app with "not configured".
// Start: HV_WATCHER_ALLOW_LOOPBACK=1 netlify dev --port 8899 ...   Run: BASE=http://localhost:8899 HV_ADMIN_PW=... node test/e2e-watcher.mjs
import http from "node:http";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const BASE = process.env.BASE || "http://localhost:8899";
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(BASE)) { console.error("e2e-watcher runs against local netlify dev only"); process.exit(2); }
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };
const F = (n) => fs.readFileSync(new URL(`./fixtures/watcher/${n}.html`, import.meta.url), "utf8");
let page = "base";
const fx = http.createServer((q, s) => {
  if (q.url === "/robots.txt") return s.writeHead(200, { "content-type": "text/plain" }).end("User-agent: *\nDisallow: /secret\n");
  if (q.url.startsWith("/pricing")) return s.writeHead(200, { "content-type": "text/html" }).end(F(page));
  if (q.url === "/app") return s.writeHead(200, { "content-type": "text/html" }).end(F("js-rendered"));
  s.writeHead(404).end();
});
await new Promise((r) => fx.listen(0, "127.0.0.1", r));
const FX = `http://127.0.0.1:${fx.address().port}`;

let token = "";
const call = async (path, { method = "GET", body, auth = true } = {}) => {
  const r = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get("content-type") || "";
  return { s: r.status, d: ct.includes("json") ? await r.json().catch(() => null) : await r.text(), h: r.headers };
};

// Public view
let r = await call("/api/apps", { auth: false });
const pw = r.d.apps.find((a) => a.id === "pricing-watcher");
ok(pw && pw.status === "soon" && !pw.buyable, "public catalog lists Pricing Watcher as Coming soon, not buyable");
r = await call("/api/apps/checkout", { method: "POST", body: { appId: "pricing-watcher", inputs: {} }, auth: false });
ok(r.s >= 400, `public checkout for pricing-watcher refused (${r.s})`);
// Auth required everywhere
for (const [p, m] of [["/api/watcher/state", "GET"], ["/api/watcher/watch", "POST"], ["/api/watcher/check", "POST"], ["/api/watcher/settings", "PUT"], ["/api/watcher/watch?id=w_aaaaaaaaaaaa", "DELETE"]]) {
  r = await call(p, { method: m, body: m === "GET" || m === "DELETE" ? undefined : { url: FX + "/pricing" }, auth: false });
  ok(r.s === 401, `${m} ${p.split("?")[0]} without admin session -> 401`);
}
token = "eyJleHAiOjk5OTk5OTk5OTk5OTl9.forged";
ok((await call("/api/watcher/state")).s === 401, "forged admin token -> 401");
// Sign in with the existing admin login
r = await call("/api/hv-admin/login", { method: "POST", body: { password: process.env.HV_ADMIN_PW }, auth: false });
token = r.d?.token || "";
ok(r.s === 200 && token, "admin sign-in (existing /api/hv-admin/login)");

r = await call("/api/watcher/state");
ok(r.s === 200 && r.d.settings.alertEmail === "" && r.d.settings.emailConfigured === false, "state: alert email empty by default; email reported not configured");
// clean slate
for (const w of r.d.watches) await call(`/api/watcher/watch?id=${w.id}`, { method: "DELETE" });

// Validation / SSRF through the API
for (const u of ["http://169.254.169.254/latest/meta-data/", "http://10.0.0.1/pricing", "file:///etc/passwd", "http://localhost.internal/", "not a url"]) {
  r = await call("/api/watcher/watch", { method: "POST", body: { url: u } });
  ok(r.s === 400, `add rejected: ${u} (${r.d?.error})`);
}
r = await call("/api/watcher/watch", { method: "POST", body: { url: FX + "/secret" } });
ok(r.s === 400 && /robots/i.test(r.d.error), "add rejected when robots.txt disallows the page");
ok((await call("/api/watcher/settings", { method: "PUT", body: { alertEmail: "nope@" } })).s === 400, "invalid alert email rejected");

// Add + baseline
page = "base";
r = await call("/api/watcher/watch", { method: "POST", body: { url: FX + "/pricing", label: "Acme" } });
const id = r.d?.watch?.id;
ok(r.s === 200 && r.d.watch.status === "ok" && r.d.watch.tiers.length === 5, `watch added + baseline (${r.d?.watch?.tiers?.length} plans, method ${r.d?.watch?.method})`);
ok((await call("/api/watcher/watch", { method: "POST", body: { url: FX + "/pricing" } })).s === 400, "duplicate URL rejected");
r = await call("/api/watcher/watch", { method: "POST", body: { url: FX + "/app", label: "JS app" } });
ok(r.s === 200 && r.d.watch.status === "no_prices", "JS-rendered page added but flagged 'no prices in HTML'");
const jsId = r.d.watch.id;

// Wording-only and layout-only: no alert
page = "wording-only"; r = await call("/api/watcher/check", { method: "POST", body: { id } });
ok(r.s === 200 && !r.d.alert && r.d.watch.status === "ok" && !r.d.watch.pending, "wording-only change: no alert");
page = "layout-change"; r = await call("/api/watcher/check", { method: "POST", body: { id } });
ok(!r.d.alert && !r.d.watch.pending, "layout-only change: no alert");
// Price change: pending, then confirmed
page = "price-change"; r = await call("/api/watcher/check", { method: "POST", body: { id } });
ok(!r.d.alert && r.d.watch.status === "pending", "price change first sighting: pending, no alert");
r = await call("/api/watcher/check", { method: "POST", body: { id } });
ok(r.d.alert && r.d.alert.emailStatus === "no_recipient" && r.d.alert.changes[0].type === "price_changed", "confirmed on 2nd fetch: alert stored (no recipient set -> shown in app)");
// Set email (env not configured) -> next alert stored as not_configured, nothing sent
ok((await call("/api/watcher/settings", { method: "PUT", body: { alertEmail: "owner@example.com" } })).d.settings.alertEmail === "owner@example.com", "alert email saved in settings");
page = "tier-added"; await call("/api/watcher/check", { method: "POST", body: { id } });
r = await call("/api/watcher/check", { method: "POST", body: { id } });
ok(r.d.alert && r.d.alert.emailStatus === "not_configured" && r.d.alert.changes.some((c) => c.type === "tier_added"), "tier added alert: 'email not configured', stored in app (no email sent)");
page = "tier-added"; r = await call("/api/watcher/check", { method: "POST", body: { id } });
ok(!r.d.alert, "no duplicate alert for the same change");
r = await call("/api/watcher/state");
ok(r.d.alerts.length === 2 && r.d.alerts[0].changes.some((c) => c.type === "tier_added"), "alert history lists both alerts, newest first");
ok(r.d.watches.find((w) => w.id === id).tiers.some((t) => t.name === "Team"), "snapshot now includes the new Team plan");

// Scheduled function: runs cleanly and leaves watches that aren't due alone (they were just checked)
const checksBefore = (await call("/api/watcher/state")).d.watches.find((w) => w.id === id).checks;
let out = "", invokeOk = true;
try { out = execFileSync("netlify", ["functions:invoke", "watcher-scheduled", "--port", new URL(BASE).port, "--no-identity"], { encoding: "utf8", timeout: 60000 }); } catch (e) { invokeOk = false; out = String(e.stdout || e.message); }
const checksAfter = (await call("/api/watcher/state")).d.watches.find((w) => w.id === id).checks;
ok(invokeOk && checksAfter === checksBefore, `scheduled run invoked; not-due watch skipped (checks ${checksBefore} -> ${checksAfter})`);

// Unsubscribe link: bad token refused, then remove + cleanup
ok((await call("/api/watcher/unsubscribe?t=" + "x".repeat(32), { auth: false })).s === 400, "unsubscribe with wrong token refused");
ok((await call(`/api/watcher/watch?id=${jsId}`, { method: "DELETE" })).s === 200 && (await call(`/api/watcher/watch?id=${id}`, { method: "DELETE" })).s === 200, "watches removed");
r = await call("/api/watcher/state");
ok(r.d.watches.length === 0, "no watches left");
await call("/api/watcher/settings", { method: "PUT", body: { alertEmail: "" } });

fx.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

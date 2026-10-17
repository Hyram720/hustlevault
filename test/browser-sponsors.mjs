// Real-browser checks: bottom bar (house ad / sponsor ticker), mobile 390px overflow, admin UI CRUD,
// inquiry form, blog editor preview. Usage: BASE=... ADMIN_PW=... CHROME=/usr/bin/google-chrome node test/browser-sponsors.mjs
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import fs from "node:fs";

const BASE = process.env.BASE || "http://localhost:8888", PW = process.env.ADMIN_PW, SHOTS = process.env.SHOTS || "/workspace/hustlevault";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 hv-e2e";
const page = await browser.newPage();
await page.setUserAgent(UA);
const mobile = () => page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const desktop = () => page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
const go = async (p) => { await page.goto(BASE + p, { waitUntil: "networkidle0", timeout: 45000 }); await sleep(400); };
const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const bar = () => page.evaluate(() => { const b = document.querySelector("[data-hv-bar]"); return b ? { kind: b.dataset.hvBar, h: b.getBoundingClientRect().height, pad: document.body.style.paddingBottom, text: b.innerText } : null; });
const waitBar = async (ms = 6000) => { try { await page.waitForSelector("[data-hv-bar]", { timeout: ms }); } catch { /* none */ } return bar(); };
const api = async (path, opts = {}) => (await fetch(BASE + path, { ...opts, headers: { "Content-Type": "application/json", "User-Agent": UA, ...(opts.headers || {}) } })).json();

// No sponsors: house bar on public pages, not on /sponsors, /admin or purchase pages
const tok = (await api("/api/hv-admin/login", { method: "POST", body: JSON.stringify({ password: PW }) })).token;
const A = { Authorization: `Bearer ${tok}` };
// clear leftovers from an interrupted earlier run
for (const s of (await api("/api/hv-admin/sponsors", { headers: A })).sponsors.filter((x) => /^TEST/.test(x.name))) await fetch(`${BASE}/api/hv-admin/sponsors?id=${s.id}`, { method: "DELETE", headers: A });
for (const q of (await api("/api/hv-admin/inquiries", { headers: A })).inquiries.filter((x) => /^TEST/.test(x.business || ""))) await fetch(`${BASE}/api/hv-admin/inquiries?id=${q.id}`, { method: "DELETE", headers: A });
const live = (await api("/api/sponsors")).sponsors;
ok(Array.isArray(live), `start: ${live.length} live sponsors`);

for (const vp of [["mobile", mobile], ["desktop", desktop]]) {
  await vp[1]();
  for (const p of ["/", "/sponsors", "/sponsors/policy", "/blog", "/blog/best-side-hustles-2026", "/apps/first-sale-blueprint", "/terms.html"]) {
    await go(p);
    ok((await overflow()) <= 0, `${vp[0]} ${p}: no horizontal scroll`);
  }
}
await mobile(); await go("/");
let b = await waitBar();
if (!live.length) ok(b?.kind === "house" && /Your business here/.test(b.text) && /Advertise/.test(b.text) && b.h <= 48 && b.pad === "48px", "no sponsors: slim house bar shown with copy, body padded");
ok(await page.evaluate(() => !!document.querySelector('footer a[href="/sponsors"]') && /Market your business here/.test(document.body.innerText)), "home: footer Advertise link + callout card");
ok(await page.evaluate(() => [...document.querySelectorAll("footer a")].some((a) => a.textContent.includes("Blog"))), "home: footer Blog link");
await page.waitForFunction(() => { const x = document.querySelector(".hv-bar-x"); if (!x) return false; const r = x.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === x; }, { timeout: 30000 }).catch(() => {}); // home intro video overlays everything first
await page.screenshot({ path: `${SHOTS}/home-mobile-housebar.png` });
await page.click(".hv-bar-x"); await sleep(200);
ok(!(await bar()) && (await page.evaluate(() => document.body.style.paddingBottom)) === "", "dismiss × hides bar and removes padding");
await go("/blog"); await sleep(2500);
ok(!(await bar()), "dismissal remembered for the session (next page)");
const p2 = await browser.newPage(); await p2.setUserAgent(UA);
for (const p of ["/admin", "/my", "/success", "/sponsors"]) {
  await p2.goto(BASE + p, { waitUntil: "networkidle0" }); await sleep(2500);
  ok(!(await p2.$("[data-hv-bar]")) || (p === "/sponsors" && live.length), `no bottom bar on ${p}`);
}
await p2.close();

// Sponsors page (empty) screenshots
await desktop(); await go("/sponsors");
ok(await page.evaluate(() => document.querySelectorAll("h1").length === 1 && /Your logo here/.test(document.body.textContent) && /Sponsor slot: \$100\/month/.test(document.body.textContent)), "/sponsors: one H1, placeholders, price");
ok(await page.evaluate(() => [...document.querySelectorAll("nav a")].some((a) => a.textContent === "Advertise")), "/sponsors: Advertise in main menu");
await page.screenshot({ path: `${SHOTS}/sponsors-shot-desktop.png`, fullPage: true });
await mobile(); await go("/sponsors");
await page.screenshot({ path: `${SHOTS}/sponsors-shot-mobile.png`, fullPage: true });
for (const p of ["/", "/blog", "/sponsors/policy", "/apps/first-sale-blueprint", "/terms.html"]) {
  await go(p);
  ok(await page.evaluate(() => [...document.querySelectorAll("a")].some((a) => /\/sponsors$/.test(a.getAttribute("href") || "") && /Advertise/i.test(a.textContent))), `${p}: Advertise link present`);
}

// Inquiry form through the UI (TEST), then delete
await desktop(); await go("/sponsors#inquire");
const logoFile = "/tmp/hv-test-logo.png";
fs.writeFileSync(logoFile, await sharp({ create: { width: 600, height: 200, channels: 4, background: { r: 201, g: 168, b: 76, alpha: 1 } } }).composite([{ input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200"><text x="40" y="130" font-size="96" font-family="Arial" font-weight="bold" fill="#05050A">TEST CO</text></svg>') }]).png().toBuffer());
await sleep(2700); // time-trap
await page.type("#sp-name", "TEST Browser"); await page.type("#sp-business", "TEST Browser Co"); await page.type("#sp-email", "test@example.com");
await page.type("#sp-website", "https://example.com"); await page.type("#sp-promoting", "TEST — automated browser check");
const fileInput = await page.$("#sp-logo"); await fileInput.uploadFile(logoFile);
await page.click('input[type="checkbox"][required]');
await page.click('button[type="submit"]');
await page.waitForSelector(".hv-sp-done", { timeout: 30000 }).catch(() => {});
ok(await page.evaluate(() => /we got your message/i.test(document.body.innerText)), "inquiry form submits from the browser (with logo upload)");
const inqs = (await api("/api/hv-admin/inquiries", { headers: A })).inquiries.filter((q) => q.business === "TEST Browser Co");
ok(inqs.length === 1 && inqs[0].logo, "browser inquiry stored with uploaded logo");

// Admin UI: create a sponsor through the Sponsors tab
await page.goto(BASE + "/admin", { waitUntil: "networkidle0" });
await page.type("#pw", PW); await page.click('button.hv-btn'); await page.waitForSelector('[data-tab="sponsors"]', { timeout: 20000 });
await page.click('[data-tab="sponsors"]'); await page.waitForSelector('[data-testid="sponsor-add"]', { timeout: 20000 });
await page.click('[data-testid="sponsor-add"]'); await sleep(300);
const set = async (name, v) => { await page.$eval(`input[name="${name}"]`, (el) => { el.value = ""; }); await page.type(`input[name="${name}"]`, v); };
await set("name", "TEST Ticker Co"); await set("offer", "TEST: free starter consult for new businesses"); await set("tickerLine", "TEST free consult"); await set("url", "https://example.com/ticker"); await set("sort", "1");
const lf = await page.$('[data-testid="logo-file"]'); await lf.uploadFile(logoFile);
await page.waitForFunction(() => /Uploaded ✓/.test(document.body.innerText), { timeout: 30000 }).catch(() => {});
await page.click('[data-testid="sponsor-save"]');
await page.waitForSelector('[data-name="TEST Ticker Co"]', { timeout: 20000 }).catch(() => {});
ok(!!(await page.$('[data-name="TEST Ticker Co"]')), "admin UI: sponsor created via Sponsors tab");
ok(await page.evaluate(() => /Welcome email/.test(document.querySelector('[data-name="TEST Ticker Co"]')?.innerText || "")), "admin UI shows welcome email status");
ok(await page.evaluate(() => { const r = document.querySelector('[data-name="TEST Ticker Co"]'); return !!r && [...r.querySelectorAll("button")].some((x) => x.textContent === "Copy") && !!r.querySelector('a[href^="mailto:"]'); }), "admin UI: Copy + Email links (mailto) buttons");
await page.screenshot({ path: `${SHOTS}/admin-sponsors-shot.png`, fullPage: false });
const created = (await api("/api/hv-admin/sponsors", { headers: A })).sponsors.find((s) => s.name === "TEST Ticker Co");

// Ticker with a live sponsor
const p3 = await browser.newPage(); await p3.setUserAgent(UA);
await p3.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
await p3.goto(BASE + "/blog", { waitUntil: "networkidle0" });
for (let i = 0; i < 3 && !(await p3.waitForSelector('[data-hv-bar="ticker"]', { timeout: 8000 }).catch(() => null)); i++) await p3.reload({ waitUntil: "networkidle0" });
await sleep(300);
const tk = await p3.evaluate(() => { const b = document.querySelector('[data-hv-bar="ticker"]'); if (!b) return null; const a = b.querySelector("a.hv-ti:not(.hv-dup)"); const img = a?.querySelector("img"); return { label: b.textContent.includes("Sponsored"), rel: a?.getAttribute("rel"), target: a?.target, href: a?.getAttribute("href"), imgH: img?.getBoundingClientRect().height, anim: getComputedStyle(b.querySelector(".hv-tt")).animationName, pad: document.body.style.paddingBottom, over: document.documentElement.scrollWidth - innerWidth }; });
ok(tk && tk.label && tk.rel === "sponsored noopener" && tk.target === "_blank" && /^\/go\/sponsor\/sp_/.test(tk.href) && Math.round(tk.imgH) === 32 && tk.anim === "hvtick" && tk.pad === "48px" && tk.over <= 0, `ticker: Sponsored label, rel/target, 32px logo, animating, padded, no overflow (${JSON.stringify(tk)})`);
await p3.screenshot({ path: `${SHOTS}/ticker-mobile.png` });
await p3.hover(".hv-bar"); await sleep(200);
ok(await p3.evaluate(() => getComputedStyle(document.querySelector(".hv-tt")).animationPlayState === "paused"), "ticker pauses on hover");
await p3.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]); await sleep(200);
ok(await p3.evaluate(() => getComputedStyle(document.querySelector(".hv-tt")).animationName === "none"), "ticker static with prefers-reduced-motion");
await p3.goto(BASE + "/sponsors", { waitUntil: "networkidle0" }); await sleep(2600);
ok(await p3.evaluate(() => { const c = document.querySelector(".hv-sp-card"); const img = c?.querySelector("img"); return !!c && /Sponsored/.test(c.textContent) && img && getComputedStyle(img).objectFit === "contain" && !!c.querySelector('a[rel="sponsored noopener"][target="_blank"]'); }), "wall card: Sponsored label, contained logo, sponsored link");
await p3.setViewport({ width: 1280, height: 900 }); await p3.reload({ waitUntil: "networkidle0" }); await sleep(2500);
await p3.screenshot({ path: `${SHOTS}/sponsors-with-test-sponsor-desktop.png`, fullPage: true });
await p3.goto(BASE + "/", { waitUntil: "networkidle0" }); await sleep(1500);
ok(await p3.evaluate(() => !!document.querySelector("section[aria-label=\"Sponsored by\"] a[rel=\"sponsored noopener\"]")), "home 'Sponsored by' strip appears with an active sponsor");
await p3.evaluate(() => dispatchEvent(new Event("pagehide"))); await sleep(800);
await p3.close();
await sleep(1500);
const st = await api(`/api/hv-admin/sponsor-stats?id=${created?.id}&days=7`, { headers: A });
ok(st.totals && st.totals.all.imp >= 1, `impressions recorded from the real browser (${JSON.stringify(st.totals?.all)})`);

// Blog editor preview (no save)
await page.click('[data-tab="blog"]'); await page.waitForSelector('[data-testid="post-new"]', { timeout: 15000 });
await page.click('[data-testid="post-new"]'); await sleep(300);
await page.type('input[name="title"]', "TEST preview only");
await page.$eval('textarea[name="body"]', (el) => { el.value = ""; });
await page.type('textarea[name="body"]', "## Hello\n\n<script>x</script> **bold**");
await sleep(300);
ok(await page.evaluate(() => { const p = document.querySelector('[data-testid="md-preview"]'); return !!p.querySelector("h2") && !p.querySelector("script") && !!p.querySelector("strong"); }), "blog editor: live Markdown preview, sanitized");
ok(await page.evaluate(() => document.querySelector('input[name="slug"]').value === "test-preview-only"), "blog editor: slug auto-filled from title");

// cleanup
if (created) await fetch(`${BASE}/api/hv-admin/sponsors?id=${created.id}`, { method: "DELETE", headers: A });
for (const q of inqs) await fetch(`${BASE}/api/hv-admin/inquiries?id=${q.id}`, { method: "DELETE", headers: A });
const end = await api("/api/hv-admin/sponsors", { headers: A });
ok(!end.sponsors.some((s) => /^TEST/.test(s.name)) && !(await api("/api/hv-admin/inquiries", { headers: A })).inquiries.some((q) => /TEST/.test(q.business)), "browser TEST data deleted");
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

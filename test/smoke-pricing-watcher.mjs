// Live/locally: the public Pricing Watcher page shows Coming soon (no price, noindex) and the
// full app works behind the admin login. Read-only: adds no watches.
// BASE=https://hustlevault.app ADMIN_PW=... SHOTS=/workspace/hustlevault node test/smoke-pricing-watcher.mjs
import puppeteer from "puppeteer-core";
const B = process.env.BASE || "http://localhost:8899", PW = process.env.ADMIN_PW, SHOTS = process.env.SHOTS || "/tmp";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const apps = (await (await fetch(B + "/api/apps")).json()).apps;
const pw = apps.find((a) => a.id === "pricing-watcher");
ok(pw && pw.status === "soon" && pw.price == null && pw.buyable === false, "catalog: pricing-watcher soon, no price, not buyable");
ok(apps.every((a) => a.id === "venturecheck" || a.status === "soon"), "all built-in apps still Coming soon (VentureCheck untouched)");
ok((await fetch(B + "/api/watcher/state")).status === 401, "watcher API refuses without admin login");
const tok = (await (await fetch(B + "/api/hv-admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: PW }) })).json()).token;
const st = await fetch(B + "/api/watcher/state", { headers: { Authorization: `Bearer ${tok}` } });
const sd = await st.json().catch(() => ({}));
ok(st.status === 200 && Array.isArray(sd.watches) && sd.settings, `watcher API works with admin login (${sd.watches?.length} watches)`);
const ck = await fetch(B + "/api/app-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appId: "pricing-watcher", inputs: {} }) });
ok(ck.status === 403 || ck.status === 404, `no public checkout for pricing-watcher (${ck.status})`);

const b = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 900 });
await p.goto(B + "/", { waitUntil: "networkidle0" }); await sleep(1500);
const card = await p.evaluate(() => { const el = [...document.querySelectorAll("div")].find((d) => d.children.length > 2 && /Competitor Pricing Watcher/.test(d.textContent) && /You give/i.test(d.textContent) && d.textContent.length < 900); return el ? el.textContent : ""; });
ok(/Coming soon/i.test(card) && !/\$\d/.test(card) && !/one time/i.test(card), "home card: Coming soon, no price / 'one time'");
await p.goto(B + "/apps/pricing-watcher", { waitUntil: "networkidle0" }); await sleep(800);
const pub = await p.evaluate(() => ({ t: document.body.textContent, robots: document.querySelector('meta[name=robots]')?.content, form: !!document.querySelector("input[type=url]") }));
ok(/Coming soon/i.test(pub.t) && !/\$\d/.test(pub.t.replace(/\$\d[\d,.]*\s*(\/|per)\s*(mo|month)/gi, "")) && /noindex/.test(pub.robots || "") && !pub.form, "public page: Coming soon, noindex, no app UI");
await p.screenshot({ path: `${SHOTS}/pricing-watcher-public.png` });
await p.evaluate((t) => sessionStorage.setItem("hv_admin_token", t), tok);
await p.reload({ waitUntil: "networkidle0" }); await sleep(1200);
const adm = await p.evaluate(() => ({ t: document.body.textContent, form: !!document.querySelector("input[type=url], input[placeholder*='http']") }));
ok(/only you can see this/i.test(adm.t) && adm.form, "admin-logged-in: full app (add-watch form) loads");
await p.screenshot({ path: `${SHOTS}/pricing-watcher-admin.png` });
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

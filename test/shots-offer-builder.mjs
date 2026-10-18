// Screenshots for the AI Offer Builder. Usage:
//   LIVE=https://hustlevault.app LOCAL=http://localhost:8888 PREVIEW=... WHSEC=... OUT=dir node test/shots-offer-builder.mjs
// Live: public page (Coming soon) + private preview form. Local (mock Stripe/AI): a paid result page.
import puppeteer from "puppeteer-core";
import Stripe from "stripe";
const { LIVE, LOCAL, PREVIEW, WHSEC, OUT } = process.env;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox"] });
const page = async (vp) => { const p = await b.newPage(); await p.setViewport(vp); return p; };
const D = { width: 1280, height: 900 }, M = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
if (LIVE) {
  let p = await page(D);
  await p.goto(`${LIVE}/apps/offer-builder`, { waitUntil: "networkidle0" }); await sleep(1500);
  await p.screenshot({ path: `${OUT}/1-public-coming-soon-desktop.png` });
  console.log("public:", (await p.evaluate(() => document.body.innerText)).match(/Coming soon|Get it now[^\n]*/)?.[0]);
  p = await page(M);
  await p.goto(`${LIVE}/apps/offer-builder?preview=${encodeURIComponent(PREVIEW)}`, { waitUntil: "networkidle0" }); await sleep(1500);
  await p.screenshot({ path: `${OUT}/2-private-test-form-mobile.png`, fullPage: true });
  console.log("preview:", (await p.evaluate(() => document.body.innerText)).match(/Get it now[^\n]*/)?.[0]);
}
if (LOCAL) {
  const post = (path, body) => fetch(LOCAL + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
  const inputs = { skills: "Bookkeeping and spreadsheet cleanup", background: "6 years doing the books for my family's restaurant", audience: "Food trucks and small restaurants", experience: "Some experience", delivery: "Online / remote", time: "5 – 10 hours a week", budget: "Under $100" };
  const c = await post("/api/apps/checkout", { appId: "offer-builder", inputs, preview: PREVIEW });
  const cs = c.url.match(/cs_\w+/)[0];
  const payload = JSON.stringify({ id: "evt_shot_" + Date.now(), object: "event", type: "checkout.session.completed", data: { object: { id: cs, metadata: { hv_purchase_id: c.purchaseId }, payment_status: "paid", amount_total: 900, payment_intent: "pi_shot_" + Date.now(), livemode: false, customer_details: { email: "shot@example.com" } } } });
  await fetch(LOCAL + "/api/stripe/webhook", { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": new Stripe("sk_test_x").webhooks.generateTestHeaderString({ payload, secret: WHSEC }) }, body: payload });
  const p = await page(D);
  await p.goto(`${LOCAL}/my/${c.purchaseId}`, { waitUntil: "networkidle0" });
  await p.waitForSelector('[data-testid="copy-all"]', { timeout: 60000 });
  await sleep(800);
  await p.screenshot({ path: `${OUT}/3-paid-result-desktop-local.png`, fullPage: true });
  console.log("result page ok:", c.purchaseId);
}
await b.close();

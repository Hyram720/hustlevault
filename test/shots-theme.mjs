// Before/after screenshots for theme changes: desktop (1280) + mobile (390) of home (incl. intro frame),
// sponsors, an app page, Pricing Watcher (public), blog and admin.
// BASE=https://hustlevault.app ADMIN_PW=... OUT=/workspace/hustlevault/screenshots/theme-before node test/shots-theme.mjs
import puppeteer from "puppeteer-core";
const B = process.env.BASE || "https://hustlevault.app", PW = process.env.ADMIN_PW, OUT = process.env.OUT || "/tmp";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const VP = { desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
const intro = {};
for (const [name, vp] of Object.entries(VP)) {
  const p = await b.newPage(); await p.setViewport(vp);
  const t0 = Date.now();
  await p.goto(B + "/", { waitUntil: "domcontentloaded" });
  await sleep(2500);
  await p.screenshot({ path: `${OUT}/home-intro-${name}.png` });
  // measure intro: overlay present → gone
  const gone = await p.waitForFunction(() => ![...document.querySelectorAll("video")].some((v) => v.closest('div[style*="z-index: 9999"]')), { timeout: 20000, polling: 100 }).then(() => Date.now() - t0).catch(() => -1);
  intro[name] = gone;
  await sleep(1500);
  await p.screenshot({ path: `${OUT}/home-top-${name}.png` }); // viewport: top ticker + nav + hero (+ bottom bar)
  const tk = await p.$(".ticker-wrap");
  if (tk) { const box = await (await tk.evaluateHandle((e) => e.parentElement)).boundingBox(); await p.screenshot({ path: `${OUT}/home-ticker-${name}.png`, clip: { x: 0, y: box.y, width: Math.min(box.width, vp.width), height: box.height } }); }
  await p.waitForSelector("[data-hv-bar]", { timeout: 8000 }).catch(() => {});
  const bar = await p.$("[data-hv-bar]");
  if (bar) { const bb = await bar.boundingBox(); await p.screenshot({ path: `${OUT}/bottom-bar-${name}.png`, clip: { x: 0, y: bb.y, width: bb.width, height: bb.height } }); }
  await p.screenshot({ path: `${OUT}/home-${name}.png`, fullPage: true });
  for (const [slug, path] of [["sponsors", "/sponsors"], ["app-first-sale-blueprint", "/apps/first-sale-blueprint"], ["pricing-watcher", "/apps/pricing-watcher"], ["blog", "/blog"]]) {
    await p.goto(B + path, { waitUntil: "networkidle0" }); await sleep(3500);
    await p.screenshot({ path: `${OUT}/${slug}-${name}.png`, fullPage: true });
  }
  if (PW) {
    await p.goto(B + "/admin", { waitUntil: "networkidle0" });
    if (await p.$("#pw")) { await p.type("#pw", PW); await p.click("button.hv-btn"); }
    await p.waitForSelector('[data-tab="sponsors"]', { timeout: 20000 }); await sleep(2500);
    await p.screenshot({ path: `${OUT}/admin-${name}.png`, fullPage: true });
    await p.click('[data-tab="sponsors"]'); await sleep(2500);
    await p.screenshot({ path: `${OUT}/admin-sponsors-${name}.png`, fullPage: true });
  }
  await p.close();
}
console.log("intro overlay removed after (ms):", JSON.stringify(intro));
await b.close();

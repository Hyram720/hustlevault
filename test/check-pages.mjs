// Renders every blog post + app pages in a real browser and checks they aren't blank. Optional screenshots.
//   BASE=https://hustlevault.app [SHOTS=dir] node test/check-pages.mjs
import puppeteer from "puppeteer-core";
const BASE = process.env.BASE || "http://localhost:8888", SHOTS = process.env.SHOTS;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox"] });
const sm = await (await fetch(BASE + "/sitemap.xml")).text();
const posts = [...sm.matchAll(/<loc>[^<]*\/blog\/([a-z0-9-]+)<\/loc>/g)].map((m) => m[1]);
ok(posts.length >= 4, `sitemap lists ${posts.length} posts`);
for (const path of [...posts.map((s) => `/blog/${s}`), "/apps/offer-builder", "/apps/first-sale-blueprint"]) {
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 900 });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE + path, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  const r = await p.evaluate(() => ({ h1: document.querySelector("h1")?.innerText || "", len: (document.querySelector("article, main")?.innerText || document.body.innerText).length, ssr: !!document.getElementById("hv-ssr") }));
  ok(r.h1 && r.len > (path.startsWith("/blog") ? 2500 : 200) && !errs.length && !r.ssr, `${path}: "${r.h1.slice(0, 60)}" ${r.len} chars, hydrated, ${errs.length} JS errors ${errs.join(" | ").slice(0, 120)}`);
  if (SHOTS && (path.includes("turn-your-skills") || path === "/blog/best-side-hustles-2026")) await p.screenshot({ path: `${SHOTS}/${path.split("/").pop()}.png`, fullPage: false });
  await p.close();
}
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);

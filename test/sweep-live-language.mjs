// Renders every public URL in a real browser and greps the rendered DOM text for not-live wording.
//   BASE=https://hustlevault.app node test/sweep-live-language.mjs
import puppeteer from "puppeteer-core";
const BASE = process.env.BASE || "https://hustlevault.app";
const RE = /coming soon|not yet|finishing testing|final testing|being built|is building|check back|launching soon|stay tuned/gi;
const sm = await (await fetch(BASE + "/sitemap.xml")).text();
const fromMap = [...sm.matchAll(/<loc>https:\/\/hustlevault\.app([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
const HIDDEN = ["first-sale-blueprint", "first-customer-finder", "objection-coach", "lead-follow-up", "reactivation-kit", "lead-qualifier", "pricing-watcher"];
const urls = [...new Set([...fromMap, "/apps/venturecheck", "/apps/offer-builder", ...HIDDEN.map((h) => `/apps/${h}`), "/my", "/door-script", "/advertise"])];
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox"] });
let total = 0;
for (const u of urls) {
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 900 });
  await p.goto(BASE + u, { waitUntil: "networkidle0" }); await new Promise((r) => setTimeout(r, 7500 * (u === "/") + 600));
  const t = await p.evaluate(() => document.body.innerText + "\n" + document.title + "\n" + [...document.querySelectorAll("meta[content]")].map((m) => m.content).join("\n"));
  const hits = t.match(RE) || [];
  total += hits.length;
  console.log(`${hits.length ? "HIT " : "ok  "} ${u}  ${hits.length} ${hits.join(", ")}`);
  await p.close();
}
for (const u of ["/sitemap.xml", "/blog/rss.xml", "/robots.txt"]) { const t = await (await fetch(BASE + u)).text(); const h = t.match(RE) || []; total += h.length; console.log(`${h.length ? "HIT " : "ok  "} ${u}  ${h.length}`); }
await b.close();
console.log(`\nTOTAL matches across ${urls.length + 3} URLs: ${total}`);
console.log("hidden app URLs in sitemap:", HIDDEN.filter((h) => sm.includes(`/apps/${h}`)).length);

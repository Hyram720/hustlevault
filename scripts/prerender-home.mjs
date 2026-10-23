// After `vite build`, bake the homepage into dist/index.html so the file Netlify
// publishes already contains the copy, tool cards, and JSON-LD. The pages function
// re-renders `/` the same way at request time (live catalog overrides).
import { readFileSync, writeFileSync } from "node:fs";
import { APPS } from "../shared/apps.js";
import { resolveHomeApps, renderHomeBody, visibleWords } from "../shared/homehtml.js";
import { homeMeta } from "../shared/homeseo.js";
import { fillTemplate, HOME_SHELL_STYLE } from "../shared/ssrhtml.js";

const dist = new URL("../dist/index.html", import.meta.url);
let catalog = APPS;
let fromApi = false;
try {
  const r = await fetch("https://hustlevault.app/api/apps", { signal: AbortSignal.timeout(8000) });
  if (r.ok) {
    const data = await r.json();
    if (Array.isArray(data.apps) && data.apps.length) {
      catalog = data.apps;
      fromApi = true;
    }
  }
} catch (e) {
  console.warn("prerender: live /api/apps unavailable, using source catalog:", e?.message || e);
}

const { live, soon } = resolveHomeApps(catalog);
const html = fillTemplate(readFileSync(dist, "utf8"), homeMeta(), renderHomeBody({ live, soon }), {}, { shellStyle: HOME_SHELL_STYLE });
const words = visibleWords(html);
const start = html.split('id="coming-soon"')[0];
const problems = [];
if (!html.includes("<h1>")) problems.push("missing h1");
if (!html.includes("8 quick questions")) problems.push("missing 8 quick questions");
if (html.includes("7 quick answers")) problems.push("stale 7 quick answers copy");
if (!html.includes("VentureCheck")) problems.push("missing VentureCheck");
if (!html.includes("AI Offer Builder")) problems.push("missing AI Offer Builder");
if (!html.includes("Free score")) problems.push("missing free score");
if (!html.includes("$4.99")) problems.push("missing $4.99");
if (!html.includes("$9")) problems.push("missing $9");
if (!html.includes("Coming soon")) problems.push("missing coming soon");
if (!html.includes("Sun Marketing Enterprises LLC")) problems.push("missing legalName");
if (!html.includes("https://hustlevault.app/og/home.png")) problems.push("missing og:image");
if (!html.includes('rel="canonical" href="https://hustlevault.app/"')) problems.push("missing canonical");
if (!html.includes('type="module"')) problems.push("vite module script was dropped");
if (words.length < 150) problems.push(`word count ${words.length} < 150`);
if (fromApi && !start.includes("AI Offer Builder")) problems.push("Offer Builder was not in the live section");
if (problems.length) {
  console.error("homepage prerender failed:", problems.join("; "));
  throw new Error("homepage prerender failed");
}
writeFileSync(dist, html);
console.log(`homepage prerender: ${words.length} body words, live=[${live.map((a) => a.id).join(", ")}], soon=${soon.length}, catalog=${fromApi ? "api" : "source"}`);

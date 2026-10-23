// After `vite build`, write the crawlable homepage to dist/home.html.
// dist/index.html stays the empty SPA shell. Netlify rewrites only `/` to /home.html.
// A live GET https://hustlevault.app/api/apps supplies status and price. If that
// request fails, the source catalog in shared/apps.js is used instead.
import { readFileSync, writeFileSync } from "node:fs";
import { APPS } from "../shared/apps.js";
import { resolveHomeApps, renderHomeBody, visibleWords } from "../shared/homehtml.js";
import { homeMeta, HOME_OG_IMAGE } from "../shared/homeseo.js";
import { fillTemplate, HOME_SHELL_STYLE } from "../shared/ssrhtml.js";

const shellPath = new URL("../dist/index.html", import.meta.url);
const homePath = new URL("../dist/home.html", import.meta.url);
const shellBefore = readFileSync(shellPath, "utf8");

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
  } else {
    console.warn("prerender: live /api/apps returned", r.status, ", using source catalog");
  }
} catch (e) {
  console.warn("prerender: live /api/apps unavailable, using source catalog:", e?.message || e);
}

const { live, soon } = resolveHomeApps(catalog);
const html = fillTemplate(shellBefore, homeMeta(), renderHomeBody({ live, soon }), {}, { shellStyle: HOME_SHELL_STYLE });
const words = visibleWords(html);
const start = html.split('id="coming-soon"')[0];
const h1 = "Check whether your idea is worth your time.";
const problems = [];
if (!html.includes(`<h1>${h1}</h1>`)) problems.push("missing short h1");
if ((html.match(/<h1>/g) || []).length !== 1) problems.push("expected exactly one h1");
if (!html.includes("8 quick questions")) problems.push("missing 8 quick questions");
if (html.includes("7 quick answers")) problems.push("stale 7 quick answers copy");
if (!html.includes("VentureCheck")) problems.push("missing VentureCheck");
if (!html.includes("AI Offer Builder")) problems.push("missing AI Offer Builder");
if (!html.includes("Free score")) problems.push("missing free score");
if (!html.includes("$4.99")) problems.push("missing $4.99");
if (!html.includes("$9")) problems.push("missing $9");
if (!html.includes("Coming soon")) problems.push("missing coming soon");
if (!html.includes("Sun Marketing Enterprises LLC")) problems.push("missing legalName");
if (!html.includes(HOME_OG_IMAGE)) problems.push("missing og:image");
if (html.includes("/og/home.png")) problems.push("placeholder og image is still referenced");
if (!html.includes('rel="canonical" href="https://hustlevault.app/"')) problems.push("missing canonical");
if (!html.includes('type="module"')) problems.push("vite module script was dropped");
if (words.length < 150) problems.push(`word count ${words.length} < 150`);
if (fromApi && !start.includes("AI Offer Builder")) problems.push("Offer Builder was not in the live section");
if (problems.length) {
  console.error("homepage prerender failed:", problems.join("; "));
  throw new Error("homepage prerender failed");
}

writeFileSync(homePath, html);
const shellAfter = readFileSync(shellPath, "utf8");
if (shellAfter !== shellBefore) throw new Error("prerender modified dist/index.html");
if (shellAfter.includes(h1) || shellAfter.includes('id="hv-ssr"') || shellAfter.includes('rel="canonical"')) {
  throw new Error("SPA shell contains homepage content");
}
if (!shellAfter.includes(HOME_OG_IMAGE) || shellAfter.includes("/og/home.png")) {
  throw new Error("SPA shell image tag is not the existing default image");
}
if (!shellAfter.includes('<div id="root"></div>')) throw new Error("SPA shell root is not empty");

console.log(`homepage prerender: ${words.length} body words, live=[${live.map((a) => a.id).join(", ")}], soon=${soon.length}, catalog=${fromApi ? "api" : "source"}`);

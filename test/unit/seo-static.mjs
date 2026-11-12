// Static checks for the SEO files and Netlify rules. No network.
import { readFileSync } from "node:fs";

let fail = 0;
const ok = (c, m) => {
  if (c) console.log("PASS", m);
  else { fail++; console.log("FAIL", m); }
};

const toml = readFileSync(new URL("../../netlify.toml", import.meta.url), "utf8");
const blocks = toml.split("[[redirects]]").slice(1).map((part) => {
  const body = part.split("\n[[")[0];
  const get = (k) => {
    const m = body.match(new RegExp(`^\\s*${k}\\s*=\\s*"?([^"\\n]+)"?\\s*$`, "m"));
    return m ? m[1].trim() : "";
  };
  return { from: get("from"), to: get("to"), status: get("status"), force: /force\s*=\s*true/.test(body) };
});

ok(!blocks.some((b) => b.from === "/*" && b.to === "/index.html" && b.status === "200"), "no catch-all SPA rewrite");
ok(blocks.some((b) => b.from === "/" && b.to === "/home.html" && b.status === "200" && b.force), "homepage still rewrites to home.html");

const spa = ["/success", "/cancel", "/door-script", "/my", "/my/*", "/admin", "/admin/*", "/sponsors/stats/*", "/sponsors/edit/*"];
for (const from of spa) {
  ok(blocks.some((b) => b.from === from && b.to === "/index.html" && b.status === "200" && !b.force), `SPA rewrite ${from}`);
}

for (const [from, to] of [["/terms.html", "/terms"], ["/privacy.html", "/privacy"], ["/refund-policy.html", "/refund-policy"], ["/earnings-disclaimer.html", "/earnings-disclaimer"]]) {
  ok(blocks.some((b) => b.from === from && b.to === to && b.status === "301" && b.force), `${from} 301 to ${to}`);
  ok(blocks.some((b) => b.from === `${to}/index.html` && b.to === to && b.status === "301" && b.force), `${to}/index.html 301 to ${to}`);
}

ok(toml.includes('for = "/llms.txt"') && toml.includes("text/plain"), "llms.txt content-type header");
ok(!/from\s*=\s*"\/\*"/.test(toml), "toml has no /* redirect");

const llms = readFileSync(new URL("../../public/llms.txt", import.meta.url), "utf8");
const full = readFileSync(new URL("../../public/llms-full.txt", import.meta.url), "utf8");
for (const [name, text] of [["llms.txt", llms], ["llms-full.txt", full]]) {
  ok(!text.includes("First sell, then we scale"), `${name} omits the internal motto`);
  ok(!/<!doctype|<html/i.test(text), `${name} is not HTML`);
  ok(text.includes("Check whether your idea is worth your time."), `${name} has the homepage headline`);
  ok(text.includes("$4.99") && text.includes("$12.99") && text.includes("$24.99") && text.includes("$9.99"), `${name} has verified prices`);
  ok(/\$9 one time/.test(text), `${name} has the $9 Offer Builder price`);
  ok(/\$100 per month/.test(text) && /not a book price/.test(text), `${name} keeps $100 as the sponsor price`);
  ok(/coming soon/i.test(text), `${name} marks unfinished tools as coming soon`);
  ok(text.includes("VentureCheck") && text.includes("AI Offer Builder") && text.includes("Aged Corporation Playbook"), `${name} names the live products`);
}

const notFound = readFileSync(new URL("../../public/404.html", import.meta.url), "utf8");
const robots = [...notFound.matchAll(/<meta\s+name="robots"[^>]*>/gi)].map((m) => m[0]);
ok(robots.length === 1 && robots[0].includes('content="noindex"') && !robots[0].includes("follow"), "404 page has a single noindex robots meta");
ok(!/rel="canonical"/i.test(notFound), "404 page has no canonical");
ok(!/index,\s*follow/i.test(notFound), "404 page does not say index, follow");
ok(!notFound.includes('href="https://hustlevault.app/"'), "404 page does not canonical-link the homepage URL");
ok(notFound.includes(">Page not found<") || notFound.includes("Page not found"), "404 page says page not found");

const indexXml = readFileSync(new URL("../../public/sitemap_index.xml", import.meta.url), "utf8");
ok(indexXml.includes("<sitemapindex") && indexXml.includes("https://hustlevault.app/sitemap.xml") && !indexXml.includes("<html"), "sitemap index is real XML");

const pages = readFileSync(new URL("../../netlify/functions/pages.mjs", import.meta.url), "utf8");
ok(pages.includes('"/terms"') && !pages.includes('"/terms.html"'), "sitemap source lists /terms, not /terms.html");

for (const [file, href] of [
  ["public/terms/index.html", "https://hustlevault.app/terms"],
  ["public/privacy/index.html", "https://hustlevault.app/privacy"],
  ["public/refund-policy/index.html", "https://hustlevault.app/refund-policy"],
  ["public/earnings-disclaimer/index.html", "https://hustlevault.app/earnings-disclaimer"],
]) {
  const html = readFileSync(new URL("../../" + file, import.meta.url), "utf8");
  const canonicals = [...html.matchAll(/<link\s+rel="canonical"[^>]*>/gi)].map((m) => m[0]);
  ok(canonicals.length === 1 && canonicals[0].includes(`href="${href}"`), `${file} self-canonical`);
  ok(!/terms\.html|privacy\.html|refund-policy\.html|earnings-disclaimer\.html/.test(html), `${file} does not link .html policy URLs`);
}

if (fail) {
  console.log(`\n${fail} failed`);
  process.exit(1);
}
console.log("\nall seo static checks passed");

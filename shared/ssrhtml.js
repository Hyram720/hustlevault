// Fills the Vite index.html shell with per-route <head> tags and a #root block.
// Same document shape the blog, sponsor, and app pages already serve.
import { esc } from "./markdown.js";
import { SITE, DEFAULT_OG } from "./pagemeta.js";

const jsonLdTag = (o) => `<script type="application/ld+json" data-seo="1">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;

export function headTags(meta, extra = "") {
  const url = SITE + (meta.path || "/");
  const img = meta.image || DEFAULT_OG;
  return [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta name="robots" content="${meta.noindex ? "noindex, nofollow" : "index, follow"}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${esc(meta.type || "website")}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:site_name" content="Hustle Vault" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(img)}" />`,
    meta.jsonLd ? jsonLdTag(meta.jsonLd) : "",
    extra,
  ].filter(Boolean).join("\n    ");
}

// Replace the <div id="root"> element (empty or already prerendered) and a following
// __HV_DATA__ script. Leaves the Vite module script, whether it sits in <head> or after #root.
function replaceRoot(html, rootHtml) {
  const token = '<div id="root">';
  const start = html.indexOf(token);
  if (start < 0) throw new Error("template missing root");
  let i = start + token.length;
  let depth = 1;
  while (i < html.length && depth > 0) {
    const nextOpen = html.indexOf("<div", i);
    const nextClose = html.indexOf("</div>", i);
    if (nextClose < 0) throw new Error("template root unclosed");
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 4;
    } else {
      depth -= 1;
      i = nextClose + "</div>".length;
    }
  }
  let end = i;
  const data = html.slice(end).match(/^\s*<script>window\.__HV_DATA__[\s\S]*?<\/script>/);
  if (data) end += data[0].length;
  return html.slice(0, start) + rootHtml + html.slice(end);
}

const SSR_STYLE = "max-width:860px;margin:0 auto;padding:24px;color:#FFFFFF;font-family:Inter,system-ui,sans-serif";
export const HOME_SHELL_STYLE = SSR_STYLE + ";background:#0A1630";

export function fillTemplate(html, meta, innerHtml, data, { extraHead = "", shellStyle = SSR_STYLE } = {}) {
  let out = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+(name|property)="(description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "")
    .replace(/<script type="application\/ld\+json"[^>]*data-seo="1"[\s\S]*?<\/script>\s*/gi, "")
    .replace(/<!-- (Primary SEO|Open Graph|Twitter Card) -->\s*/g, "");
  out = out.replace("</head>", `    ${headTags(meta, extraHead)}\n  </head>`);
  const payload = JSON.stringify(data ?? {}).replace(/</g, "\\u003c");
  const root = `<div id="root"><div id="hv-ssr" style="${shellStyle}">${innerHtml}</div></div>\n    <script>window.__HV_DATA__=${payload}</script>`;
  return replaceRoot(out, root);
}

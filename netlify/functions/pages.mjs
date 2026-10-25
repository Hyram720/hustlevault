// Server-rendered HTML for /sponsors, /sponsors/policy, /blog, /blog/<slug>, /apps/<id> (so crawlers see real
// content and tags), plus /blog/rss.xml, /sitemap.xml and the public blog JSON API.
// The homepage is dist/home.html, rewritten only for the exact path /. It is not this function,
// and it is not written into index.html (that file is the SPA shell for every other route).
import { esc, renderMarkdown } from "../../shared/markdown.js";
import { POSTS as STATIC_POSTS } from "../../src/blog/posts.js";
import { publishedPosts, visibleSponsors, publicSponsor, CDN } from "../lib/content.mjs";
import { publicPost, mergePosts, fmtDateET, PER_PAGE } from "../../shared/blog.js";
import { sponsorsMeta, policyMeta, blogIndexMeta, blogPostMeta, appMeta, playbookMeta, SITE } from "../../shared/pagemeta.js";
import { fillTemplate } from "../../shared/ssrhtml.js";
import { getCatalog } from "../lib/apps.mjs";
import { COPY, SPONSOR_PRICE_LABEL, LOGO_SPEC, POLICY_UPDATED } from "../../shared/sponsors.js";
import { POLICY, POLICY_INTRO } from "../../shared/policy.js";

let tpl = { html: "", at: 0 };
async function template(req) {
  if (tpl.html && Date.now() - tpl.at < 120000) return tpl.html;
  const origin = new URL(req.url).origin;
  const r = await fetch(origin + "/index.html", { headers: { "x-hv-template": "1" } });
  const html = await r.text();
  if (!r.ok || !html.includes('id="root"')) throw new Error("template fetch failed");
  tpl = { html, at: Date.now() };
  return html;
}

const NAV = `<nav aria-label="Main"><a href="/">Hustle Vault</a> · <a href="/#start">AI Tools</a> · <a href="/blog">Blog</a> · <a href="/sponsors">Advertise</a></nav>`;
const FOOT = `<footer><a href="/blog">Blog</a> · <a href="/sponsors">Advertise</a> · <a href="/sponsors/policy">Ad Policy</a> · <a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a></footer>`;

async function page(req, m, body, data, { status = 200, extraHead = "", vary = "query=page" } = {}) {
  const templateHtml = await template(req);
  const html = fillTemplate(templateHtml, m, `${NAV}${body}${FOOT}`, data, { extraHead });
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", ...CDN(60), "Netlify-Vary": vary } });
}

async function allPosts() {
  const dyn = (await publishedPosts().catch(() => [])).map(publicPost);
  return mergePosts(STATIC_POSTS, dyn);
}
const staticHtml = (p) => p.content.map((b) => b.h2 ? `<h2>${esc(b.h2)}</h2>` : b.p ? `<p>${esc(b.p)}</p>` : b.quote ? `<blockquote>${esc(b.quote)}</blockquote>` : b.ul ? `<ul>${b.ul.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : b.ol ? `<ol>${b.ol.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : "").join("\n");

async function sponsorsPage(req) {
  const sponsors = (await visibleSponsors().catch(() => [])).map(publicSponsor);
  const wall = sponsors.length
    ? sponsors.map((s) => `<article><span>Sponsored</span><img src="${esc(s.logo.wall)}" alt="${esc(s.name)} logo" width="300" height="100"><h3>${esc(s.name)}</h3><p>${esc(s.offer)}</p><a href="/go/sponsor/${esc(s.id)}?p=wall" rel="sponsored noopener" target="_blank">Visit ${esc(s.name)}</a></article>`).join("")
    : `<p>Your logo here — this spot is open.</p>`;
  const body = `<main><p>${esc(COPY.headline)}</p><h1>Advertise on Hustle Vault</h1><p>${esc(COPY.line)}</p>
<p>Hustle Vault is where AI beginners come to start a business — and where entrepreneurs come to grow one with AI.</p><a href="#inquire">${esc(COPY.cta)}</a>
<h2>${esc(SPONSOR_PRICE_LABEL)}</h2><p>Includes your logo, business name and offer on the sponsor wall and the sitewide ticker.</p>
<h2>Our sponsors</h2>${wall}
<h2 id="inquire">Get in touch</h2><p>${esc(LOGO_SPEC)}</p><p>See our <a href="/sponsors/policy">Ad Policy &amp; Sponsor Terms</a>.</p></main>`;
  return page(req, sponsorsMeta(sponsors), body, { sponsors });
}

async function policyPage(req) {
  const body = `<main><h1>Ad Policy &amp; Sponsor Terms</h1><p>Last updated ${esc(fmtDateET(POLICY_UPDATED))}</p><p>${esc(POLICY_INTRO)}</p>${POLICY.map((s) => `<h2>${esc(s.h)}</h2><ul>${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`).join("")}</main>`;
  return page(req, policyMeta(), body, {});
}

async function blogIndex(req) {
  const posts = await allPosts();
  const pages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const n = parseInt(new URL(req.url).searchParams.get("page") || "1", 10);
  const pg = Number.isFinite(n) && n >= 1 && n <= pages ? n : 1;
  const slice = posts.slice((pg - 1) * PER_PAGE, pg * PER_PAGE);
  const list = slice.length ? slice.map((p) => `<article><h2><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a></h2><p><time datetime="${esc(p.date)}">${esc(fmtDateET(p.date))}</time> · ${p.readMins} min read</p><p>${esc(p.excerpt)}</p></article>`).join("") : `<p>No posts yet — check back soon.</p>`;
  const nav = pages > 1 ? `<nav aria-label="Pagination">${pg > 1 ? `<a href="/blog${pg - 1 > 1 ? `?page=${pg - 1}` : ""}" rel="prev">Newer posts</a>` : ""} ${pg < pages ? `<a href="/blog?page=${pg + 1}" rel="next">Older posts</a>` : ""}</nav>` : "";
  const body = `<main><p>The Hustle Vault Blog</p><h1>Practical AI for Your Business</h1><p>Practical, no-fluff guides on using AI to start, run and grow a small business — from the team behind Hustle Vault’s affordable, pay-per-use AI tools. <a href="/#start">See the tools</a> · <a href="/sponsors">Advertise with us</a></p>${list}${nav}</main>`;
  const data = { blog: posts.filter((p) => p.dynamic).map(({ body: _b, ...rest }) => rest) };
  return page(req, blogIndexMeta(slice, pg), body, data, { extraHead: `<link rel="alternate" type="application/rss+xml" title="The Hustle Vault Blog" href="${SITE}/blog/rss.xml" />` });
}

async function blogPost(req, slug) {
  const posts = await allPosts();
  const post = posts.find((p) => p.slug === slug);
  const m = blogPostMeta(post, slug);
  if (!post) return page(req, m, `<main><h1>Article Not Found</h1><p>That article doesn't exist or may have moved. <a href="/blog">Back to the Blog</a></p></main>`, { blogPost: null }, { status: 404 });
  const content = post.dynamic ? renderMarkdown(post.body).html : staticHtml(post);
  const img = post.cover ? `<img src="${esc(post.cover)}" alt="${esc(post.coverAlt || post.title)}" width="720" height="405">` : "";
  const body = `<main><article><p><a href="/">Home</a> · <a href="/blog">Blog</a></p><p><time datetime="${esc(post.date)}">${esc(fmtDateET(post.date))}</time> · ${post.readMins} min read</p><h1>${esc(post.title)}</h1>${img}${content}</article></main>`;
  return page(req, m, body, { blogPost: post.dynamic ? post : { slug: post.slug, static: true } }, { extraHead: `<link rel="alternate" type="application/rss+xml" title="The Hustle Vault Blog" href="${SITE}/blog/rss.xml" />` });
}


async function playbookPage(req) {
  const m = playbookMeta();
  const body = `<main>
    <p>Hustle Vault Business Playbook Series · 2026 Edition · 115 Pages (6" × 9")</p>
    <h1>The Aged Corporation Playbook</h1>
    <p><strong>How to Buy, Build, and Flip Shelf Corporations for $1,500 to $4,500+: 7-Chapter Execution Guide, 6 Wyoming C-Corp Case Studies &amp; 4 Closing Checklists</strong></p>
    <img src="/ebooks/aged-corporation-playbook/cover-variant-a.jpg" alt="The Aged Corporation Playbook Front Cover Variant A" width="360" height="540" />
    <p>Turn a $189 Wyoming State Filing and a $12 Digital Infrastructure Stack into a $1,995 to $4,500+ Turnkey Corporate Asset. Available as an instant digital download bundle on Hustle Vault ($12.99 USD) and 6" × 9" Paperback on Amazon KDP ($24.99 USD).</p>
    <ul>
      <li><strong>Part I - The 7 Core Strategy &amp; Execution Chapters:</strong> Track A ($12 Bank-Ready Digital Bundle) and Track B (90-Day 80-Paydex Credit-Seasoned Build).</li>
      <li><strong>Part II - 6 Deep-Dive Wyoming C-Corp Case Studies:</strong> Full build-to-exit ledgers ($201 to $2,250 Track A flip, $614 to $3,850 Track B 80-Paydex sprint, 5-company batch cohort, W.S. 17-16-1422 administrative reinstatement, NJ/PA foreign qualification, and 20% broker wholesale exit channel).</li>
      <li><strong>Part III - 4 Full-Page Operational Checklists &amp; Closing Templates:</strong> 50-State &amp; Domain Name-Screening Worksheet, 14-Point Bank-Ready Digital Bundle Checklist, 90-Day 80-Paydex Net-30 Vendor Tracker, and 7-Document Same-Day Closing &amp; Ownership Transfer Checklist.</li>
    </ul>
    <p><a href="/ebooks/aged-corporation-playbook/the-aged-corporation-playbook.pdf">Download 115-Page 6x9 PDF Playbook ($12.99 Digital Bundle)</a></p>
    <p><em>Disclaimer: Provided for educational and operational business purposes only; not legal, tax, or securities advice.</em></p>
  </main>`;
  return page(req, m, body, {});
}

async function appPage(req, id) {
  const app = (await getCatalog()).find((a) => a.id === id && a.status !== "hidden") || null;
  const preview = new URL(req.url).searchParams.has("preview");
  const m = appMeta(app, { preview });
  if (!app) return page(req, { ...m, path: `/apps/${id}` }, `<main><h1>App not found</h1><p><a href="/#start">See all tools</a></p></main>`, {}, { status: 404 });
  const price = app.external ? "Free score · $4.99 full report" : app.price ? `$${(app.price / 100).toFixed(app.price % 100 ? 2 : 0)} one time — no subscription` : "Coming soon";
  const status = app.status === "live" ? "Available now" : "Coming soon";
  const body = `<main><p>${app.path === "grow" ? "Grow Your Hustle" : "Start Your Hustle"}</p><h1>${esc(app.name)}</h1><p>${esc(app.tagline)}</p>
<dl><dt>You give</dt><dd>${esc(app.give || "")}</dd><dt>You get</dt><dd>${esc(app.get || "")}</dd><dt>How much</dt><dd>${esc(price)}</dd><dt>How fast</dt><dd>${esc(app.fast || "")}</dd></dl>
<p>${esc(status)}</p><p>AI-generated suggestions for education only — no income or sales results are guaranteed.</p></main>`;
  return page(req, m, body, {}, { vary: "query=preview" });
}

async function rss() {
  const posts = (await allPosts()).slice(0, 30);
  const items = posts.map((p) => `<item><title>${esc(p.title)}</title><link>${SITE}/blog/${esc(p.slug)}</link><guid isPermaLink="true">${SITE}/blog/${esc(p.slug)}</guid><pubDate>${new Date(/^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date + "T12:00:00Z" : p.date).toUTCString()}</pubDate><description>${esc(p.excerpt)}</description></item>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>The Hustle Vault Blog</title><link>${SITE}/blog</link><description>Practical guides on using AI to start, run and grow a small business.</description><language>en-us</language><atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml"/>\n${items}\n</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", ...CDN(300) } });
}

async function sitemap() {
  // Apex only. www.hustlevault.app 301-redirects to https://hustlevault.app, and canonicals use the apex.
  const SITEMAP_SITE = "https://hustlevault.app";
  const posts = await allPosts();
  const day = (d) => String(d || "").slice(0, 10);
  const latest = posts.reduce((a, p) => (day(p.dateModified || p.date) > a ? day(p.dateModified || p.date) : a), "2026-08-10");
  const urls = [
    ["/", "2026-10-23", "weekly", "1.0"], ["/blog", latest, "weekly", "0.8"], ["/sponsors", "2026-10-17", "monthly", "0.6"], ["/sponsors/policy", "2026-10-17", "yearly", "0.3"],
    ["/apps/offer-builder", "2026-10-18", "monthly", "0.8"],
    ["/aged-corporation-playbook", "2026-10-25", "weekly", "0.9"],
    ...["/terms.html", "/privacy.html", "/refund-policy.html", "/earnings-disclaimer.html"].map((u) => [u, "2026-10-18", "yearly", "0.2"]),
    ...posts.map((p) => [`/blog/${p.slug}`, day(p.dateModified || p.date), "monthly", "0.7"]),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, m, c, p]) => `  <url>\n    <loc>${SITEMAP_SITE}${esc(u)}</loc>\n    <lastmod>${m}</lastmod>\n    <changefreq>${c}</changefreq>\n    <priority>${p}</priority>\n  </url>`).join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", ...CDN(300) } });
}

const jsonRes = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { "Content-Type": "application/json", ...(status === 200 ? CDN(60) : { "Cache-Control": "no-store" }) } });

export default async (req) => {
  const path = new URL(req.url).pathname.replace(/\/+$/, "") || "/";
  try {
    if (path === "/sitemap.xml") return sitemap();
    if (path === "/blog/rss.xml") return rss();
    if (path === "/api/blog") return jsonRes({ posts: (await allPosts()).filter((p) => p.dynamic).map(({ body: _b, ...r }) => r) });
    if (path.startsWith("/api/blog/")) { const p = (await allPosts()).find((x) => x.dynamic && x.slug === path.slice(10)); return p ? jsonRes({ post: p }) : jsonRes({ error: "Not found" }, 404); }
    if (path === "/sponsors") return sponsorsPage(req);
    if (path === "/sponsors/policy") return policyPage(req);
    if (path === "/blog") return blogIndex(req);
    if (path === "/aged-corporation-playbook" || path === "/playbooks/aged-corporation-playbook" || path === "/ebooks/aged-corporation-playbook") return playbookPage(req);
    const a = path.match(/^\/apps\/([a-z0-9-]{1,60})$/);
    if (path.startsWith("/apps/")) return appPage(req, a ? a[1] : "");
    const m = path.match(/^\/blog\/([a-z0-9-]{1,100})$/);
    if (m) return blogPost(req, m[1]);
    return blogPost(req, "not-found");
  } catch (e) {
    console.error("pages render failed", path, e?.message);
    // Fall back to the plain SPA shell so the page still works.
    try { return new Response(await template(req), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }); }
    catch { return new Response("Temporarily unavailable", { status: 503 }); }
  }
};

export const config = { path: ["/sponsors", "/sponsors/policy", "/blog", "/blog/*", "/apps/*", "/aged-corporation-playbook", "/playbooks/aged-corporation-playbook", "/ebooks/aged-corporation-playbook", "/sitemap.xml", "/api/blog", "/api/blog/*"] };

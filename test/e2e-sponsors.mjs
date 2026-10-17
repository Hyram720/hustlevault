// Sponsors, ticker data, uploads, stats, Stripe-linked expiry, welcome email, blog + SEO.
//   Local (with mocks):  MOCKS=1 BASE=http://localhost:8888 WHSEC=whsec_localtestsecret ADMIN_PW=... node test/e2e-sponsors.mjs
//   Production smoke:    BASE=https://hustlevault.app ADMIN_PW=... node test/e2e-sponsors.mjs
// Everything it creates is named TEST and deleted at the end.
import sharp from "sharp";
import Stripe from "stripe";
import { sponsorVisible, applySubscription } from "../shared/sponsors.js";
import { renderMarkdown } from "../shared/markdown.js";

const BASE = process.env.BASE || "http://localhost:8888", PW = process.env.ADMIN_PW, MOCKS = process.env.MOCKS === "1", PROD = /hustlevault\.app/.test(BASE);
const STRIPE_MOCK = "http://localhost:12111", RESEND_MOCK = "http://localhost:12112";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 hv-e2e";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };
const req = async (path, opts = {}) => {
  let r;
  for (let i = 0; i < 15; i++) { // platform rate limits: wait and retry instead of failing
    r = await fetch(BASE + path, { redirect: "manual", ...opts, headers: { "User-Agent": UA, ...(opts.headers || {}) } });
    if (r.status !== 429 || /hv-admin\/login|sponsors\/inquiry/.test(path) && !opts.retry429) break;
    console.log("  (429 on", path, "- waiting)"); await new Promise((x) => setTimeout(x, 5000));
  }
  const ct = r.headers.get("content-type") || "";
  const d = ct.includes("json") ? await r.json().catch(() => null) : ct.startsWith("image/") ? Buffer.from(await r.arrayBuffer()) : await r.text();
  return { s: r.status, d, ct, h: r.headers };
};
const post = (path, body, headers = {}, method = "POST") => req(path, { method, headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
let TOKEN;
const A = () => ({ Authorization: `Bearer ${TOKEN}` });
const admin = (path, body, method = body === undefined ? "GET" : "POST") => body === undefined && method === "GET" ? req(`/api/hv-admin/${path}`, { headers: A() }) : post(`/api/hv-admin/${path}`, body ?? {}, A(), method);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cleanup = { sponsors: new Set(), inquiries: new Set(), posts: new Set() };

async function upload(buf, { purpose = "logo", auth = false, editToken } = {}) {
  const H = auth ? A() : {};
  let r = await post("/api/hv-upload/start", { size: buf.length, purpose, editToken }, H);
  if (r.s !== 200) return r;
  const { id, key, chunkSize, parts } = r.d;
  for (let i = 0; i < parts; i++) {
    const c = await req(`/api/hv-upload/chunk?id=${id}&n=${i}`, { method: "PUT", headers: { "Content-Type": "application/octet-stream", "x-upload-key": key, ...H }, body: buf.subarray(i * chunkSize, (i + 1) * chunkSize) });
    if (c.s !== 200) return c;
  }
  return post("/api/hv-upload/finish", { id, key }, H);
}
const headTags = (html) => ({
  title: (html.match(/<title>([^<]*)<\/title>/g) || []),
  desc: html.match(/<meta name="description" content="([^"]*)"/)?.[1],
  canonical: html.match(/<link rel="canonical" href="([^"]*)"/)?.[1],
  og: (html.match(/<meta property="og:(title|description|url|image|type)"/g) || []).length,
  tw: (html.match(/<meta name="twitter:(card|title|description|image)"/g) || []).length,
  h1: (html.match(/<h1[\s>]/g) || []).length,
  ld: [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])),
});

// ── unit: visibility rules + markdown sanitizing ───────────────
{
  const now = new Date("2026-10-17T16:00:00Z"), base = { active: true, logo: "m_x" };
  ok(sponsorVisible({ ...base }, now), "unit: manual active sponsor with logo is visible");
  ok(!sponsorVisible({ ...base, logo: "" }, now), "unit: no logo -> hidden");
  ok(!sponsorVisible({ ...base, active: false }, now), "unit: inactive -> hidden");
  ok(sponsorVisible({ ...base, endDate: "2026-10-17" }, now) && !sponsorVisible({ ...base, endDate: "2026-10-16" }, now), "unit: end date shows through that ET day, hides after");
  for (const st of ["active", "trialing"]) ok(sponsorVisible({ ...base, subscriptionId: "sub_1", subStatus: st }, now), `unit: subscription ${st} -> visible`);
  for (const st of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused", undefined]) ok(!sponsorVisible({ ...base, subscriptionId: "sub_1", subStatus: st }, now), `unit: subscription ${st} -> hidden immediately`);
  ok(sponsorVisible({ ...base, subscriptionId: "sub_1", subStatus: "past_due", pastDueSince: "2026-10-15T17:00:00Z" }, now), "unit: past_due within 3-day grace -> visible");
  ok(!sponsorVisible({ ...base, subscriptionId: "sub_1", subStatus: "past_due", pastDueSince: "2026-10-14T15:00:00Z" }, now), "unit: past_due over 3 days -> hidden");
  ok(sponsorVisible({ ...base, subscriptionId: "sub_1", subStatus: "active", endDate: "2020-01-01" }, now), "unit: end date ignored for Stripe-linked sponsors");
  const a = applySubscription({ subStatus: "active" }, { id: "sub_1", status: "past_due", customer: "cus_1" }, now);
  const b = applySubscription(a, { id: "sub_1", status: "past_due" }, new Date(now.getTime() + 864e5));
  ok(a.pastDueSince === now.toISOString() && b.pastDueSince === a.pastDueSince && a.customerId === "cus_1", "unit: past_due start time kept across updates");
  ok(!applySubscription(b, { id: "sub_1", status: "active" }).pastDueSince, "unit: recovering to active clears past_due");
  const md = renderMarkdown("# Top\n\n<script>alert(1)</script> <img src=x onerror=alert(1)> [x](javascript:alert(1)) [ok](https://a.example)\n\n## Two\n\n### Three");
  ok(!/<script|<img src=x|href="javascript/i.test(md.html) && md.html.includes("&lt;script&gt;"), "unit: markdown escapes raw HTML and drops javascript: links");
  ok(!md.html.includes("<h1") && md.html.includes("<h2") && md.html.includes("<h3"), "unit: markdown headings map to H2/H3 only");
}

// ── public pages + SEO ────────────────────────────────────────
let r = await req("/sponsors");
let t = headTags(r.d);
ok(r.s === 200 && /Advertise on Hustle Vault/.test(r.d), "/sponsors 200 with server-rendered content");
ok(t.title.length === 1 && /Advertise on Hustle Vault/.test(t.title[0]) && t.desc?.length > 80, "/sponsors unique <title> + meta description");
ok(t.canonical === "https://hustlevault.app/sponsors" && t.og >= 5 && t.tw >= 4, "/sponsors canonical + Open Graph + Twitter tags");
ok(t.h1 === 1 && /<h2/.test(r.d), "/sponsors exactly one H1 + H2 sections");
ok(t.ld.some((x) => JSON.stringify(x).includes('"WebPage"') && JSON.stringify(x).includes('"Organization"')), "/sponsors JSON-LD WebPage + Organization");
ok(/Sponsor slot: \$100\/month/.test(r.d) && /Market your business here/.test(r.d) && /300×100 px/.test(r.d), "/sponsors shows price, marketing headline and logo spec");
ok(/\/sponsors\/policy/.test(r.d), "/sponsors links the Ad Policy");
r = await req("/advertise");
ok(r.s === 301 && /\/sponsors$/.test(r.h.get("location") || ""), "/advertise 301 -> /sponsors");
r = await req("/sponsors/policy"); t = headTags(r.d);
ok(r.s === 200 && t.h1 === 1 && /Last updated/.test(r.d) && /guaranteed-income/i.test(r.d) && t.canonical === "https://hustlevault.app/sponsors/policy", "/sponsors/policy 200, one H1, Last updated, canonical");
r = await req("/sitemap.xml");
ok(r.s === 200 && /<loc>https:\/\/hustlevault\.app\/sponsors<\/loc>/.test(r.d) && /sponsors\/policy/.test(r.d) && /blog\/best-side-hustles-2026/.test(r.d), "sitemap.xml lists /sponsors, policy and blog posts");
r = await req("/robots.txt");
ok(/Sitemap: https:\/\/hustlevault\.app\/sitemap\.xml/.test(r.d) && /Disallow: \/sponsors\/stats\//.test(r.d), "robots.txt references sitemap, hides private sponsor links");
r = await req("/blog"); t = headTags(r.d);
ok(r.s === 200 && t.h1 === 1 && /best-side-hustles-2026/.test(r.d) && /application\/rss\+xml/.test(r.d), "/blog server-rendered index with posts + RSS link");
r = await req("/blog/best-side-hustles-2026"); t = headTags(r.d);
ok(r.s === 200 && t.h1 === 1 && t.ld.some((x) => JSON.stringify(x).includes("BlogPosting")) && /<h2>/.test(r.d), "existing static post server-rendered with BlogPosting JSON-LD");
r = await req("/blog/this-does-not-exist-xyz");
ok(r.s === 404, "unknown blog slug -> 404");
r = await req("/blog/rss.xml");
ok(r.s === 200 && /<rss/.test(r.d) && /best-side-hustles-2026/.test(r.d), "RSS feed at /blog/rss.xml");
for (const p of ["/", "/terms.html"]) { r = await req(p); ok(r.s === 200, `${p} still 200`); }
r = await req("/terms.html");
ok(/href="\/sponsors">Advertise/.test(r.d), "static pages footer has Advertise link");

// ── admin login ───────────────────────────────────────────────
r = await post("/api/hv-admin/login", { password: PW });
TOKEN = r.d?.token;
ok(r.s === 200 && !!TOKEN, "admin login");
r = await req("/api/hv-admin/sponsors");
ok(r.s === 401, "admin sponsors API requires sign-in");
const initial = (await admin("sponsors")).d;
ok(Array.isArray(initial.sponsors), `admin sponsors list (${initial.sponsors.length} existing)`);
const preexisting = initial.sponsors.length;
r = await req("/api/sponsors");
const publicBefore = r.d.sponsors.length;
ok(r.s === 200 && r.d.checkout === false, `public sponsors API ok, checkout off (${publicBefore} live)`);

// ── uploads: real images, malicious SVG, fake image, limits ──
const bigJpeg = await sharp({ create: { width: 3000, height: 2000, channels: 3, noise: { type: "gaussian", mean: 128, sigma: 40 } } }).jpeg({ quality: 88 }).toBuffer();
const tallPng = await sharp({ create: { width: 300, height: 3000, channels: 4, background: { r: 201, g: 168, b: 76, alpha: 0.9 } } }).png().toBuffer();
const evilSvg = Buffer.from(`<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="300" height="100" onload="alert('x')"><script>alert(document.cookie)</script><foreignObject width="10" height="10"><iframe src="https://evil.example"></iframe></foreignObject><image xlink:href="https://evil.example/track.png" width="5" height="5"/><a href="javascript:alert(1)"><rect width="300" height="100" fill="#C9A84C"/></a><text x="20" y="60" font-size="40" fill="#000">TEST</text></svg>`);
const fake = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from("this is not really a png, just bytes ".repeat(20))]);
console.log("fixture sizes: jpeg", bigJpeg.length, "png", tallPng.length);
ok(bigJpeg.length > 1.6 * 1024 * 1024 && bigJpeg.length < 5 * 1024 * 1024, "fixture: large JPEG is multi-chunk and under 5 MB");

const upJ = await upload(bigJpeg, { auth: true });
ok(upJ.s === 200 && upJ.d.variants["wall.webp"].w <= 600 && upJ.d.variants["wall.webp"].h <= 200 && upJ.d.variants["tick.png"].h <= 64 && upJ.d.original.w === 3000, `large JPEG accepted + resized (${upJ.d?.variants?.["wall.webp"]?.w}×${upJ.d?.variants?.["wall.webp"]?.h}, ${upJ.d?.variants?.["wall.webp"]?.bytes} bytes webp)`);
const upP = await upload(tallPng);
ok(upP.s === 200 && upP.d.variants["wall.png"].h === 200 && upP.d.variants["wall.png"].w === 20 && upP.d.urls === null, "tall PNG (public upload) fit inside 600×200 keeping aspect, no public URL");
r = await req(`/api/media/${upP.d.mediaId}/wall.png`);
ok(r.s === 404, "inquiry upload is not publicly served before approval");
r = await req(`/api/media/${upP.d.mediaId}/wall.png`, { headers: A() });
ok(r.s === 200 && r.ct === "image/png" && r.d.subarray(1, 4).toString() === "PNG", "admin can view the pending inquiry logo");
const upS = await upload(evilSvg, { auth: true });
ok(upS.s === 200 && Object.keys(upS.d.variants).every((k) => /\.(webp|png)$/.test(k)), "malicious SVG sanitized + rasterized to WebP/PNG only");
r = await req(`/api/media/${upS.d.mediaId}/wall.png`);
ok(r.s === 200 && r.ct === "image/png" && !r.d.includes("script") && /sandbox/.test(r.h.get("content-security-policy") || "") && r.h.get("x-content-type-options") === "nosniff", "SVG served only as PNG, nosniff + sandbox CSP");
r = await req(`/api/media/${upS.d.mediaId}/wall.svg`);
ok(r.s === 404, "no raw SVG route");
r = await upload(fake);
ok(r.s === 400, "fake image (PNG magic, garbage body) rejected");
r = await upload(Buffer.from("<html><body>hi</body></html>                       "));
ok(r.s === 400, "HTML file rejected (magic bytes)");
r = await post("/api/hv-upload/start", { size: 5 * 1024 * 1024 + 1, purpose: "logo" });
ok(r.s === 413, "over 5 MB rejected at start");
const wide = await sharp({ create: { width: 8200, height: 60, channels: 3, background: "#fff" } }).png().toBuffer();
r = await upload(wide, { auth: true });
ok(r.s === 400 && /8000/.test(r.d?.error || ""), "image over 8000px rejected");
r = await post("/api/hv-upload/start", { size: 1000, purpose: "cover" });
ok(r.s === 400, "public can't upload blog covers");

// ── inquiry form ─────────────────────────────────────────────
const inq = { name: "TEST Tester", business: "TEST Sponsor Co", email: "test@example.com", website: "https://example.com", promoting: "TEST offer — please ignore", message: "Automated TEST inquiry, delete me.", agree: true, logo: upP.d.mediaId, t: 5000 };
r = await post("/api/sponsors/inquiry", { ...inq, agree: false });
ok(r.s === 400 && /Ad Policy/.test(r.d?.error), "inquiry requires agreeing to the Ad Policy");
r = await post("/api/sponsors/inquiry", { ...inq, email: "nope" });
ok(r.s === 400, "inquiry bad email -> 400");
r = await post("/api/sponsors/inquiry", { ...inq, website: "http://example.com" });
ok(r.s === 400, "inquiry non-https website -> 400");
r = await post("/api/sponsors/inquiry", { ...inq, business: "TEST honeypot", company_fax: "555" });
ok(r.s === 200 && !r.d.id, "honeypot submission silently dropped");
r = await post("/api/sponsors/inquiry", { ...inq, business: "<b>TEST Sponsor Co</b>" });
const inqId = r.d?.id; if (inqId) cleanup.inquiries.add(inqId);
ok(r.s === 200 && /^inq_/.test(inqId || ""), "valid TEST inquiry stored");
let inqs = (await admin("inquiries")).d.inquiries;
let mine = inqs.find((x) => x.id === inqId);
ok(mine && mine.business === "bTEST Sponsor Co/b" && mine.logo === upP.d.mediaId && mine.test && !inqs.some((x) => x.business === "TEST honeypot"), "admin sees inquiry (HTML stripped, logo kept), honeypot not stored");

// ── sponsor CRUD (admin) ─────────────────────────────────────
r = await admin("sponsors", { name: "TEST Bad", offer: "x offer", url: "http://example.com", logo: upJ.d.mediaId });
ok(r.s === 400, "sponsor link must be https");
r = await admin("sponsors", { name: "TEST Bad", offer: "x offer", url: "javascript:alert(1)" });
ok(r.s === 400, "javascript: link rejected");
r = await admin("sponsors", { name: "TEST Sponsor <script>", offer: "TEST: 20% off your first month", tickerLine: "TEST ticker line", url: "https://example.com/?ref=hv", email: "test@example.com", active: true, ticker: true, sort: 1, logo: upJ.d.mediaId });
const sp = r.d?.sponsor; if (sp) cleanup.sponsors.add(sp.id);
ok(r.s === 200 && sp && sp.visible && sp.name === "TEST Sponsor script" && sp.links?.stats && sp.links?.edit, "TEST sponsor created, sanitized, live, has stats + edit links");
r = await req(`/api/media/${upJ.d.mediaId}/wall.webp`);
ok(r.s === 200 && r.ct === "image/webp", "sponsor logo now public (WebP)");
r = await req("/api/sponsors");
let pub = r.d.sponsors.find((x) => x.id === sp.id);
ok(pub && pub.ticker === true && pub.logo.tick && pub.tickerLine === "TEST ticker line" && !("email" in pub) && !("statsToken" in pub), "public API lists sponsor for wall + ticker, no private fields");
r = await req("/sponsors");
ok(r.d.includes(`/go/sponsor/${sp.id}?p=wall`) && /rel="sponsored noopener"/.test(r.d) && /target="_blank"/.test(r.d) && /Sponsored/.test(r.d) && r.d.includes("TEST Sponsor script logo"), "SSR wall: sponsored link, Sponsored label, logo alt text");
ok(headTags(r.d).ld.some((x) => JSON.stringify(x).includes("TEST Sponsor script")), "JSON-LD mentions active sponsor");

// welcome email
const welcome0 = (await admin("sponsors")).d.sponsors.find((x) => x.id === sp.id).welcome;
if (MOCKS) {
  const mineEm = async () => (await (await fetch(RESEND_MOCK + "/__emails")).json()).filter((e) => e.text?.includes(sp.links.edit));
  const w = await mineEm();
  ok(w.length === 1 && w[0].subject === "Your Hustle Vault sponsor links" && w[0].text.includes(sp.links.stats) && w[0].text.includes(sp.links.edit) && w[0].html.includes("/sponsors/policy") && /300×100/.test(w[0].text) && /cancel anytime/i.test(w[0].text), "welcome email sent once via Resend (mock) with both links, policy, logo guidance");
  ok(!JSON.stringify(w).includes(PW) && !/password/i.test(JSON.stringify(w)), "welcome email has no password/secrets");
  ok(!!welcome0?.sentAt, "sponsor marked welcome sent");
  await admin("sponsors?id=" + sp.id, { offer: "TEST: updated offer" }, "PUT");
  ok((await mineEm()).length === 1, "editing a live sponsor doesn't re-send welcome (idempotent)");
  r = await admin("sponsor-welcome", { id: sp.id });
  ok(r.d?.result?.ok && (await mineEm()).length === 2, "admin 'Resend welcome email' sends again");
} else {
  ok(welcome0?.skipped === "not_configured" || !!welcome0?.sentAt, `welcome email state: ${welcome0?.sentAt ? "sent" : "not sent — email not configured (flagged in admin)"}`);
}
r = await admin("audit");
ok(r.s === 200 && r.d.audit.some((a) => a.action === "sponsor_created" && a.sponsor === sp.id), "audit log records sponsor creation");

// impressions + clicks + stats
r = await post("/api/sponsors/imp", { pv: "p1", items: [[sp.id, "wall"], [sp.id, "ticker"], [sp.id, "wall"], ["sp_doesnotexist", "wall"], [sp.id, "bogus"]] });
ok(r.s === 200 && r.d.counted === 2, "impression beacon counts wall + ticker once each (dupes/unknown dropped)");
r = await req("/api/sponsors/imp", { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" }, body: JSON.stringify({ pv: "p2", items: [[sp.id, "home"]] }) });
ok(r.s === 200 && !r.d.counted, "bot impressions ignored");
r = await req(`/go/sponsor/${sp.id}?p=wall`);
ok(r.s === 302 && r.h.get("location") === "https://example.com/?ref=hv", "/go/sponsor redirect 302 to sponsor https URL");
r = await req(`/go/sponsor/${sp.id}?p=ticker`, { headers: { "User-Agent": "curl/8.0" } });
ok(r.s === 302, "bot click still redirects (not counted)");
r = await req(`/go/sponsor/sp_doesnotexist?p=wall`);
ok(r.s === 302 && /^(https:\/\/[^/]+)?\/sponsors(\?.*)?$/.test(r.h.get("location") || ""), "unknown sponsor click -> /sponsors");
await sleep(500);
r = await admin(`sponsor-stats?id=${sp.id}&days=7`);
ok(r.s === 200 && r.d.totals.wall.imp === 1 && r.d.totals.ticker.imp === 1 && r.d.totals.wall.clk === 1 && r.d.totals.ticker.clk === 0 && r.d.totals.wall.ctr === 1 && r.d.daily.length === 7, "admin stats: impressions, clicks, CTR by placement, daily rows");
const statsTok = sp.links.stats.split("/").pop(), editTok = sp.links.edit.split("/").pop();
r = await req(`/api/sponsors/stats/${statsTok}?days=30`);
ok(r.s === 200 && r.d.stats.totals.all.imp === 2 && r.d.stats.daily.length === 30 && /noindex/.test(r.h.get("x-robots-tag") || "") && !JSON.stringify(r.d).includes("test@example.com"), "private stats link works, noindex, no email exposed");
r = await req(`/sponsors/stats/${statsTok}`);
ok(r.s === 200 && /noindex/.test(r.h.get("x-robots-tag") || ""), "stats page served with noindex header");
r = await admin("sponsor-token", { id: sp.id, kind: "stats" });
ok(r.s === 200 && r.d.sponsor.links.stats !== sp.links.stats, "stats link regenerated");
r = await req(`/api/sponsors/stats/${statsTok}`);
ok(r.s === 410, `old stats link stops working (${r.s})`);

// sponsor edit link -> pending -> admin approves
r = await req(`/api/sponsors/edit/${editTok}`);
ok(r.s === 200 && r.d.sponsor.offer === "TEST: updated offer" || r.d?.sponsor?.offer?.startsWith("TEST"), "edit link loads current listing");
const upE = await upload(tallPng, { editToken: editTok });
ok(upE.s === 200, "sponsor can upload a new logo through the edit link");
r = await post(`/api/sponsors/edit/${editTok}`, { name: "TEST Sponsor Edited", offer: "TEST: edited offer", tickerLine: "", url: "http://insecure.example" });
ok(r.s === 400, "edit link rejects non-https link");
r = await post(`/api/sponsors/edit/${editTok}`, { name: "TEST Sponsor Edited", offer: "TEST: edited offer", tickerLine: "TEST edited", url: "https://example.com/edited", logo: upE.d.mediaId });
ok(r.s === 200, "sponsor change request stored");
ok((await req("/api/sponsors")).d.sponsors.find((x) => x.id === sp.id).name !== "TEST Sponsor Edited", "change not live before review");
r = await admin("sponsor-pending", { id: sp.id, approve: true });
ok(r.s === 200 && r.d.sponsor.name === "TEST Sponsor Edited" && r.d.sponsor.logo === upE.d.mediaId && !r.d.sponsor.pending, "admin approves change (new logo applied)");
ok((await req(`/api/media/${upJ.d.mediaId}/wall.webp`)).s === 404, "replaced logo deleted");

// ticker toggle, end date, inactive
await admin(`sponsors?id=${sp.id}`, { ticker: false }, "PUT");
pub = (await req("/api/sponsors")).d.sponsors.find((x) => x.id === sp.id);
ok(pub && pub.ticker === false, "'Show in ticker' off keeps wall, removes from ticker");
await admin(`sponsors?id=${sp.id}`, { ticker: true, endDate: "2026-01-01" }, "PUT");
ok(!(await req("/api/sponsors")).d.sponsors.some((x) => x.id === sp.id), "manual sponsor past end date auto-hides");
await admin(`sponsors?id=${sp.id}`, { endDate: "" }, "PUT");
ok((await req("/api/sponsors")).d.sponsors.some((x) => x.id === sp.id), "clearing end date shows it again");
r = await admin(`sponsors?id=${sp.id}`, { logo: upS.d.mediaId }, "PUT");
ok(r.s === 200 && r.d.sponsor.logo === upS.d.mediaId, "logo swapped to sanitized SVG raster");

// inquiry: attach logo in one click, approve into sponsor
r = await admin("inquiry-attach-logo", { inquiryId: inqId, sponsorId: sp.id });
ok(r.s === 200 && r.d.sponsor.logo === upP.d.mediaId, "attach inquiry logo to sponsor in one click");
ok((await req(`/api/media/${upP.d.mediaId}/wall.png`)).s === 200, "attached logo becomes public");
const upP2 = await upload(tallPng);
r = await post("/api/sponsors/inquiry", { ...inq, business: "TEST Approve Co", logo: upP2.d.mediaId });
const inq2 = r.d.id; cleanup.inquiries.add(inq2);
r = await admin("inquiry-approve", { inquiryId: inq2 });
const sp2 = r.d?.sponsor; if (sp2) cleanup.sponsors.add(sp2.id);
ok(r.s === 200 && sp2?.visible && sp2.name === "TEST Approve Co" && sp2.source === "inquiry", "approve inquiry -> active sponsor");

// ── Stripe-linked sponsors (mocked Stripe locally) ───────────
if (MOCKS) {
  const setSub = (s) => fetch(STRIPE_MOCK + "/__set_sub", { method: "POST", body: JSON.stringify({ object: "subscription", customer: "cus_test1", items: { data: [{ price: { id: "price_1URbjlRTxRBnTgwhTWtuYip2" } }] }, ...s }) });
  const stripe = new Stripe("sk_test_dummy_for_signing_only");
  const hook = (type, obj) => { const payload = JSON.stringify({ id: "evt_e2e_" + Math.random().toString(36).slice(2), object: "event", type, data: { object: obj } }); return req("/api/stripe/webhook", { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.WHSEC }) }, body: payload }); };
  const vis = async () => (await req("/api/sponsors")).d.sponsors.some((x) => x.id === sp2.id);
  await setSub({ id: "sub_test0001", status: "active" });
  r = await admin(`sponsors?id=${sp2.id}`, { subscriptionId: "sub_test0001" }, "PUT");
  ok(r.d.sponsor.subStatus === "active" && r.d.sponsor.customerId === "cus_test1" && await vis(), "admin links sub_ id -> re-fetched from Stripe, active -> shown");
  await setSub({ id: "sub_test0001", status: "past_due" });
  r = await hook("invoice.payment_failed", { id: "in_test", object: "invoice", subscription: "sub_test0001" });
  let s2 = (await admin("sponsors")).d.sponsors.find((x) => x.id === sp2.id);
  ok(r.s === 200 && s2.subStatus === "past_due" && s2.pastDueSince && await vis(), "invoice.payment_failed -> past_due, still shown during 3-day grace");
  await setSub({ id: "sub_test0001", status: "active" });
  await hook("customer.subscription.updated", { id: "sub_test0001", object: "subscription", status: "past_due" /* body is ignored; Stripe copy wins */ });
  s2 = (await admin("sponsors")).d.sponsors.find((x) => x.id === sp2.id);
  ok(s2.subStatus === "active" && !s2.pastDueSince, "subscription.updated re-fetches from Stripe (posted body not trusted) -> active");
  for (const st of ["unpaid", "incomplete_expired", "canceled"]) {
    await setSub({ id: "sub_test0001", status: st });
    await hook(st === "canceled" ? "customer.subscription.deleted" : "customer.subscription.updated", { id: "sub_test0001", object: "subscription" });
    ok(!(await vis()), `subscription ${st} -> hidden immediately`);
  }
  await setSub({ id: "sub_test0001", status: "trialing" });
  r = await admin("sponsor-sync", { id: sp2.id });
  ok(r.d.sponsor.subStatus === "trialing" && await vis(), "manual re-check: trialing -> shown");
  r = await hook("customer.subscription.updated", { id: "sub_unrelated99", object: "subscription", metadata: {} });
  ok(r.s === 200, "unrelated subscription events acknowledged and ignored");
  // checkout-created sponsor
  await setSub({ id: "sub_test0002", status: "active" });
  r = await hook("checkout.session.completed", { id: "cs_test_sp1", object: "checkout.session", mode: "subscription", subscription: "sub_test0002", metadata: { hv_kind: "sponsor", hv_business: "TEST Checkout Co" }, customer_details: { email: "test@example.com" } });
  const sp3 = (await admin("sponsors")).d.sponsors.find((x) => x.subscriptionId === "sub_test0002");
  if (sp3) cleanup.sponsors.add(sp3.id);
  ok(r.s === 200 && sp3 && sp3.name === "TEST Checkout Co" && sp3.subStatus === "active" && !sp3.active && !sp3.visible, "sponsor checkout auto-links subscription; listing waits for admin review");
  // webhook endpoint events (adding only)
  const before = (await (await fetch(STRIPE_MOCK + "/__state")).json()).endpoint.enabled_events;
  r = await admin("stripe-webhook-events", {});
  const after = (await (await fetch(STRIPE_MOCK + "/__state")).json()).endpoint.enabled_events;
  ok(r.s === 200 && before.every((e) => after.includes(e)) && ["customer.subscription.updated", "customer.subscription.deleted", "invoice.payment_failed"].every((e) => after.includes(e)), "webhook endpoint: sponsor events added, existing kept");
  r = await admin("stripe-webhook-events", {});
  ok(r.d.unchanged === true, "webhook events update is idempotent");
}

// ── sponsor checkout (off by default) ────────────────────────
r = await post("/api/sponsors/checkout", { business: "TEST", email: "test@example.com" });
ok(r.s === 400 && /isn't open/.test(r.d?.error || ""), "public sponsor checkout disabled by default");
r = await admin("sponsor-checkout-test", {});
ok(r.s === 200 && r.d.mode === "subscription" && r.d.amount_total === 10000 && r.d.status === "expired", `admin test: $100/month subscription session created + expired immediately (livemode=${r.d?.livemode})`);
if (MOCKS) {
  await admin("sponsor-settings", { checkout: true }, "PUT");
  r = await post("/api/sponsors/checkout", { business: "TEST", email: "test@example.com" });
  ok(r.s === 200 && /^https:\/\/checkout\.stripe\.com\//.test(r.d.url), "toggle ON -> checkout returns Stripe URL (mock)");
  await admin("sponsor-settings", { checkout: false }, "PUT");
}
ok((await req("/api/sponsors")).d.checkout === false, "sponsor checkout toggle is OFF");

// ── blog: draft, publish, SEO, sitemap, RSS, delete ──────────
const slug = "test-post-e2e-" + Date.now().toString(36);
const cover = await upload(await sharp({ create: { width: 2400, height: 1400, channels: 3, background: "#2A1400" } }).jpeg().toBuffer(), { auth: true, purpose: "cover" });
ok(cover.s === 200 && cover.d.variants["cover.webp"].w <= 1600 && cover.d.variants["cover.webp"].h <= 900 && cover.d.variants["cover.jpg"], "blog cover upload resized to fit 1600×900 (WebP + JPG)");
const postBody = { title: "TEST Post — please ignore", slug, excerpt: "TEST excerpt for an automated end-to-end check of the Hustle Vault blog. Not a real post.", body: "Intro paragraph with **bold** and a [link](https://example.com).\n\n# Big heading\n\n## Section two\n\n### Sub section\n\n<script>alert('x')</script>\n\n- one\n- two", status: "draft", cover: cover.d.mediaId, coverAlt: "TEST cover" };
r = await admin("posts", postBody);
const pst = r.d?.post; if (pst) cleanup.posts.add(pst.id);
ok(r.s === 200 && pst?.status === "draft", "TEST draft post created");
ok((await req(`/blog/${slug}`)).s === 404 && !(await req("/sitemap.xml")).d.includes(slug) && !(await req("/api/blog")).d.posts.some((p) => p.slug === slug), "draft is not public (404, not in sitemap/API)");
r = await admin("posts", { ...postBody, slug: "best-side-hustles-2026" });
ok(r.s === 400, "slug colliding with an existing post rejected");
r = await admin(`posts?id=${pst.id}`, { ...postBody, status: "published", publishAt: new Date(Date.now() + 864e5).toISOString() }, "PUT");
ok(r.s === 200 && (await req(`/blog/${slug}`)).s === 404, "future publish date stays hidden");
r = await admin(`posts?id=${pst.id}`, { ...postBody, status: "published", publishAt: new Date(Date.now() - 60000).toISOString() }, "PUT");
await sleep(300);
r = await req(`/blog/${slug}`); t = headTags(r.d);
ok(r.s === 200 && t.title.length === 1 && t.title[0].includes("TEST Post") && t.desc.startsWith("TEST excerpt") && t.canonical === `https://hustlevault.app/blog/${slug}`, "published post: own title, meta description, canonical");
ok(/og:type" content="article"/.test(r.d) && t.tw >= 4 && t.ld.some((x) => JSON.stringify(x).includes("BlogPosting")) && /cover\.jpg/.test(r.d), "published post: OG article, Twitter, BlogPosting JSON-LD, cover image");
ok(t.h1 === 1 && /<h2 id="big-heading">/.test(r.d) && /<h3 id="sub-section">/.test(r.d) && !/<script>alert/.test(r.d) && /&lt;script&gt;/.test(r.d), "post HTML server-rendered: one H1, markdown headings as H2/H3, script escaped");
ok(/<time datetime=/.test(r.d), "post shows publish date");
ok((await req("/blog")).d.includes(`/blog/${slug}`), "post listed on /blog index");
ok((await req("/sitemap.xml")).d.includes(`/blog/${slug}`) && (await req("/blog/rss.xml")).d.includes(`/blog/${slug}`), "post auto-added to sitemap.xml + RSS");
if (!PROD) {
  const extra = [];
  for (let i = 0; i < 9; i++) { const x = await admin("posts", { ...postBody, slug: `${slug}-p${i}`, title: `TEST Page Post ${i}`, status: "published", publishAt: new Date(Date.now() - (i + 2) * 3600e3).toISOString() }); if (x.d?.post) { extra.push(x.d.post.id); cleanup.posts.add(x.d.post.id); } }
  r = await req("/blog");
  const r2 = await req("/blog?page=2");
  ok(/rel="next"/.test(r.d) && r2.s === 200 && /rel="prev"/.test(r2.d) && headTags(r2.d).canonical === "https://hustlevault.app/blog?page=2", "pagination after 10 posts (page 2 with prev/next + canonical)");
}

// ── mobile 390px: no horizontal overflow risk in SSR markup (full check is in the browser step) ──
ok(!/width:\s*(4\d\d|[5-9]\d\d|\d{4})px/.test((await req("/sponsors")).d.replace(/max-width:\s*\d+px/g, "")), "no fixed >390px widths in SSR /sponsors markup");

// ── cleanup ─────────────────────────────────────────────────
for (const id of cleanup.posts) await admin(`posts?id=${id}`, undefined, "DELETE").catch(() => {});
for (const id of cleanup.sponsors) await req(`/api/hv-admin/sponsors?id=${id}`, { method: "DELETE", headers: A() });
for (const id of cleanup.inquiries) await req(`/api/hv-admin/inquiries?id=${id}`, { method: "DELETE", headers: A() });
await sleep(300);
const endS = (await admin("sponsors")).d.sponsors, endI = (await admin("inquiries")).d.inquiries, endP = (await admin("posts")).d.posts;
ok(endS.length === preexisting && !endS.some((s) => /^TEST/.test(s.name)), "TEST sponsors deleted");
ok(!endI.some((q) => /TEST/.test(q.business)), "TEST inquiries deleted");
ok(!endP.some((p) => p.title.startsWith("TEST")), "TEST posts deleted");
ok((await req(`/blog/${slug}`)).s === 404 && !(await req("/sitemap.xml")).d.includes(slug), "deleted post gone from site + sitemap");
ok((await req(`/api/media/${upP.d.mediaId}/wall.png`)).s === 404 && (await req(`/api/media/${upS.d.mediaId}/wall.png`)).s === 404 && (await req(`/api/media/${cover.d.mediaId}/cover.webp`)).s === 404, "TEST media deleted");
r = await req("/api/sponsors");
ok(r.d.sponsors.length === publicBefore, `public sponsors back to ${publicBefore} (placeholders${publicBefore ? "" : " showing"})`);
ok(publicBefore > 0 || /Your logo here/.test((await req("/sponsors")).d), "/sponsors shows 'Your logo here' placeholder when empty");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

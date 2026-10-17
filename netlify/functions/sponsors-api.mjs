// Public sponsor API: active sponsors, inquiries, impression beacons, private stats/edit links,
// and the (off-by-default) $100/month sponsor checkout.
import { json, handle, readJson, HttpError, ipHash, baseUrl } from "../lib/http.mjs";
import { rateLimit } from "../lib/store.mjs";
import { content, getSponsors, visibleSponsors, publicSponsor, getSettings, updateSponsors, audit, rid, text, email, httpsUrl, MEDIA_ID_RE, TOKEN_RE, SPONSOR_ID_RE, mediaUrls } from "../lib/content.mjs";
import { isBot, visitor, capFilter, record, sponsorStats } from "../lib/sponsorstats.mjs";
import { createSponsorCheckout } from "../lib/sponsorsub.mjs";
import { etDay, PLACEMENTS } from "../../shared/sponsors.js";

const NOINDEX = { "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };

async function inquiry(req, context) {
  const b = await readJson(req, 12000);
  if (b.company_fax || b.website2) return json({ ok: true }); // honeypot: pretend success, store nothing
  if (typeof b.t === "number" && b.t < 2500) return json({ ok: true }); // filled faster than a human can
  const who = ipHash(context, req);
  if (!(await rateLimit("sp-inq", who, 3, 600)) || !(await rateLimit("sp-inq-day", who, 10, 86400)) || !(await rateLimit("sp-inq-all", "all", 60, 86400)))
    throw new HttpError(429, "Too many messages — please try again later.");
  if (b.agree !== true) throw new HttpError(400, "Please agree to the Ad Policy.");
  const logo = String(b.logo || "");
  if (logo && !MEDIA_ID_RE.test(logo)) throw new HttpError(400, "Bad logo upload — please try again.");
  const now = new Date().toISOString();
  const rec = {
    id: "inq_" + rid(9), createdAt: now,
    name: text(b.name, "Your name", 2, 80), business: text(b.business, "Business name", 2, 80), email: email(b.email),
    website: httpsUrl(b.website, "Website", { required: false }), promoting: text(b.promoting, "What you're promoting", 3, 300),
    logoUrl: httpsUrl(b.logoUrl, "Logo URL", { required: false }), logo, message: text(b.message, "Message", 0, 2000, { required: false }),
    agreedPolicy: true, test: /\bTEST\b/.test(`${b.business} ${b.name}`),
  };
  await content().setJSON(`inq/${now}-${rec.id}`, rec);
  await audit("inquiry_received", { inquiry: rec.id, business: rec.business });
  return json({ ok: true, id: rec.id });
}

async function impressions(req, context) {
  if (isBot(req)) return json({ ok: true });
  const who = ipHash(context, req);
  if (!(await rateLimit("sp-imp", who, 120, 600))) return json({ ok: true });
  const b = await readJson(req, 4000);
  const items = Array.isArray(b.items) ? b.items.slice(0, 40) : [];
  const visible = new Set((await visibleSponsors()).map((s) => s.id));
  const seen = new Set();
  const entries = [];
  for (const it of items) {
    const [id, p] = Array.isArray(it) ? it : [];
    const k = `${id}|${p}`;
    if (!SPONSOR_ID_RE.test(id || "") || !PLACEMENTS.includes(p) || !visible.has(id) || seen.has(k)) continue;
    seen.add(k); entries.push([id, p, "imp"]);
  }
  if (!entries.length) return json({ ok: true, counted: 0 });
  const day = etDay();
  const allowed = await capFilter(await visitor(context, req, day), entries, day);
  if (allowed.length) await record(allowed, day);
  return json({ ok: true, counted: allowed.length });
}

const byToken = async (field, tok) => {
  if (!TOKEN_RE.test(tok || "")) throw new HttpError(410, "This link isn't valid.");
  const s = (await getSponsors()).list.find((x) => x[field] && x[field] === tok);
  if (!s) throw new HttpError(410, "This link isn't valid (it may have been replaced with a new one).");
  return s;
};

async function checkout(req, context) {
  const settings = await getSettings();
  if (!settings.checkout) throw new HttpError(400, "Online sponsor checkout isn't open yet — please use the inquiry form.");
  if (!(await rateLimit("sp-co", ipHash(context, req), 5, 900))) throw new HttpError(429, "Too many attempts. Please try again later.");
  const b = await readJson(req, 3000);
  const session = await createSponsorCheckout(req, { business: text(b.business, "Business name", 2, 60), email: email(b.email) });
  return json({ url: session.url });
}

export default handle(async (req, context) => {
  const { action, token } = context.params || {};
  if (!action && req.method === "GET") {
    const [list, settings] = await Promise.all([visibleSponsors(), getSettings()]);
    return json({ sponsors: list.map(publicSponsor), checkout: !!settings.checkout }, 200, { "Cache-Control": "public, max-age=30, s-maxage=30" });
  }
  if (action === "inquiry" && req.method === "POST") return inquiry(req, context);
  if (action === "imp" && req.method === "POST") return impressions(req, context);
  if (action === "checkout" && req.method === "POST") return checkout(req, context);
  if (action === "stats" && req.method === "GET") {
    if (!(await rateLimit("sp-stats", ipHash(context, req), 60, 600))) throw new HttpError(429, "Too many requests.");
    const s = await byToken("statsToken", token);
    const days = new URL(req.url).searchParams.get("days") === "7" ? 7 : 30;
    return json({ sponsor: { name: s.name, offer: s.offer, logo: mediaUrls(s.logo), active: s.active }, stats: await sponsorStats(s.id, days) }, 200, NOINDEX);
  }
  if (action === "edit") {
    if (!(await rateLimit("sp-edit", ipHash(context, req), 30, 600))) throw new HttpError(429, "Too many requests.");
    const s = await byToken("editToken", token);
    if (req.method === "GET") return json({ sponsor: { name: s.name, offer: s.offer, tickerLine: s.tickerLine || "", url: s.url, logo: mediaUrls(s.logo) }, pending: s.pending ? { at: s.pending.at } : null }, 200, NOINDEX);
    if (req.method === "POST") {
      const b = await readJson(req, 4000);
      const logo = String(b.logo || "");
      if (logo && !MEDIA_ID_RE.test(logo)) throw new HttpError(400, "Bad logo upload — please try again.");
      const pending = {
        at: new Date().toISOString(), name: text(b.name, "Business name", 2, 60), offer: text(b.offer, "Offer line", 3, 120),
        tickerLine: text(b.tickerLine, "Ticker line", 0, 70, { required: false }), url: httpsUrl(b.url, "Link URL"), logo, note: text(b.note, "Note", 0, 500, { required: false }),
      };
      await updateSponsors((list) => { const x = list.find((y) => y.id === s.id); if (!x) return null; x.pending = pending; return list; });
      await audit("sponsor_change_requested", { sponsor: s.id, name: s.name });
      return json({ ok: true }, 200, NOINDEX);
    }
  }
  throw new HttpError(404, "Not found");
});

export const config = { path: ["/api/sponsors", "/api/sponsors/:action", "/api/sponsors/:action/:token"], rateLimit: { windowLimit: 120, windowSize: 60, aggregateBy: ["ip", "domain"] } };

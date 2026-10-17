// Admin API: login, stats dashboard, app controls, CSV export.
import { json, handle, readJson, HttpError, cleanText, ipHash } from "../lib/http.mjs";
import { purchases, events, meta, rateLimit } from "../lib/store.mjs";
import { verifyPassword, issueToken, requireAdmin, signOutEverywhere } from "../lib/admin.mjs";
import { getCatalog, getOverrides, isBuilt } from "../lib/apps.mjs";
import { APPS } from "../../shared/apps.js";
import { content, getSponsors, updateSponsors, sponsorFields, setMediaPublic, deleteMedia, listInquiries, listAudit, audit, getSettings, setSettings, token, rid, listPosts, postFields, POST_ID_RE, SPONSOR_ID_RE, mediaUrls } from "../lib/content.mjs";
import { sponsorVisible } from "../../shared/sponsors.js";
import { sponsorStats, deleteSponsorStats } from "../lib/sponsorstats.mjs";
import { sendWelcome, emailConfigured, sponsorLinks } from "../lib/email.mjs";
import { welcomeIfLive, syncSubscription, createSponsorCheckout } from "../lib/sponsorsub.mjs";
import { verifiedStripe } from "../lib/stripe.mjs";
import { POSTS as STATIC_POSTS } from "../../src/blog/posts.js";

const SPONSOR_EVENTS = ["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "invoice.payment_failed"];

function adminSponsor(s) {
  return { ...s, visible: sponsorVisible(s), logoUrls: mediaUrls(s.logo), links: s.statsToken ? sponsorLinks(s) : null,
    pending: s.pending ? { ...s.pending, logoUrls: mediaUrls(s.pending.logo) } : null };
}

async function sponsorsAdmin(req, url) {
  const id = url.searchParams.get("id") || "";
  if (req.method === "GET") {
    const [{ list }, settings] = await Promise.all([getSponsors(), getSettings()]);
    return { sponsors: list.sort((a, b) => (a.sort ?? 100) - (b.sort ?? 100)).map(adminSponsor), settings, emailConfigured: emailConfigured() };
  }
  if (req.method === "POST") {
    const f = await sponsorFields(await readJson(req, 6000));
    const now = new Date().toISOString();
    const s = { id: "sp_" + rid(9), ticker: true, sort: 100, ...f, source: "admin", statsToken: token(), editToken: token(), createdAt: now, updatedAt: now };
    if (s.logo) await setMediaPublic(s.logo, true);
    await updateSponsors((list) => { list.push(s); return list; });
    await audit("sponsor_created", { sponsor: s.id, name: s.name, active: s.active });
    await welcomeIfLive(null, s, "admin");
    return { sponsor: adminSponsor((await getSponsors()).list.find((x) => x.id === s.id) || s) };
  }
  if (!SPONSOR_ID_RE.test(id)) throw new HttpError(400, "Bad sponsor id");
  if (req.method === "PUT") {
    const f = await sponsorFields(await readJson(req, 6000), { partial: true });
    let before, after;
    await updateSponsors((list) => {
      const i = list.findIndex((x) => x.id === id);
      if (i < 0) throw new HttpError(404, "Sponsor not found");
      before = list[i]; after = { ...before, ...f, updatedAt: new Date().toISOString() };
      if (f.subscriptionId === "") { delete after.subStatus; delete after.pastDueSince; delete after.customerId; }
      list[i] = after; return list;
    });
    if (f.logo && f.logo !== before.logo) await setMediaPublic(f.logo, true);
    if (before.logo && f.logo !== undefined && f.logo !== before.logo) await deleteMedia(before.logo);
    await audit("sponsor_updated", { sponsor: id, name: after.name, fields: Object.keys(f).join(",") });
    if (f.subscriptionId && f.subscriptionId !== before.subscriptionId) { try { await syncSubscription(f.subscriptionId, "admin"); } catch (e) { console.error("sync", e.message); } }
    else await welcomeIfLive(before, after, "admin");
    return { sponsor: adminSponsor((await getSponsors()).list.find((x) => x.id === id)) };
  }
  if (req.method === "DELETE") {
    let gone;
    await updateSponsors((list) => { gone = list.find((x) => x.id === id); return gone ? list.filter((x) => x.id !== id) : null; });
    if (!gone) throw new HttpError(404, "Sponsor not found");
    await deleteMedia(gone.logo); if (gone.pending?.logo) await deleteMedia(gone.pending.logo);
    await deleteSponsorStats(id);
    await audit("sponsor_deleted", { sponsor: id, name: gone.name });
    return { ok: true };
  }
  throw new HttpError(405, "Method not allowed");
}

async function sponsorAction(action, b) {
  const id = String(b.id || "");
  if (!SPONSOR_ID_RE.test(id)) throw new HttpError(400, "Bad sponsor id");
  const one = async () => (await getSponsors()).list.find((x) => x.id === id);
  if (action === "sponsor-token") {
    const field = b.kind === "edit" ? "editToken" : "statsToken";
    await updateSponsors((list) => { const x = list.find((y) => y.id === id); if (!x) throw new HttpError(404, "Sponsor not found"); x[field] = token(); return list; });
    await audit("sponsor_link_regenerated", { sponsor: id, kind: b.kind === "edit" ? "edit" : "stats" });
    return { sponsor: adminSponsor(await one()) };
  }
  if (action === "sponsor-welcome") {
    const r = await sendWelcome(id, { force: true, trigger: "admin-resend" });
    if (!r.ok && r.reason !== "send_failed") await audit("welcome_email_skipped", { sponsor: id, reason: r.reason });
    return { result: r, sponsor: adminSponsor(await one()) };
  }
  if (action === "sponsor-pending") {
    let before, after, drop;
    await updateSponsors((list) => {
      const x = list.find((y) => y.id === id);
      if (!x?.pending) throw new HttpError(400, "No pending changes");
      before = { ...x };
      if (b.approve === true) {
        const p = x.pending;
        if (p.logo) { drop = x.logo; x.logo = p.logo; }
        Object.assign(x, { name: p.name, offer: p.offer, tickerLine: p.tickerLine, url: p.url });
      } else drop = x.pending.logo;
      delete x.pending; x.updatedAt = new Date().toISOString(); after = x; return list;
    });
    if (b.approve === true && after.logo !== before.logo) await setMediaPublic(after.logo, true);
    if (drop && drop !== after.logo) await deleteMedia(drop);
    await audit(b.approve === true ? "sponsor_change_approved" : "sponsor_change_rejected", { sponsor: id, name: after.name });
    return { sponsor: adminSponsor(await one()) };
  }
  if (action === "sponsor-sync") {
    const s = await one();
    if (!s?.subscriptionId) throw new HttpError(400, "No subscription linked");
    return { result: await syncSubscription(s.subscriptionId, "admin"), sponsor: adminSponsor(await one()) };
  }
  throw new HttpError(404, "Not found");
}

async function inquiryAction(action, b) {
  const all = await listInquiries();
  const inq = all.find((x) => x.id === b.inquiryId);
  if (!inq) throw new HttpError(404, "Inquiry not found");
  if (action === "inquiry-approve") {
    if (!inq.logo) throw new HttpError(400, "This inquiry has no uploaded logo. Create the sponsor by hand and upload or import a logo.");
    const f = await sponsorFields({
      name: b.name ?? inq.business, offer: b.offer ?? inq.promoting.slice(0, 120), tickerLine: b.tickerLine ?? "", url: b.url ?? inq.website,
      email: inq.email, active: b.active !== false, ticker: true, sort: 100, endDate: b.endDate || "", subscriptionId: "", logo: inq.logo,
    });
    const now = new Date().toISOString();
    const s = { id: "sp_" + rid(9), ...f, source: "inquiry", inquiryId: inq.id, statsToken: token(), editToken: token(), createdAt: now, updatedAt: now };
    await setMediaPublic(s.logo, true);
    await updateSponsors((list) => { list.push(s); return list; });
    await content().setJSON(inquiryKey(inq), { ...inq, sponsorId: s.id, approvedAt: now });
    await audit("inquiry_approved", { inquiry: inq.id, sponsor: s.id, name: s.name, active: s.active });
    await welcomeIfLive(null, s, "inquiry-approve");
    return { sponsor: adminSponsor((await getSponsors()).list.find((x) => x.id === s.id)) };
  }
  if (action === "inquiry-attach-logo") {
    if (!inq.logo) throw new HttpError(400, "This inquiry has no uploaded logo.");
    if (!SPONSOR_ID_RE.test(b.sponsorId || "")) throw new HttpError(400, "Pick a sponsor");
    let before, after;
    const f = await sponsorFields({ logo: inq.logo }, { partial: true });
    await updateSponsors((list) => { const x = list.find((y) => y.id === b.sponsorId); if (!x) throw new HttpError(404, "Sponsor not found"); before = { ...x }; Object.assign(x, f, { updatedAt: new Date().toISOString() }); after = x; return list; });
    await setMediaPublic(inq.logo, true);
    if (before.logo && before.logo !== inq.logo) await deleteMedia(before.logo);
    await audit("inquiry_logo_attached", { inquiry: inq.id, sponsor: b.sponsorId });
    await welcomeIfLive(before, after, "admin");
    return { sponsor: adminSponsor(after) };
  }
  throw new HttpError(404, "Not found");
}
const inquiryKey = (inq) => `inq/${inq.createdAt}-${inq.id}`;

async function postsAdmin(req, url) {
  const id = url.searchParams.get("id") || "";
  const posts = await listPosts();
  if (req.method === "GET") return { posts: posts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), staticSlugs: STATIC_POSTS.map((p) => p.slug) };
  const reserved = (exceptId) => new Set([...STATIC_POSTS.map((p) => p.slug), ...posts.filter((p) => p.id !== exceptId).map((p) => p.slug)]);
  if (req.method === "POST") {
    const f = postFields(await readJson(req, 90000), reserved(null));
    const now = new Date().toISOString();
    const p = { id: "p_" + rid(9), ...f, createdAt: now, updatedAt: now };
    if (p.cover) await setMediaPublic(p.cover, true);
    await content().setJSON(`post/${p.id}`, p);
    await audit("post_created", { post: p.id, slug: p.slug, status: p.status });
    return { post: p };
  }
  if (!POST_ID_RE.test(id)) throw new HttpError(400, "Bad post id");
  const cur = posts.find((p) => p.id === id);
  if (!cur) throw new HttpError(404, "Post not found");
  if (req.method === "PUT") {
    const f = postFields(await readJson(req, 90000), reserved(id));
    const p = { ...cur, ...f, updatedAt: new Date().toISOString() };
    await content().setJSON(`post/${id}`, p);
    if (cur.cover && cur.cover !== p.cover) await deleteMedia(cur.cover);
    await audit("post_updated", { post: id, slug: p.slug, status: p.status });
    return { post: p };
  }
  if (req.method === "DELETE") {
    await content().delete(`post/${id}`);
    if (cur.cover) await deleteMedia(cur.cover);
    await audit("post_deleted", { post: id, slug: cur.slug });
    return { ok: true };
  }
  throw new HttpError(405, "Method not allowed");
}

async function webhookEvents() {
  const s = await verifiedStripe();
  const eps = await s.webhookEndpoints.list({ limit: 100 });
  const ep = eps.data.find((e) => /^https:\/\/hustlevault\.app\/api\/stripe\/webhook\/?$/.test(e.url));
  if (!ep) throw new HttpError(404, "No Stripe webhook endpoint for https://hustlevault.app/api/stripe/webhook");
  const before = ep.enabled_events || [];
  if (before.includes("*")) return { endpoint: ep.id, unchanged: true, enabled_events: before };
  const add = SPONSOR_EVENTS.filter((e) => !before.includes(e));
  if (!add.length) return { endpoint: ep.id, unchanged: true, enabled_events: before };
  const up = await s.webhookEndpoints.update(ep.id, { enabled_events: [...before, ...add] });
  await audit("stripe_webhook_events_added", { endpoint: ep.id, added: add.join(",") });
  return { endpoint: ep.id, added: add, enabled_events: up.enabled_events };
}

const REAL_PAID = ["paid", "refunded", "partially_refunded"];

async function loadPurchases() {
  const { blobs } = await purchases().list();
  const out = [];
  for (let i = 0; i < blobs.length; i += 25) {
    const batch = await Promise.all(blobs.slice(i, i + 25).map((b) => purchases().get(b.key, { type: "json" }).catch(() => null)));
    out.push(...batch.filter(Boolean));
  }
  return out;
}

async function loadEvents(days) {
  const dayKeys = [];
  for (let i = 0; i < days; i++) dayKeys.push(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const lists = await Promise.all(dayKeys.map((d) => events().list({ prefix: d + "/" }).then((r) => r.blobs).catch(() => [])));
  return lists.flat().map(({ key }) => {
    const [day, type, app, source, campaign, amount] = key.split("/");
    const dec = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
    return { day, type, app: dec(app), source: dec(source), campaign: dec(campaign), amount: +amount || 0 };
  });
}

const isTestP = (p) => p.preview || p.livemode === false || p.utm?.source === "e2e-test";

async function stats(days, includeTest, recentLimit = 100) {
  const since = Date.now() - days * 864e5;
  const [all, evs, catalog] = await Promise.all([loadPurchases(), loadEvents(days), getCatalog()]);
  const ps = all.filter((p) => Date.parse(p.createdAt) >= since);
  const counted = ps.filter((p) => REAL_PAID.includes(p.status) && (includeTest || !isTestP(p)));
  const evOk = (e) => includeTest || !e.type.endsWith("_test");
  const ev = evs.filter(evOk).map((e) => ({ ...e, type: e.type.replace(/_test$/, "") }));

  const byApp = catalog.map((a) => {
    const mine = counted.filter((p) => p.appId === a.id);
    const views = ev.filter((e) => e.type === "app_view" && e.app === a.id).length;
    const checkouts = ev.filter((e) => e.type === "checkout_start" && e.app === a.id).length;
    const refunded = mine.filter((p) => p.status !== "paid");
    const revenue = mine.reduce((s, p) => s + (p.amountPaid || 0) - (p.amountRefunded || 0), 0);
    const aiCost = mine.reduce((s, p) => s + (p.ai?.costUsd || 0), 0);
    return {
      id: a.id, name: a.name, path: a.path, status: a.status, price: a.price, built: isBuilt(a.id) || !!a.external,
      views, checkouts, purchases: mine.length, revenue, refunds: refunded.length,
      refundAmount: refunded.reduce((s, p) => s + (p.amountRefunded || 0), 0),
      aiCostUsd: +aiCost.toFixed(4), aiCostPerSale: mine.length ? +(aiCost / mine.length).toFixed(5) : 0,
      viewToPurchase: views ? +(mine.length / views).toFixed(4) : null,
      checkoutToPurchase: checkouts ? +(mine.length / checkouts).toFixed(4) : null,
      vcClicks: a.id === "venturecheck" ? ev.filter((e) => e.type === "vc_click").length : undefined,
    };
  });

  const camp = new Map();
  const C = (e) => { const k = `${e.source}|${e.campaign}`; if (!camp.has(k)) camp.set(k, { source: e.source, campaign: e.campaign, visits: 0, appViews: 0, checkouts: 0, purchases: 0, revenue: 0, refunds: 0, vcClicks: 0 }); return camp.get(k); };
  for (const e of ev) {
    const c = C(e);
    if (e.type === "visit") c.visits++;
    else if (e.type === "app_view") c.appViews++;
    else if (e.type === "checkout_start") c.checkouts++;
    else if (e.type === "purchase") { c.purchases++; c.revenue += e.amount; }
    else if (e.type === "refund") { c.refunds++; c.revenue -= e.amount; }
    else if (e.type === "vc_click") c.vcClicks++;
  }
  const vcSales = ev.filter((e) => e.type === "vc_purchase");
  const totals = {
    visits: ev.filter((e) => e.type === "visit").length,
    appViews: ev.filter((e) => e.type === "app_view").length,
    checkouts: ev.filter((e) => e.type === "checkout_start").length,
    purchases: counted.length,
    revenue: byApp.reduce((s, a) => s + a.revenue, 0),
    refunds: counted.filter((p) => p.status !== "paid").length,
    refundAmount: counted.reduce((s, p) => s + (p.amountRefunded || 0), 0),
    aiCostUsd: +counted.reduce((s, p) => s + (p.ai?.costUsd || 0), 0).toFixed(4),
    testPurchases: ps.filter((p) => REAL_PAID.includes(p.status) && isTestP(p)).length,
  };
  totals.visitToPurchase = totals.visits ? +(totals.purchases / totals.visits).toFixed(4) : null;
  const recent = ps.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, recentLimit).map((p) => ({
    id: p.id, app: p.appId, status: p.status, amount: p.amount, paid: p.amountPaid || 0, refunded: p.amountRefunded || 0,
    createdAt: p.createdAt, source: p.utm?.source || "", campaign: p.utm?.campaign || "", test: isTestP(p),
    aiCostUsd: p.ai?.costUsd || 0, email: p.email ? p.email.replace(/^(.).*(@.*)$/, "$1***$2") : "",
  }));
  return {
    days, includeTest, totals, byApp,
    popular: [...byApp].sort((a, b) => b.purchases - a.purchases || b.views - a.views).map((a) => a.id),
    byCampaign: [...camp.values()].sort((a, b) => b.revenue - a.revenue || b.visits - a.visits),
    venturecheck: { clicks: ev.filter((e) => e.type === "vc_click").length, salesAllSources: vcSales.length, revenueAllSources: vcSales.reduce((s, e) => s + e.amount, 0) },
    recent,
  };
}

const csv = (rows) => {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v) => { let s = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
};

async function updateApp(body) {
  const id = String(body.id || "");
  const base = APPS.find((a) => a.id === id);
  if (!base) throw new HttpError(404, "Unknown app");
  const o = await getOverrides();
  const cur = { ...(o[id] || {}) };
  if (body.price !== undefined) {
    const price = Math.round(Number(body.price));
    if (base.external) throw new HttpError(400, "VentureCheck's price is set on its own site.");
    if (!Number.isFinite(price) || price < 100 || price > 20000) throw new HttpError(400, "Price must be between $1 and $200.");
    cur.price = price;
  }
  for (const k of ["tagline", "give", "get", "fast"]) if (body[k] !== undefined) {
    const v = cleanText(body[k], k === "tagline" ? 140 : 200);
    if (v.length < 3) throw new HttpError(400, `${k} is too short`);
    cur[k] = v;
  }
  if (body.status !== undefined) {
    if (!["live", "soon", "hidden"].includes(body.status)) throw new HttpError(400, "Bad status");
    if (body.status === "live" && !isBuilt(id) && !base.external) throw new HttpError(400, "This app isn't built yet.");
    cur.status = body.status;
  }
  o[id] = cur;
  await meta().setJSON("config/apps", o);
  return getCatalog();
}

export default handle(async (req, context) => {
  const { action } = context.params || {};
  if (action === "login") {
    if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
    if (!(await rateLimit("admin-login", ipHash(context, req), 5, 900)) || !(await rateLimit("admin-login-all", "all", 40, 3600)))
      throw new HttpError(429, "Too many sign-in attempts. Try again in 15 minutes.");
    const { password } = await readJson(req, 1000);
    if (!verifyPassword(password)) { await new Promise((r) => setTimeout(r, 400)); throw new HttpError(401, "Wrong password."); }
    return json({ token: await issueToken() });
  }
  await requireAdmin(req);
  const url = new URL(req.url);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get("days") || "30", 10) || 30));
  const includeTest = url.searchParams.get("test") === "1";
  if (action === "verify") return json({ ok: true });
  if (action === "stats" && req.method === "GET") return json(await stats(days, includeTest));
  if (action === "apps" && req.method === "GET") return json({ apps: await getCatalog() });
  if (action === "apps" && req.method === "PUT") return json({ apps: await updateApp(await readJson(req, 4000)) });
  if (action === "sponsors") return json(await sponsorsAdmin(req, url));
  if (["sponsor-token", "sponsor-welcome", "sponsor-pending", "sponsor-sync"].includes(action) && req.method === "POST") return json(await sponsorAction(action, await readJson(req, 2000)));
  if (action === "sponsor-stats" && req.method === "GET") {
    const id = url.searchParams.get("id") || "";
    if (!SPONSOR_ID_RE.test(id)) throw new HttpError(400, "Bad sponsor id");
    return json(await sponsorStats(id, Math.min(90, Math.max(7, days))));
  }
  if (action === "inquiries" && req.method === "GET") return json({ inquiries: await listInquiries() });
  if (action === "inquiries" && req.method === "DELETE") {
    const inq = (await listInquiries()).find((x) => x.id === url.searchParams.get("id"));
    if (!inq) throw new HttpError(404, "Inquiry not found");
    await content().delete(inquiryKey(inq));
    const used = inq.logo && (await getSponsors()).list.some((x) => x.logo === inq.logo || x.pending?.logo === inq.logo);
    if (inq.logo && !used) await deleteMedia(inq.logo);
    await audit("inquiry_deleted", { inquiry: inq.id, business: inq.business });
    return json({ ok: true });
  }
  if (["inquiry-approve", "inquiry-attach-logo"].includes(action) && req.method === "POST") return json(await inquiryAction(action, await readJson(req, 4000)));
  if (action === "sponsor-settings" && req.method === "PUT") {
    const b = await readJson(req, 500);
    const next = await setSettings({ checkout: b.checkout === true });
    await audit("sponsor_checkout_toggled", { checkout: next.checkout });
    return json({ settings: next });
  }
  if (action === "sponsor-checkout-test" && req.method === "POST") {
    // Creates a real $100/month Checkout Session and expires it at once — nothing can be paid.
    const sess = await createSponsorCheckout(req, { business: "TEST sponsor checkout", email: "test@example.com" });
    const ex = await (await verifiedStripe()).checkout.sessions.expire(sess.id);
    await audit("sponsor_checkout_test", { session: sess.id, status: ex.status });
    return json({ id: sess.id, mode: sess.mode, amount_total: sess.amount_total, livemode: sess.livemode, status: ex.status, url_host: new URL(sess.url).host });
  }
  if (action === "stripe-webhook-events" && req.method === "POST") return json(await webhookEvents());
  if (action === "audit" && req.method === "GET") return json({ audit: await listAudit(150) });
  if (action === "posts") return json(await postsAdmin(req, url));
  if (action === "logout-all" && req.method === "POST") { await signOutEverywhere(); return json({ ok: true }); }
  if (action === "export" && req.method === "GET") {
    const s = await stats(days, includeTest, 100000);
    const type = url.searchParams.get("type") || "purchases";
    const rows = type === "apps" ? s.byApp : type === "campaigns" ? s.byCampaign : s.recent;
    return new Response(csv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="hustlevault-${type}-${days}d.csv"`, "Cache-Control": "no-store" } });
  }
  throw new HttpError(404, "Not found");
});

export const config = { path: "/api/hv-admin/:action", rateLimit: { windowLimit: 200, windowSize: 60, aggregateBy: ["ip", "domain"] } };

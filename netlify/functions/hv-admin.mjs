// Admin API: login, stats dashboard, app controls, CSV export.
import { json, handle, readJson, HttpError, cleanText, ipHash } from "../lib/http.mjs";
import { purchases, events, meta, rateLimit } from "../lib/store.mjs";
import { verifyPassword, issueToken, requireAdmin, signOutEverywhere } from "../lib/admin.mjs";
import { getCatalog, getOverrides, isBuilt } from "../lib/apps.mjs";
import { APPS } from "../../shared/apps.js";

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
  if (action === "logout-all" && req.method === "POST") { await signOutEverywhere(); return json({ ok: true }); }
  if (action === "export" && req.method === "GET") {
    const s = await stats(days, includeTest, 100000);
    const type = url.searchParams.get("type") || "purchases";
    const rows = type === "apps" ? s.byApp : type === "campaigns" ? s.byCampaign : s.recent;
    return new Response(csv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="hustlevault-${type}-${days}d.csv"`, "Cache-Control": "no-store" } });
  }
  throw new HttpError(404, "Not found");
});

export const config = { path: "/api/hv-admin/:action", rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ["ip", "domain"] } };

// Pricing Watcher API — Fred's private tool. Every action except the email unsubscribe link requires the
// existing Hustle Vault admin session (same Bearer token as /api/hv-admin).
import { json, handle, readJson, HttpError, ipHash } from "../lib/http.mjs";
import { requireAdmin } from "../lib/admin.mjs";
import { rateLimit } from "../lib/store.mjs";
import { FetchError } from "../lib/watcher/net.mjs";
import { getSettings, updateSettings, publicSettings, listWatches, listAlerts, addWatch, removeWatch, runOne, unsubscribe } from "../lib/watcher/service.mjs";

const view = (w) => w && ({
  id: w.id, url: w.url, label: w.label, host: w.host, status: w.status, error: w.error || null, method: w.method || null,
  createdAt: w.createdAt, lastCheckAt: w.lastCheckAt || null, nextCheckAt: w.nextCheckAt || null, lastChangeAt: w.lastChangeAt || null,
  tiers: w.snapshot?.tiers || [], pending: w.pending ? { changes: w.pending.changes, firstSeenAt: w.pending.firstSeenAt } : null,
  history: (w.history || []).slice(0, 10), checks: w.checks || 0, ai: w.ai || null,
});

const asHttp = (fn) => async (...a) => { try { return await fn(...a); } catch (e) { if (e instanceof FetchError) throw new HttpError(400, e.message); throw e; } };

export default handle(async (req, context) => {
  const action = context.params?.action || new URL(req.url).pathname.split("/").pop();

  if (action === "unsubscribe") {
    if (!(await rateLimit("watcher-unsub", ipHash(context, req), 20, 3600))) throw new HttpError(429, "Slow down a little.");
    const ok = await unsubscribe(new URL(req.url).searchParams.get("t") || "");
    const msg = ok ? "You won't get Pricing Watcher emails anymore. You can turn them back on in the app." : "This link is no longer valid (alerts may already be off).";
    return new Response(`<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Pricing Watcher</title><body style="font-family:system-ui;background:#05050A;color:#F5F0E8;display:grid;place-items:center;min-height:90vh"><p style="max-width:420px;text-align:center">${msg}</p></body>`,
      { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }

  await requireAdmin(req);

  if (action === "state" && req.method === "GET") {
    const [cfg, watches, alerts] = await Promise.all([getSettings(), listWatches(), listAlerts(50)]);
    return json({ settings: publicSettings(cfg), watches: watches.map(view), alerts });
  }
  if (action === "settings" && req.method === "PUT") {
    const b = await readJson(req, 2000);
    const cfg = await asHttp(updateSettings)({ alertEmail: b.alertEmail });
    return json({ settings: publicSettings(cfg) });
  }
  if (action === "watch" && req.method === "POST") {
    if (!(await rateLimit("watcher-add", "admin", 30, 3600))) throw new HttpError(429, "Slow down a little.");
    const b = await readJson(req, 4000);
    const w = await asHttp(addWatch)({ url: b.url, label: b.label });
    // First check right away to record the baseline (bounded by fetch timeouts).
    let r = { watch: w, alert: null };
    try { r = await runOne(w.id); } catch (e) { console.error("first check failed", e?.message); }
    return json({ watch: view(r.watch || w) });
  }
  if (action === "watch" && req.method === "DELETE") {
    await asHttp(removeWatch)(new URL(req.url).searchParams.get("id"));
    return json({ ok: true });
  }
  if (action === "check" && req.method === "POST") {
    if (!(await rateLimit("watcher-check", "admin", 60, 3600))) throw new HttpError(429, "Slow down a little.");
    const b = await readJson(req, 1000);
    const r = await asHttp(runOne)(String(b.id || ""));
    return json({ watch: view(r.watch), alert: r.alert });
  }
  throw new HttpError(404, "Not found");
});

export const config = { path: "/api/watcher/:action", rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ["ip", "domain"] } };

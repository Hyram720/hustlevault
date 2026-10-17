// Pricing Watcher — storage (Netlify Blobs) and orchestration used by the API and the scheduled function.
import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";
import { validateUrl, safeLookup, checkRobots, FetchError } from "./net.mjs";
import { checkWatch, fetchPricingPage, DEFAULT_PLAN } from "./core.mjs";
import { alertEmail, sendEmail, emailConfigured } from "./email.mjs";
import { chatJSON, aiSource } from "../ai.mjs";

export const store = () => getStore({ name: "hv-watcher", consistency: "strong" });
const blobCache = (s) => ({ get: (k) => s.get(k, { type: "json" }), set: (k, v) => s.setJSON(k, v) });
const EMAIL_RE = /^[^\s@<>"']{1,64}@[A-Za-z0-9.-]{1,180}\.[A-Za-z]{2,24}$/;
const SITE = () => (process.env.URL && /^https:\/\//.test(process.env.URL) ? process.env.URL : "https://hustlevault.app");

export async function getSettings(s = store()) {
  let cfg = await s.get("settings", { type: "json" });
  if (!cfg || !cfg.unsubSecret) {
    cfg = { alertEmail: "", plan: DEFAULT_PLAN, ...(cfg || {}), unsubSecret: cfg?.unsubSecret || crypto.randomBytes(32).toString("base64url") };
    await s.setJSON("settings", cfg);
  }
  cfg.plan = { ...DEFAULT_PLAN, ...(cfg.plan || {}) };
  return cfg;
}
export async function updateSettings({ alertEmail }) {
  const s = store(); const cfg = await getSettings(s);
  const email = String(alertEmail ?? "").trim();
  if (email && !EMAIL_RE.test(email)) throw new FetchError("bad_email", "Enter a valid email address (or leave it empty).");
  cfg.alertEmail = email.slice(0, 254);
  await s.setJSON("settings", cfg);
  return cfg;
}
export const publicSettings = (cfg) => ({ alertEmail: cfg.alertEmail, plan: cfg.plan, emailConfigured: emailConfigured(), aiSource: aiSource() });

const unsubToken = (cfg) => crypto.createHmac("sha256", cfg.unsubSecret).update("unsub:" + cfg.alertEmail).digest("base64url").slice(0, 32);
export const unsubscribeUrl = (cfg) => (cfg.alertEmail ? `${SITE()}/api/watcher/unsubscribe?t=${unsubToken(cfg)}` : null);
export async function unsubscribe(t) {
  const s = store(); const cfg = await getSettings(s);
  if (!cfg.alertEmail || typeof t !== "string" || t.length !== 32) return false;
  const a = Buffer.from(t), b = Buffer.from(unsubToken(cfg));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  cfg.alertEmail = ""; await s.setJSON("settings", cfg);
  return true;
}

export async function listWatches(s = store()) {
  const { blobs } = await s.list({ prefix: "watch/" });
  const out = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" })));
  return out.filter(Boolean).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export async function listAlerts(limit = 50, s = store()) {
  const { blobs } = await s.list({ prefix: "alert/" });
  const keys = blobs.map((b) => b.key).sort().reverse().slice(0, limit);
  return (await Promise.all(keys.map((k) => s.get(k, { type: "json" })))).filter(Boolean);
}

const resolvesPublic = (host) => new Promise((res, rej) => safeLookup(host, {}, (e) => (e ? rej(e instanceof FetchError ? e : new FetchError("dns", "Site not found.")) : res())));

export async function addWatch({ url, label }) {
  const s = store(); const cfg = await getSettings(s);
  const watches = await listWatches(s);
  if (watches.length >= cfg.plan.maxWatches) throw new FetchError("limit", `You can watch up to ${cfg.plan.maxWatches} pages. Remove one first.`);
  const u = validateUrl(String(url || ""));
  if (watches.some((w) => w.url === u.href)) throw new FetchError("dupe", "You're already watching that page.");
  await resolvesPublic(u.hostname.replace(/^\[|\]$/g, ""));
  const rb = await checkRobots(u, blobCache(s));
  if (!rb.allowed) throw new FetchError("robots", rb.reason);
  const id = "w_" + crypto.randomBytes(9).toString("base64url");
  const w = { id, url: u.href, host: u.hostname, label: String(label || "").replace(/[<>]/g, "").trim().slice(0, 60), createdAt: new Date().toISOString(), status: "new", nextCheckAt: new Date().toISOString(), history: [] };
  await s.setJSON("watch/" + id, w);
  return w;
}
export async function removeWatch(id) {
  if (!/^w_[A-Za-z0-9_-]{12}$/.test(String(id))) throw new FetchError("bad_id", "Unknown watch.");
  await store().delete("watch/" + id);
}

async function deliver(alert, cfg, s) {
  const rec = { id: "a_" + crypto.randomBytes(6).toString("hex"), at: new Date().toISOString(), ...alert };
  if (!cfg.alertEmail) rec.emailStatus = "no_recipient";
  else if (!emailConfigured()) rec.emailStatus = "not_configured";
  else {
    const day = rec.at.slice(0, 10);
    const cnt = (await s.get("emailcount/" + day, { type: "json" })) || { n: 0 };
    if (cnt.n >= cfg.plan.maxAlertEmailsPerDay) rec.emailStatus = "daily_cap";
    else {
      try {
        const unsub = unsubscribeUrl(cfg);
        rec.emailId = await sendEmail({ to: cfg.alertEmail, ...alertEmail(rec, { unsubscribeUrl: unsub }), unsubscribeUrl: unsub });
        rec.emailStatus = "sent"; rec.emailTo = cfg.alertEmail;
        await s.setJSON("emailcount/" + day, { n: cnt.n + 1 });
      } catch (e) { rec.emailStatus = "failed"; rec.emailError = String(e.message).slice(0, 160); }
    }
  }
  await s.setJSON(`alert/${rec.at}_${rec.id}`, rec);
  return rec;
}

const aiChat = () => (aiSource() === "none" ? null : chatJSON);

export async function runOne(id, { now } = {}) {
  const s = store(); const cfg = await getSettings(s);
  const w = await s.get("watch/" + id, { type: "json" });
  if (!w) throw new FetchError("bad_id", "Unknown watch.");
  const { watch, alert } = await checkWatch(w, cfg.plan, { now, chat: aiChat(), fetchHtml: (url) => fetchPricingPage(url, { robotsCache: blobCache(s) }) });
  if (!(await s.get("watch/" + id))) return { watch: null, alert: null }; // deleted meanwhile
  await s.setJSON("watch/" + id, watch);
  return { watch, alert: alert ? await deliver(alert, cfg, s) : null };
}

// Scheduled entry point: checks due watches one by one until the time budget is used (scheduled functions get 30 s).
export async function runDue({ budgetMs = 20000, now = Date.now() } = {}) {
  const s = store(); const t0 = Date.now();
  const lock = await s.get("lock/run", { type: "json" });
  if (lock && now - lock.at < 60_000) return { skipped: "locked" };
  await s.setJSON("lock/run", { at: now });
  const due = (await listWatches(s)).filter((w) => !w.nextCheckAt || Date.parse(w.nextCheckAt) <= now).sort((a, b) => (a.nextCheckAt || "").localeCompare(b.nextCheckAt || ""));
  const done = [], hostsThisRun = new Set();
  for (const w of due) {
    if (Date.now() - t0 > budgetMs) break;
    if (hostsThisRun.has(w.host)) continue; // politeness: one request burst per site per run
    hostsThisRun.add(w.host);
    try { const r = await runOne(w.id); done.push({ id: w.id, status: r.watch?.status, alert: !!r.alert }); }
    catch (e) { done.push({ id: w.id, error: e.message }); }
  }
  await s.delete("lock/run");
  return { due: due.length, checked: done.length, done };
}

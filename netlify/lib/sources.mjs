// Read-only public post search for First Customer Finder: Bluesky + Hacker News (Algolia).
// Polite: descriptive User-Agent, a gap between requests per source, a global per-minute cap,
// short timeouts, and a 6-hour cache so repeat searches don't hit the sources again.
// Bluesky works unauthenticated via the public AppView; if BSKY_HANDLE + BSKY_APP_PASSWORD are set,
// searches go through an authenticated session instead (used automatically if the public API refuses).
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { meta, rateLimit } from "./store.mjs";

const UA = "HustleVault/1.0 (First Customer Finder; read-only; +https://hustlevault.app)";
const CACHE_MS = 6 * 3600_000, GAP_MS = 700, TIMEOUT_MS = 8000;
const BSKY_HOSTS = ["https://public.api.bsky.app", "https://api.bsky.app"];
const BAD_LABELS = new Set(["porn", "sexual", "nudity", "graphic-media", "gore", "spam", "!hide", "!warn"]);
const last = { bluesky: 0, hn: 0 };
let bskySession = null, bskyHostOk = null;

const safe = async (fn, fallback) => { try { return await fn(); } catch { return fallback; } };
export const bskyAuthConfigured = () => !!(process.env.BSKY_HANDLE && process.env.BSKY_APP_PASSWORD);

async function polite(source) {
  if (!(await safe(() => rateLimit("src-" + source, "global", 60, 60), true))) throw new Error(source + "_rate_limited");
  const wait = last[source] + GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last[source] = Date.now();
}

async function cached(key, fn) {
  const k = "src-cache/" + createHash("sha256").update(key).digest("hex").slice(0, 40);
  const hit = await safe(() => meta().get(k, { type: "json" }), null);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.posts;
  const posts = await fn();
  await safe(() => meta().setJSON(k, { at: Date.now(), posts }), null);
  return posts;
}

function fixture(source) {
  if (process.env.NETLIFY_DEV !== "true" || !process.env.HV_SOURCE_FIXTURE) return null;
  return JSON.parse(readFileSync(process.env.HV_SOURCE_FIXTURE, "utf8"))[source] || [];
}

const getJSON = async (url, headers = {}) => {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json", ...headers }, redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (r.status !== 200) { const e = new Error("http_" + r.status); e.status = r.status; throw e; }
  return r.json();
};

// ---------- Bluesky ----------
function normBsky(p) {
  const rec = p?.record || {}, handle = String(p?.author?.handle || "");
  const rkey = String(p?.uri || "").split("/").pop();
  if (!rkey || !/^[a-z0-9.-]+$/i.test(handle) || handle === "handle.invalid" || !/^[a-z0-9]+$/i.test(rkey)) return null;
  const labels = [...(p.labels || []), ...(p.author?.labels || [])].map((l) => l?.val);
  if (labels.some((v) => BAD_LABELS.has(v))) return null;
  const text = String(rec.text || "");
  const created = Date.parse(rec.createdAt || p.indexedAt || "");
  if (!text || !Number.isFinite(created) || created > Date.now() + 3600_000) return null;
  return { id: "bsky:" + p.uri, source: "bluesky", author: handle, title: "", text: text.slice(0, 700), created, url: `https://bsky.app/profile/${handle}/post/${rkey}`, replies: Number(p.replyCount || 0) };
}

async function bskyAuthHeaders() {
  if (!bskyAuthConfigured()) return null;
  if (bskySession && bskySession.exp > Date.now()) return bskySession;
  const r = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST", headers: { "User-Agent": UA, "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: process.env.BSKY_HANDLE, password: process.env.BSKY_APP_PASSWORD }), signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!r.ok) throw new Error("bsky_auth_" + r.status);
  const d = await r.json();
  bskySession = { host: "https://bsky.social", headers: { Authorization: `Bearer ${d.accessJwt}` }, exp: Date.now() + 60 * 60_000 };
  return bskySession;
}

export async function searchBluesky(q, { limit = 30, sinceDays = 365 } = {}) {
  const fx = fixture("bluesky"); if (fx) return fx.map(normBsky).filter(Boolean);
  const params = new URLSearchParams({ q, sort: "latest", limit: String(limit), since: new Date(Date.now() - sinceDays * 86400_000).toISOString().slice(0, 10) + "T00:00:00.000Z" });
  return cached("bsky?" + params, async () => {
    await polite("bluesky");
    const path = "/xrpc/app.bsky.feed.searchPosts?" + params;
    let lastErr;
    const auth = await safe(bskyAuthHeaders, null);
    const tries = auth ? [{ host: auth.host, headers: auth.headers }] : [];
    for (const h of bskyHostOk ? [bskyHostOk, ...BSKY_HOSTS.filter((x) => x !== bskyHostOk)] : BSKY_HOSTS) tries.push({ host: h, headers: {} });
    for (const t of tries) {
      try { const d = await getJSON(t.host + path, t.headers); if (!t.headers.Authorization) bskyHostOk = t.host; return (d.posts || []).map(normBsky).filter(Boolean); }
      catch (e) { lastErr = e; }
    }
    throw new Error("bluesky_" + (lastErr?.message || "failed"));
  });
}

// ---------- Hacker News (Algolia) ----------
const decode = (s) => String(s || "").replace(/<p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&#x2F;/g, "/").replace(/&amp;/g, "&");
function normHN(h) {
  const id = String(h?.objectID || "");
  if (!/^\d+$/.test(id)) return null;
  const isComment = (h._tags || []).includes("comment") || h.comment_text;
  const text = decode(isComment ? h.comment_text : h.story_text || "").trim();
  const title = decode(isComment ? "" : h.title || "").trim();
  if (!text && !title) return null;
  return { id: "hn:" + id, source: "hn", author: String(h.author || "").slice(0, 40), title: title.slice(0, 300), context: isComment ? decode(h.story_title || "").slice(0, 200) : "",
    text: text.slice(0, 700), created: Number(h.created_at_i || 0) * 1000, url: `https://news.ycombinator.com/item?id=${id}` };
}

export async function searchHN(q, { askOnly = false, limit = 30, sinceDays = 365 } = {}) {
  const fx = fixture("hn"); if (fx) return fx.map(normHN).filter(Boolean);
  const params = new URLSearchParams({ query: q, tags: askOnly ? "ask_hn" : "(story,comment)", hitsPerPage: String(limit), numericFilters: `created_at_i>${Math.floor(Date.now() / 1000) - sinceDays * 86400}` });
  return cached("hn?" + params, async () => {
    await polite("hn");
    const d = await getJSON("https://hn.algolia.com/api/v1/search_by_date?" + params).catch((e) => { throw new Error("hn_" + e.message); });
    return (d.hits || []).map(normHN).filter(Boolean);
  });
}

// Health of each source (live probe, not cached). Booleans + short error codes only.
export async function probeSources() {
  const out = { bluesky: { ok: false, auth: bskyAuthConfigured() }, hn: { ok: false } };
  const t = (fn) => Promise.race([fn(), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), TIMEOUT_MS + 2000))]);
  await Promise.all([
    t(async () => { for (const h of BSKY_HOSTS) { try { await getJSON(h + "/xrpc/app.bsky.feed.searchPosts?q=recommend&sort=latest&limit=1"); out.bluesky.ok = true; out.bluesky.host = h.replace("https://", ""); return; } catch (e) { out.bluesky[h.replace("https://", "")] = e.message; } }
      if (bskyAuthConfigured()) { try { const a = await bskyAuthHeaders(); await getJSON(a.host + "/xrpc/app.bsky.feed.searchPosts?q=recommend&sort=latest&limit=1", a.headers); out.bluesky.ok = true; out.bluesky.host = "bsky.social (auth)"; } catch (e) { out.bluesky.authError = e.message; } } }).catch((e) => { out.bluesky.error = e.message; }),
    t(async () => { await getJSON("https://hn.algolia.com/api/v1/search_by_date?query=recommend&tags=story&hitsPerPage=1"); out.hn.ok = true; }).catch((e) => { out.hn.error = e.message; }),
  ]);
  return out;
}

// Cached (10 min) "can we search anything right now?" — used before taking payment.
export async function sourcesReachable() {
  if (process.env.NETLIFY_DEV === "true" && process.env.HV_SOURCE_FIXTURE) return process.env.HV_SOURCES_DOWN !== "1";
  const c = await safe(() => meta().get("sources-health", { type: "json" }), null);
  if (c && Date.now() - c.at < 600_000) return c.ok;
  const p = await probeSources();
  const ok = p.bluesky.ok || p.hn.ok;
  await safe(() => meta().setJSON("sources-health", { at: Date.now(), ok }), null);
  return ok;
}

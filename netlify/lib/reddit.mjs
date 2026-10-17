// Read-only access to PUBLIC Reddit search, used by First Customer Finder.
// Uses Reddit's OAuth app-only API when REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET are set (required by
// Reddit's Data API terms for production use; commercial use needs Reddit's approval), otherwise the
// public .json endpoints. Polite: descriptive User-Agent, sequential requests with a gap, a global
// per-minute cap, and a 6-hour cache so repeat searches never hit Reddit twice.
import { createHash } from "node:crypto";
import { meta, rateLimit } from "./store.mjs";

const UA = "web:app.hustlevault:v1.0 (read-only lead search; +https://hustlevault.app)";
const CACHE_MS = 6 * 3600_000, GAP_MS = 1100, TIMEOUT_MS = 8000;
const SUB_RE = /^[A-Za-z0-9][A-Za-z0-9_]{1,20}$/;
let lastAt = 0, token = null;

export const redditMode = () => (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET ? "oauth" : "public");
export const validSub = (s) => SUB_RE.test(String(s || "").replace(/^\/?r\//i, ""));

async function getToken() {
  if (token && token.exp > Date.now()) return token.v;
  const basic = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString("base64");
  const r = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST", headers: { Authorization: `Basic ${basic}`, "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials", signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!r.ok) throw new Error("reddit_auth_" + r.status);
  const d = await r.json();
  token = { v: d.access_token, exp: Date.now() + Math.max(60, (d.expires_in || 3600) - 120) * 1000 };
  return token.v;
}

function norm(c) {
  const d = c?.data || {};
  if (!d.id || d.over_18 || d.stickied || d.removed_by_category) return null;
  const text = String(d.selftext || "");
  if (/^\[(removed|deleted)\]$/i.test(text.trim()) || /^\[(removed|deleted)\]$/i.test(String(d.title || "").trim())) return null;
  const permalink = String(d.permalink || "");
  if (!permalink.startsWith("/r/")) return null;
  return {
    id: String(d.id), title: String(d.title || "").slice(0, 300), text: text.slice(0, 700),
    sub: String(d.subreddit || ""), created: Math.round(Number(d.created_utc || 0)) * 1000,
    url: "https://www.reddit.com" + permalink.replace(/[^A-Za-z0-9_\-/%.~]/g, ""), comments: Number(d.num_comments || 0),
  };
}

// Search posts. `sub` limits to one subreddit. Returns [] on "no results"; throws if Reddit is unreachable.
export async function searchReddit(q, { sub = null, limit = 25, time = "year" } = {}) {
  const params = new URLSearchParams({ q, sort: "new", t: time, limit: String(limit), type: "link", raw_json: "1" });
  if (sub) { if (!validSub(sub)) return []; params.set("restrict_sr", "1"); }
  const path = (sub ? `/r/${sub.replace(/^\/?r\//i, "")}/search` : "/search");
  const key = "reddit-cache/" + createHash("sha256").update(path + "?" + params).digest("hex").slice(0, 40);
  const store = meta();
  const hit = await store.get(key, { type: "json" }).catch(() => null);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.posts;

  if (process.env.NETLIFY_DEV === "true" && process.env.HV_REDDIT_FIXTURE) {
    const fx = JSON.parse((await import("node:fs")).readFileSync(process.env.HV_REDDIT_FIXTURE, "utf8"));
    const posts = (fx[sub ? "sub" : "global"] || []).map((d) => norm({ data: d })).filter(Boolean);
    await store.setJSON(key, { at: Date.now(), posts });
    return posts;
  }

  if (!(await rateLimit("reddit", "global", 60, 60))) throw new Error("reddit_rate_limited");
  const wait = lastAt + GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastAt = Date.now();
  const oauth = redditMode() === "oauth";
  const url = (oauth ? "https://oauth.reddit.com" : "https://www.reddit.com") + path + (oauth ? "" : ".json") + "?" + params;
  const headers = { "User-Agent": UA, Accept: "application/json" };
  if (oauth) headers.Authorization = `Bearer ${await getToken()}`;
  const r = await fetch(url, { headers, redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (sub && (r.status === 404 || r.status === 403 && oauth)) return []; // unknown / private subreddit
  if (r.status !== 200) throw new Error("reddit_http_" + r.status);
  const d = await r.json().catch(() => null);
  if (!d?.data?.children) throw new Error("reddit_bad_response");
  const posts = d.data.children.map(norm).filter(Boolean);
  await store.setJSON(key, { at: Date.now(), posts });
  return posts;
}

// Cheap reachability check (cached 10 minutes) — used before taking payment and by the health endpoint.
export async function redditReachable() {
  const store = meta();
  const c = await store.get("reddit-health", { type: "json" }).catch(() => null);
  if (c && Date.now() - c.at < 600_000) return c.ok;
  let ok = false;
  try { await searchReddit("looking for recommendations", { limit: 1, time: "week" }); ok = true; } catch (e) { console.error("reddit check failed", e?.message); }
  await store.setJSON("reddit-health", { at: Date.now(), ok });
  return ok;
}

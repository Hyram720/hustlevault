// Storage on Netlify Blobs. One JSON object per purchase; append-only event keys.
import { getStore } from "@netlify/blobs";

const opts = (name) => ({ name, consistency: "strong" });
export const purchases = () => getStore(opts("hv-purchases"));
export const events = () => getStore(opts("hv-events"));
export const meta = () => getStore(opts("hv-meta"));

export async function getPurchase(id) {
  const r = await purchases().getWithMetadata(id, { type: "json" });
  return r ? { data: r.data, etag: r.etag } : null;
}

// Optimistic update: mutate(current) -> next | null (no change). Retries on conflict.
export async function updatePurchase(id, mutate, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const cur = await getPurchase(id);
    if (!cur) return null;
    const next = await mutate(structuredClone(cur.data));
    if (!next) return cur.data;
    next.updatedAt = new Date().toISOString();
    const { modified } = await purchases().setJSON(id, next, { onlyIfMatch: cur.etag });
    if (modified) return next;
    await new Promise((r) => setTimeout(r, 80 + Math.random() * 200));
  }
  throw new Error("Purchase update conflict");
}

// Idempotency marker: returns true only the first time a key is claimed.
export async function claimOnce(key, value = {}) {
  const { modified } = await meta().setJSON("once/" + key, { ...value, at: new Date().toISOString() }, { onlyIfNew: true });
  return modified;
}

// Event log: data lives in the key so the dashboard can count with list() alone.
export async function logEvent(type, { app = "-", campaign = "-", source = "-", amount = 0, extra = "" } = {}) {
  try {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const enc = (s) => encodeURIComponent(String(s || "-").slice(0, 60)).replace(/\./g, "%2E");
    const key = [day, type, enc(app), enc(source), enc(campaign), Math.round(amount) || 0, now.getTime() + "-" + Math.random().toString(36).slice(2, 8)].join("/");
    await events().set(key, extra ? String(extra).slice(0, 500) : "1");
  } catch (e) {
    console.error("logEvent failed", e?.message);
  }
}

// Approximate fixed-window rate limit (best effort; Netlify's built-in limiter is the hard gate).
export async function rateLimit(bucket, who, limit, windowSec) {
  const win = Math.floor(Date.now() / 1000 / windowSec);
  const key = `rl/${bucket}/${who}/${win}`;
  const s = meta();
  const cur = (await s.get(key, { type: "json" })) || { n: 0 };
  const scale = Number(process.env.HV_RL_SCALE || 1) || 1;
  if (cur.n >= limit * scale) return false;
  await s.setJSON(key, { n: cur.n + 1 });
  return true;
}

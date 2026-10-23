// Legacy ebook store: server-side catalog, paid-session checks, signed short-lived download links.
// File locations are never in the repo. Files are read from the private Netlify Blobs store
// "hv-ebook-files" (key = file key in products.json), or, as a fallback, from a private URL map in
// the env var HV_EBOOK_FILE_URLS (JSON: {"<file key>": "<url>"}), fetched server-side only.
import crypto from "node:crypto";
import Stripe from "stripe";
import { getStore } from "@netlify/blobs";
import products from "../../server/data/products.json";
import { meta } from "./store.mjs";

export const CATALOG = products;
export const getProduct = (id) => (Object.prototype.hasOwnProperty.call(CATALOG, String(id)) ? CATALOG[String(id)] : null);

// Server-side upsell offers: purchased product -> the one product that may be offered at its upsell price.
// (Mirrors the retired success-page offer; the client never decides the price.)
export const UPSELL_FOR = {
  "1": "6", "2": "4", "3": "2", "4": "9", "5": "8", "6": "7", "7": "6", "8": "9", "9": "8", "10": "4",
  "B1": "5", "B2": "B5", "B3": "5", "B4": "B5",
};

export const SESSION_RE = /^cs_(live|test)_[A-Za-z0-9]{10,200}$/;

// Same key the legacy flow always used (STRIPE_SECRET_KEY). Local tests may point it at a mock.
let client;
export function legacyStripe() {
  if (client) return client;
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) return null;
  const host = process.env.HV_ALLOW_LOCALHOST === "1" && process.env.HV_STRIPE_API_HOST;
  client = host ? new Stripe(k, { host, port: +process.env.HV_STRIPE_API_PORT || 80, protocol: "http" }) : new Stripe(k);
  return client;
}

// Product ids recorded on a legacy ebook session, or null if the session isn't one of ours.
export function ebookProductIds(session) {
  const md = session?.metadata || {};
  const ids = String(md.product_ids || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!ids.length || ids.length > 5) return null;
  const items = ids.map(getProduct);
  if (items.some((p) => !p)) return null;
  // Names must match what this site wrote at checkout (other apps share the Stripe account).
  if (md.product_names !== items.map((p) => p.name).join(", ")) return null;
  return ids;
}

// Retrieve a session and confirm it is a paid, completed, not fully refunded ebook purchase.
export async function paidEbookSession(stripe, sessionId) {
  if (!SESSION_RE.test(String(sessionId || ""))) return { ok: false, status: 400 };
  let s;
  try {
    s = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent.latest_charge"] });
  } catch {
    return { ok: false, status: 404 };
  }
  if (s.status !== "complete" || s.payment_status !== "paid") return { ok: false, status: 402 };
  const ids = ebookProductIds(s);
  if (!ids) return { ok: false, status: 404 };
  const ch = s.payment_intent && typeof s.payment_intent === "object" ? s.payment_intent.latest_charge : null;
  if (ch && typeof ch === "object" && (ch.refunded || (ch.amount_refunded && ch.amount_refunded >= ch.amount))) return { ok: false, status: 410 };
  return { ok: true, session: s, ids };
}

// ---- signed download links (10 minutes) ----
export const LINK_TTL_MS = 10 * 60 * 1000;
let cachedSecret;
async function signingSecret() {
  const env = process.env.HV_DOWNLOAD_SIGNING_SECRET;
  if (typeof env === "string" && env.length >= 32) return env;
  if (cachedSecret) return cachedSecret;
  const s = meta();
  let cfg = await s.get("config/ebook_links", { type: "json" });
  if (!cfg?.secret) {
    await s.setJSON("config/ebook_links", { secret: crypto.randomBytes(32).toString("base64url") }, { onlyIfNew: true });
    cfg = await s.get("config/ebook_links", { type: "json" });
  }
  cachedSecret = cfg.secret;
  return cachedSecret;
}
const mac = (secret, body) => crypto.createHmac("sha256", secret).update(body).digest("base64url");

export async function signLink(fileKey, sessionId, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ f: fileKey, s: crypto.createHash("sha256").update(sessionId).digest("base64url").slice(0, 16), x: now + LINK_TTL_MS })).toString("base64url");
  return body + "." + mac(await signingSecret(), body);
}

export async function readLink(token) {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig || body.length > 400) return null;
  const want = Buffer.from(mac(await signingSecret(), body)), got = Buffer.from(sig);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
  let p; try { p = JSON.parse(Buffer.from(body, "base64url").toString()); } catch { return null; }
  if (!(p.x > Date.now()) || typeof p.f !== "string" || !ALL_KEYS.has(p.f)) return null;
  return p;
}

export const ALL_KEYS = new Set(Object.values(CATALOG).flatMap((p) => (p.digitalContent?.files || []).map((f) => f.key)).filter(Boolean));

// ---- file source ----
export const fileStore = () => getStore({ name: "hv-ebook-files", consistency: "strong" });

function urlMap() {
  try { const m = JSON.parse(process.env.HV_EBOOK_FILE_URLS || "{}"); return m && typeof m === "object" ? m : {}; } catch { return {}; }
}

// Returns { body, type } or null when the file isn't configured anywhere.
export async function openFile(key) {
  if (!ALL_KEYS.has(key)) return null;
  try {
    const blob = await fileStore().get(key, { type: "arrayBuffer" });
    if (blob) return { body: blob, type: "application/pdf" };
  } catch (e) {
    console.error("ebook blob read failed", e?.message);
  }
  const u = urlMap()[key];
  const local = process.env.HV_ALLOW_LOCALHOST === "1" && /^http:\/\/127\.0\.0\.1:\d+\//.test(u || ""); // local tests only
  if (typeof u === "string" && (/^https:\/\//.test(u) || local)) {
    const r = await fetch(u, { redirect: "follow", signal: AbortSignal.timeout(20000) });
    if (r.ok && !/text\/html/i.test(r.headers.get("content-type") || "")) return { body: await r.arrayBuffer(), type: "application/pdf" };
    console.error("ebook source fetch failed", key, r.status);
  }
  return null;
}

// Shared HTTP helpers for Hustle Vault app functions.
import crypto from "node:crypto";

export const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra },
  });

export const newId = (prefix = "hv_") => prefix + crypto.randomBytes(18).toString("base64url");

export const PURCHASE_ID_RE = /^hv_[A-Za-z0-9_-]{24}$/;

// Strip control chars and anything that could look like our data fences.
export function cleanText(v, max) {
  if (v == null) return "";
  let s = String(v).normalize("NFKC");
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g, "");
  s = s.replace(/[<>`]/g, "");
  s = s.replace(/\s{3,}/g, "  ").trim();
  if (s.length > max) s = s.slice(0, max);
  return s;
}

export async function readJson(req, maxBytes = 8000) {
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, "Request too large");
  try { return text ? JSON.parse(text) : {}; } catch { throw new HttpError(400, "Invalid JSON"); }
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const handle = (fn) => async (req, context) => {
  try {
    return await fn(req, context);
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error("Unhandled error", err?.message, err?.stack);
    return json({ error: "Something went wrong on our side. Please try again." }, 500);
  }
};

// Base URL for redirects: only trust known hosts.
export function baseUrl(req) {
  try {
    const o = new URL(req.url).origin;
    if (/^https:\/\/(hustlevault\.app|[a-z0-9-]+--hustle-vault-store\.netlify\.app|hustle-vault-store\.netlify\.app)$/.test(o)) return o;
    if (/^http:\/\/localhost:\d+$/.test(o) && process.env.HV_ALLOW_LOCALHOST === "1") return o;
  } catch {}
  return process.env.URL || "https://hustlevault.app";
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || ""));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

export const ipHash = (context, req) => {
  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || "unknown";
  return crypto.createHash("sha256").update("hv-rl:" + ip).digest("hex").slice(0, 24);
};

// Admin auth: scrypt password hash + short-lived HMAC-signed session tokens.
import crypto from "node:crypto";
import { meta } from "./store.mjs";
import { HttpError } from "./http.mjs";

// Hash of a 144-bit random password (the password itself is never stored in code or storage).
// Set ADMIN_PASSWORD_HASH in Netlify env to rotate without a code change.
const DEFAULT_HASH = "scrypt$16384$8$1$FoSrD1bNKS91sAcCFXp46g$orNvpMoEEC8hKrznmjIjqzOlV17YMOA562IYtzPDv3I";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

export function verifyPassword(pw) {
  const stored = process.env.ADMIN_PASSWORD_HASH || DEFAULT_HASH;
  const [alg, N, r, p, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || typeof pw !== "string" || pw.length < 8 || pw.length > 200) return false;
  const expected = Buffer.from(hash, "base64url");
  const got = crypto.scryptSync(pw, Buffer.from(salt, "base64url"), expected.length, { N: +N, r: +r, p: +p });
  return crypto.timingSafeEqual(got, expected);
}

let cached;
async function secretAndEpoch() {
  if (cached && Date.now() - cached.at < 60_000) return cached;
  const s = meta();
  let cfg = await s.get("config/admin_session", { type: "json" });
  if (!cfg) {
    await s.setJSON("config/admin_session", { secret: crypto.randomBytes(32).toString("base64url"), epoch: 1 }, { onlyIfNew: true });
    cfg = await s.get("config/admin_session", { type: "json" });
  }
  cached = { ...cfg, at: Date.now() };
  return cached;
}

const sign = (secret, body) => crypto.createHmac("sha256", secret).update(body).digest("base64url");

export async function issueToken() {
  const { secret, epoch } = await secretAndEpoch();
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS, e: epoch, n: crypto.randomBytes(8).toString("hex") })).toString("base64url");
  return body + "." + sign(secret, body);
}

export async function requireAdmin(req) {
  const auth = req.headers.get("authorization") || "";
  const tok = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const [body, mac] = tok.split(".");
  if (!body || !mac) throw new HttpError(401, "Please sign in.");
  const { secret, epoch } = await secretAndEpoch();
  const exp = Buffer.from(sign(secret, body)), got = Buffer.from(mac);
  if (exp.length !== got.length || !crypto.timingSafeEqual(exp, got)) throw new HttpError(401, "Please sign in.");
  let p; try { p = JSON.parse(Buffer.from(body, "base64url").toString()); } catch { throw new HttpError(401, "Please sign in."); }
  if (!(p.exp > Date.now()) || p.e !== epoch) throw new HttpError(401, "Session expired. Please sign in again.");
  return true;
}

// Invalidates every issued admin token.
export async function signOutEverywhere() {
  const s = meta();
  const cfg = (await s.get("config/admin_session", { type: "json" })) || {};
  await s.setJSON("config/admin_session", { secret: cfg.secret || crypto.randomBytes(32).toString("base64url"), epoch: (cfg.epoch || 1) + 1 });
  cached = null;
}

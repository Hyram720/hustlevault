// Chunked image upload (keeps each request well under the function payload limit), then
// server-side validation + re-encoding with sharp. Admin can also import a logo from an https URL.
import dns from "node:dns/promises";
import net from "node:net";
import crypto from "node:crypto";
import { json, handle, readJson, HttpError, ipHash } from "../lib/http.mjs";
import { rateLimit } from "../lib/store.mjs";
import { requireAdmin } from "../lib/admin.mjs";
import { uploads, saveMedia, rid, getSponsors, TOKEN_RE, httpsUrl, audit, mediaUrls } from "../lib/content.mjs";
import { processImage, MAX_BYTES } from "../lib/images.mjs";

const CHUNK = 1536 * 1024;
const ID_RE = /^u_[A-Za-z0-9_-]{16}$/;
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");

async function scopeOf(req, b) {
  if ((req.headers.get("authorization") || "").startsWith("Bearer ")) { await requireAdmin(req); return "admin"; }
  if (b.editToken) {
    if (!TOKEN_RE.test(b.editToken) || !(await getSponsors()).list.some((s) => s.editToken === b.editToken)) throw new HttpError(404, "This edit link isn't valid.");
    return "edit";
  }
  return "inquiry";
}

async function finishUpload(buf, purpose, scope, source) {
  const processed = await processImage(buf, purpose === "cover" ? "cover" : "logo");
  const saved = await saveMedia(processed, purpose === "cover" ? "cover" : "logo", { isPublic: scope === "admin", source });
  return { mediaId: saved.id, variants: saved.variants, original: processed.source, urls: scope === "admin" ? (purpose === "cover" ? { cover: `/api/media/${saved.id}/cover.webp`, coverJpg: `/api/media/${saved.id}/cover.jpg` } : mediaUrls(saved.id)) : null };
}

function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:");
}

async function fetchImage(url) {
  let u = httpsUrl(url, "Image URL");
  for (let hop = 0; hop < 4; hop++) {
    const host = new URL(u).hostname;
    const addrs = await dns.lookup(host, { all: true }).catch(() => []);
    if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new HttpError(400, "That image address isn't reachable.");
    const r = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(10000), headers: { "User-Agent": "HustleVault-LogoImport/1.0" } });
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) { u = httpsUrl(new URL(r.headers.get("location"), u).toString(), "Image URL"); continue; }
    if (!r.ok) throw new HttpError(400, `Couldn't download that image (HTTP ${r.status}).`);
    if (+(r.headers.get("content-length") || 0) > MAX_BYTES) throw new HttpError(413, "That image is over 5 MB.");
    const chunks = []; let n = 0;
    for await (const c of r.body) { n += c.length; if (n > MAX_BYTES) throw new HttpError(413, "That image is over 5 MB."); chunks.push(Buffer.from(c)); }
    return Buffer.concat(chunks);
  }
  throw new HttpError(400, "Too many redirects.");
}

export default handle(async (req, context) => {
  const { action } = context.params || {};
  const url = new URL(req.url);
  const who = ipHash(context, req);

  if (action === "start" && req.method === "POST") {
    const b = await readJson(req, 2000);
    const scope = await scopeOf(req, b);
    const purpose = b.purpose === "cover" ? "cover" : "logo";
    if (purpose === "cover" && scope !== "admin") throw new HttpError(400, "Only the admin can upload cover images.");
    if (scope !== "admin" && (!(await rateLimit("up-start", who, 8, 3600)) || !(await rateLimit("up-start-all", "all", 200, 86400)))) throw new HttpError(429, "Too many uploads — please try again later.");
    const size = Math.round(Number(b.size));
    if (!Number.isFinite(size) || size < 12) throw new HttpError(400, "Empty file.");
    if (size > MAX_BYTES) throw new HttpError(413, "That file is over 5 MB.");
    const id = "u_" + rid(12), key = rid(18);
    await uploads().setJSON(`${id}/meta`, { size, purpose, scope, keyHash: sha(key), parts: Math.ceil(size / CHUNK), createdAt: new Date().toISOString() });
    return json({ id, key, chunkSize: CHUNK, parts: Math.ceil(size / CHUNK) });
  }

  const loadMeta = async (id, key) => {
    if (!ID_RE.test(id || "")) throw new HttpError(400, "Bad upload id");
    const m = await uploads().get(`${id}/meta`, { type: "json" });
    if (!m || m.keyHash !== sha(key || "") || Date.now() - Date.parse(m.createdAt) > 3600e3) throw new HttpError(404, "Upload expired — please choose the file again.");
    return m;
  };

  if (action === "chunk" && req.method === "PUT") {
    const id = url.searchParams.get("id"), n = parseInt(url.searchParams.get("n"), 10);
    const m = await loadMeta(id, req.headers.get("x-upload-key"));
    if (!(n >= 0 && n < m.parts)) throw new HttpError(400, "Bad chunk number");
    const buf = Buffer.from(await req.arrayBuffer());
    if (!buf.length || buf.length > CHUNK) throw new HttpError(413, "Chunk too large");
    await uploads().set(`${id}/c${String(n).padStart(3, "0")}`, buf);
    return json({ ok: true });
  }

  if (action === "finish" && req.method === "POST") {
    const b = await readJson(req, 1000);
    const m = await loadMeta(b.id, b.key);
    const parts = [];
    for (let i = 0; i < m.parts; i++) {
      const c = await uploads().get(`${b.id}/c${String(i).padStart(3, "0")}`, { type: "arrayBuffer" });
      if (!c) throw new HttpError(400, "Upload incomplete — please try again.");
      parts.push(Buffer.from(c));
    }
    const { blobs } = await uploads().list({ prefix: b.id + "/" });
    await Promise.all(blobs.map((x) => uploads().delete(x.key)));
    const buf = Buffer.concat(parts);
    if (buf.length !== m.size) throw new HttpError(400, "Upload incomplete — please try again.");
    const out = await finishUpload(buf, m.purpose, m.scope, m.scope);
    if (m.scope === "admin") await audit("media_uploaded", { media: out.mediaId, purpose: m.purpose });
    return json(out);
  }

  if (action === "import-url" && req.method === "POST") {
    await requireAdmin(req);
    const b = await readJson(req, 2000);
    const buf = await fetchImage(b.url);
    const out = await finishUpload(buf, b.purpose === "cover" ? "cover" : "logo", "admin", "url");
    await audit("media_imported", { media: out.mediaId, from: new URL(httpsUrl(b.url, "Image URL")).hostname });
    return json(out);
  }
  throw new HttpError(404, "Not found");
});

export const config = { path: "/api/hv-upload/:action", rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ["ip", "domain"] } };

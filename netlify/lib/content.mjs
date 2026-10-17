// Sponsors, inquiries, blog posts, media and audit log on Netlify Blobs.
import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";
import { HttpError, cleanText } from "./http.mjs";
import { sponsorVisible } from "../../shared/sponsors.js";
import { slugify } from "../../shared/markdown.js";

const opts = (name) => ({ name, consistency: "strong" });
export const content = () => getStore(opts("hv-content"));
export const media = () => getStore(opts("hv-media"));
export const uploads = () => getStore(opts("hv-uploads"));
export const statsStore = () => getStore(opts("hv-stats"));

export const rid = (n = 12) => crypto.randomBytes(n).toString("base64url");
export const token = () => crypto.randomBytes(24).toString("base64url"); // 192-bit
export const MEDIA_ID_RE = /^m_[A-Za-z0-9_-]{16}$/;
export const SPONSOR_ID_RE = /^sp_[A-Za-z0-9_-]{12}$/;
export const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;

// ── field validation ───────────────────────────────────────────
export function httpsUrl(v, field = "Link", { required = true } = {}) {
  const s = String(v ?? "").trim();
  if (!s) { if (required) throw new HttpError(400, `${field} is required.`); return ""; }
  let u;
  try { u = new URL(s); } catch { throw new HttpError(400, `${field} must be a full https:// address.`); }
  if (u.protocol !== "https:" || u.username || u.password || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname) || s.length > 300 || /[\s<>"'`]/.test(s))
    throw new HttpError(400, `${field} must be a full https:// address.`);
  return u.toString();
}
export function email(v, { required = true } = {}) {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s && !required) return "";
  if (!/^[^\s@<>"'`,;]{1,64}@[a-z0-9.-]{1,190}\.[a-z]{2,}$/.test(s)) throw new HttpError(400, "Please enter a valid email address.");
  return s;
}
export function text(v, field, min, max, { required = true } = {}) {
  const s = cleanText(v, max);
  if (required && s.length < min) throw new HttpError(400, `${field} is too short.`);
  return s;
}
const isoDay = (v) => { const s = String(v || "").trim(); if (!s) return ""; if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(Date.parse(s))) throw new HttpError(400, "Date must be YYYY-MM-DD."); return s; };

// ── audit log ──────────────────────────────────────────────────
export async function audit(action, detail = {}) {
  try {
    const now = new Date().toISOString();
    await content().setJSON(`audit/${now}-${rid(4)}`, { at: now, action, ...detail });
  } catch (e) { console.error("audit failed", e?.message); }
}
export async function listAudit(limit = 100) {
  const { blobs } = await content().list({ prefix: "audit/" });
  const keys = blobs.map((b) => b.key).sort().reverse().slice(0, limit);
  return (await Promise.all(keys.map((k) => content().get(k, { type: "json" }).catch(() => null)))).filter(Boolean);
}

// ── settings ───────────────────────────────────────────────────
export async function getSettings() {
  return { checkout: false, ...((await content().get("settings/sponsors", { type: "json" }).catch(() => null)) || {}) };
}
export async function setSettings(patch) {
  const cur = await getSettings();
  const next = { ...cur, ...patch, updatedAt: new Date().toISOString() };
  await content().setJSON("settings/sponsors", next);
  return next;
}

// ── sponsors (one JSON array, optimistic concurrency) ─────────
export async function getSponsors() {
  const r = await content().getWithMetadata("sponsors", { type: "json" });
  return { list: Array.isArray(r?.data) ? r.data : [], etag: r?.etag, exists: !!r };
}
export async function updateSponsors(mutate, tries = 6) {
  for (let i = 0; i < tries; i++) {
    const { list, etag, exists } = await getSponsors();
    const next = await mutate(structuredClone(list));
    if (!next) return list;
    // (The local dev sandbox returns no ETags; production always does.)
    const res = await content().setJSON("sponsors", next, etag ? { onlyIfMatch: etag } : exists ? {} : { onlyIfNew: true });
    if (res.modified) return next;
    await new Promise((r) => setTimeout(r, 60 + Math.random() * 200));
  }
  throw new HttpError(409, "Someone else changed sponsors at the same time. Please try again.");
}

export const mediaUrls = (id) => id ? ({ wall: `/api/media/${id}/wall.webp`, wallPng: `/api/media/${id}/wall.png`, tick: `/api/media/${id}/tick.webp`, tickPng: `/api/media/${id}/tick.png` }) : null;

export function publicSponsor(s) {
  return { id: s.id, name: s.name, offer: s.offer, tickerLine: s.tickerLine || s.offer, url: s.url, ticker: s.ticker !== false, logo: mediaUrls(s.logo), logoW: s.logoW || 300, logoH: s.logoH || 100 };
}
export async function visibleSponsors(now = new Date()) {
  const { list } = await getSponsors();
  return list.filter((s) => sponsorVisible(s, now)).sort((a, b) => (a.sort ?? 100) - (b.sort ?? 100) || a.name.localeCompare(b.name));
}

// Admin-editable sponsor fields → validated record patch.
export async function sponsorFields(b, { partial = false } = {}) {
  const out = {};
  const has = (k) => !partial || b[k] !== undefined;
  if (has("name")) out.name = text(b.name, "Business name", 2, 60);
  if (has("offer")) out.offer = text(b.offer, "Offer line", 3, 120);
  if (has("tickerLine")) out.tickerLine = text(b.tickerLine, "Ticker line", 0, 70, { required: false });
  if (has("url")) out.url = httpsUrl(b.url, "Link URL");
  if (has("email")) out.email = email(b.email, { required: false });
  if (has("active")) out.active = b.active === true;
  if (has("ticker")) out.ticker = b.ticker !== false;
  if (has("sort")) { const n = Math.round(Number(b.sort ?? 100)); out.sort = Number.isFinite(n) ? Math.max(0, Math.min(9999, n)) : 100; }
  if (has("endDate")) out.endDate = isoDay(b.endDate);
  if (has("subscriptionId")) {
    const v = String(b.subscriptionId || "").trim();
    if (v && !/^sub_[A-Za-z0-9]{8,64}$/.test(v)) throw new HttpError(400, "Subscription id must look like sub_…");
    out.subscriptionId = v;
  }
  if (has("logo")) {
    const v = String(b.logo || "");
    if (v && !MEDIA_ID_RE.test(v)) throw new HttpError(400, "Bad logo id");
    if (v) {
      const m = await media().get(`${v}/meta`, { type: "json" });
      if (!m || m.kind !== "logo") throw new HttpError(400, "Logo not found — upload it again.");
      out.logoW = Math.round(m.variants?.["wall.webp"]?.w / 2) || 300; out.logoH = Math.round(m.variants?.["wall.webp"]?.h / 2) || 100;
    }
    out.logo = v;
  }
  return out;
}

// ── media ──────────────────────────────────────────────────────
export async function saveMedia(processed, kind, { isPublic, source }) {
  const id = "m_" + rid(12);
  const variants = {};
  for (const [name, v] of Object.entries(processed.variants)) {
    await media().set(`${id}/${name}`, v.buf, { metadata: { type: v.type } });
    variants[name] = { type: v.type, w: v.w, h: v.h, bytes: v.buf.length };
  }
  await media().setJSON(`${id}/meta`, { id, kind, public: !!isPublic, source, original: processed.source, variants, createdAt: new Date().toISOString() });
  return { id, variants };
}
export async function setMediaPublic(id, isPublic = true) {
  if (!MEDIA_ID_RE.test(id || "")) return;
  const m = await media().get(`${id}/meta`, { type: "json" });
  if (m && m.public !== isPublic) await media().setJSON(`${id}/meta`, { ...m, public: isPublic });
}
export async function deleteMedia(id) {
  if (!MEDIA_ID_RE.test(id || "")) return;
  const { blobs } = await media().list({ prefix: id + "/" });
  await Promise.all(blobs.map((b) => media().delete(b.key)));
}

// ── inquiries ──────────────────────────────────────────────────
export async function listInquiries() {
  const { blobs } = await content().list({ prefix: "inq/" });
  const all = await Promise.all(blobs.map((b) => content().get(b.key, { type: "json" }).catch(() => null)));
  return all.filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ── blog posts ─────────────────────────────────────────────────
export const POST_ID_RE = /^p_[A-Za-z0-9_-]{12}$/;
export async function listPosts() {
  const { blobs } = await content().list({ prefix: "post/" });
  const all = await Promise.all(blobs.map((b) => content().get(b.key, { type: "json" }).catch(() => null)));
  return all.filter(Boolean);
}
export const isPublished = (p, now = Date.now()) => p.status === "published" && Date.parse(p.publishAt) <= now;
export async function publishedPosts(now = Date.now()) {
  return (await listPosts()).filter((p) => isPublished(p, now)).sort((a, b) => b.publishAt.localeCompare(a.publishAt));
}
export function postFields(b, reservedSlugs) {
  const title = text(b.title, "Title", 3, 140);
  const slug = slugify(b.slug || title);
  if (slug.length < 3) throw new HttpError(400, "Slug is too short.");
  if (reservedSlugs.has(slug) || ["rss-xml", "rss", "page"].includes(slug)) throw new HttpError(400, "That slug is already used.");
  const excerpt = text(b.excerpt, "Excerpt / meta description", 20, 300);
  const body = String(b.body ?? "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  if (body.trim().length < 20) throw new HttpError(400, "Body is too short.");
  if (body.length > 60000) throw new HttpError(400, "Body is too long (60,000 characters max).");
  const status = b.status === "published" ? "published" : "draft";
  let publishAt = b.publishAt ? new Date(b.publishAt) : new Date();
  if (isNaN(publishAt)) throw new HttpError(400, "Bad publish date.");
  const cover = String(b.cover || "");
  if (cover && !MEDIA_ID_RE.test(cover)) throw new HttpError(400, "Bad cover image");
  const coverAlt = text(b.coverAlt, "Cover alt text", 0, 160, { required: false });
  return { title, slug, excerpt, body, status, publishAt: publishAt.toISOString(), cover, coverAlt };
}

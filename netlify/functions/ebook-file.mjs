// Streams a purchased ebook from private storage after checking a short-lived signed link
// (issued by /api/verify-session only for files in a verified, paid ebook purchase).
import { readLink, openFile, CATALOG } from "../lib/ebooks.mjs";
import { rateLimit } from "../lib/store.mjs";
import { ipHash } from "../lib/http.mjs";

const text = (msg, status) => new Response(msg, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
const NAMES = Object.fromEntries(Object.values(CATALOG).flatMap((p) => (p.digitalContent?.files || []).map((f) => [f.key, f.name])));

export default async (req, context) => {
  if (req.method !== "GET") return text("Method not allowed", 405);
  if (!(await rateLimit("ebook-file", ipHash(context, req), 40, 600))) return text("Too many downloads. Please wait a few minutes.", 429);
  const token = decodeURIComponent(new URL(req.url).pathname.split("/").pop() || "");
  const link = await readLink(token);
  if (!link) return text("This download link has expired. Go back to your order page to get a fresh link.", 403);
  let file;
  try { file = await openFile(link.f); } catch (e) { console.error("ebook open failed", e?.message); }
  if (!file) return text("This file is temporarily unavailable. Please email sunmarketingllc@gmail.com with your order and we'll send it.", 503);
  const name = (NAMES[link.f] || link.f).replace(/[^A-Za-z0-9._ -]+/g, "_");
  return new Response(file.body, {
    headers: {
      "Content-Type": file.type,
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
};

export const config = { path: "/api/ebook-file/:token" };

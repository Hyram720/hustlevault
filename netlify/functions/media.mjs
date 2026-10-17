// Serves our own re-encoded images. Public only once attached by the admin; otherwise admin-only.
import { media, MEDIA_ID_RE } from "../lib/content.mjs";
import { requireAdmin } from "../lib/admin.mjs";

const FILES = new Set(["wall.webp", "wall.png", "tick.webp", "tick.png", "cover.webp", "cover.jpg"]);
const nf = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

export default async (req, context) => {
  const { id, file } = context.params || {};
  if (!MEDIA_ID_RE.test(id || "") || !FILES.has(file)) return nf();
  const meta = await media().get(`${id}/meta`, { type: "json" });
  if (!meta || !meta.variants?.[file]) return nf();
  if (!meta.public) {
    try { await requireAdmin(req); } catch { return nf(); }
  }
  const buf = await media().get(`${id}/${file}`, { type: "arrayBuffer" });
  if (!buf) return nf();
  return new Response(buf, {
    headers: {
      "Content-Type": meta.variants[file].type, "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox", "Content-Disposition": "inline",
      "Cache-Control": meta.public ? "public, max-age=3600" : "private, no-store",
    },
  });
};

export const config = { path: "/api/media/:id/:file" };

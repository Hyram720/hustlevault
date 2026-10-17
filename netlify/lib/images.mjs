// Image intake: verify real image bytes, sanitize SVG, decode, auto-orient, strip metadata,
// resize and re-encode. We only ever serve our own re-encoded WebP/PNG/JPEG output.
import sharp from "sharp";
import { HttpError } from "./http.mjs";

export const MAX_BYTES = 5 * 1024 * 1024;
export const MAX_DIM = 8000;
sharp.cache(false);

export function sniff(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 0, 4) === "GIF8") return "gif";
  const head = buf.subarray(0, 2048).toString("utf8").replace(/^\uFEFF/, "").replace(/<\?xml[\s\S]*?\?>/, "").replace(/<!--[\s\S]*?-->/g, "").trimStart();
  if (/^<svg[\s>]/i.test(head) || /^<!DOCTYPE svg/i.test(head)) return "svg";
  return null;
}

// Strip everything active or external from an SVG. The result is only ever rasterized, never served.
export function sanitizeSvg(text) {
  let s = String(text);
  if (/<!ENTITY/i.test(s)) throw new HttpError(400, "That SVG uses entities, which we don't accept. Please export a plain SVG or PNG.");
  s = s.replace(/<!DOCTYPE[^>]*>/gi, "").replace(/<\?[\s\S]*?\?>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  for (const tag of ["script", "foreignObject", "iframe", "object", "embed", "audio", "video", "canvas", "handler", "listener", "set", "animate", "animateMotion", "animateTransform"]) {
    s = s.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, "gi"), "").replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi"), "");
  }
  s = s.replace(/<style\b[\s\S]*?<\/style\s*>/gi, (m) => (/@import|url\s*\(/i.test(m) ? "" : m));
  s = s.replace(/\s(on[a-z]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/\s((?:xlink:)?href|src)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (m, attr, v) => (/^["']?#/.test(v) ? m : ""));
  s = s.replace(/url\(\s*(['"]?)(?!#)[^)]*\)/gi, "none");
  s = s.replace(/javascript:/gi, "");
  return s;
}

async function decode(buf) {
  const kind = sniff(buf);
  if (!kind) throw new HttpError(400, "That file isn't a PNG, JPG, WebP, GIF or SVG image.");
  let input = buf, opts = { limitInputPixels: MAX_DIM * MAX_DIM, failOn: "error", pages: 1 };
  if (kind === "svg") {
    input = Buffer.from(sanitizeSvg(buf.toString("utf8")));
    opts = { ...opts, density: 300 };
  }
  let meta;
  try { meta = await sharp(input, kind === "svg" ? { limitInputPixels: false } : opts).metadata(); }
  catch { throw new HttpError(400, "We couldn't read that image. Please try a different file."); }
  if (kind !== "svg" && ((meta.width || 0) > MAX_DIM || (meta.height || 0) > MAX_DIM)) throw new HttpError(400, `That image is too big (over ${MAX_DIM}px on a side).`);
  if (!meta.width || !meta.height) throw new HttpError(400, "We couldn't read that image's size.");
  if (kind === "svg") {
    // Rasterize big enough for our largest output without blowing up memory.
    const scale = Math.min(8, Math.max(1, 1200 / Math.max(meta.width, meta.height)));
    opts.density = Math.min(2400, Math.round(72 * scale));
  }
  return { kind, input, opts, meta };
}

const PROFILES = {
  logo: [
    { name: "wall", w: 600, h: 200, fmts: ["webp", "png"] },
    { name: "tick", w: 384, h: 64, fmts: ["webp", "png"] },
  ],
  cover: [
    { name: "cover", w: 1600, h: 900, fmts: ["webp", "jpeg"] },
  ],
};

// Returns { kind, source: {w,h}, variants: { "wall.webp": {buf, type, w, h}, ... } }
export async function processImage(buf, profile = "logo") {
  if (!Buffer.isBuffer(buf) || !buf.length) throw new HttpError(400, "Empty file.");
  if (buf.length > MAX_BYTES) throw new HttpError(413, "That file is over 5 MB.");
  const { kind, input, opts, meta } = await decode(buf);
  const variants = {};
  for (const p of PROFILES[profile]) {
    const base = await sharp(input, opts).rotate().resize({ width: p.w, height: p.h, fit: "inside", withoutEnlargement: kind !== "svg" })
      .toBuffer({ resolveWithObject: true });
    for (const f of p.fmts) {
      let img = sharp(base.data);
      if (f === "jpeg") img = img.flatten({ background: "#05050A" }).jpeg({ quality: 82, mozjpeg: true });
      else if (f === "webp") img = img.webp({ quality: 82, effort: 4 });
      else img = img.png({ compressionLevel: 9, palette: base.info.width * base.info.height < 160000 });
      const out = await img.toBuffer({ resolveWithObject: true });
      variants[`${p.name}.${f === "jpeg" ? "jpg" : f}`] = { buf: out.data, type: `image/${f}`, w: out.info.width, h: out.info.height };
    }
  }
  return { kind, source: { w: meta.width, h: meta.height, animated: (meta.pages || 1) > 1 }, variants };
}

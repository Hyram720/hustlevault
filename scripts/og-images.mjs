// Builds 1200×630 navy/lime share images (Open Graph / Twitter) for the app pages and new blog posts.
//   node scripts/og-images.mjs   → public/og/*.png
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { APPS } from "../shared/apps.js";
import { PALETTE as P } from "../shared/theme.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function wrap(text, max) {
  const out = []; let line = "";
  for (const w of String(text).split(/\s+/)) { if ((line + " " + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + " " + w).trim(); }
  if (line) out.push(line); return out;
}
function card({ kicker, title, sub, badge }) {
  const t = wrap(title, 26).slice(0, 3), s = wrap(sub, 58).slice(0, 3);
  const tSize = t.length > 2 ? 64 : 76, tTop = 210;
  const subTop = tTop + t.length * (tSize + 8) + 34;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><radialGradient id="g" cx="85%" cy="15%" r="70%"><stop offset="0" stop-color="${P.navyCard2}"/><stop offset="1" stop-color="${P.navyDeep}"/></radialGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="0" y="0" width="1200" height="10" fill="${P.lime}"/>
  <rect x="40" y="40" width="1120" height="550" rx="18" fill="none" stroke="${P.lineHi}" stroke-width="2"/>
  <g transform="translate(84,92)"><rect width="34" height="34" rx="6" fill="none" stroke="${P.lime}" stroke-width="3"/><circle cx="17" cy="17" r="7" fill="none" stroke="${P.lime}" stroke-width="3"/>
  <text x="50" y="27" font-family="Archivo, Inter, sans-serif" font-weight="900" font-size="26" letter-spacing="6" fill="${P.lime}">HUSTLE VAULT</text></g>
  <text x="84" y="172" font-family="Inter, sans-serif" font-weight="700" font-size="22" letter-spacing="4" fill="${P.soft}">${esc(kicker.toUpperCase())}</text>
  ${t.map((l, i) => `<text x="84" y="${tTop + i * (tSize + 8) + tSize - 10}" font-family="Archivo, Inter, sans-serif" font-weight="900" font-size="${tSize}" fill="${P.lime}">${esc(l)}</text>`).join("\n  ")}
  ${s.map((l, i) => `<text x="84" y="${subTop + i * 40}" font-family="Inter, sans-serif" font-weight="500" font-size="31" fill="${P.white}">${esc(l)}</text>`).join("\n  ")}
  ${badge ? `<g transform="translate(84,520)"><rect width="${badge.length * 15 + 48}" height="46" rx="6" fill="${P.lime}"/><text x="24" y="31" font-family="Inter, sans-serif" font-weight="800" font-size="22" fill="#000">${esc(badge)}</text></g>` : ""}
  <text x="1116" y="552" text-anchor="end" font-family="Inter, sans-serif" font-weight="600" font-size="22" fill="${P.dim}">hustlevault.app</text>
</svg>`;
}
const jobs = APPS.map((a) => ({
  file: `${a.id}.png`,
  kicker: a.path === "grow" ? "AI tool · Grow your hustle" : "AI tool · Start your hustle",
  title: a.name, sub: a.tagline,
  badge: a.external ? "Free score · $4.99 full report" : a.price ? `$${(a.price / 100).toFixed(a.price % 100 ? 2 : 0)} one time · no subscription` : "Coming soon",
}));
jobs.push({ file: "blog-turn-skills-into-a-service.png", kicker: "Hustle Vault Blog · Free guide", title: "Turn Your Skills Into a Service People Pay For", sub: "A step-by-step way to package what you're good at into a clear offer — with a worked example and checklist.", badge: "" });
for (const j of jobs) {
  const png = await sharp(Buffer.from(card(j))).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(`public/og/${j.file}`, png);
  console.log(j.file, png.length);
}

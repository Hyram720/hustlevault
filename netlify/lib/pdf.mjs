// Simple branded PDF of a generated result (pdf-lib, standard fonts).
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toSections, DISCLAIMER } from "../../shared/render.js";

const OK = /[\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/;
const clean = (t) => Array.from(String(t || "").replace(/\t/g, " ")).map((c) => (c === "\n" || OK.test(c) ? c : c === "\u2192" ? "->" : "")).join("");

export async function buildPdf({ title, appId, result, purchaseId }) {
  const doc = await PDFDocument.create();
  doc.setTitle(title); doc.setAuthor("Hustle Vault"); doc.setCreator("hustlevault.app");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 612, H = 792, M = 54, maxW = W - M * 2;
  const gold = rgb(0.62, 0.48, 0.15), ink = rgb(0.1, 0.1, 0.12), grey = rgb(0.4, 0.4, 0.45);
  let page, y;
  const newPage = () => {
    page = doc.addPage([W, H]); y = H - M;
    page.drawText("HUSTLE VAULT", { x: M, y: H - 32, size: 9, font: bold, color: gold });
    page.drawText(clean(title), { x: W - M - font.widthOfTextAtSize(clean(title), 9), y: H - 32, size: 9, font, color: grey });
  };
  const wrap = (text, f, size) => {
    const out = [];
    for (const para of clean(text).split("\n")) {
      let line = "";
      for (const w of para.split(/ +/)) {
        const t = line ? line + " " + w : w;
        if (f.widthOfTextAtSize(t, size) > maxW && line) { out.push(line); line = w; } else line = t;
      }
      out.push(line);
    }
    return out;
  };
  const write = (text, { f = font, size = 11, color = ink, gap = 4 } = {}) => {
    for (const line of wrap(text, f, size)) {
      if (y < M + size) newPage();
      page.drawText(line, { x: M, y: y - size, size, font: f, color });
      y -= size + gap;
    }
  };
  newPage();
  write(title, { f: bold, size: 22, color: gold, gap: 8 });
  write(`Purchase ${purchaseId} · ${new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" })}`, { size: 9, color: grey });
  y -= 10;
  for (const s of toSections(appId, result)) {
    y -= 8;
    write(s.h, { f: bold, size: 15, color: gold, gap: 6 });
    for (const it of s.items) {
      if (it.label) write(it.label, { f: bold, size: 11 });
      if (it.text) write(it.text, { size: 11 });
      y -= 6;
    }
  }
  y -= 10;
  write(DISCLAIMER, { size: 8.5, color: grey });
  return await doc.save();
}

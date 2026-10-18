// Hustle Vault theme — the single source of truth for site colors. Matches the approved
// Sponsor Media Kit palette (hustlevault-media-kit/media-kit.html): navy surfaces, one flat
// electric-lime accent (lime headlines/labels, dark text on lime buttons), white/soft/dim text.
// Every page/component builds its local palette from THEME. Old key names (gold, goldBri, goldDim,
// cream) are kept so components didn't need restructuring: "gold*" = the lime accent.
// The same values are exposed as CSS variables (--hv-*) in src/index.css and the static legal pages.
// WCAG contrast on bg #0A1630: white 17.9:1, secondary #C9D3E8 11.9:1, muted #8C9AB8 6.3:1
// (4.9:1 on the lightest surface #182C55), lime 15.1:1; dark text on lime buttons 15–17:1.
export const PALETTE = {
  navy: "#0A1630",        // page background
  navyDeep: "#081128",    // deepest
  navyLow: "#0D1B3A",     // bars (top ticker, bottom ticker/house bar), inputs, logo boxes
  navyCard: "#132447",    // cards / surfaces
  navyCard2: "#182C55",   // raised panels, notices
  line: "#1E3463",        // borders
  lineHi: "#25407A",      // stronger borders / hover
  lime: "#C6FF00",        // the accent: buttons, links, focus, badges, headlines
  white: "#FFFFFF",
  soft: "#C9D3E8",        // secondary text
  dim: "#8C9AB8",         // muted text
  green: "#2ECC71", red: "#FF6B6B", blue: "#4DA8FF", purple: "#B98CFF", // status colors (unchanged roles)
};
const P = PALETTE;
export const THEME = {
  bg: P.navy, deep: P.navyDeep, low: P.navyLow, surface: P.navyCard, panel: P.navyCard2,
  border: P.line, borderH: P.lineHi, borderG: P.lime + "40",
  gold: P.lime, goldBri: P.lime, goldDim: P.lime, tint: P.navyCard2,
  cream: P.white, muted: P.soft, dim: P.dim, body: P.soft,
  green: P.green, red: P.red, blue: P.blue, purple: P.purple, soon: P.lineHi,
  onAccent: "#000",
};
export const ACCENT_RGB = "198,255,0";
// Flat accent (the media kit uses solid lime, no gradients). Kept as GRADIENT/GRADIENT_TEXT so
// existing `background: GG` / `...GT` call sites work unchanged.
export const GRADIENT = P.lime;
export const GRADIENT_TEXT = { color: P.lime, display: "inline-block" };
export const BAR_BG = P.navyLow;

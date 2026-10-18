import { useRef } from "react";
import { goUrl, useImpression } from "./data";
import { THEME, GRADIENT, GRADIENT_TEXT } from "../../shared/theme.js";

export const T = { ...THEME };
export const GG = GRADIENT;
export const GT = GRADIENT_TEXT;

export function LogoBox({ s, w = 300, h = 100 }) {
  return (
    <div style={{ width: "100%", maxWidth: w, aspectRatio: `${w} / ${h}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", background: T.low, borderRadius: 6 }}>
      <picture style={{ display: "contents" }}>
        <source srcSet={s.logo.wall} type="image/webp" />
        <img src={s.logo.wallPng} alt={`${s.name} logo`} width={w} height={h} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </picture>
    </div>
  );
}

export function SponsorCard({ s, placement = "wall" }) {
  const ref = useRef(null);
  useImpression(ref, s.id, placement);
  return (
    <article ref={ref} className="hv-sp-card" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18, display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
      <span style={{ position: "absolute", top: 10, right: 10, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: T.muted, border: `1px solid ${T.borderH}`, padding: "2px 6px", borderRadius: 2 }}>Sponsored</span>
      <div style={{ paddingTop: 14 }}><LogoBox s={s} /></div>
      <h3 style={{ fontSize: 17, fontWeight: 800, color: T.cream }}>{s.name}</h3>
      <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.55, flex: 1 }}>{s.offer}</p>
      <a href={goUrl(s.id, placement)} rel="sponsored noopener" target="_blank" className="hv-sp-cta" style={{ display: "inline-block", background: GG, color: "#000", padding: "11px 16px", fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", borderRadius: 3, textDecoration: "none", fontFamily: "Georgia,serif" }}>Visit {s.name} →</a>
    </article>
  );
}

export function PlaceholderCard() {
  return (
    <a href="#inquire" style={{ background: "transparent", border: `1px dashed ${T.borderH}`, borderRadius: 8, padding: 18, display: "flex", flexDirection: "column", gap: 10, alignItems: "center", justifyContent: "center", textDecoration: "none", minHeight: 230 }}>
      <div style={{ width: "100%", maxWidth: 300, aspectRatio: "3 / 1", border: `1px dashed ${T.gold}55`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: T.gold, fontSize: 12, letterSpacing: 3, textTransform: "uppercase" }}>Your logo here</div>
      <div style={{ fontWeight: 800, color: T.cream }}>This spot is open</div>
      <div style={{ fontSize: 13, color: T.muted, textAlign: "center" }}>Your name and offer, seen by Hustle Vault visitors.</div>
    </a>
  );
}

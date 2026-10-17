import { useRef } from "react";
import { goUrl, useImpression } from "./data";

export const T = { bg: "#05050A", surface: "#09090F", panel: "#0E0E18", border: "#16162A", borderH: "#28284A", gold: "#C9A84C", goldBri: "#F0C040", cream: "#F5F0E8", muted: "#9A8A6A", dim: "#6A6A7A", red: "#E74C3C", green: "#2ECC71" };
export const GG = `linear-gradient(135deg,#7A5A18 0%,${T.gold} 30%,${T.goldBri} 55%,${T.gold} 80%,#7A5A18 100%)`;
export const GT = { background: GG, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", display: "inline-block" };

export function LogoBox({ s, w = 300, h = 100 }) {
  return (
    <div style={{ width: "100%", maxWidth: w, aspectRatio: `${w} / ${h}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", background: "#0B0B14", borderRadius: 6 }}>
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

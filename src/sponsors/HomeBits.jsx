// Home page: "Sponsored by" strip (only when there are active sponsors) + the advertise callout card.
import { useRef } from "react";
import { Link } from "react-router-dom";
import { useSponsors, goUrl, useImpression } from "./data";
import { COPY } from "../../shared/sponsors.js";
import { T, GG, GT } from "./Card";

function StripLogo({ s }) {
  const ref = useRef(null);
  useImpression(ref, s.id, "home");
  return (
    <a ref={ref} href={goUrl(s.id, "home")} rel="sponsored noopener" target="_blank" title={`${s.name} — ${s.offer}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 150, height: 50 }}>
      <picture style={{ display: "contents" }}><source srcSet={s.logo.wall} type="image/webp" /><img src={s.logo.wallPng} alt={`${s.name} logo`} width="150" height="50" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></picture>
    </a>
  );
}

export function SponsoredStrip() {
  const d = useSponsors();
  const list = d?.sponsors || [];
  if (!list.length) return null;
  return (
    <section aria-label="Sponsored by" style={{ padding: "8px 20px 40px", maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: T.muted, marginBottom: 14 }}>Sponsored by</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center", alignItems: "center" }}>{list.map((s) => <StripLogo key={s.id} s={s} />)}</div>
    </section>
  );
}

export function AdvertiseCallout() {
  return (
    <section style={{ padding: "0 20px 56px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ background: T.surface, border: `1px solid ${T.gold}40`, borderRadius: 10, padding: "22px 22px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: "1 1 320px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}><span style={GT}>{COPY.headline}</span></h2>
          <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6 }}>{COPY.line}</p>
        </div>
        <Link to={COPY.ctaHref} style={{ display: "inline-block", background: GG, color: "#000", padding: "13px 24px", fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Georgia,serif", borderRadius: 3, textDecoration: "none", whiteSpace: "nowrap" }}>{COPY.cta}</Link>
      </div>
    </section>
  );
}

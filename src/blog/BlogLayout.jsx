import { Link } from "react-router-dom";

export const C = {
  bg: "#05050A", surface: "#09090F", panel: "#0E0E18",
  border: "#16162A", borderH: "#28284A",
  gold: "#C9A84C", goldBri: "#F0C040", cream: "#F5F0E8",
  muted: "#9A8A6A", dim: "#4A4A5A",
};
export const GG = `linear-gradient(135deg,#7A5A18 0%,${C.gold} 30%,${C.goldBri} 55%,${C.gold} 80%,#7A5A18 100%)`;
export const GT = { background: GG, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", display: "inline-block" };

function VaultIcon({ size = 24, color = C.goldBri }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <defs><linearGradient id="bvg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7A5A18" /><stop offset="50%" stopColor={color} /><stop offset="100%" stopColor="#7A5A18" /></linearGradient></defs>
      <rect x="8" y="10" width="64" height="56" rx="4" fill={C.surface} stroke="url(#bvg)" strokeWidth="2" />
      <circle cx="40" cy="38" r="13" fill="none" stroke="url(#bvg)" strokeWidth="2" />
      <circle cx="40" cy="38" r="8" fill={C.bg} /><circle cx="40" cy="38" r="2.5" fill="url(#bvg)" />
    </svg>
  );
}

export default function BlogLayout({ children }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.cream, fontFamily: "Inter, system-ui, sans-serif" }}>
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 100, background: `${C.surface}F0`, backdropFilter: "blur(15px)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <VaultIcon size={24} />
            <span style={{ ...GT, fontSize: 14, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase" }}>Hustle Vault</span>
          </Link>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <Link to="/#products" style={{ color: C.muted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", textDecoration: "none", fontFamily: "Georgia,serif" }}>Blueprints</Link>
            <Link to="/blog" style={{ color: C.gold, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", textDecoration: "none", fontFamily: "Georgia,serif" }}>Blog</Link>
            <Link to="/door-script" style={{ color: C.muted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", textDecoration: "none", fontFamily: "Georgia,serif" }}>Door Script</Link>
          </div>
        </div>
      </nav>

      {children}

      <footer style={{ padding: "48px 24px", textAlign: "center", background: C.surface, color: C.dim, fontSize: 10, letterSpacing: 2, borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
          <Link to="/#products" style={{ color: C.muted, textDecoration: "none" }}>Blueprints</Link>
          <Link to="/blog" style={{ color: C.muted, textDecoration: "none" }}>Blog</Link>
          <Link to="/door-script" style={{ color: C.muted, textDecoration: "none" }}>Door Script</Link>
          <Link to="/" style={{ color: C.muted, textDecoration: "none" }}>Home</Link>
        </div>
        <div>HUSTLE VAULT · © 2026 · ALL RIGHTS RESERVED</div>
      </footer>
    </div>
  );
}

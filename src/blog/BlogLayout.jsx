import { Link } from "react-router-dom";
import { THEME, GRADIENT, GRADIENT_TEXT } from "../../shared/theme.js";

export const C = { ...THEME };
export const GG = GRADIENT;
export const GT = GRADIENT_TEXT;

function VaultIcon({ size = 24, color = C.goldBri }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <defs><linearGradient id="bvg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={C.goldDim} /><stop offset="50%" stopColor={color} /><stop offset="100%" stopColor={C.goldDim} /></linearGradient></defs>
      <rect x="8" y="10" width="64" height="56" rx="4" fill={C.surface} stroke="url(#bvg)" strokeWidth="2" />
      <circle cx="40" cy="38" r="13" fill="none" stroke="url(#bvg)" strokeWidth="2" />
      <circle cx="40" cy="38" r="8" fill={C.bg} /><circle cx="40" cy="38" r="2.5" fill="url(#bvg)" />
    </svg>
  );
}

const navA = (on) => ({ color: on ? C.gold : C.muted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", textDecoration: "none", fontFamily: "Georgia,serif" });

export default function BlogLayout({ children, active = "blog" }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.cream, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`.hv-bl-links{display:flex;gap:22px;align-items:center}@media(max-width:560px){.hv-bl-links{gap:14px}.hv-bl-links .hv-hide-m{display:none}}`}</style>
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 100, background: `${C.surface}F0`, backdropFilter: "blur(15px)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <VaultIcon size={24} />
            <span style={{ ...GT, fontSize: 14, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase" }}>Hustle Vault</span>
          </Link>
          <div className="hv-bl-links">
            <a href="/#start" style={navA(false)}>AI Tools</a>
            <Link to="/blog" style={navA(active === "blog")}>Blog</Link>
            <Link to="/sponsors" style={navA(active === "sponsors")}>Advertise</Link>
            <Link to="/door-script" className="hv-hide-m" style={navA(false)}>Door Script</Link>
          </div>
        </div>
      </nav>

      {children}

      <footer style={{ padding: "48px 24px", textAlign: "center", background: C.surface, color: C.dim, fontSize: 10, letterSpacing: 2, borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
          <a href="/#start" style={{ color: C.muted, textDecoration: "none" }}>Start Your Hustle</a>
          <a href="/#grow" style={{ color: C.muted, textDecoration: "none" }}>Grow Your Hustle</a>
          <Link to="/blog" style={{ color: C.muted, textDecoration: "none" }}>Blog</Link>
          <Link to="/sponsors" title="Put your logo in front of our visitors" style={{ color: C.muted, textDecoration: "none" }}>Advertise</Link>
          <Link to="/sponsors/policy" style={{ color: C.muted, textDecoration: "none" }}>Ad Policy</Link>
          <Link to="/door-script" style={{ color: C.muted, textDecoration: "none" }}>Door Script</Link>
          <Link to="/" style={{ color: C.muted, textDecoration: "none" }}>Home</Link>
        </div>
        <div style={{ marginBottom: 10, letterSpacing: 1 }}><Link to="/sponsors#inquire" style={{ color: C.muted, textDecoration: "none" }}>Advertise: put your logo in front of our visitors →</Link></div>
        <div>HUSTLE VAULT · © 2026 · ALL RIGHTS RESERVED</div>
      </footer>
    </div>
  );
}

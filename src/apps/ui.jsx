import { Link } from "react-router-dom";
import { THEME, GRADIENT, GRADIENT_TEXT } from "../../shared/theme.js";
export const C = { ...THEME };
export const GG = GRADIENT;
export const GT = GRADIENT_TEXT;
export const money = (c) => "$" + (c % 100 === 0 ? c / 100 : (c / 100).toFixed(2));

export function Shell({ children }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.cream, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}
        .hv-in{width:100%;padding:13px 14px;background:${C.bg};border:1px solid ${C.borderH};border-radius:6px;color:${C.cream};font-size:16px;font-family:inherit}
        .hv-in:focus{outline:none;border-color:${C.gold}}
        .hv-lab{display:block;font-size:13px;color:${C.muted};margin:0 0 6px;font-weight:600}
        .hv-btn{display:inline-block;width:100%;padding:15px 18px;background:${GG};color:#000;border:none;border-radius:6px;font-weight:800;font-size:15px;letter-spacing:.5px;cursor:pointer;text-align:center;text-decoration:none}
        .hv-btn[disabled]{opacity:.55;cursor:not-allowed}
        .hv-ghost{background:transparent;color:${C.gold};border:1px solid ${C.gold}}
        .hv-card{background:${C.surface};border:1px solid ${C.border};border-radius:10px;padding:20px}
        @media(min-width:720px){.hv-card{padding:28px}}`}</style>
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: "0 18px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ ...GT, fontSize: 14, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", textDecoration: "none" }}>Hustle Vault</Link>
          <Link to="/my" style={{ color: C.muted, fontSize: 13, textDecoration: "none" }}>My purchases</Link>
        </div>
      </nav>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 60px" }}>{children}</main>
      <footer style={{ textAlign: "center", color: C.dim, fontSize: 11, padding: "24px 16px 40px", lineHeight: 1.7 }}>
        Results are AI-generated suggestions for education only — no income or sales results are guaranteed.<br />
        <Link to="/blog" style={{ color: C.muted }}>Blog</Link> · <Link to="/sponsors" title="Put your logo in front of our visitors" style={{ color: C.muted }}>Advertise</Link> · <a href="/terms.html" style={{ color: C.muted }}>Terms</a> · <a href="/refund-policy.html" style={{ color: C.muted }}>Refunds</a> · <a href="/privacy.html" style={{ color: C.muted }}>Privacy</a>
      </footer>
    </div>
  );
}

export function Facts({ app }) {
  const row = (k, v) => (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 110, flexShrink: 0, fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 1, paddingTop: 2 }}>{k}</div>
      <div style={{ fontSize: 15, lineHeight: 1.5 }}>{v}</div>
    </div>
  );
  return (
    <div style={{ marginBottom: 18 }}>
      {row("You give", app.give)}{row("You get", app.get)}{row("How much", app.price == null ? "Coming soon" : app.external ? `Free score · ${money(app.price)} full report` : `${money(app.price)} one time — no subscription`)}{row("How fast", app.fast)}
    </div>
  );
}

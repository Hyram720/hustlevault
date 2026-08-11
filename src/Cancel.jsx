import { Link } from "react-router-dom";

const C = {
  bg: "#05050A", surface: "#09090F",
  border: "#18182A", borderH: "#282840", gold: "#C9A84C",
  goldBri: "#F0C040", cream: "#F5F0E8", muted: "#9A8A6A", dim: "#4A4A5A",
};
const GG = `linear-gradient(135deg, #7A5A18 0%, ${C.gold} 30%, ${C.goldBri} 55%, ${C.gold} 80%, #7A5A18 100%)`;
const GT = { background: GG, WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent", display:"inline-block" };

export default function Cancel() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.cream, fontFamily: "Georgia,serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{ background: C.surface, border: `1px solid ${C.borderH}`, borderRadius: 8, maxWidth: 440, width: "100%", overflow: "hidden" }}>
        <div style={{ height: 4, background: GG }} />
        <div style={{ padding: "52px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔙</div>
          <div style={{ ...GT, fontSize: 22, fontWeight: 900, letterSpacing: 2, marginBottom: 14 }}>No Worries</div>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, marginBottom: 28 }}>
            Your payment was cancelled — you weren't charged. The blueprints are here whenever you're ready.
          </p>
          <Link to="/" style={{ display: "inline-block", background: GG, color: "#000", padding: "15px 36px", fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", textDecoration: "none", borderRadius: 2, fontFamily: "Georgia,serif" }}>
            Back to the Vault
          </Link>
          <div style={{ marginTop: 14, fontSize: 11, color: C.dim }}>Your payment was not processed</div>
        </div>
      </div>
    </div>
  );
}

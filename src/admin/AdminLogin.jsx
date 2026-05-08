import { useState } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  bg: "#05050A", surface: "#09090F", panel: "#0E0E18",
  border: "#18182A", borderH: "#282840", gold: "#C9A84C",
  goldBri: "#F0C040", cream: "#F5F0E8", muted: "#9A8A6A",
  dim: "#4A4A5A", red: "#E74C3C", green: "#2ECC71",
};
const GG = `linear-gradient(135deg, #7A5A18 0%, ${C.gold} 30%, ${C.goldBri} 55%, ${C.gold} 80%, #7A5A18 100%)`;
const GT = { background: GG, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", display: "inline-block" };
const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", data.username);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: "100%", padding: "14px 16px", background: C.bg,
    border: `1px solid ${C.border}`, borderRadius: 4, color: C.cream,
    fontSize: 14, fontFamily: "Georgia,serif", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif", padding: 20 }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        input:focus{border-color:${C.gold} !important;}
      `}</style>
      <div style={{ maxWidth: 400, width: "100%", animation: "fadeIn 0.5s ease" }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}`}</style>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <div style={{ ...GT, fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase" }}>Admin</div>
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: 5, textTransform: "uppercase", marginTop: 4 }}>Hustle Vault Control Panel</div>
        </div>

        {/* Card */}
        <div style={{ background: C.surface, border: `1px solid ${C.borderH}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ height: 3, background: GG }} />
          <form onSubmit={handleSubmit} style={{ padding: "36px 32px" }}>
            {error && (
              <div style={{ background: "rgba(231,76,60,0.12)", border: "1px solid rgba(231,76,60,0.4)", borderRadius: 4, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: C.red }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Username</label>
              <input
                style={inp}
                placeholder="admin"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Password</label>
              <input
                style={inp}
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "15px", background: GG, color: "#000",
                border: "none", borderRadius: 4, fontSize: 12, fontWeight: 700,
                letterSpacing: 3, textTransform: "uppercase", cursor: loading ? "wait" : "pointer",
                fontFamily: "Georgia,serif", opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
              }}
            >
              {loading ? "Authenticating..." : "Enter Admin Panel"}
            </button>

            <div style={{ textAlign: "center", marginTop: 14, fontSize: 10, color: C.dim }}>
              🔒 Secured session · 24hr auto-expiry
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

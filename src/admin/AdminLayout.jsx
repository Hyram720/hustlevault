import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

const C = {
  bg: "#05050A", surface: "#09090F", panel: "#0E0E18",
  border: "#18182A", borderH: "#2A2A42", gold: "#C9A84C",
  goldBri: "#F0C040", goldDim: "#7A5A18", cream: "#F5F0E8", 
  muted: "#9A8A6A", dim: "#4A4A5A", red: "#E74C3C", green: "#2ECC71",
};
const GG = `linear-gradient(135deg, ${C.goldDim} 0%, ${C.gold} 30%, ${C.goldBri} 55%, ${C.gold} 80%, ${C.goldDim} 100%)`;
const GT = { background: GG, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", display: "inline-block" };
const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export { C, GG, GT, API };

export function adminFetch(endpoint, options = {}) {
  const token = localStorage.getItem("adminToken");
  return fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Overview", icon: "📊" },
  { path: "/admin/products", label: "Vault Assets", icon: "🔐" },
  { path: "/admin/orders", label: "Sales Log", icon: "📦" },
  { path: "/admin/settings", label: "System Config", icon: "⚙️" },
  { path: "/admin/preview", label: "Live View", icon: "🌐" },
];

export default function AdminLayout() {
  const [verified, setVerified] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const username = localStorage.getItem("adminUser") || "admin";

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin"); return; }

    adminFetch("/api/admin/verify")
      .then((r) => {
        if (!r.ok) throw new Error();
        setVerified(true);
      })
      .catch(() => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin");
      });
  }, [navigate]);

  const handleLogout = async () => {
    try { await adminFetch("/api/admin/logout", { method: "POST" }); } catch { /* ok */ }
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin");
  };

  if (!verified) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "Inter, system-ui, sans-serif", color: C.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;} 
        ::-webkit-scrollbar{width:4px;} 
        ::-webkit-scrollbar-track{background:${C.bg};}
        ::-webkit-scrollbar-thumb{background:${C.borderH};border-radius:4px;}
        .nav-link:hover { background: ${C.panel} !important; color: ${C.goldBri} !important; }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 80, background: C.surface, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", overflow: "hidden", flexShrink: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, whiteSpace: "nowrap" }}>
          <div style={{ width: 32, height: 32, background: GG, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 20px ${C.gold}40` }}>
            <span style={{ fontSize: 18, color: "#000" }}>🔐</span>
          </div>
          {sidebarOpen && <span style={{ ...GT, fontSize: 13, fontWeight: 900, letterSpacing: 4 }}>HUSTLE<br/>VAULT</span>}
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="nav-link"
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 14, padding: "12px 14px",
                borderRadius: 4, textDecoration: "none", fontSize: 12, letterSpacing: 1, fontWeight: 600,
                transition: "all 0.2s", whiteSpace: "nowrap",
                background: isActive ? `${C.gold}12` : "transparent",
                color: isActive ? C.goldBri : C.muted,
                border: isActive ? `1px solid ${C.gold}30` : "1px solid transparent",
                boxShadow: isActive ? `0 4px 12px ${C.gold}10` : "none",
              })}
            >
              <span style={{ fontSize: 18, flexShrink: 0, opacity: 0.8 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "16px 12px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
          <NavLink to="/" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 4, textDecoration: "none", fontSize: 11, color: C.dim, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🌐</span>
            {sidebarOpen && <span>Storefront</span>}
          </NavLink>
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "12px 14px",
            borderRadius: 4, border: "none", background: "transparent", cursor: "pointer",
            fontSize: 11, color: C.red, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase",
            fontFamily: "Inter, sans-serif", width: "100%", textAlign: "left"
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🚪</span>
            {sidebarOpen && <span>Disconnect</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
        {/* Header */}
        <header style={{
          height: 64, background: "rgba(5, 5, 10, 0.8)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", flexShrink: 0,
          position: "sticky", top: 0, zIndex: 90,
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 12px",
            color: C.muted, cursor: "pointer", fontSize: 14, transition: "all 0.2s"
          }}>
            {sidebarOpen ? "◀" : "▶"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Access Guaranteed</div>
              <div style={{ fontSize: 12, color: C.goldBri, fontWeight: 900 }}>{username.toUpperCase()}</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.panel, border: `1px solid ${C.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              👑
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "40px", overflowY: "auto", background: `radial-gradient(circle at 50% 0%, ${C.panel} 0%, ${C.bg} 100%)` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", animation: "contentFade 0.5s ease-out" }}>
            <Outlet />
          </div>
        </main>

        <style>{`
          @keyframes contentFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </div>
  );
}

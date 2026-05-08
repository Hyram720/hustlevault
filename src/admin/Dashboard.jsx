import { useState, useEffect } from "react";
import { C, GG, GT, adminFetch } from "./AdminLayout";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const stats = [
    { label: "Gross Revenue", value: `$${((data?.totalRevenue || 0) / 100).toLocaleString()}`, icon: "💰", color: C.gold },
    { label: "Total Orders", value: data?.totalOrders || 0, icon: "📦", color: C.green },
    { label: "Average Value", value: `$${((data?.avgOrder || 0) / 100).toFixed(2)}`, icon: "📈", color: "#3498DB" },
    { label: "Live Assets", value: data?.totalProducts || 0, icon: "🔐", color: "#9B59B6" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ ...GT, fontSize: 26, fontWeight: 900, letterSpacing: 3, marginBottom: 8 }}>Operational Overview</div>
          <div style={{ fontSize: 13, color: C.muted }}>Hustle Vault realtime performance analytics</div>
        </div>
        
        <div style={{ 
          background: `linear-gradient(90deg, ${C.gold}10, ${C.gold}20)`, 
          border: `1px solid ${C.gold}40`, 
          borderRadius: 4, 
          padding: "10px 20px", 
          display: "flex", 
          alignItems: "center", 
          gap: 12,
          boxShadow: `0 0 30px ${C.gold}15`
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.goldBri, boxShadow: `0 0 10px ${C.goldBri}` }} />
          <span style={{ fontSize: 11, fontWeight: 900, color: C.gold, letterSpacing: 2, textTransform: "uppercase" }}>
            Unlimited Tier
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 40 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "28px 24px", position: "relative", overflow: "hidden", transition: "all 0.3s" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right:0, height: 1, background: `linear-gradient(90deg, transparent, ${s.color}60, transparent)` }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>{s.label}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: C.cream, letterSpacing: -1 }}>{s.value}</div>
              </div>
              <div style={{ width: 48, height: 48, background: `${s.color}15`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tables Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
        {/* Top Products */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, background: C.panel }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: C.gold, letterSpacing: 3, textTransform: "uppercase" }}>🏆 High Velocity Assets</div>
          </div>
          <div style={{ padding: "8px 0" }}>
            {(!data?.topProducts || data.topProducts.length === 0) ? (
              <div style={{ padding: "40px", textAlign: "center", fontSize: 13, color: C.dim }}>Waiting for first vault acquisition...</div>
            ) : data.topProducts.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: i < data.topProducts.length - 1 ? `1px solid ${C.border}` : "none", transition: "background 0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: GG, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#000" }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 14, color: C.cream, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.dim }}>Premium Digital Asset</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: C.goldBri, fontWeight: 900 }}>{p.count} Units</div>
                  <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: 1 }}>Delivered</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, background: C.panel }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: C.gold, letterSpacing: 3, textTransform: "uppercase" }}>📋 Transaction Log</div>
          </div>
          <div style={{ padding: "8px 0" }}>
            {(!data?.recentOrders || data.recentOrders.length === 0) ? (
              <div style={{ padding: "40px", textAlign: "center", fontSize: 13, color: C.dim }}>System ready. Awaiting inbound sales.</div>
            ) : data.recentOrders.map((o, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: i < data.recentOrders.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div>
                  <div style={{ fontSize: 14, color: C.cream, fontWeight: 700 }}>{o.customerEmail}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{o.productName}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, color: C.green, fontWeight: 900 }}>+${((o.amount || 0) / 100).toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>{new Date(o.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}>
      <div style={{ width: 44, height: 44, border: `3px solid ${C.border}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

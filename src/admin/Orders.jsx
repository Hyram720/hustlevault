import { useState, useEffect } from "react";
import { C, GG, GT, adminFetch } from "./AdminLayout";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchOrders = (p = 1) => {
    setLoading(true);
    adminFetch(`/api/admin/orders?page=${p}&limit=15`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setTotal(d.total || 0);
        setPages(d.pages || 1);
        setPage(d.page || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ ...GT, fontSize: 22, fontWeight: 900, letterSpacing: 2, marginBottom: 4 }}>Orders</div>
          <div style={{ fontSize: 12, color: C.muted }}>{total} total orders</div>
        </div>
        <button onClick={() => fetchOrders(page)} style={{
          background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 16px",
          color: C.muted, cursor: "pointer", fontSize: 11, fontFamily: "Georgia,serif", letterSpacing: 1,
        }}>🔄 Refresh</button>
      </div>

      {/* Orders Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr", padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: C.panel }}>
          {["Customer", "Product", "Date", "Amount", "Status"].map((h) => (
            <div key={h} style={{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>{h}</div>
          ))}
        </div>

        {/* Body */}
        {loading && (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTopColor: C.gold, borderRadius: "50%", margin: "0 auto", animation: "spin .8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 14, color: C.muted }}>No orders yet</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Orders will appear here after your first Stripe payment</div>
          </div>
        )}

        {!loading && orders.map((o, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr", padding: "14px 20px",
            borderBottom: i < orders.length - 1 ? `1px solid ${C.border}` : "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = C.panel}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <div>
              <div style={{ fontSize: 12, color: C.cream }}>{o.customerName || "—"}</div>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{o.customerEmail}</div>
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>{o.productName}</div>
            <div style={{ fontSize: 11, color: C.dim }}>{new Date(o.date).toLocaleString()}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>${((o.amount || 0) / 100).toFixed(2)}</div>
            <div>
              <span style={{
                fontSize: 9, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700,
                padding: "3px 10px", borderRadius: 100,
                background: o.status === "completed" ? `${C.green}20` : `${C.gold}20`,
                color: o.status === "completed" ? C.green : C.gold,
              }}>{o.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => fetchOrders(p)} style={{
              width: 32, height: 32, borderRadius: 4, border: `1px solid ${page === p ? C.gold : C.border}`,
              background: page === p ? `${C.gold}20` : "transparent", color: page === p ? C.gold : C.muted,
              cursor: "pointer", fontSize: 11, fontFamily: "Georgia,serif",
            }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

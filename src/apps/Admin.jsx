import { useEffect, useState, useCallback } from "react";
import { Shell, C, GT, money } from "./ui";
import { useSEO } from "../seo";

const KEY = "hv_admin_token";
const pct = (v) => (v == null ? "—" : (v * 100).toFixed(1) + "%");
const usd = (c) => "$" + ((c || 0) / 100).toFixed(2);

async function api(path, opts = {}) {
  const token = sessionStorage.getItem(KEY);
  const r = await fetch(`/api/hv-admin/${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
  if (r.status === 401) { sessionStorage.removeItem(KEY); throw Object.assign(new Error("Signed out"), { auth: true }); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}

function Login({ onOk }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function go(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const r = await fetch("/api/hv-admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Sign-in failed");
      sessionStorage.setItem(KEY, d.token); setPw(""); onOk();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={go} className="hv-card" style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1 style={{ ...GT, fontSize: 26, fontWeight: 900, marginBottom: 14 }}>Admin sign-in</h1>
      <label className="hv-lab" htmlFor="pw">Password</label>
      <input id="pw" type="password" autoComplete="current-password" className="hv-in" value={pw} onChange={(e) => setPw(e.target.value)} />
      {err && <div style={{ color: C.red, fontSize: 14, marginTop: 10 }}>{err}</div>}
      <button className="hv-btn" style={{ marginTop: 16 }} disabled={busy || pw.length < 8}>{busy ? "Checking…" : "Sign in"}</button>
      <div style={{ fontSize: 11, color: C.dim, marginTop: 10 }}>Sessions last 12 hours and end when you close this tab.</div>
    </form>
  );
}

const th = { textAlign: "left", padding: "8px 10px", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${C.borderH}`, whiteSpace: "nowrap" };
const td = { padding: "8px 10px", fontSize: 13, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
function Table({ cols, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{cols.map((c) => <th key={c[0]} style={th}>{c[0]}</th>)}</tr></thead>
        <tbody>{rows.length ? rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c[0]} style={td}>{c[1](r)}</td>)}</tr>) : <tr><td style={{ ...td, color: C.dim }} colSpan={cols.length}>No data yet</td></tr>}</tbody>
      </table>
    </div>
  );
}

function AppEditor({ app, onSaved }) {
  const [f, setF] = useState({ price: (app.price / 100).toFixed(2), tagline: app.tagline, give: app.give, get: app.get, fast: app.fast });
  const [msg, setMsg] = useState("");
  const save = async (extra = {}) => {
    setMsg("Saving…");
    try {
      const body = { id: app.id, tagline: f.tagline, give: f.give, get: f.get, fast: f.fast, ...extra };
      if (!app.external) body.price = Math.round(parseFloat(f.price) * 100);
      const d = await api("apps", { method: "PUT", body: JSON.stringify(body) }); onSaved(d.apps); setMsg("Saved ✓");
    } catch (e) { setMsg(e.message); }
  };
  const setStatus = (status) => {
    if (status === "live" && !confirm(`Make ${app.name} buyable by the public? Only do this after a real paid test passed.`)) return;
    save({ status });
  };
  return (
    <div className="hv-card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div><b>{app.name}</b> <span style={{ color: C.dim, fontSize: 12 }}>· {app.path === "start" ? "Start" : "Grow"} · {app.id}</span></div>
        <div style={{ display: "flex", gap: 6 }}>
          {["live", "soon", "hidden"].map((s) => (
            <button key={s} onClick={() => setStatus(s)} disabled={app.status === s}
              style={{ padding: "6px 12px", borderRadius: 4, fontSize: 12, cursor: "pointer", border: `1px solid ${app.status === s ? C.gold : C.borderH}`, background: app.status === s ? (s === "live" ? C.green : C.gold) : "transparent", color: app.status === s ? "#000" : C.muted, fontWeight: 700 }}>
              {s === "live" ? "Live (buyable)" : s === "soon" ? "Coming soon" : "Hidden"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
        {!app.external && <div><label className="hv-lab">Price (USD)</label><input className="hv-in" inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>}
        {["tagline", "give", "get", "fast"].map((k) => (
          <div key={k}><label className="hv-lab">{{ tagline: "Short description", give: "What you give", get: "What you get", fast: "How fast" }[k]}</label><input className="hv-in" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <button className="hv-btn" style={{ width: "auto", padding: "10px 18px" }} onClick={() => save()}>Save changes</button>
        <span style={{ fontSize: 13, color: C.muted }}>{msg}</span>
      </div>
    </div>
  );
}

function Dashboard({ onOut }) {
  const [days, setDays] = useState(30); const [test, setTest] = useState(false);
  const [s, setS] = useState(null); const [apps, setApps] = useState([]); const [err, setErr] = useState("");
  const load = useCallback(async () => {
    setErr("");
    try { const [st, a] = await Promise.all([api(`stats?days=${days}&test=${test ? 1 : 0}`), api("apps")]); setS(st); setApps(a.apps); }
    catch (e) { if (e.auth) onOut(); else setErr(e.message); }
  }, [days, test, onOut]);
  useEffect(() => { load(); }, [load]);
  const download = async (type) => {
    const r = await fetch(`/api/hv-admin/export?type=${type}&days=${days}&test=${test ? 1 : 0}`, { headers: { Authorization: `Bearer ${sessionStorage.getItem(KEY)}` } });
    if (!r.ok) return setErr("Export failed");
    const url = URL.createObjectURL(await r.blob());
    Object.assign(document.createElement("a"), { href: url, download: `hustlevault-${type}-${days}d.csv` }).click();
    URL.revokeObjectURL(url);
  };
  const card = (k, v, sub) => <div className="hv-card" style={{ padding: 16 }}><div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{k}</div><div style={{ ...GT, fontSize: 24, fontWeight: 900 }}>{v}</div>{sub && <div style={{ fontSize: 12, color: C.dim }}>{sub}</div>}</div>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <h1 style={{ ...GT, fontSize: 28, fontWeight: 900 }}>Hustle Vault admin</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select className="hv-in" style={{ width: "auto", padding: "8px 10px", fontSize: 14 }} value={days} onChange={(e) => setDays(+e.target.value)}>{[1, 7, 30, 90, 365].map((d) => <option key={d} value={d}>Last {d} day{d > 1 ? "s" : ""}</option>)}</select>
          <label style={{ fontSize: 13, color: C.muted, display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={test} onChange={(e) => setTest(e.target.checked)} />Include test purchases</label>
          <a href="/apps/pricing-watcher" style={{ border: `1px solid ${C.gold}`, color: C.gold, padding: "8px 12px", borderRadius: 4, fontSize: 13, textDecoration: "none" }}>Pricing Watcher</a>
          <button onClick={load} style={{ background: "none", border: `1px solid ${C.borderH}`, color: C.muted, padding: "8px 12px", borderRadius: 4, cursor: "pointer" }}>Refresh</button>
          <button onClick={async () => { try { await api("logout-all", { method: "POST" }); } catch {} sessionStorage.removeItem(KEY); onOut(); }} style={{ background: "none", border: `1px solid ${C.borderH}`, color: C.muted, padding: "8px 12px", borderRadius: 4, cursor: "pointer" }}>Sign out everywhere</button>
        </div>
      </div>
      {err && <div style={{ color: C.red, marginBottom: 12 }}>{err}</div>}
      {!s ? <div style={{ color: C.muted }}>Loading…</div> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 20 }}>
            {card("Revenue", usd(s.totals.revenue), "after refunds")}
            {card("Purchases", s.totals.purchases, `${s.totals.testPurchases} test purchase(s) ${test ? "included" : "hidden"}`)}
            {card("Refunds", s.totals.refunds, usd(s.totals.refundAmount))}
            {card("Visits", s.totals.visits, `${s.totals.appViews} app views`)}
            {card("Visit → purchase", pct(s.totals.visitToPurchase), `${s.totals.checkouts} checkouts started`)}
            {card("AI cost (est.)", "$" + s.totals.aiCostUsd.toFixed(4), "tokens × gpt-4o-mini price")}
          </div>

          <h2 style={{ fontSize: 18, margin: "8px 0 10px" }}>By app <span style={{ fontSize: 12, color: C.dim }}>(sorted by popularity below)</span></h2>
          <div className="hv-card" style={{ padding: 8, marginBottom: 20 }}>
            <Table rows={s.popular.map((id) => s.byApp.find((a) => a.id === id))} cols={[
              ["App", (r) => r.name], ["Status", (r) => r.status], ["Price", (r) => money(r.price)], ["Views", (r) => r.views], ["Checkouts", (r) => r.checkouts],
              ["Sales", (r) => (r.id === "venturecheck" ? `${s.venturecheck.salesAllSources} (all sources)` : r.purchases)],
              ["Revenue", (r) => (r.id === "venturecheck" ? usd(s.venturecheck.revenueAllSources) : usd(r.revenue))], ["Refunds", (r) => r.refunds],
              ["View→sale", (r) => pct(r.viewToPurchase)], ["Checkout→sale", (r) => pct(r.checkoutToPurchase)], ["AI cost/sale", (r) => (r.aiCostPerSale ? "$" + r.aiCostPerSale.toFixed(4) : "—")],
            ]} />
          </div>

          <h2 style={{ fontSize: 18, margin: "8px 0 4px" }}>By campaign (UTM, first touch)</h2>
          <div style={{ fontSize: 12, color: C.dim, marginBottom: 8 }}>VentureCheck referrals: {s.venturecheck.clicks} clicks sent from Hustle Vault (links carry utm_source=hustlevault). VentureCheck sales above are counted from Stripe for all sources.</div>
          <div className="hv-card" style={{ padding: 8, marginBottom: 20 }}>
            <Table rows={s.byCampaign} cols={[["Source", (r) => r.source], ["Campaign", (r) => r.campaign], ["Visits", (r) => r.visits], ["App views", (r) => r.appViews], ["Checkouts", (r) => r.checkouts], ["Purchases", (r) => r.purchases], ["Revenue", (r) => usd(r.revenue)], ["VentureCheck clicks", (r) => r.vcClicks]]} />
          </div>

          <h2 style={{ fontSize: 18, margin: "8px 0 10px" }}>Recent purchases</h2>
          <div className="hv-card" style={{ padding: 8, marginBottom: 12 }}>
            <Table rows={s.recent.slice(0, 50)} cols={[["When", (r) => new Date(r.createdAt).toLocaleString()], ["App", (r) => r.app], ["Status", (r) => r.status + (r.test ? " (test)" : "")], ["Paid", (r) => usd(r.paid)], ["Refunded", (r) => usd(r.refunded)], ["Source", (r) => r.source], ["Campaign", (r) => r.campaign], ["Email", (r) => r.email], ["AI $", (r) => r.aiCostUsd.toFixed(4)], ["Link", (r) => <a href={`/my/${r.id}`} target="_blank" rel="noopener noreferrer" style={{ color: C.gold }}>open</a>]]} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {["purchases", "apps", "campaigns"].map((t) => <button key={t} onClick={() => download(t)} className="hv-btn hv-ghost" style={{ width: "auto", padding: "10px 16px" }}>Export {t} (CSV)</button>)}
          </div>

          <h2 style={{ fontSize: 18, margin: "8px 0 4px" }}>Apps — price, descriptions, on/off</h2>
          <div style={{ fontSize: 12, color: C.dim, marginBottom: 10 }}>"Live" makes an app buyable by everyone. Keep apps on "Coming soon" until a real paid test passes (use the private preview link).</div>
          {apps.map((a) => <AppEditor key={a.id + a.status + a.price} app={a} onSaved={setApps} />)}
        </>
      )}
    </>
  );
}

export default function Admin() {
  useSEO({ title: "Admin – Hustle Vault", description: "Admin", path: "/admin", noindex: true });
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(KEY));
  return (
    <Shell>
      <style>{`main{max-width:1200px !important}`}</style>
      {authed ? <Dashboard onOut={() => setAuthed(false)} /> : <Login onOk={() => setAuthed(true)} />}
    </Shell>
  );
}

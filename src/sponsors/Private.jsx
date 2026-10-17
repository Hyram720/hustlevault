// Private, unguessable-token pages a sponsor can use: read-only stats + "edit my listing" requests.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BlogLayout from "../blog/BlogLayout";
import { useSEO } from "../seo";
import { T, GT, GG } from "./Card";
import { uploadImage, ACCEPT } from "./upload";
import { LOGO_SPEC } from "../../shared/sponsors.js";

const PL = { wall: "Sponsor wall", ticker: "Ticker", home: "Home page strip" };
const pct = (v) => (v == null ? "—" : (v * 100).toFixed(1) + "%");

export function StatsTable({ stats }) {
  const rows = ["wall", "ticker", "home", "all"].map((p) => [p === "all" ? "All placements" : PL[p], stats.totals[p]]);
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead><tr>{["Placement", "Impressions", "Clicks", "CTR"].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 6px", color: T.muted, borderBottom: `1px solid ${T.borderH}`, fontWeight: 600 }}>{h}</th>)}</tr></thead>
      <tbody>{rows.map(([n, t]) => <tr key={n}><td style={{ padding: "8px 6px", borderBottom: `1px solid ${T.border}` }}>{n}</td><td style={{ padding: "8px 6px", borderBottom: `1px solid ${T.border}` }}>{t.imp}</td><td style={{ padding: "8px 6px", borderBottom: `1px solid ${T.border}` }}>{t.clk}</td><td style={{ padding: "8px 6px", borderBottom: `1px solid ${T.border}` }}>{pct(t.ctr)}</td></tr>)}</tbody>
    </table>
  );
}

export function DailyChart({ stats }) {
  const vals = stats.daily.map((d) => ({ day: d.day, imp: d.wall.imp + d.ticker.imp + d.home.imp, clk: d.wall.clk + d.ticker.clk + d.home.clk }));
  const max = Math.max(1, ...vals.map((v) => v.imp));
  return (
    <div>
      <div role="img" aria-label="Daily impressions chart" style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 110, borderBottom: `1px solid ${T.borderH}`, paddingTop: 6 }}>
        {vals.map((v) => <div key={v.day} title={`${v.day}: ${v.imp} impressions, ${v.clk} clicks`} style={{ flex: 1, minWidth: 2, height: `${(v.imp / max) * 100}%`, background: v.clk ? GG : `${T.gold}99`, borderRadius: "2px 2px 0 0", minHeight: v.imp ? 2 : 0 }} />)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.dim, marginTop: 4 }}><span>{vals[0]?.day}</span><span>impressions per day (ET)</span><span>{vals[vals.length - 1]?.day}</span></div>
    </div>
  );
}

export function SponsorStatsPage() {
  const { token } = useParams();
  const [days, setDays] = useState(30), [d, setD] = useState(null), [err, setErr] = useState("");
  useSEO({ title: "Sponsor stats – Hustle Vault", description: "Private sponsor stats.", path: "/sponsors/stats", noindex: true });
  useEffect(() => {
    fetch(`/api/sponsors/stats/${encodeURIComponent(token)}?days=${days}`).then(async (r) => { const x = await r.json().catch(() => ({})); if (!r.ok) throw new Error(x.error || "Not found"); setD(x); }).catch((e) => setErr(e.message));
  }, [token, days]);
  return (
    <BlogLayout active="sponsors">
      <main style={{ maxWidth: 820, margin: "0 auto", padding: "44px 20px 72px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 8 }}><span style={GT}>Sponsor stats</span></h1>
        {err ? <p style={{ color: T.red }}>{err}</p> : !d ? <p style={{ color: T.muted }}>Loading…</p> : (
          <>
            <p style={{ color: T.cream, fontWeight: 700, marginBottom: 4 }}>{d.sponsor.name}</p>
            <p style={{ color: T.muted, fontSize: 14, marginBottom: 18 }}>{d.sponsor.offer}{d.sponsor.active ? "" : " · currently not shown"}</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>{[7, 30].map((n) => <button key={n} onClick={() => setDays(n)} style={{ padding: "7px 14px", borderRadius: 4, border: `1px solid ${days === n ? T.gold : T.borderH}`, background: days === n ? T.gold : "transparent", color: days === n ? "#000" : T.muted, fontWeight: 700, cursor: "pointer" }}>Last {n} days</button>)}</div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18, marginBottom: 16 }}><StatsTable stats={d.stats} /></div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}><DailyChart stats={d.stats} /></div>
            <p style={{ fontSize: 12, color: T.dim, marginTop: 14, lineHeight: 1.6 }}>An impression is counted when at least half of your logo is on screen for a second, once per page view. Clicks are counted when someone follows your link. Known bots are filtered out. These are our best counts and may differ from your own analytics.</p>
          </>
        )}
      </main>
    </BlogLayout>
  );
}

export function SponsorEditPage() {
  const { token } = useParams();
  const [cur, setCur] = useState(null), [f, setF] = useState(null), [err, setErr] = useState(""), [msg, setMsg] = useState(""), [file, setFile] = useState(null), [busy, setBusy] = useState(false);
  useSEO({ title: "Edit your sponsor listing – Hustle Vault", description: "Private sponsor page.", path: "/sponsors/edit", noindex: true });
  useEffect(() => {
    fetch(`/api/sponsors/edit/${encodeURIComponent(token)}`).then(async (r) => { const x = await r.json().catch(() => ({})); if (!r.ok) throw new Error(x.error || "Not found"); setCur(x); setF({ ...x.sponsor, note: "" }); }).catch((e) => setErr(e.message));
  }, [token]);
  const inp = { width: "100%", padding: "12px 13px", background: T.bg, border: `1px solid ${T.borderH}`, borderRadius: 6, color: T.cream, fontSize: 16, fontFamily: "inherit" };
  const lab = { display: "block", fontSize: 13, color: T.muted, margin: "0 0 6px", fontWeight: 600 };
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr(""); setMsg(file ? "Uploading logo…" : "Sending…");
    try {
      let logo = "";
      if (file) logo = (await uploadImage(file, { purpose: "logo", editToken: token })).mediaId;
      const r = await fetch(`/api/sponsors/edit/${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, offer: f.offer, tickerLine: f.tickerLine, url: f.url, note: f.note, logo }) });
      const x = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(x.error || "Couldn't send your changes.");
      setMsg("Thanks — we'll review your changes and update your listing soon.");
    } catch (e2) { setErr(e2.message); setMsg(""); }
    setBusy(false);
  };
  return (
    <BlogLayout active="sponsors">
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "44px 20px 72px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 8 }}><span style={GT}>Edit your sponsor listing</span></h1>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>Changes are reviewed before they go live. Keep your ad within our <a href="/sponsors/policy" style={{ color: T.gold }}>Ad Policy</a>.</p>
        {err && <p role="alert" style={{ color: T.red, marginBottom: 12 }}>{err}</p>}
        {f && (
          <form onSubmit={save} style={{ display: "grid", gap: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 22 }}>
            {cur?.pending && <p style={{ color: T.gold, fontSize: 13 }}>You already sent changes on {new Date(cur.pending.at).toLocaleDateString("en-US", { timeZone: "America/New_York" })}; sending again replaces them.</p>}
            {[["name", "Business name", 60], ["offer", "Offer line", 120], ["tickerLine", "Short ticker line (optional)", 70], ["url", "Link (https://…)", 300]].map(([k, l, m]) => (
              <div key={k}><label style={lab} htmlFor={"ed-" + k}>{l}</label><input id={"ed-" + k} style={inp} maxLength={m} value={f[k] || ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} required={k !== "tickerLine"} /></div>
            ))}
            <div><label style={lab} htmlFor="ed-logo">New logo (optional)</label><input id="ed-logo" type="file" accept={ACCEPT} onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ ...inp, padding: 10, fontSize: 14 }} /><div style={{ fontSize: 12, color: T.dim, marginTop: 6 }}>{LOGO_SPEC}</div></div>
            <div><label style={lab} htmlFor="ed-note">Note for us (optional)</label><textarea id="ed-note" rows={3} maxLength={500} style={{ ...inp, resize: "vertical" }} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
            <button type="submit" disabled={busy} style={{ background: GG, color: "#000", border: "none", padding: "14px 22px", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", fontSize: 12, borderRadius: 3, cursor: "pointer", fontFamily: "Georgia,serif" }}>{busy ? msg : "Send changes for review"}</button>
            {!busy && msg && <p role="status" style={{ color: T.green }}>{msg}</p>}
          </form>
        )}
      </main>
    </BlogLayout>
  );
}

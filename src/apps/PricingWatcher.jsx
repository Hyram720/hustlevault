// Competitor Pricing Watcher: Fred's private tool. Public visitors see "Coming soon";
// the working app needs the existing Hustle Vault admin session (same sign-in as /admin).
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shell, C, GT } from "./ui";
import { APPS } from "../../shared/apps.js";
import { useSEO } from "../seo";

const KEY = "hv_admin_token";
const APP = APPS.find((a) => a.id === "pricing-watcher");
const et = (iso) => (iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " ET" : "—");
const SYM = { USD: "$", EUR: "€", GBP: "£", CAD: "C$", AUD: "A$", JPY: "¥", INR: "₹" };
const PER = { month: "/mo", year: "/yr", month_billed_annually: "/mo billed yearly", one_time: " one-time", usage: " usage", unknown: "" };
const fmt = (p) => (!p ? "—" : p.period === "custom" || p.amount == null ? "Custom" : p.amount === 0 ? "Free" : (SYM[p.currency] || (p.currency || "") + " ") + (p.amount % 100 ? (p.amount / 100).toFixed(2) : p.amount / 100) + (PER[p.period] ?? ""));
const describe = (c) => {
  const l = (ps) => (ps || []).map(fmt).join(" or ");
  return { tier_added: `New plan: ${c.tier} (${l(c.to)})`, tier_removed: `Plan removed: ${c.tier} (was ${l(c.from)})`, price_changed: `${c.tier}: ${l(c.from)} → ${l(c.to)}`, period_added: `${c.tier}: new billing option ${l(c.to)}`, period_removed: `${c.tier}: billing option removed (was ${l(c.from)})` }[c.type] || c.type;
};
const STATUS = {
  new: ["Waiting for first check", C.muted], ok: ["Watching", C.green], pending: ["Change spotted, confirming…", C.goldBri],
  no_prices: ["No prices in page HTML", C.red], no_tiers: ["Couldn't find plans", C.red], blocked: ["Site blocks bots", C.red],
  robots_disallowed: ["robots.txt says no", C.red], error: ["Couldn't load page", C.red],
};
const EMAIL_STATUS = { sent: "Emailed", not_configured: "Email not configured: shown here only", no_recipient: "No alert email set: shown here only", failed: "Email failed", daily_cap: "Daily email limit reached" };
const small = { background: "none", border: `1px solid ${C.borderH}`, color: C.muted, padding: "7px 12px", borderRadius: 4, cursor: "pointer", fontSize: 13 };

async function api(path, opts = {}) {
  const r = await fetch(`/api/watcher/${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem(KEY)}` } });
  if (r.status === 401) { sessionStorage.removeItem(KEY); throw Object.assign(new Error("Please sign in again."), { auth: true }); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}

function SignIn({ onOk }) {
  const [pw, setPw] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
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
    <form onSubmit={go} className="hv-card" style={{ marginTop: 16 }}>
      <label className="hv-lab" htmlFor="pw">Owner sign-in (Hustle Vault admin password)</label>
      <input id="pw" type="password" autoComplete="current-password" className="hv-in" value={pw} onChange={(e) => setPw(e.target.value)} />
      {err && <div style={{ color: C.red, fontSize: 14, marginTop: 10 }}>{err}</div>}
      <button className="hv-btn" style={{ marginTop: 12 }} disabled={busy || pw.length < 8}>{busy ? "Checking…" : "Sign in"}</button>
    </form>
  );
}

function Watch({ w, onCheck, onRemove, busy }) {
  const [label, color] = STATUS[w.status] || [w.status, C.muted];
  return (
    <div className="hv-card" style={{ marginBottom: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800 }}>{w.label || w.host}</div>
          <a href={w.url} target="_blank" rel="noopener noreferrer" style={{ color: C.gold, fontSize: 13, wordBreak: "break-all" }}>{w.url}</a>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          <button style={small} disabled={busy} onClick={() => onCheck(w.id)}>{busy ? "Checking…" : "Check now"}</button>
          <button style={small} onClick={() => onRemove(w)}>Remove</button>
        </div>
      </div>
      <div style={{ fontSize: 13, marginTop: 8, color: C.muted }}>
        <span style={{ color, fontWeight: 700 }}>● {label}</span> · Last check {et(w.lastCheckAt)} · Next {et(w.nextCheckAt)}{w.lastChangeAt ? ` · Last change ${et(w.lastChangeAt)}` : ""}
      </div>
      {w.error && <div style={{ fontSize: 13, color: C.red, marginTop: 6 }}>{w.error}</div>}
      {w.pending && <div style={{ fontSize: 13, color: C.goldBri, marginTop: 6 }}>Seen once, re-checking before alerting: {w.pending.changes.map(describe).join("; ")}</div>}
      {w.tiers.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10, fontSize: 13 }}>
          <tbody>{w.tiers.map((t) => (
            <tr key={t.key} style={{ borderTop: `1px solid ${C.border}` }}>
              <td style={{ padding: "6px 4px", fontWeight: 700 }}>{t.name}</td>
              <td style={{ padding: "6px 4px" }}>{t.prices.map(fmt).join(" · ")}</td>
              <td style={{ padding: "6px 4px", color: C.dim }}>{t.limits.join(" · ")}</td>
            </tr>))}</tbody>
        </table>
      )}
    </div>
  );
}

function App({ onOut }) {
  const [s, setS] = useState(null), [err, setErr] = useState(""), [msg, setMsg] = useState("");
  const [url, setUrl] = useState(""), [label, setLabel] = useState(""), [adding, setAdding] = useState(false);
  const [email, setEmail] = useState(""), [checking, setChecking] = useState("");
  const fail = (e) => { if (e.auth) onOut(); else setErr(e.message); };
  const load = useCallback(async () => {
    try { const d = await api("state"); setS(d); setEmail(d.settings.alertEmail || ""); setErr(""); } catch (e) { if (e.auth) onOut(); else setErr(e.message); }
  }, [onOut]);
  useEffect(() => { load(); }, [load]);

  async function add(e) {
    e.preventDefault(); setAdding(true); setErr(""); setMsg("");
    try { const d = await api("watch", { method: "POST", body: JSON.stringify({ url, label }) }); setUrl(""); setLabel(""); setMsg(d.watch.tiers.length ? `Watching ${d.watch.host}: found ${d.watch.tiers.length} plans.` : `Added ${d.watch.host}. ${d.watch.error || ""}`); await load(); }
    catch (e2) { fail(e2); } finally { setAdding(false); }
  }
  async function check(id) {
    setChecking(id); setErr("");
    try { const d = await api("check", { method: "POST", body: JSON.stringify({ id }) }); setMsg(d.alert ? "Change confirmed: alert recorded." : "Checked."); await load(); } catch (e) { fail(e); } finally { setChecking(""); }
  }
  async function remove(w) {
    if (!confirm(`Stop watching ${w.label || w.host}?`)) return;
    try { await api(`watch?id=${encodeURIComponent(w.id)}`, { method: "DELETE" }); await load(); } catch (e) { fail(e); }
  }
  async function saveEmail(e) {
    e.preventDefault(); setErr(""); setMsg("");
    try { await api("settings", { method: "PUT", body: JSON.stringify({ alertEmail: email }) }); setMsg(email ? "Alert email saved." : "Alert email removed."); await load(); } catch (e2) { fail(e2); }
  }
  if (!s) return <div style={{ color: err ? C.red : C.muted }}>{err || "Loading…"}</div>;
  const full = s.watches.length >= s.settings.plan.maxWatches;
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <h1 style={{ ...GT, fontSize: 28, fontWeight: 900 }}>Pricing Watcher</h1>
        <div style={{ display: "flex", gap: 6 }}><Link to="/admin" style={{ ...small, textDecoration: "none" }}>Admin</Link><button style={small} onClick={load}>Refresh</button><button style={small} onClick={() => { sessionStorage.removeItem(KEY); onOut(); }}>Sign out</button></div>
      </div>
      <div style={{ background: "#2A1F00", border: `1px solid ${C.gold}`, color: C.goldBri, padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 14 }}>Private: only you can see this. The public page shows Coming soon.</div>
      {err && <div style={{ color: C.red, marginBottom: 10 }}>{err}</div>}
      {msg && <div style={{ color: C.green, marginBottom: 10 }}>{msg}</div>}

      <form onSubmit={saveEmail} className="hv-card" style={{ marginBottom: 14, padding: 16 }}>
        <label className="hv-lab" htmlFor="em">Send alerts to</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input id="em" type="email" className="hv-in" placeholder="you@yourdomain.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="hv-btn" style={{ width: "auto", padding: "0 18px" }}>Save</button>
        </div>
        <div style={{ fontSize: 12, color: s.settings.emailConfigured ? C.dim : C.goldBri, marginTop: 8 }}>
          {s.settings.emailConfigured ? "Email sending is on." : "Email not configured yet (needs HV_RESEND_API_KEY + HV_EMAIL_FROM in Netlify). Alerts are saved and shown below."}
          {" "}Each page is checked once a day. A change has to show up twice in a row before you're alerted.
        </div>
      </form>

      <form onSubmit={add} className="hv-card" style={{ marginBottom: 14, padding: 16 }}>
        <label className="hv-lab" htmlFor="url">Competitor pricing page ({s.watches.length}/{s.settings.plan.maxWatches})</label>
        <input id="url" className="hv-in" placeholder="https://competitor.com/pricing" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={2000} />
        <input className="hv-in" style={{ marginTop: 8 }} placeholder="Name (optional), e.g. Acme" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} />
        <button className="hv-btn" style={{ marginTop: 10 }} disabled={adding || full || url.length < 8}>{adding ? "Adding and reading the page…" : full ? "Limit reached" : "Start watching"}</button>
        <div style={{ fontSize: 12, color: C.dim, marginTop: 8 }}>Public pages only. We follow robots.txt and don't get around bot protection. Pages that load prices with JavaScript aren't supported yet.</div>
      </form>

      <h2 style={{ fontSize: 18, margin: "18px 0 10px" }}>Watched pages</h2>
      {s.watches.length ? s.watches.map((w) => <Watch key={w.id} w={w} busy={checking === w.id} onCheck={check} onRemove={remove} />) : <div style={{ color: C.dim, fontSize: 14 }}>Nothing watched yet.</div>}

      <h2 style={{ fontSize: 18, margin: "18px 0 10px" }}>Alerts</h2>
      {s.alerts.length ? s.alerts.map((a) => (
        <div key={a.id} className="hv-card" style={{ marginBottom: 10, padding: 14 }}>
          <div style={{ fontSize: 13, color: C.muted }}>{et(a.at)} · <b style={{ color: C.cream }}>{a.label || (() => { try { return new URL(a.url).hostname; } catch { return a.url; } })()}</b> · <span style={{ color: a.emailStatus === "sent" ? C.green : C.goldBri }}>{EMAIL_STATUS[a.emailStatus] || a.emailStatus}</span></div>
          <ul style={{ margin: "6px 0 0 18px", fontSize: 14, lineHeight: 1.6 }}>{a.changes.map((c, i) => <li key={i}>{describe(c)}</li>)}</ul>
        </div>
      )) : <div style={{ color: C.dim, fontSize: 14 }}>No alerts yet.</div>}
    </>
  );
}

export default function PricingWatcher() {
  const [authed, setAuthed] = useState(() => { try { return !!sessionStorage.getItem(KEY); } catch { return false; } });
  const out = useCallback(() => setAuthed(false), []);
  const [showLogin, setShowLogin] = useState(false);
  useSEO({ title: `${APP.name} – Hustle Vault`, description: APP.tagline, path: "/apps/pricing-watcher", noindex: true });
  if (authed) return <Shell><App onOut={out} /></Shell>;
  return (
    <Shell>
      <div style={{ fontSize: 12, color: C.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Grow Your Hustle</div>
      <h1 style={{ ...GT, fontSize: "clamp(28px,6vw,40px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 10 }}>{APP.name}</h1>
      <p style={{ color: "#C8C0B0", fontSize: 17, lineHeight: 1.6, marginBottom: 18 }}>{APP.tagline}</p>
      <div style={{ marginBottom: 18 }}>
        {[["You give", APP.give], ["You get", APP.get], ["How fast", APP.fast]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 110, flexShrink: 0, fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 1, paddingTop: 2 }}>{k}</div>
            <div style={{ fontSize: 15, lineHeight: 1.5 }}>{v}</div>
          </div>))}
      </div>
      <div className="hv-card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, color: C.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Coming soon</div>
        <p style={{ color: C.muted, lineHeight: 1.6 }}>We're finishing testing on this tool. It'll be available here shortly.</p>
      </div>
      {showLogin ? <SignIn onOk={() => setAuthed(true)} /> : <div style={{ textAlign: "center", marginTop: 18 }}><button onClick={() => setShowLogin(true)} style={{ background: "none", border: "none", color: C.dim, fontSize: 12, cursor: "pointer" }}>Owner sign-in</button></div>}
    </Shell>
  );
}

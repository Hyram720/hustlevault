// Admin → Sponsors: sponsors CRUD, logos, links, welcome email, stats, inquiries, settings, audit log.
import { useCallback, useEffect, useState } from "react";
import { C } from "./ui";
import { api, adminToken } from "./adminApi";
import { uploadImage, ACCEPT } from "../sponsors/upload";
import { StatsTable, DailyChart } from "../sponsors/Private";
import { LOGO_SPEC, SPONSOR_PRICE_LABEL } from "../../shared/sponsors.js";

const small = { background: "none", border: `1px solid ${C.borderH}`, color: C.muted, padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 };
const goldBtn = { ...small, borderColor: C.gold, color: C.gold };
const EMPTY = { name: "", offer: "", tickerLine: "", url: "https://", email: "", active: true, ticker: true, sort: 100, endDate: "", subscriptionId: "", logo: "" };
const fmt = (iso) => (iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) + " ET" : "");

export function AuthImg({ src, alt, style }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!src) return;
    let u = "", on = true;
    fetch(src, { headers: { Authorization: `Bearer ${adminToken()}` } }).then((r) => (r.ok ? r.blob() : null)).then((b) => { if (b && on) { u = URL.createObjectURL(b); setUrl(u); } }).catch(() => {});
    return () => { on = false; if (u) URL.revokeObjectURL(u); };
  }, [src]);
  return url ? <img src={url} alt={alt} style={style} /> : <span style={{ ...style, display: "inline-block", background: "#0B0B14" }} />;
}
const LogoBox = ({ src, alt }) => <div style={{ width: 300, maxWidth: "100%", aspectRatio: "3 / 1", background: "#0B0B14", border: `1px solid ${C.border}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>{src ? <AuthImg src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ color: C.dim, fontSize: 12 }}>No logo</span>}</div>;

function copy(text, setMsg) { navigator.clipboard?.writeText(text).then(() => setMsg("Copied ✓"), () => setMsg(text)); }

function mailto(s) {
  const body = `Hi ${s.name},\n\nHere are your private Hustle Vault sponsor links:\n\nStats (views and clicks): ${s.links.stats}\nEdit your listing (logo, offer, link — we review changes): ${s.links.edit}\n\n${LOGO_SPEC}\n\nYour sponsorship is month to month — cancel anytime. Ad Policy: ${s.links.policy}\n\n— Hustle Vault`;
  return `mailto:${encodeURIComponent(s.email || "")}?subject=${encodeURIComponent("Your Hustle Vault sponsor links")}&body=${encodeURIComponent(body)}`;
}

export function LogoPicker({ value, urls, onChange, purpose = "logo" }) {
  const [msg, setMsg] = useState(""), [importUrl, setImportUrl] = useState("");
  const onFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setMsg("Uploading…");
    try { const r = await uploadImage(f, { purpose, token: adminToken() }); onChange(r.mediaId, r.urls); setMsg(`Uploaded ✓ (${r.original.w}×${r.original.h} → resized)`); } catch (err) { setMsg(err.message); }
    e.target.value = "";
  };
  const onImport = async () => {
    setMsg("Importing…");
    try { const r = await api("../hv-upload/import-url", { method: "POST", body: JSON.stringify({ url: importUrl, purpose }) }); onChange(r.mediaId, r.urls); setMsg("Imported ✓"); setImportUrl(""); } catch (err) { setMsg(err.message); }
  };
  return (
    <div>
      {purpose === "logo" ? <LogoBox src={urls?.wall} alt="Logo" /> : urls?.cover ? <AuthImg src={urls.cover} alt="Cover" style={{ width: 320, maxWidth: "100%", borderRadius: 6 }} /> : <div style={{ color: C.dim, fontSize: 12 }}>No cover image</div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
        <label style={{ ...small, display: "inline-block" }}>Upload file<input type="file" accept={ACCEPT} onChange={onFile} style={{ display: "none" }} data-testid={`${purpose}-file`} /></label>
        <input className="hv-in" style={{ width: 240, padding: "6px 8px", fontSize: 13 }} placeholder="…or https:// image URL" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} />
        <button type="button" style={small} onClick={onImport} disabled={!/^https:\/\//.test(importUrl)}>Import</button>
        {value && <button type="button" style={small} onClick={() => onChange("", null)}>Remove</button>}
      </div>
      <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{purpose === "logo" ? LOGO_SPEC : "Cover: JPG/PNG/WebP up to 5 MB, shown at up to 1600×900."}</div>
      {msg && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{msg}</div>}
    </div>
  );
}

function SponsorForm({ initial, onSave, onCancel, saveLabel = "Save" }) {
  const [f, setF] = useState({ ...EMPTY, ...initial });
  const [urls, setUrls] = useState(initial?.logoUrls || null);
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const save = async () => { setMsg("Saving…"); try { await onSave({ ...f, sort: Number(f.sort) }); setMsg("Saved ✓"); } catch (e) { setMsg(e.message); } };
  const inp = (k, label, props = {}) => <div><label className="hv-lab">{label}</label><input className="hv-in" style={{ padding: "9px 10px", fontSize: 14 }} value={f[k] ?? ""} onChange={set(k)} name={k} {...props} /></div>;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginBottom: 10 }}>
        {inp("name", "Business name", { maxLength: 60 })}
        {inp("offer", "Offer line (wall)", { maxLength: 120 })}
        {inp("tickerLine", "Ticker line (optional, short)", { maxLength: 70 })}
        {inp("url", "Link URL (https only)", { maxLength: 300 })}
        {inp("email", "Sponsor email (for links)", { maxLength: 200 })}
        {inp("sort", "Sort order (low = first)", { type: "number" })}
        {inp("endDate", "End date (optional, manual sponsors)", { type: "date" })}
        {inp("subscriptionId", "Stripe subscription (sub_…)", { maxLength: 70 })}
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 10, flexWrap: "wrap" }}>
        <label style={{ fontSize: 14, display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" name="active" checked={!!f.active} onChange={set("active")} />Active (shown on the site)</label>
        <label style={{ fontSize: 14, display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" name="ticker" checked={f.ticker !== false} onChange={set("ticker")} />Show in ticker</label>
      </div>
      <LogoPicker value={f.logo} urls={urls} onChange={(id, u) => { setF((x) => ({ ...x, logo: id })); setUrls(u); }} />
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
        <button className="hv-btn" style={{ width: "auto", padding: "10px 18px" }} onClick={save} data-testid="sponsor-save">{saveLabel}</button>
        {onCancel && <button style={small} onClick={onCancel}>Cancel</button>}
        <span style={{ fontSize: 13, color: C.muted }}>{msg}</span>
      </div>
    </div>
  );
}

function SponsorStats({ id }) {
  const [days, setDays] = useState(30), [s, setS] = useState(null), [err, setErr] = useState("");
  useEffect(() => { api(`sponsor-stats?id=${id}&days=${days}`).then(setS).catch((e) => setErr(e.message)); }, [id, days]);
  if (err) return <div style={{ color: C.red }}>{err}</div>;
  if (!s) return <div style={{ color: C.muted }}>Loading stats…</div>;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>{[7, 30].map((n) => <button key={n} style={days === n ? goldBtn : small} onClick={() => setDays(n)}>Last {n} days</button>)}</div>
      <StatsTable stats={s} /><div style={{ marginTop: 10 }}><DailyChart stats={s} /></div>
    </div>
  );
}

function welcomeLabel(s, emailOn) {
  if (s.welcome?.sentAt) return `Welcome email sent ${fmt(s.welcome.sentAt)}`;
  if (s.welcome?.error) return `Welcome email failed: ${s.welcome.error}`;
  if (s.welcome?.skipped === "not_configured" || (!emailOn && s.visible)) return "Welcome email not sent — email not configured";
  if (s.welcome?.skipped === "no_email") return "Welcome email not sent — no sponsor email";
  return s.visible ? "Welcome email not sent yet" : "Welcome email goes out when the sponsor goes live";
}

function SponsorRow({ s, emailOn, reload, setList }) {
  const [edit, setEdit] = useState(false), [stats, setStats] = useState(false), [msg, setMsg] = useState("");
  const replace = (sp) => setList((l) => l.map((x) => (x.id === sp.id ? sp : x)));
  const act = async (path, body, done) => { setMsg("…"); try { const d = await api(path, { method: "POST", body: JSON.stringify(body) }); if (d.sponsor) replace(d.sponsor); setMsg(done || "Done ✓"); return d; } catch (e) { setMsg(e.message); } };
  const del = async () => { if (!confirm(`Delete sponsor ${s.name}? This removes its logo and stats.`)) return; try { await api(`sponsors?id=${s.id}`, { method: "DELETE" }); reload(); } catch (e) { setMsg(e.message); } };
  const status = s.visible ? ["Live", C.green] : !s.active ? ["Off", C.dim] : !s.logo ? ["Needs logo", C.red] : s.subscriptionId ? [`Hidden (subscription ${s.subStatus || "unknown"})`, C.red] : ["Hidden (ended)", C.red];
  return (
    <div className="hv-card" style={{ marginBottom: 12, padding: 18 }} data-sponsor={s.id} data-name={s.name}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ width: 200 }}><LogoBox src={s.logoUrls?.wall} alt={`${s.name} logo`} /></div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <b style={{ fontSize: 16 }}>{s.name}</b>
            <span style={{ fontSize: 11, fontWeight: 800, color: status[1], border: `1px solid ${status[1]}`, borderRadius: 3, padding: "1px 6px" }}>{status[0]}</span>
            {s.ticker !== false && <span style={{ fontSize: 11, color: C.muted }}>in ticker</span>}
            <span style={{ fontSize: 11, color: C.dim }}>sort {s.sort ?? 100}{s.endDate ? ` · ends ${s.endDate}` : ""}{s.subscriptionId ? ` · ${s.subscriptionId} (${s.subStatus || "?"})` : ""}</span>
          </div>
          <div style={{ fontSize: 13, color: C.muted, margin: "4px 0" }}>{s.offer}{s.tickerLine ? ` · ticker: ${s.tickerLine}` : ""}</div>
          <div style={{ fontSize: 12, color: C.dim, wordBreak: "break-all" }}>{s.url} {s.email ? `· ${s.email}` : ""}</div>
          <div style={{ fontSize: 12, color: s.welcome?.sentAt ? C.green : C.gold, marginTop: 4 }} data-testid="welcome-status">{welcomeLabel(s, emailOn)}</div>
          {s.links && (
            <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
              {[["Stats link", s.links.stats, "stats"], ["Edit link", s.links.edit, "edit"]].map(([l, u, kind]) => (
                <div key={kind} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", fontSize: 12 }}>
                  <span style={{ color: C.muted, width: 70 }}>{l}</span>
                  <code style={{ fontSize: 11, color: C.cream, background: "#0B0B14", padding: "3px 6px", borderRadius: 3, maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u}</code>
                  <button style={small} onClick={() => copy(u, setMsg)}>Copy</button>
                  <button style={small} onClick={() => confirm(`Make a new ${kind} link? The old one stops working.`) && act("sponsor-token", { id: s.id, kind }, "New link made ✓")}>Regenerate</button>
                </div>
              ))}
            </div>
          )}
          {s.pending && (
            <div style={{ marginTop: 10, border: `1px solid ${C.gold}60`, borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 12, color: C.gold, fontWeight: 800, marginBottom: 4 }}>Change request from sponsor · {fmt(s.pending.at)}</div>
              <div style={{ fontSize: 13 }}>{s.pending.name} — {s.pending.offer}{s.pending.tickerLine ? ` · ticker: ${s.pending.tickerLine}` : ""}</div>
              <div style={{ fontSize: 12, color: C.dim, wordBreak: "break-all" }}>{s.pending.url}{s.pending.note ? ` · note: ${s.pending.note}` : ""}</div>
              {s.pending.logoUrls && <div style={{ width: 200, marginTop: 6 }}><LogoBox src={s.pending.logoUrls.wall} alt="New logo" /></div>}
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}><button style={goldBtn} onClick={() => act("sponsor-pending", { id: s.id, approve: true }, "Changes approved ✓")}>Approve changes</button><button style={small} onClick={() => act("sponsor-pending", { id: s.id, approve: false }, "Changes rejected")}>Reject</button></div>
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            <button style={goldBtn} onClick={() => setEdit(!edit)}>{edit ? "Close editor" : "Edit"}</button>
            <button style={small} onClick={() => setStats(!stats)}>{stats ? "Hide stats" : "Stats"}</button>
            {s.links && <a style={{ ...small, textDecoration: "none" }} href={mailto(s)}>Email links</a>}
            <button style={small} onClick={() => act("sponsor-welcome", { id: s.id }).then((d) => d && setMsg(d.result?.ok ? "Welcome email sent ✓" : d.result?.reason === "not_configured" ? "Email isn't configured — use Email links" : d.result?.reason === "no_email" ? "Add a sponsor email first" : `Failed: ${d.result?.error || d.result?.reason}`))}>Resend welcome email</button>
            {s.subscriptionId && <button style={small} onClick={() => act("sponsor-sync", { id: s.id }, "Checked with Stripe ✓")}>Re-check subscription</button>}
            <button style={{ ...small, color: C.red, borderColor: `${C.red}80` }} onClick={del} data-testid="sponsor-delete">Delete</button>
            <span style={{ fontSize: 12, color: C.muted, alignSelf: "center" }}>{msg}</span>
          </div>
        </div>
      </div>
      {stats && <SponsorStats id={s.id} />}
      {edit && <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        <SponsorForm initial={s} onSave={async (f) => { const d = await api(`sponsors?id=${s.id}`, { method: "PUT", body: JSON.stringify(f) }); replace(d.sponsor); }} />
      </div>}
    </div>
  );
}

function Inquiry({ q, sponsors, reload }) {
  const [msg, setMsg] = useState(""), [attachTo, setAttachTo] = useState("");
  const approve = async () => { setMsg("Creating sponsor…"); try { await api("inquiry-approve", { method: "POST", body: JSON.stringify({ inquiryId: q.id }) }); setMsg("Sponsor created ✓"); reload(); } catch (e) { setMsg(e.message); } };
  const attach = async () => { setMsg("Attaching…"); try { await api("inquiry-attach-logo", { method: "POST", body: JSON.stringify({ inquiryId: q.id, sponsorId: attachTo }) }); setMsg("Logo attached ✓"); reload(); } catch (e) { setMsg(e.message); } };
  const del = async () => { if (!confirm("Delete this inquiry?")) return; try { await api(`inquiries?id=${q.id}`, { method: "DELETE" }); reload(); } catch (e) { setMsg(e.message); } };
  return (
    <div className="hv-card" style={{ marginBottom: 10, padding: 16 }} data-inquiry={q.id} data-business={q.business}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {q.logo && <div style={{ width: 180 }}><LogoBox src={`/api/media/${q.logo}/wall.webp`} alt="Uploaded logo" /></div>}
        <div style={{ flex: 1, minWidth: 240, fontSize: 13, lineHeight: 1.6 }}>
          <div><b style={{ fontSize: 15 }}>{q.business}</b> · {q.name} · <a href={`mailto:${q.email}`} style={{ color: C.gold }}>{q.email}</a> {q.test && <span style={{ color: C.red }}>(TEST)</span>}</div>
          <div style={{ color: C.dim }}>{fmt(q.createdAt)}{q.sponsorId ? ` · approved as sponsor` : ""}</div>
          {q.website && <div style={{ wordBreak: "break-all" }}>Website: {q.website}</div>}
          <div>Promoting: {q.promoting}</div>
          {q.logoUrl && <div style={{ wordBreak: "break-all" }}>Logo link: {q.logoUrl} <span style={{ color: C.dim }}>(import it from the sponsor editor)</span></div>}
          {q.message && <div style={{ whiteSpace: "pre-wrap", color: C.muted }}>{q.message}</div>}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
            {q.logo && !q.sponsorId && <button style={goldBtn} onClick={approve}>Approve → create active sponsor</button>}
            {q.logo && sponsors.length > 0 && <>
              <select className="hv-in" style={{ width: "auto", padding: "5px 8px", fontSize: 12 }} value={attachTo} onChange={(e) => setAttachTo(e.target.value)}><option value="">Attach logo to…</option>{sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <button style={small} disabled={!attachTo} onClick={attach}>Attach logo</button>
            </>}
            <button style={{ ...small, color: C.red, borderColor: `${C.red}80` }} onClick={del}>Delete</button>
            <span style={{ fontSize: 12, color: C.muted }}>{msg}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSponsors({ onOut }) {
  const [list, setList] = useState(null), [inq, setInq] = useState([]), [settings, setSettings] = useState({}), [emailOn, setEmailOn] = useState(false);
  const [err, setErr] = useState(""), [adding, setAdding] = useState(false), [msg, setMsg] = useState(""), [audit, setAudit] = useState(null);
  const load = useCallback(async () => {
    try { const [a, b] = await Promise.all([api("sponsors"), api("inquiries")]); setList(a.sponsors); setSettings(a.settings); setEmailOn(a.emailConfigured); setInq(b.inquiries); }
    catch (e) { if (e.auth) onOut(); else setErr(e.message); }
  }, [onOut]);
  useEffect(() => { load(); }, [load]);
  const toggleCheckout = async () => {
    const next = !settings.checkout;
    if (next && !confirm("Turn ON online sponsor checkout? Visitors will see a live $100/month subscribe button on /sponsors.")) return;
    try { const d = await api("sponsor-settings", { method: "PUT", body: JSON.stringify({ checkout: next }) }); setSettings(d.settings); } catch (e) { setMsg(e.message); }
  };
  const run = async (path, label) => { setMsg(label + "…"); try { const d = await api(path, { method: "POST", body: "{}" }); setMsg(`${label}: ${JSON.stringify(d)}`); } catch (e) { setMsg(`${label}: ${e.message}`); } };
  if (err) return <div style={{ color: C.red }}>{err}</div>;
  if (!list) return <div style={{ color: C.muted }}>Loading…</div>;
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>Sponsors</h1>
      <p style={{ fontSize: 13, color: C.dim, marginBottom: 14 }}>{SPONSOR_PRICE_LABEL}. Live sponsors appear on <a href="/sponsors" target="_blank" rel="noopener" style={{ color: C.gold }}>/sponsors</a>, the site-wide ticker and the home page strip. The <a href="/sponsors/policy" target="_blank" rel="noopener" style={{ color: C.gold }}>Ad Policy</a> is a <b>draft for your review — not legal advice</b>.</p>

      <div className="hv-card" style={{ padding: 16, marginBottom: 18, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <b style={{ fontSize: 14 }}>Sponsor checkout</b>
          <button onClick={toggleCheckout} data-testid="checkout-toggle" style={{ ...small, background: settings.checkout ? C.green : "transparent", color: settings.checkout ? "#000" : C.muted, fontWeight: 800 }}>{settings.checkout ? "ON — subscribe button is public" : "OFF (inquiry form only)"}</button>
          <button style={small} onClick={() => run("sponsor-checkout-test", "Test checkout (create + expire, no charge)")}>Test checkout session</button>
          <button style={small} onClick={() => run("stripe-webhook-events", "Stripe webhook events")}>Add sponsor events to Stripe webhook</button>
        </div>
        <div style={{ fontSize: 12, color: emailOn ? C.green : C.gold }}>{emailOn ? "Automatic welcome emails: on (Resend)." : "Automatic welcome emails: off — email not configured. Use “Email links” on each sponsor, or add HV_RESEND_API_KEY and HV_EMAIL_FROM in Netlify."}</div>
        {msg && <div style={{ fontSize: 12, color: C.muted, wordBreak: "break-all" }}>{msg}</div>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ fontSize: 18 }}>All sponsors ({list.length})</h2>
        <button className="hv-btn" style={{ width: "auto", padding: "9px 16px" }} onClick={() => setAdding(!adding)} data-testid="sponsor-add">{adding ? "Close" : "+ Add sponsor"}</button>
      </div>
      {adding && <div className="hv-card" style={{ marginBottom: 14, padding: 18 }}><SponsorForm initial={EMPTY} saveLabel="Create sponsor" onSave={async (f) => { await api("sponsors", { method: "POST", body: JSON.stringify(f) }); setAdding(false); load(); }} onCancel={() => setAdding(false)} /></div>}
      {list.length === 0 && <div style={{ color: C.dim, marginBottom: 14 }}>No sponsors yet — the site shows “Your logo here” placeholders.</div>}
      {list.map((s) => <SponsorRow key={s.id} s={s} emailOn={emailOn} reload={load} setList={setList} />)}

      <h2 style={{ fontSize: 18, margin: "26px 0 10px" }}>Sponsor inquiries ({inq.length})</h2>
      {inq.length === 0 && <div style={{ color: C.dim }}>No inquiries yet.</div>}
      {inq.map((q) => <Inquiry key={q.id} q={q} sponsors={list} reload={load} />)}

      <h2 style={{ fontSize: 18, margin: "26px 0 10px" }}>Audit log</h2>
      {!audit ? <button style={small} onClick={() => api("audit").then((d) => setAudit(d.audit)).catch((e) => setMsg(e.message))}>Show recent activity</button> : (
        <div className="hv-card" style={{ padding: 10, maxHeight: 320, overflow: "auto", fontSize: 12, fontFamily: "ui-monospace,monospace" }}>
          {audit.length ? audit.map((a, i) => <div key={i} style={{ padding: "3px 0", borderBottom: `1px solid ${C.border}` }}>{fmt(a.at)} · <b>{a.action}</b> {Object.entries(a).filter(([k]) => !["at", "action"].includes(k)).map(([k, v]) => `${k}=${v}`).join(" ")}</div>) : "Nothing yet."}
        </div>
      )}
    </div>
  );
}

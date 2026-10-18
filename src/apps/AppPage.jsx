import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Shell, Facts, C, GT, money } from "./ui";
import { APPS, APP_FORMS } from "../../shared/apps.js";
import { getUtm, previewToken, track, ventureCheckUrl } from "./utm";
import { useSEO } from "../seo";

const PATH_LABEL = { start: "Start Your Hustle", grow: "Grow Your Hustle" };
const NOTES = {
  "first-sale-blueprint": "You'll get it on screen and as a PDF download. A plan, not a promise — no income is guaranteed.",
  "offer-builder": "Suggested pricing is a starting point — check what others charge near you.",
  "lead-follow-up": "Drafts only — nothing is sent for you. Only contact people who agreed to hear from you.",
  "first-customer-finder": "Searches public Bluesky and Hacker News posts only (no Facebook, Reddit or private groups). Results depend on what people have posted recently — some ideas get few matches.",
  "lead-qualifier": "Remove phone numbers and email addresses before pasting. The suggested reply is a draft — nothing is sent for you.",
  "reactivation-kit": "No customer lists or personal data needed — you add names yourself. Downloadable PDF + text file.",
};

export default function AppPage() {
  const { id } = useParams();
  const [q] = useSearchParams();
  const preview = previewToken(q.get("preview") || "");
  const fallback = APPS.find((a) => a.id === id);
  const [app, setApp] = useState(fallback);
  const [buyable, setBuyable] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const fields = APP_FORMS[id] || [];
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map((f) => [f.name, f.type === "select" ? f.options[0] : ""])));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(q.get("canceled") ? "Checkout was canceled — you weren't charged. You can try again anytime." : "");

  useSEO({ title: `${fallback?.name || "App"} – Hustle Vault`, description: fallback?.tagline || "", path: `/apps/${id}`, noindex: !!preview || app?.status !== "live" });
  useEffect(() => { if (fallback) track("app_view", id); }, [id]);
  useEffect(() => {
    fetch(`/api/apps${preview ? `?preview=${encodeURIComponent(preview)}` : ""}`).then((r) => r.json())
      .then((d) => { const a = d.apps?.find((x) => x.id === id); if (a) { setApp(a); setBuyable(!!a.buyable); } })
      .catch(() => {}).finally(() => setLoaded(true));
  }, [id, preview]);

  if (!fallback) return <Shell><div className="hv-card"><h1 style={{ fontSize: 22 }}>App not found</h1><p style={{ marginTop: 10 }}><Link to="/" style={{ color: C.gold }}>See all tools</Link></p></div></Shell>;
  const ready = fields.every((f) => f.type === "select" || (vals[f.name] || "").trim().length >= (f.min ?? 1));

  async function buy() {
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/apps/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appId: id, preview, utm: getUtm(), inputs: vals }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) throw new Error(d.error || "Couldn't start checkout. Please try again.");
      window.location.href = d.url;
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  return (
    <Shell>
      {preview && buyable && app.status !== "live" && <div style={{ background: C.tint, border: `1px solid ${C.gold}`, color: C.goldBri, padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>Private test link — this app is hidden from the public (Coming soon). Payments here are real.</div>}
      <div style={{ fontSize: 12, color: C.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{PATH_LABEL[app.path]}</div>
      <h1 style={{ ...GT, fontSize: "clamp(28px,6vw,40px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 10 }}>{app.name}</h1>
      <p style={{ color: C.body, fontSize: 17, lineHeight: 1.6, marginBottom: 18 }}>{app.tagline}</p>
      <Facts app={app} />
      {app.external ? (
        <a className="hv-btn" href={ventureCheckUrl(app.url, "app_page")} target="_blank" rel="noopener" onClick={() => track("vc_click", app.id)}>Take the free quiz on VentureCheck →</a>
      ) : !buyable ? (
        <div className="hv-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: C.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{loaded ? "Coming soon" : "Loading…"}</div>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>We're finishing testing on this tool. It'll be available here shortly.</p>
        </div>
      ) : (
        <div className="hv-card">
          <h2 style={{ fontSize: 19, marginBottom: 16 }}>Tell us about you</h2>
          {fields.map((f, i) => (
            <div key={f.name} style={{ marginBottom: 16 }}>
              <label className="hv-lab" htmlFor={f.name}>{i + 1}. {f.label}</label>
              {f.type === "select" ? (
                <select id={f.name} className="hv-in" value={vals[f.name]} onChange={(e) => setVals({ ...vals, [f.name]: e.target.value })}>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
              ) : f.type === "textarea" ? (
                <textarea id={f.name} className="hv-in" rows={f.rows || 3} maxLength={f.max} placeholder={f.placeholder} value={vals[f.name]} onChange={(e) => setVals({ ...vals, [f.name]: e.target.value })} />
              ) : (
                <input id={f.name} className="hv-in" maxLength={f.max} placeholder={f.placeholder} value={vals[f.name]} onChange={(e) => setVals({ ...vals, [f.name]: e.target.value })} />
              )}
            </div>
          ))}
          <div style={{ fontSize: 12, color: C.dim, marginBottom: 14, lineHeight: 1.6 }}>{NOTES[id]} Please don't include anyone's private details.</div>
          {err && <div style={{ color: C.red, fontSize: 14, marginBottom: 12 }}>{err}</div>}
          <button className="hv-btn" disabled={busy || !ready} onClick={buy}>{busy ? "Opening secure checkout…" : `Get it now — ${money(app.price)}`}</button>
          <div style={{ fontSize: 12, color: C.dim, textAlign: "center", marginTop: 10 }}>Secure checkout by Stripe · No account needed · One-time payment</div>
        </div>
      )}
      {!buyable && err && <div style={{ color: C.red, fontSize: 14, marginTop: 12 }}>{err}</div>}
    </Shell>
  );
}

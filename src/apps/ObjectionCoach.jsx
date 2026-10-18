import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Shell, Facts, C, GT, money } from "./ui";
import { COACH_INDUSTRIES } from "../../shared/apps.js";
import { getUtm, previewToken, track } from "./utm";
import { useSEO } from "../seo";
import { appMeta } from "../../shared/pagemeta.js";

const FALLBACK = { id: "objection-coach", name: "Sales Objection Coach", price: 500, status: "soon",
  tagline: "Know exactly what to say when a customer pushes back.",
  give: "Your industry and the objection you keep hearing",
  get: "A 5-step answer script plus one practice session where AI plays the customer and scores you",
  fast: "Under 1 minute" };

export default function ObjectionCoach() {
  const [q] = useSearchParams();
  const preview = previewToken(q.get("preview") || "");
  const [app, setApp] = useState(FALLBACK);
  const [buyable, setBuyable] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [industry, setIndustry] = useState("real_estate");
  const [otherIndustry, setOtherIndustry] = useState("");
  const [choice, setChoice] = useState(COACH_INDUSTRIES.real_estate.objections[0]);
  const [custom, setCustom] = useState("");
  const [offer, setOffer] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(q.get("canceled") ? "Checkout was canceled — you weren't charged. You can try again anytime." : "");

  useSEO(appMeta(app, { preview: !!preview }));

  useEffect(() => { track("app_view", "objection-coach"); }, []);
  useEffect(() => {
    fetch(`/api/apps${preview ? `?preview=${encodeURIComponent(preview)}` : ""}`)
      .then((r) => r.json())
      .then((d) => { const a = d.apps?.find((x) => x.id === "objection-coach"); if (a) { setApp(a); setBuyable(!!a.buyable); setMissing(false); } else if (Array.isArray(d.apps)) setMissing(true); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [preview]);

  const objections = COACH_INDUSTRIES[industry].objections;
  const objection = choice === "__custom" ? custom : choice;

  async function buy() {
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/apps/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: "objection-coach", preview, utm: getUtm(), inputs: { industry, otherIndustry, objection, offer } }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) throw new Error(d.error || "Couldn't start checkout. Please try again.");
      window.location.href = d.url;
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  if (missing) return <Shell><div className="hv-card"><h1 style={{ fontSize: 22 }}>This tool isn't available</h1><p style={{ color: C.muted, marginTop: 10, lineHeight: 1.6 }}>It may have moved or been retired.</p><p style={{ marginTop: 10 }}><Link to="/#start" style={{ color: C.gold }}>See our AI tools</Link></p></div></Shell>;
  return (
    <Shell>
      {preview && buyable && app.status !== "live" && (
        <div style={{ background: C.tint, border: `1px solid ${C.gold}`, color: C.goldBri, padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          Private test link — this app is hidden from the public (Coming soon). Payments here are real.
        </div>
      )}
      <div style={{ fontSize: 12, color: C.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Grow Your Hustle</div>
      <h1 style={{ ...GT, fontSize: "clamp(28px,6vw,40px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 10 }}>{app.name}</h1>
      <p style={{ color: C.body, fontSize: 17, lineHeight: 1.6, marginBottom: 18 }}>{app.tagline}</p>
      <Facts app={app} />

      {!buyable ? (
        <div className="hv-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: C.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{loaded ? "Coming soon" : "Loading…"}</div>
          {loaded && <p style={{ color: C.muted, lineHeight: 1.6 }}>We're finishing testing on this tool. It'll be available here shortly.</p>}
        </div>
      ) : (
        <div className="hv-card">
          <h2 style={{ fontSize: 19, marginBottom: 16 }}>Tell the coach about your situation</h2>
          <div style={{ marginBottom: 16 }}>
            <label className="hv-lab" htmlFor="ind">1. What do you sell?</label>
            <select id="ind" className="hv-in" value={industry} onChange={(e) => { setIndustry(e.target.value); setChoice(COACH_INDUSTRIES[e.target.value].objections[0]); }}>
              {Object.entries(COACH_INDUSTRIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            {industry === "other" && <input className="hv-in" style={{ marginTop: 8 }} maxLength={60} placeholder="Your industry (e.g. home cleaning)" value={otherIndustry} onChange={(e) => setOtherIndustry(e.target.value)} />}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="hv-lab">2. What does the customer say?</label>
            {[...objections, "__custom"].map((o) => (
              <label key={o} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", border: `1px solid ${choice === o ? C.gold : C.border}`, borderRadius: 6, marginBottom: 6, cursor: "pointer", fontSize: 15 }}>
                <input type="radio" name="obj" checked={choice === o} onChange={() => setChoice(o)} style={{ marginTop: 3 }} />
                <span>{o === "__custom" ? "Something else (type it)" : `“${o}”`}</span>
              </label>
            ))}
            {choice === "__custom" && <input className="hv-in" maxLength={200} placeholder="Type what the customer says" value={custom} onChange={(e) => setCustom(e.target.value)} />}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="hv-lab" htmlFor="offer">3. Anything about your offer? (optional)</label>
            <textarea id="offer" className="hv-in" rows={3} maxLength={300} placeholder="e.g. Term life policies for young families, starting around $30/month" value={offer} onChange={(e) => setOffer(e.target.value)} />
            <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Please don't include customer names, phone numbers, or other private details.</div>
          </div>
          {err && <div style={{ color: C.red, fontSize: 14, marginBottom: 12 }}>{err}</div>}
          <button className="hv-btn" disabled={busy || objection.trim().length < 4 || (industry === "other" && otherIndustry.trim().length < 2)} onClick={buy}>
            {busy ? "Opening secure checkout…" : `Get my script + practice — ${money(app.price)}`}
          </button>
          <div style={{ fontSize: 12, color: C.dim, textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
            Secure checkout by Stripe · No account needed · One-time payment<br />Includes one practice session (up to 6 replies). Coaching only — no sales results guaranteed.
          </div>
        </div>
      )}
      {!buyable && err && <div style={{ color: C.red, fontSize: 14, marginTop: 12 }}>{err}</div>}
    </Shell>
  );
}

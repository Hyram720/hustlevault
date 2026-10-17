import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import BlogLayout from "../blog/BlogLayout";
import { useSEO } from "../seo";
import { useSponsors } from "./data";
import { SponsorCard, PlaceholderCard, T, GG, GT } from "./Card";
import { uploadImage, ACCEPT } from "./upload";
import { sponsorsMeta } from "../../shared/pagemeta.js";
import { COPY, SPONSOR_PRICE_LABEL, LOGO_SPEC } from "../../shared/sponsors.js";

const lab = { display: "block", fontSize: 13, color: T.muted, margin: "0 0 6px", fontWeight: 600 };
const inp = { width: "100%", padding: "12px 13px", background: T.bg, border: `1px solid ${T.borderH}`, borderRadius: 6, color: T.cream, fontSize: 16, fontFamily: "inherit" };
const btn = { display: "inline-block", background: GG, color: "#000", padding: "14px 26px", fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Georgia,serif", borderRadius: 3, textDecoration: "none", border: "none", cursor: "pointer" };

export function useHashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    return () => clearTimeout(t);
  }, [hash]);
}

function InquiryForm({ checkout }) {
  const started = useRef(Date.now());
  const [f, setF] = useState({ name: "", business: "", email: "", website: "", promoting: "", logoUrl: "", message: "", company_fax: "" });
  const [agree, setAgree] = useState(false);
  const [file, setFile] = useState(null), [preview, setPreview] = useState("");
  const [state, setState] = useState({ busy: false, err: "", done: false, msg: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const pick = (e) => {
    const x = e.target.files?.[0] || null;
    setFile(x); if (preview) URL.revokeObjectURL(preview);
    setPreview(x && x.size <= 5 * 1024 * 1024 ? URL.createObjectURL(x) : "");
    if (x && x.size > 5 * 1024 * 1024) setState({ ...state, err: "That file is over 5 MB." });
  };
  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, err: "", done: false, msg: file ? "Uploading your logo…" : "Sending…" });
    try {
      let logo = "";
      if (file) logo = (await uploadImage(file, { purpose: "logo" })).mediaId;
      setState((s) => ({ ...s, msg: "Sending…" }));
      const r = await fetch("/api/sponsors/inquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, logo, agree, t: Date.now() - started.current }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Something went wrong — please try again.");
      setState({ busy: false, err: "", done: true, msg: "" });
    } catch (err) { setState({ busy: false, err: err.message, done: false, msg: "" }); }
  };
  if (state.done) return (
    <div role="status" className="hv-sp-done" style={{ background: T.surface, border: `1px solid ${T.gold}60`, borderRadius: 8, padding: 24 }}>
      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Thanks — we got your message.</h3>
      <p style={{ color: T.muted, lineHeight: 1.6 }}>We'll review it and reply by email, usually within two business days.</p>
    </div>
  );
  const field = (k, label, props = {}) => (
    <div><label style={lab} htmlFor={"sp-" + k}>{label}</label><input id={"sp-" + k} style={inp} value={f[k]} onChange={set(k)} {...props} /></div>
  );
  return (
    <form onSubmit={submit} noValidate={false} className="hv-sp-form" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 22, display: "grid", gap: 14 }}>
      <div className="hv-sp-grid2">
        {field("name", "Your name", { required: true, minLength: 2, maxLength: 80, autoComplete: "name" })}
        {field("business", "Business name", { required: true, minLength: 2, maxLength: 80, autoComplete: "organization" })}
      </div>
      <div className="hv-sp-grid2">
        {field("email", "Email", { type: "email", required: true, maxLength: 200, autoComplete: "email" })}
        {field("website", "Website (https://…)", { type: "url", placeholder: "https://", maxLength: 300, pattern: "https://.+" })}
      </div>
      {field("promoting", "What you're promoting", { required: true, minLength: 3, maxLength: 300, placeholder: "e.g. Free 15-minute bookkeeping review for new LLCs" })}
      <div>
        <label style={lab} htmlFor="sp-logo">Logo (optional)</label>
        <input id="sp-logo" type="file" accept={ACCEPT} onChange={pick} style={{ ...inp, padding: 10, fontSize: 14 }} />
        <div style={{ fontSize: 12, color: T.dim, marginTop: 6, lineHeight: 1.5 }}>{LOGO_SPEC}</div>
        {preview && <div style={{ marginTop: 10, width: 300, maxWidth: "100%", aspectRatio: "3 / 1", background: "#0B0B14", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}><img src={preview} alt="Your logo preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>}
      </div>
      {field("logoUrl", "…or a link to your logo (optional)", { type: "url", placeholder: "https://", maxLength: 300, pattern: "https://.+" })}
      <div><label style={lab} htmlFor="sp-message">Message (optional)</label><textarea id="sp-message" rows={4} maxLength={2000} style={{ ...inp, resize: "vertical" }} value={f.message} onChange={set("message")} /></div>
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="sp-company_fax">Company fax</label><input id="sp-company_fax" tabIndex={-1} autoComplete="off" value={f.company_fax} onChange={set("company_fax")} />
      </div>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: T.cream, lineHeight: 1.5 }}>
        <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 4, width: 18, height: 18, flex: "0 0 auto" }} />
        <span>I agree to the <Link to="/sponsors/policy" style={{ color: T.gold }}>Ad Policy</Link>.</span>
      </label>
      {state.err && <div role="alert" style={{ color: T.red, fontSize: 14 }}>{state.err}</div>}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button type="submit" style={{ ...btn, opacity: state.busy ? 0.6 : 1 }} disabled={state.busy}>{state.busy ? state.msg : "Send inquiry"}</button>
        {checkout && <CheckoutButton business={f.business} email={f.email} />}
      </div>
    </form>
  );
}

function CheckoutButton({ business, email }) {
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/sponsors/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business, email }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) throw new Error(d.error || "Checkout isn't available right now.");
      window.location.href = d.url;
    } catch (e) { setErr(e.message); setBusy(false); }
  };
  return <span><button type="button" onClick={go} disabled={busy} style={{ ...btn, background: "transparent", color: T.gold, border: `1px solid ${T.gold}` }}>Start sponsorship — $100/month</button>{err && <span style={{ color: T.red, fontSize: 13, marginLeft: 8 }}>{err}</span>}</span>;
}

export default function Sponsors() {
  const d = useSponsors();
  const sponsors = d?.sponsors || [];
  useSEO(sponsorsMeta(sponsors));
  useHashScroll();
  const q = new URLSearchParams(useLocation().search);
  const placeholders = Math.max(0, 3 - sponsors.length);
  return (
    <BlogLayout active="sponsors">
      <style>{`.hv-sp-grid2{display:grid;gap:14px;grid-template-columns:1fr}@media(min-width:640px){.hv-sp-grid2{grid-template-columns:1fr 1fr}}.hv-sp-wall{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}`}</style>
      <header style={{ maxWidth: 900, margin: "0 auto", padding: "56px 20px 28px", textAlign: "center" }}>
        <p style={{ display: "inline-flex", background: `${T.gold}15`, border: `1px solid ${T.gold}40`, borderRadius: 100, padding: "6px 16px", marginBottom: 20, fontSize: 10, color: T.gold, letterSpacing: 3, textTransform: "uppercase" }}>{COPY.headline}</p>
        <h1 style={{ fontSize: "clamp(32px,5.5vw,54px)", fontWeight: 900, lineHeight: 1.05, marginBottom: 16 }}>Advertise on <span style={GT}>Hustle Vault</span></h1>
        <p style={{ fontSize: 17, color: T.cream, lineHeight: 1.6, maxWidth: 640, margin: "0 auto 12px" }}>{COPY.line}</p>
        <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.65, maxWidth: 640, margin: "0 auto 26px" }}>Hustle Vault is where AI beginners come to start a business — and where entrepreneurs come to grow one with AI. If you sell tools, services or know-how to people building a business, this is your crowd.</p>
        <a href="#inquire" style={btn}>{COPY.cta}</a>
        {q.get("subscribed") && <p role="status" style={{ marginTop: 18, color: T.green }}>Thanks for subscribing! We'll review your listing and email you when it's live.</p>}
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "8px 20px 72px" }}>
        <section aria-labelledby="sp-price" style={{ background: T.surface, border: `1px solid ${T.gold}40`, borderRadius: 10, padding: "22px 22px", marginBottom: 44, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: "1 1 320px" }}>
            <h2 id="sp-price" style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}><span style={GT}>{SPONSOR_PRICE_LABEL}</span></h2>
            <ul style={{ paddingLeft: 18, color: T.muted, fontSize: 14, lineHeight: 1.8 }}>
              <li>Your logo, business name and offer on the sponsor wall below</li>
              <li>Your logo and offer in the scrolling ticker across the site</li>
              <li>Month to month — cancel anytime. Every listing is labeled "Sponsored".</li>
            </ul>
          </div>
          <a href="#inquire" style={btn}>{COPY.cta}</a>
        </section>

        <section aria-labelledby="sp-wall" style={{ marginBottom: 48 }}>
          <h2 id="sp-wall" style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Our sponsors</h2>
          <p style={{ color: T.muted, fontSize: 14, marginBottom: 18 }}>{sponsors.length ? "These businesses support Hustle Vault." : "Be the first business on the wall."}</p>
          <div className="hv-sp-wall">
            {sponsors.map((s) => <SponsorCard key={s.id} s={s} />)}
            {Array.from({ length: placeholders }, (_, i) => <PlaceholderCard key={i} />)}
          </div>
        </section>

        <section id="inquire" aria-labelledby="sp-inq" style={{ scrollMarginTop: 80, maxWidth: 760, margin: "0 auto" }}>
          <h2 id="sp-inq" style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Get in touch</h2>
          <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>Tell us about your business and what you'd like to promote. We review every sponsor before it goes live — see our <Link to="/sponsors/policy" style={{ color: T.gold }}>Ad Policy &amp; Sponsor Terms</Link>.</p>
          <InquiryForm checkout={!!d?.checkout} />
        </section>
      </main>
    </BlogLayout>
  );
}

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Shell, C, GT, money } from "./ui";
import { rememberPurchase, myPurchases, previewToken, withPreview } from "./utm";
import { toSections, DISCLAIMER } from "../../shared/render.js";
import { useSEO } from "../seo";

function Copy({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); }); }}
      style={{ background: "transparent", border: `1px solid ${C.borderH}`, color: ok ? C.green : C.muted, borderRadius: 4, fontSize: 12, padding: "4px 10px", cursor: "pointer", flexShrink: 0 }}>
      {ok ? "Copied" : "Copy"}
    </button>
  );
}

function Step({ n, title, text }) {
  return (
    <div style={{ padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: C.gold, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>{n}. {title}</div>
        <Copy text={text} />
      </div>
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}

function CoachResult({ p, onUpdate }) {
  const r = p.result;
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pr = p.practice;
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [pr?.turns?.length]);
  const script = [r.acknowledge, r.clarify, r.respond, r.follow_up, r.close].join("\n\n");

  async function send() {
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/purchase/${p.id}/practice`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Something went wrong.");
      onUpdate(d); setMsg("");
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="hv-card" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h2 style={{ fontSize: 20 }}>Your answer script</h2><Copy text={script} />
        </div>
        <div style={{ color: C.muted, fontSize: 14, marginBottom: 6 }}>When they say: “{p.inputs.objection}”</div>
        <Step n={1} title="Acknowledge" text={r.acknowledge} />
        <Step n={2} title="Ask to understand" text={r.clarify} />
        <Step n={3} title="Respond" text={r.respond} />
        <Step n={4} title="Check in" text={r.follow_up} />
        <Step n={5} title="Ethical next step" text={r.close} />
        {r.why_it_works?.length > 0 && <><div style={{ fontSize: 13, color: C.green, fontWeight: 700, marginTop: 16 }}>Why it works</div><ul style={{ paddingLeft: 20, lineHeight: 1.7, fontSize: 15 }}>{r.why_it_works.map((x, i) => <li key={i}>{x}</li>)}</ul></>}
        {r.avoid?.length > 0 && <><div style={{ fontSize: 13, color: C.red, fontWeight: 700, marginTop: 12 }}>Don't do this</div><ul style={{ paddingLeft: 20, lineHeight: 1.7, fontSize: 15 }}>{r.avoid.map((x, i) => <li key={i}>{x}</li>)}</ul></>}
      </div>

      {pr && (
        <div className="hv-card">
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Practice with an AI customer</h2>
          <div style={{ color: C.muted, fontSize: 14, marginBottom: 14 }}>The AI plays your customer and scores each reply from 1–10. Replies used: {pr.used} of {pr.maxTurns}.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            {pr.turns.map((t, i) => {
              const you = t.role === "you";
              const sc = you ? pr.scores[Math.floor(i / 2)] : null;
              return (
                <div key={i} style={{ alignSelf: you ? "flex-end" : "flex-start", maxWidth: "88%" }}>
                  <div style={{ fontSize: 11, color: C.dim, marginBottom: 3, textAlign: you ? "right" : "left" }}>{you ? "You" : "Customer"}</div>
                  <div style={{ background: you ? "#1C1606" : C.panel, border: `1px solid ${you ? C.gold + "60" : C.border}`, borderRadius: 10, padding: "10px 13px", fontSize: 15, lineHeight: 1.5 }}>{t.text}</div>
                  {sc && <div style={{ fontSize: 13, color: sc.score >= 7 ? C.green : sc.score >= 4 ? C.goldBri : C.red, marginTop: 4, textAlign: "right" }}>Score {sc.score}/10 — <span style={{ color: C.muted }}>{sc.feedback}</span></div>}
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          {pr.done ? (
            <div style={{ background: C.panel, border: `1px solid ${C.gold}50`, borderRadius: 8, padding: 14 }}>
              <div style={{ ...GT, fontWeight: 900, fontSize: 18, marginBottom: 6 }}>Session complete — average {pr.summary?.average}/10</div>
              <div style={{ fontSize: 15, lineHeight: 1.6 }}>{pr.summary?.text}</div>
            </div>
          ) : (
            <>
              <textarea className="hv-in" rows={3} maxLength={600} placeholder="Type what you'd say back…" value={msg} onChange={(e) => setMsg(e.target.value)} />
              {err && <div style={{ color: C.red, fontSize: 14, margin: "8px 0" }}>{err}</div>}
              <button className="hv-btn" style={{ marginTop: 10 }} disabled={busy || msg.trim().length < 2} onClick={send}>{busy ? "Customer is thinking…" : "Send reply"}</button>
            </>
          )}
        </div>
      )}
    </>
  );
}

function FormResult({ p }) {
  const sections = toSections(p.appId, p.result);
  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <a className="hv-btn" style={{ width: "auto", flex: 1, minWidth: 160 }} href={`/api/purchase/${p.id}/pdf`}>Download PDF</a>
        <a className="hv-btn hv-ghost" style={{ width: "auto", flex: 1, minWidth: 160 }} href={`/api/purchase/${p.id}/txt`}>Download text file</a>
      </div>
      {sections.map((s, i) => (
        <div key={i} className="hv-card" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 19, marginBottom: 6 }}>{s.h}</h2>
          {s.items.map((it, j) => (
            <div key={j} style={{ padding: "10px 0", borderBottom: j < s.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
              {(it.label || s.copy) && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>{it.label}</div>{s.copy && <Copy text={it.text} />}
              </div>}
              <div style={{ fontSize: 15.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{it.text}</div>
              {/^https:\/\/(bsky\.app|news\.ycombinator\.com)\//.test(it.link || "") && <a href={it.link} target="_blank" rel="noopener noreferrer nofollow" style={{ display: "inline-block", marginTop: 6, color: C.gold, fontSize: 14 }}>Open the post on {it.link.includes("ycombinator") ? "Hacker News" : "Bluesky"} →</a>}
            </div>
          ))}
        </div>
      ))}
      <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>{DISCLAIMER}</div>
    </>
  );
}

export default function MyPurchase() {
  const { id } = useParams();
  const [q] = useSearchParams();
  const sessionId = q.get("session_id");
  const [p, setP] = useState(null);
  const [err, setErr] = useState("");
  const tries = useRef(0);
  const genAsked = useRef(false);
  useSEO({ title: "Your purchase – Hustle Vault", description: "Your Hustle Vault purchase", path: "/my", noindex: true });

  const load = useCallback(async () => {
    const r = await fetch(`/api/purchase/${encodeURIComponent(id)}${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""}`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "We couldn't find that purchase.");
    return d;
  }, [id, sessionId]);

  useEffect(() => {
    let stop = false, timer;
    const tick = async () => {
      try {
        let d = await load();
        if (stop) return;
        setP(d);
        if (["paid", "partially_refunded"].includes(d.status)) rememberPurchase(d.id, d.appName);
        if (["paid", "partially_refunded"].includes(d.status) && !d.result && !genAsked.current && d.gen?.state !== "running") {
          genAsked.current = true;
          const r = await fetch(`/api/purchase/${encodeURIComponent(id)}/generate`, { method: "POST" });
          d = await r.json(); if (!stop && r.ok) setP(d);
          genAsked.current = d.gen?.state !== "failed" ? genAsked.current : false;
        }
        const waiting = ["pending", "processing"].includes(d.status) || (["paid", "partially_refunded"].includes(d.status) && !d.result);
        tries.current += 1;
        if (waiting && tries.current < 80) timer = setTimeout(tick, tries.current < 10 ? 2000 : 5000);
      } catch (e) { if (!stop) setErr(e.message); }
    };
    tick();
    return () => { stop = true; clearTimeout(timer); };
  }, [id, load]);

  if (err) return <Shell><div className="hv-card"><h1 style={{ fontSize: 22, marginBottom: 8 }}>Hmm, we couldn't open this</h1><p style={{ color: C.muted }}>{err}</p><p style={{ marginTop: 12 }}><Link to="/my" style={{ color: C.gold }}>See purchases saved on this device</Link></p></div></Shell>;
  if (!p) return <Shell><div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Loading your purchase…</div></Shell>;

  const head = (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, color: C.gold, letterSpacing: 2, textTransform: "uppercase" }}>Your purchase</div>
      <h1 style={{ ...GT, fontSize: "clamp(26px,6vw,36px)", fontWeight: 900 }}>{p.appName}</h1>
      <div style={{ fontSize: 13, color: C.dim, marginTop: 4 }}>Purchase ID {p.id} · {money(p.amount)}</div>
    </div>
  );
  const again = p.preview ? withPreview(`/apps/${p.appId}`, previewToken()) : `/apps/${p.appId}`;
  const note = (title, text, color = C.muted) => <div className="hv-card" style={{ marginBottom: 18 }}><div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, color }}>{title}</div><div style={{ color: C.muted, lineHeight: 1.6 }}>{text}</div></div>;

  let body;
  if (p.status === "pending" || p.status === "processing") body = note("Confirming your payment…", "This usually takes a few seconds. Keep this page open.");
  else if (p.status === "refunded") body = note("This purchase was refunded", "Your money has been returned, so the results are no longer available. Questions? Reply to your Stripe receipt email.");
  else if (p.status === "failed") body = note("The payment didn't go through", <>Your bank declined or the payment failed — you weren't charged. <Link to={again} style={{ color: C.gold }}>Try again</Link>.</>, C.red);
  else if (p.status === "expired" || p.status === "checkout_error") body = note("Checkout wasn't completed", <>No payment was taken. <Link to={again} style={{ color: C.gold }}>Start again</Link>.</>);
  else if (!p.result) body = p.gen?.state === "failed" && (p.gen.attempts || 0) >= 4
    ? note("We hit a problem creating your results", "Your payment is safe. Please reply to your Stripe receipt email with your purchase ID and we'll fix it or refund you.", C.red)
    : note("Creating your results…", "Payment confirmed. The AI is working on it — this usually takes under a minute.", C.green);
  else body = p.appId === "objection-coach" ? <CoachResult p={p} onUpdate={setP} /> : <FormResult p={p} />;

  return (
    <Shell>
      {head}
      {body}
      {["paid", "partially_refunded"].includes(p.status) && (
        <div style={{ fontSize: 13, color: C.dim, marginTop: 18, lineHeight: 1.6 }}>
          Bookmark this page to come back anytime: <span style={{ color: C.muted, wordBreak: "break-all" }}>{window.location.origin}/my/{p.id}</span>
          {p.appId === "objection-coach" && <><br />AI-generated coaching for education only. No income or sales results are guaranteed.</>}
        </div>
      )}
    </Shell>
  );
}

export function MyList() {
  const list = myPurchases();
  useSEO({ title: "My purchases – Hustle Vault", description: "Purchases saved on this device", path: "/my", noindex: true });
  return (
    <Shell>
      <h1 style={{ ...GT, fontSize: 30, fontWeight: 900, marginBottom: 12 }}>My purchases</h1>
      {list.length === 0 ? <p style={{ color: C.muted, lineHeight: 1.6 }}>No purchases saved on this device yet. Your purchase link is on the page you landed on after paying — bookmark it to come back.</p> : (
        list.map((x) => <Link key={x.id} to={`/my/${x.id}`} className="hv-card" style={{ display: "block", marginBottom: 10, color: C.cream, textDecoration: "none" }}><div style={{ fontWeight: 700 }}>{x.appName}</div><div style={{ fontSize: 12, color: C.dim }}>{new Date(x.at).toLocaleString()}</div></Link>)
      )}
    </Shell>
  );
}

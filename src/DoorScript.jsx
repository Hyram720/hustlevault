import { useEffect, useState } from "react";
import BlogLayout, { C, GT } from "./blog/BlogLayout";

const KEY = "hv_knock_log_v1";
const LEAD_TYPES = ["roofing-only", "bundled", "solar-only"];
const OUTCOMES = ["no answer", "not interested", "callback", "number grabbed"];
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };

const card = { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: 28, marginBottom: 32 };
const h3 = { color: C.gold, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", margin: "22px 0 8px", fontFamily: "Georgia,serif" };
const q = { color: C.cream, lineHeight: 1.7, margin: "6px 0", fontFamily: "Georgia,serif", fontSize: 16 };
const note = { color: C.muted, fontStyle: "italic", lineHeight: 1.6, margin: "6px 0", fontSize: 14 };
const inp = { width: "100%", padding: "10px 12px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, color: C.cream, fontSize: 14, boxSizing: "border-box" };
const lbl = { display: "block", color: C.muted, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 };
const btn = { padding: "11px 22px", background: "linear-gradient(135deg,#7A5A18 0%,#C9A84C 30%,#F0C040 55%,#C9A84C 80%,#7A5A18 100%)", color: "#000", border: "none", borderRadius: 4, fontWeight: 800, letterSpacing: 2, fontSize: 11, textTransform: "uppercase", cursor: "pointer" };
const th = { textAlign: "left", padding: "10px 8px", color: C.muted, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", borderBottom: `1px solid ${C.borderH}` };
const td = { padding: "10px 8px", borderBottom: `1px solid ${C.border}`, fontSize: 14, color: C.cream };

function useNoIndex() {
  useEffect(() => {
    document.title = "Door Script & Knock Log · Hustle Vault";
    let m = document.head.querySelector('meta[name="robots"]');
    const prev = m ? m.getAttribute("content") : null;
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "robots"); document.head.appendChild(m); }
    m.setAttribute("content", "noindex, nofollow, noarchive");
    return () => { if (prev == null) m.remove(); else m.setAttribute("content", prev); };
  }, []);
}

export default function DoorScript() {
  useNoIndex();
  const [rows, setRows] = useState(load);
  const blank = { address: "", leadType: "roofing-only", outcome: "no answer", phone: "", date: today() };
  const [f, setF] = useState(blank);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(rows)); }, [rows]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const add = (e) => {
    e.preventDefault();
    if (!f.address.trim()) return;
    setRows([{ ...f, address: f.address.trim(), phone: f.phone.trim(), id: Date.now() + Math.random() }, ...rows]);
    setF({ ...blank, leadType: f.leadType });
  };
  const del = (id) => { if (confirm("Delete this entry?")) setRows(rows.filter((r) => r.id !== id)); };
  const csv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const out = [["date", "address", "lead_type", "outcome", "phone"].join(","),
      ...rows.map((r) => [r.date, r.address, r.leadType, r.outcome, r.phone].map(esc).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([out], { type: "text/csv" }));
    a.download = `knock-log-${today()}.csv`;
    a.click();
  };

  return (
    <BlogLayout>
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ ...GT, fontSize: 40, fontWeight: 900, fontFamily: "Georgia,serif", marginBottom: 8 }}>Door Script &amp; Knock Log</h1>
        <p style={{ color: C.muted, marginBottom: 32 }}>Private field tool. Knock log entries are saved only in this browser on this device.</p>

        <section style={card} id="script">
          <h2 style={{ ...GT, fontSize: 24, fontFamily: "Georgia,serif" }}>1. Door knock (subtle, neighbor-first)</h2>

          <h3 style={h3}>Opening. Neighbor talk only, with no roofing or solar:</h3>
          <p style={q}>"Hey, how's it going? I'm Fred, I live just over in Collingswood. Sorry to interrupt your afternoon."</p>
          <p style={q}>"Man, that wind the other week was something. Did you guys lose power over here?"</p>
          <p style={note}>(Listen. Follow whatever they bring up.)</p>
          <p style={q}>"This is such a nice street. How long have you been here?" / "Love the [porch / flowers / old maple]. Has that tree been here forever?"</p>

          <h3 style={h3}>If they ask why you're out, or the talk winds down (one easy, honest line):</h3>
          <p style={q}>"Ah, I'm just walking the neighborhood today. I work with a local roofing and solar company, so after storms I like to see how the houses around here held up."</p>
          <p style={note}>(Then go back to them. Don't pitch.)</p>

          <h3 style={h3}>Late, only if it comes up naturally (an afterthought):</h3>
          <p style={q}><strong style={{ color: C.goldBri }}>Solar only:</strong> "Funny thing, your side of the street gets great sun. I've been reading up on solar for my own bills. If you're ever curious, I could tell you honestly whether it'd even make sense here."</p>
          <p style={q}><strong style={{ color: C.goldBri }}>Roofing only:</strong> "With trees like yours, I always think about my own gutters and roof after a storm. If you ever want a second set of eyes on yours, I'm happy to take a look and send you a couple of photos."</p>
          <p style={q}><strong style={{ color: C.goldBri }}>Bundled:</strong> "Your roof's in a great spot for sun. If you ever thought about solar, the smart move is having somebody check the roof first. I could look at both sometime if you wanted."</p>

          <h3 style={h3}>Suggestion, between neighbors:</h3>
          <p style={q}>"No rush at all. If you ever want me to swing by, evenings or a Saturday morning are easy for me. Probably best when everyone's home so I only bug you once."</p>
          <h3 style={h3}>Easy out:</h3>
          <p style={q}>"Anyway, great meeting you. Enjoy the rest of your day."</p>

          <h3 style={h3}>Getting their number (Fred's text-on-the-spot move):</h3>
          <p style={q}>"What's the best number for you? I'll shoot you a text right now so you've got mine, just in case I wrote yours down wrong."</p>
          <p style={note}>(Send it while you're standing there. When you hear their phone buzz, the number's confirmed and they've agreed to texts. Log the date and time in the tracker as their consent.)</p>
          <p style={q}>Text: "Hi [Name], it's Fred from the door on [Street]. Great meeting you! This is my number. Reply STOP anytime."</p>
        </section>

        <section style={card} id="log">
          <h2 style={{ ...GT, fontSize: 24, fontFamily: "Georgia,serif", marginBottom: 18 }}>2. Knock log</h2>
          <form onSubmit={add} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, alignItems: "end" }}>
            <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>Address</label><input name="address" style={inp} value={f.address} onChange={set("address")} placeholder="100 Pacific Ave, Collingswood" required /></div>
            <div><label style={lbl}>Lead type</label><select name="leadType" style={inp} value={f.leadType} onChange={set("leadType")}>{LEAD_TYPES.map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><label style={lbl}>Outcome</label><select name="outcome" style={inp} value={f.outcome} onChange={set("outcome")}>{OUTCOMES.map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><label style={lbl}>Phone captured</label><input name="phone" type="tel" style={inp} value={f.phone} onChange={set("phone")} placeholder="optional" /></div>
            <div><label style={lbl}>Date</label><input name="date" type="date" style={inp} value={f.date} onChange={set("date")} /></div>
            <div><button type="submit" style={btn}>Add knock</button></div>
          </form>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "28px 0 10px" }}>
            <span style={{ color: C.muted, fontSize: 12 }}>{rows.length} {rows.length === 1 ? "entry" : "entries"}</span>
            <button type="button" onClick={csv} disabled={!rows.length} style={{ ...btn, opacity: rows.length ? 1 : 0.4 }}>Export CSV</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table id="knock-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Date</th><th style={th}>Address</th><th style={th}>Lead type</th><th style={th}>Outcome</th><th style={th}>Phone</th><th style={th}></th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td style={{ ...td, color: C.dim }} colSpan={6}>No knocks logged yet.</td></tr>}
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={td}>{r.date}</td><td style={td}>{r.address}</td><td style={td}>{r.leadType}</td>
                    <td style={td}>{r.outcome}</td><td style={td}>{r.phone}</td>
                    <td style={td}><button type="button" onClick={() => del(r.id)} style={{ background: "transparent", border: `1px solid ${C.borderH}`, color: "#E74C3C", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </BlogLayout>
  );
}

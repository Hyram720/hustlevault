import { Link } from "react-router-dom";
import BlogLayout from "../blog/BlogLayout";
import { useSEO } from "../seo";
import { T, GT } from "./Card";
import { policyMeta } from "../../shared/pagemeta.js";
import { POLICY, POLICY_INTRO, POLICY_UPDATED } from "../../shared/policy.js";
import { fmtDateET } from "../../shared/blog.js";

export default function Policy() {
  useSEO(policyMeta());
  return (
    <BlogLayout active="sponsors">
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "52px 20px 72px" }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 11, color: T.dim, letterSpacing: 1, marginBottom: 20 }}><Link to="/" style={{ color: T.muted, textDecoration: "none" }}>Home</Link> · <Link to="/sponsors" style={{ color: T.muted, textDecoration: "none" }}>Advertise</Link></nav>
        <h1 style={{ fontSize: "clamp(28px,4.5vw,40px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 10 }}><span style={GT}>Ad Policy &amp; Sponsor Terms</span></h1>
        <p style={{ fontSize: 12, color: T.dim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 20 }}>Last updated {fmtDateET(POLICY_UPDATED)}</p>
        <p style={{ fontSize: 16, color: T.body, lineHeight: 1.75, marginBottom: 10 }}>{POLICY_INTRO}</p>
        {POLICY.map((s) => (
          <section key={s.h}>
            <h2 style={{ fontSize: 21, fontWeight: 800, margin: "30px 0 12px" }}>{s.h}</h2>
            <ul style={{ paddingLeft: 22 }}>{s.items.map((i) => <li key={i} style={{ fontSize: 15, lineHeight: 1.7, color: T.body, marginBottom: 8 }}>{i}</li>)}</ul>
          </section>
        ))}
        <p style={{ marginTop: 34 }}><Link to="/sponsors#inquire" style={{ color: T.gold }}>← Back to Advertise on Hustle Vault</Link></p>
      </main>
    </BlogLayout>
  );
}

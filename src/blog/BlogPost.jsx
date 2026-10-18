import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import BlogLayout, { C, GT, GG } from "./BlogLayout";
import { getPost, POSTS } from "./posts";
import { useSEO } from "../seo";
import { fmtDateET } from "../../shared/blog.js";
import { blogPostMeta } from "../../shared/pagemeta.js";
import { renderMarkdown } from "../../shared/markdown.js";

const fmtDate = fmtDateET;
export const MD_CSS = `.hv-md h2{font-size:24px;font-weight:800;margin:36px 0 14px;color:${C.cream};line-height:1.25}
.hv-md h3{font-size:19px;font-weight:800;margin:28px 0 10px;color:${C.cream}}
.hv-md p,.hv-md li{font-size:16px;line-height:1.8;color:${C.body}}.hv-md p{margin:0 0 18px}
.hv-md ul,.hv-md ol{margin:0 0 18px;padding-left:22px}.hv-md li{margin-bottom:8px}
.hv-md a{color:${C.gold}}.hv-md strong{color:${C.cream}}
.hv-md blockquote{border-left:3px solid ${C.gold};margin:24px 0;padding:6px 20px;font-style:italic}
.hv-md blockquote p{color:${C.cream};font-size:17px}
.hv-md img{max-width:100%;height:auto;border-radius:6px;margin:8px 0}
.hv-md code{background:${C.panel};padding:2px 5px;border-radius:3px;font-size:14px}
.hv-md pre{background:${C.deep};border:1px solid ${C.border};padding:14px;border-radius:6px;overflow-x:auto;margin:0 0 18px}
.hv-md pre code{background:none;padding:0}.hv-md hr{border:none;border-top:1px solid ${C.border};margin:28px 0}`;

function useDynamicPost(slug, skip) {
  const emb = window.__HV_DATA__?.blogPost;
  const [st, setSt] = useState(() => (emb?.dynamic && emb.slug === slug ? { slug, post: emb } : null));
  useEffect(() => {
    if (skip || st?.slug === slug) return;
    let on = true;
    fetch(`/api/blog/${encodeURIComponent(slug)}`).then((r) => (r.ok ? r.json() : { post: null }))
      .then((d) => on && setSt({ slug, post: d.post || null })).catch(() => on && setSt({ slug, post: null }));
    return () => { on = false; };
  }, [slug, skip, st]);
  if (skip) return null;
  return st?.slug === slug ? st.post : undefined;
}

function Block({ b }) {
  const txt = { fontSize: 16, lineHeight: 1.8, color: C.body };
  if (b.h2) return <h2 style={{ fontSize: 24, fontWeight: 800, margin: "36px 0 14px", color: C.cream, lineHeight: 1.25 }}>{b.h2}</h2>;
  if (b.p) return <p style={{ ...txt, margin: "0 0 18px" }}>{b.p}</p>;
  if (b.quote) return <blockquote style={{ borderLeft: `3px solid ${C.gold}`, margin: "24px 0", padding: "6px 20px", fontSize: 17, fontStyle: "italic", color: C.cream }}>{b.quote}</blockquote>;
  const li = (x, i) => <li key={i} style={{ ...txt, lineHeight: 1.7, marginBottom: 8 }}>{x}</li>;
  if (b.ul) return <ul style={{ margin: "0 0 18px", paddingLeft: 22 }}>{b.ul.map(li)}</ul>;
  if (b.ol) return <ol style={{ margin: "0 0 18px", paddingLeft: 22 }}>{b.ol.map(li)}</ol>;
  return null;
}

export default function BlogPost() {
  const { slug } = useParams();
  const staticPost = getPost(slug);
  const dyn = useDynamicPost(slug, !!staticPost);
  const post = staticPost || dyn;
  const loading = !staticPost && dyn === undefined;
  useSEO(blogPostMeta(post, slug));
  if (loading) return <BlogLayout><main style={{ maxWidth: 720, margin: "0 auto", padding: "100px 24px", color: C.muted }}>Loading…</main></BlogLayout>;
  if (!post) {
    return (
      <BlogLayout>
        <main style={{ maxWidth: 700, margin: "0 auto", padding: "100px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>Article Not Found</h1>
          <p style={{ color: C.muted, marginBottom: 24 }}>That article doesn't exist or may have moved.</p>
          <Link to="/blog" style={{ ...GT, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>← Back to the Blog</Link>
        </main>
      </BlogLayout>
    );
  }

  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <BlogLayout>
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 40px" }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 11, color: C.dim, letterSpacing: 1, marginBottom: 24 }}>
          <Link to="/" style={{ color: C.muted, textDecoration: "none" }}>Home</Link> ·{" "}
          <Link to="/blog" style={{ color: C.muted, textDecoration: "none" }}>Blog</Link>
        </nav>

        <p style={{ fontSize: 11, color: C.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
          <time dateTime={post.date}>{fmtDate(post.date)}</time> · {post.readMins} min read
        </p>
        <h1 style={{ fontSize: "clamp(28px,4.5vw,42px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 22, color: C.cream }}>{post.title}</h1>
        {post.cover && <img src={post.cover} alt={post.coverAlt || post.title} width="720" height="405" style={{ width: "100%", height: "auto", borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 32, display: "block" }} />}

        {post.dynamic
          ? <><style>{MD_CSS}</style><div className="hv-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body).html }} /></>
          : <div>{post.content.map((b, i) => <Block key={i} b={b} />)}</div>}

        {/* CTA */}
        <aside style={{ marginTop: 40, background: C.surface, border: `1px solid ${C.borderH}`, borderRadius: 8, padding: "28px 26px", textAlign: "center" }}>
          <div style={{ height: 3, background: GG, borderRadius: 3, width: 60, margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, color: C.cream }}>Ready to stop reading and start doing?</h2>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>Hustle Vault offers affordable, pay-per-use AI tools to start, run and grow a business. Turn your skills into a ready-to-sell offer with the AI Offer Builder, or check your idea with VentureCheck.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}><a href="/#start" style={{ display: "inline-block", background: GG, color: "#000", padding: "13px 26px", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Georgia,serif", borderRadius: 2, textDecoration: "none" }}>Start Your Hustle</a><a href="/apps/offer-builder?utm_source=blog&utm_medium=cta&utm_campaign=offer-builder" style={{ display: "inline-block", border: `1px solid ${C.gold}`, color: C.gold, padding: "12px 26px", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Georgia,serif", borderRadius: 2, textDecoration: "none" }}>AI Offer Builder</a></div>
        </aside>

        {/* Related */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 14, letterSpacing: 2, textTransform: "uppercase", color: C.muted, marginBottom: 18 }}>Keep Reading</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 18 }}>
            {related.map((r) => (
              <Link key={r.slug} to={`/blog/${r.slug}`} style={{ textDecoration: "none", color: "inherit", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 16 }}>
                <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{r.readMins} min read</div>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35, color: C.cream }}>{r.title}</div>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </BlogLayout>
  );
}

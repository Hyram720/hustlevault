import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BlogLayout, { C, GT } from "./BlogLayout";
import { POSTS } from "./posts";
import { useSEO } from "../seo";
import { mergePosts, fmtDateET, PER_PAGE } from "../../shared/blog.js";
import { blogIndexMeta } from "../../shared/pagemeta.js";

// Admin-written posts: from the server-rendered page data, else fetched once.
let dynCache = null;
export function useDynamicPosts() {
  const [list, setList] = useState(() => dynCache || (Array.isArray(window.__HV_DATA__?.blog) ? window.__HV_DATA__.blog : null));
  useEffect(() => {
    if (dynCache) return;
    let on = true;
    fetch("/api/blog").then((r) => (r.ok ? r.json() : { posts: [] })).then((d) => { dynCache = d.posts || []; if (on) setList(dynCache); }).catch(() => on && setList((l) => l || []));
    return () => { on = false; };
  }, []);
  return list;
}

export default function Blog() {
  const dyn = useDynamicPosts();
  const all = mergePosts(POSTS, dyn || []);
  const [q] = useSearchParams();
  const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const n = parseInt(q.get("page") || "1", 10);
  const page = n >= 1 && n <= pages ? n : 1;
  const shown = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  useSEO(blogIndexMeta(shown, page));
  return (
    <BlogLayout>
      <header style={{ maxWidth: 1000, margin: "0 auto", padding: "64px 24px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: C.gold, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>The Hustle Vault Blog</p>
        <h1 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 900, lineHeight: 1.05, marginBottom: 16 }}>
          Real Strategies for <span style={GT}>Building Income</span>
        </h1>
        <p style={{ fontSize: 16, color: C.muted, maxWidth: 620, margin: "0 auto", lineHeight: 1.6 }}>
          Practical, no-fluff guides on side hustles and growing a small business — plus AI tools to help you act on them.
        </p>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 28 }}>
          {shown.length === 0 && <p style={{ color: C.muted, textAlign: "center" }}>No posts yet — check back soon.</p>}
          {shown.map((p) => (
            <article key={p.slug} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <Link to={`/blog/${p.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}>
                {p.cover && <img src={p.cover} alt={p.coverAlt || p.title} loading="lazy" width="600" height="338" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />}
                <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  <div style={{ fontSize: 10, color: C.dim, letterSpacing: 1, textTransform: "uppercase" }}>
                    <time dateTime={p.date}>{fmtDateET(p.date)}</time> · {p.readMins} min read
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3, color: C.cream }}>{p.title}</h2>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0 }}>{p.excerpt}</p>
                  <span style={{ ...GT, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginTop: "auto", paddingTop: 8 }}>Read Article →</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
        {pages > 1 && (
          <nav aria-label="Pagination" style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 36, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>
            {page > 1 && <Link to={page - 1 > 1 ? `/blog?page=${page - 1}` : "/blog"} rel="prev" style={{ color: C.gold, textDecoration: "none" }}>← Newer posts</Link>}
            <span style={{ color: C.muted }}>Page {page} of {pages}</span>
            {page < pages && <Link to={`/blog?page=${page + 1}`} rel="next" style={{ color: C.gold, textDecoration: "none" }}>Older posts →</Link>}
          </nav>
        )}
      </main>
    </BlogLayout>
  );
}

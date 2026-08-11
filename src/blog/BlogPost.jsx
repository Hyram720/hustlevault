import { useParams, Link } from "react-router-dom";
import BlogLayout, { C, GT, GG } from "./BlogLayout";
import { getPost, POSTS } from "./posts";
import { useSEO, SITE } from "../seo";

const fmtDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

function Block({ b }) {
  if (b.h2) return <h2 style={{ fontSize: 24, fontWeight: 800, margin: "36px 0 14px", color: C.cream, lineHeight: 1.25 }}>{b.h2}</h2>;
  if (b.p) return <p style={{ fontSize: 16, lineHeight: 1.8, color: "#C8C0B0", margin: "0 0 18px" }}>{b.p}</p>;
  if (b.quote) return <blockquote style={{ borderLeft: `3px solid ${C.gold}`, margin: "24px 0", padding: "6px 20px", fontSize: 17, fontStyle: "italic", color: C.cream }}>{b.quote}</blockquote>;
  if (b.ul) return <ul style={{ margin: "0 0 18px", paddingLeft: 22 }}>{b.ul.map((li, i) => <li key={i} style={{ fontSize: 16, lineHeight: 1.7, color: "#C8C0B0", marginBottom: 8 }}>{li}</li>)}</ul>;
  if (b.ol) return <ol style={{ margin: "0 0 18px", paddingLeft: 22 }}>{b.ol.map((li, i) => <li key={i} style={{ fontSize: 16, lineHeight: 1.7, color: "#C8C0B0", marginBottom: 8 }}>{li}</li>)}</ol>;
  return null;
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPost(slug);

  useSEO({
    title: post ? `${post.title} | Hustle Vault` : "Article Not Found | Hustle Vault",
    description: post ? post.description : "The article you are looking for could not be found.",
    path: `/blog/${slug}`,
    type: "article",
    image: post?.cover,
    jsonLd: post
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BlogPosting",
              headline: post.title,
              description: post.description,
              image: post.cover,
              datePublished: post.date,
              dateModified: post.dateModified || post.date,
              author: { "@type": "Organization", name: post.author, url: SITE },
              publisher: { "@type": "Organization", name: "Hustle Vault", logo: { "@type": "ImageObject", url: SITE + "/favicon.svg" } },
              mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${post.slug}` },
              keywords: post.keywords,
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: SITE },
                { "@type": "ListItem", position: 2, name: "Blog", item: SITE + "/blog" },
                { "@type": "ListItem", position: 3, name: post.title, item: `${SITE}/blog/${post.slug}` },
              ],
            },
          ],
        }
      : null,
  });

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
          {fmtDate(post.date)} · {post.readMins} min read
        </p>
        <h1 style={{ fontSize: "clamp(28px,4.5vw,42px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 22, color: C.cream }}>{post.title}</h1>
        <img src={post.cover} alt={post.title} width="720" height="405" style={{ width: "100%", height: "auto", borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 32, display: "block" }} />

        <div>{post.content.map((b, i) => <Block key={i} b={b} />)}</div>

        {/* CTA */}
        <aside style={{ marginTop: 40, background: C.surface, border: `1px solid ${C.borderH}`, borderRadius: 8, padding: "28px 26px", textAlign: "center" }}>
          <div style={{ height: 3, background: GG, borderRadius: 3, width: 60, margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, color: C.cream }}>Ready to stop reading and start building?</h2>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>Every Hustle Vault blueprint gives you the exact step-by-step system — case studies, templates, and tools included.</p>
          <Link to="/#products" style={{ display: "inline-block", background: GG, color: "#000", padding: "13px 30px", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Georgia,serif", borderRadius: 2, textDecoration: "none" }}>Browse the Blueprints</Link>
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

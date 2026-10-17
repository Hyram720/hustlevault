import { Link } from "react-router-dom";
import BlogLayout, { C, GT } from "./BlogLayout";
import { POSTS } from "./posts";
import { useSEO, SITE } from "../seo";

const fmtDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export default function Blog() {
  useSEO({
    title: "The Hustle Vault Blog – Side Hustles, Digital Products & Money Strategies",
    description:
      "Actionable guides on side hustles, digital products, and building income streams — storage auctions, land flipping, print on demand, and more from Hustle Vault.",
    path: "/blog",
    type: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": SITE + "/blog",
      name: "The Hustle Vault Blog",
      url: SITE + "/blog",
      description:
        "Actionable guides on side hustles, digital products, and building income streams for entrepreneurs.",
      publisher: { "@type": "Organization", name: "Hustle Vault", url: SITE },
      blogPost: POSTS.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        description: p.description,
        image: p.cover,
        datePublished: p.date,
        dateModified: p.dateModified || p.date,
        author: { "@type": "Organization", name: p.author },
        url: `${SITE}/blog/${p.slug}`,
      })),
    },
  });

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
          {POSTS.map((p) => (
            <article key={p.slug} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <Link to={`/blog/${p.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}>
                <img src={p.cover} alt={p.title} loading="lazy" width="600" height="338" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  <div style={{ fontSize: 10, color: C.dim, letterSpacing: 1, textTransform: "uppercase" }}>
                    {fmtDate(p.date)} · {p.readMins} min read
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3, color: C.cream }}>{p.title}</h2>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0 }}>{p.excerpt}</p>
                  <span style={{ ...GT, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginTop: "auto", paddingTop: 8 }}>Read Article →</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </main>
    </BlogLayout>
  );
}

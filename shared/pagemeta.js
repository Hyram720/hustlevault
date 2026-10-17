// Per-page SEO data shared by the React pages (useSEO) and the server renderer.
import { absUrl } from "./blog.js";
export const SITE = "https://hustlevault.app";
export const DEFAULT_OG = "https://d8j0ntlcm91z4.cloudfront.net/user_391qpEAynVndVvvLA4RZWiHERjU/hf_20260810_204014_47196f1f-19bc-4591-8ed2-50a21cf519aa.png";
const ORG = { "@type": "Organization", "@id": SITE + "/#org", name: "Hustle Vault", url: SITE, logo: SITE + "/favicon.svg" };

export function sponsorsMeta(sponsors = []) {
  const title = "Advertise on Hustle Vault – Sponsor Slots for Your Business";
  const description = "Put your logo, business name and offer in front of Hustle Vault visitors — AI beginners starting a business and entrepreneurs growing with AI. Sponsor slots are $100/month.";
  return {
    title, description, path: "/sponsors", type: "website",
    jsonLd: { "@context": "https://schema.org", "@graph": [
      ORG,
      { "@type": "WebPage", "@id": SITE + "/sponsors", url: SITE + "/sponsors", name: title, description, isPartOf: { "@type": "WebSite", url: SITE, name: "Hustle Vault" }, publisher: { "@id": SITE + "/#org" },
        ...(sponsors.length ? { mentions: sponsors.map((s) => ({ "@type": "Organization", name: s.name, url: s.url })) } : {}) },
      { "@type": "Offer", name: "Hustle Vault sponsor slot", price: "100.00", priceCurrency: "USD", description: "Logo, business name and offer on the sponsor wall and the sitewide ticker, billed monthly.", seller: { "@id": SITE + "/#org" } },
    ] },
  };
}

export function policyMeta() {
  const title = "Ad Policy & Sponsor Terms – Hustle Vault";
  const description = "The rules for sponsored listings on Hustle Vault: what we accept, FTC disclosure, review and removal, monthly billing and cancellation, and no guaranteed results.";
  return { title, description, path: "/sponsors/policy", type: "website",
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", "@id": SITE + "/sponsors/policy", url: SITE + "/sponsors/policy", name: title, description, publisher: ORG } };
}

export function blogIndexMeta(posts, page = 1) {
  const title = page > 1 ? `The Hustle Vault Blog – Page ${page}` : "The Hustle Vault Blog – Side Hustles, Digital Products & Money Strategies";
  const description = "Actionable guides on side hustles, digital products, and building income streams — storage auctions, land flipping, print on demand, and more from Hustle Vault.";
  return { title, description, path: page > 1 ? `/blog?page=${page}` : "/blog", type: "website",
    jsonLd: { "@context": "https://schema.org", "@type": "Blog", "@id": SITE + "/blog", name: "The Hustle Vault Blog", url: SITE + "/blog", description, publisher: ORG,
      blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, description: p.description, ...(p.cover ? { image: absUrl(p.cover) } : {}), datePublished: p.date, dateModified: p.dateModified || p.date, author: { "@type": "Organization", name: p.author }, url: `${SITE}/blog/${p.slug}` })) } };
}

export function blogPostMeta(post, slug) {
  if (!post) return { title: "Article Not Found | Hustle Vault", description: "The article you are looking for could not be found.", path: `/blog/${slug}`, noindex: true };
  const image = absUrl(post.coverJpg || post.cover) || DEFAULT_OG;
  return { title: `${post.title} | Hustle Vault`, description: post.description, path: `/blog/${post.slug}`, type: "article", image,
    jsonLd: { "@context": "https://schema.org", "@graph": [
      { "@type": "BlogPosting", headline: post.title, description: post.description, image, datePublished: post.date, dateModified: post.dateModified || post.date,
        author: { "@type": "Organization", name: post.author, url: SITE }, publisher: { "@type": "Organization", name: "Hustle Vault", logo: { "@type": "ImageObject", url: SITE + "/favicon.svg" } },
        mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${post.slug}` }, ...(post.keywords ? { keywords: post.keywords } : {}) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Blog", item: SITE + "/blog" },
        { "@type": "ListItem", position: 3, name: post.title, item: `${SITE}/blog/${post.slug}` },
      ] },
    ] } };
}

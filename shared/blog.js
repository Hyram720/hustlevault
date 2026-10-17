// Blog helpers shared by the site and the server renderer.
import { readMins } from "./markdown.js";
export const PER_PAGE = 10;

export function fmtDateET(iso) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + "T12:00:00Z") : new Date(iso);
  return d.toLocaleDateString("en-US", { timeZone: "America/New_York", year: "numeric", month: "long", day: "numeric" });
}

// Admin-written post (from Blobs) -> the public shape the pages use.
export function publicPost(p) {
  return {
    slug: p.slug, title: p.title, description: p.excerpt, excerpt: p.excerpt, date: p.publishAt, dateModified: p.updatedAt,
    author: "The Hustle Vault Team", readMins: readMins(p.body), body: p.body, dynamic: true,
    cover: p.cover ? `/api/media/${p.cover}/cover.webp` : null, coverJpg: p.cover ? `/api/media/${p.cover}/cover.jpg` : null, coverAlt: p.coverAlt || p.title,
  };
}

// Static posts (src/blog/posts.js) + published admin posts, newest first.
export function mergePosts(staticPosts, dynamicPosts) {
  const seen = new Set();
  return [...dynamicPosts, ...staticPosts.map((p) => ({ ...p, coverAlt: p.title }))]
    .filter((p) => (seen.has(p.slug) ? false : seen.add(p.slug)))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export const absUrl = (u, site = "https://hustlevault.app") => (!u ? u : /^https?:\/\//.test(u) ? u : site + u);

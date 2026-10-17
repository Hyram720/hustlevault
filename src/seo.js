import { useEffect } from "react";

// ── SITE CONSTANTS ─────────────────────────────────────────────
export const SITE = "https://hustlevault.app";
export const BRAND = "Hustle Vault";
export const DEFAULT_OG =
  "https://d8j0ntlcm91z4.cloudfront.net/user_391qpEAynVndVvvLA4RZWiHERjU/hf_20260810_204014_47196f1f-19bc-4591-8ed2-50a21cf519aa.png";

// ── HEAD HELPERS ───────────────────────────────────────────────
function upsertMeta(attr, key, content) {
  if (content == null) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

// ── SEO HOOK ───────────────────────────────────────────────────
// Sets <title>, meta description, canonical, Open Graph + Twitter tags,
// and injects JSON-LD structured data for the current route.
export function useSEO({ title, description, path = "/", image, type = "website", jsonLd, noindex = false }) {
  const jsonKey = jsonLd ? JSON.stringify(jsonLd) : "";
  useEffect(() => {
    const url = SITE + path;
    const img = image || DEFAULT_OG;

    if (title) document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    upsertLink("canonical", url);

    upsertMeta("property", "og:site_name", BRAND);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:image", img);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", img);

    // Remove any JSON-LD we previously injected, then add the current one.
    document.head.querySelectorAll('script[data-seo="1"]').forEach((s) => s.remove());
    let script;
    if (jsonLd) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo", "1");
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => {
      if (script) script.remove();
    };
  }, [title, description, path, image, type, jsonKey, noindex]);
}

// Homepage SEO shared by the React page (useSEO) and the server/prerender HTML.
// No other imports, so the homepage bundle doesn't pull the blog renderer.
export const SITE = "https://hustlevault.app";

export const HOME_TITLE = "Hustle Vault – Affordable AI Tools to Start, Run & Grow Your Business";
export const HOME_DESCRIPTION = "Pay-per-use AI tools for beginners and business owners. Check your business idea and turn your skills into a ready-to-sell offer — no subscriptions, results in minutes.";
// Placeholder until a Canva 1200×630 card is added at this path. Absolute URL so scrapers don't hotlink.
export const HOME_OG_IMAGE = SITE + "/og/home.png";

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": SITE + "/#org",
        name: "Hustle Vault",
        legalName: "Sun Marketing Enterprises LLC",
        url: SITE,
        logo: SITE + "/favicon.svg",
        description: "Affordable AI tools to start, run, and grow your business.",
      },
      {
        "@type": "WebSite",
        "@id": SITE + "/#website",
        url: SITE,
        name: "Hustle Vault",
        publisher: { "@id": SITE + "/#org" },
      },
    ],
  };
}

export function homeMeta() {
  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: "/",
    type: "website",
    image: HOME_OG_IMAGE,
    jsonLd: homeJsonLd(),
  };
}

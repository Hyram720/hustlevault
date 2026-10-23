// Semantic homepage HTML for crawlers. Wording is copied from the React homepage and the app catalog.
import { APPS } from "./apps.js";
import { esc } from "./markdown.js";

const PATHS = {
  start: {
    id: "start",
    eyebrow: "New to business?",
    title: "Start Your Hustle",
    who: "For beginners who want to start a business with AI. Check whether your idea is worth your time, then turn your skills into an offer people can buy.",
  },
  grow: {
    id: "grow",
    eyebrow: "Already in business?",
    title: "Grow Your Hustle",
    who: "For entrepreneurs and salespeople who want to close more deals, follow up faster, and bring past customers back.",
  },
};

const NAV = `<nav aria-label="Main"><a href="/">Hustle Vault</a> · <a href="/#start">Start</a> · <a href="/#grow">Grow</a> · <a href="/blog">Blog</a> · <a href="/sponsors">Advertise</a> · <a href="/door-script">Door Script</a> · <a href="/my">My purchases</a></nav>`;

const FOOT = `<footer>
<a href="/#start">Start Your Hustle</a> · <a href="/#grow">Grow Your Hustle</a> · <a href="/blog">Blog</a> · <a href="/sponsors">Advertise</a> · <a href="/sponsors/policy">Ad Policy</a> · <a href="/door-script">Door Script</a> · <a href="/my">My purchases</a> · <a href="/terms.html">Terms</a> · <a href="/refund-policy.html">Refunds</a> · <a href="/privacy.html">Privacy</a> · <a href="/earnings-disclaimer.html">Earnings disclaimer</a>
<p><a href="/sponsors#inquire">Advertise: put your logo in front of our visitors →</a></p>
<p>HUSTLE VAULT · © 2026 · ALL RIGHTS RESERVED</p>
</footer>`;

function money(cents) {
  if (!Number.isInteger(cents)) return "";
  return "$" + (cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2));
}

function priceLine(app) {
  if (app.price == null) return "Coming soon";
  const amount = money(app.price);
  if (app.external) return `Free score · ${amount} full report`;
  return `${amount} one time`;
}

// Status and price can come from the live catalog (admin overrides). Names and descriptions
// stay in shared/apps.js so a stale /api/apps response cannot put old wording back.
export function resolveHomeApps(catalog) {
  const incoming = Array.isArray(catalog) && catalog.length ? catalog : APPS;
  const byId = new Map(incoming.map((a) => [a.id, a]));
  const merged = APPS.map((src) => {
    const over = byId.get(src.id);
    if (!over) return { ...src };
    const next = { ...src };
    if (over.status) next.status = over.status;
    if (Object.prototype.hasOwnProperty.call(over, "price")) next.price = over.price;
    if (over.url) next.url = over.url;
    if (typeof over.external === "boolean") next.external = over.external;
    return next;
  });
  const live = merged.filter((a) => a.status === "live");
  const soon = merged.filter((a) => {
    const src = APPS.find((s) => s.id === a.id);
    return src && src.status === "soon" && a.status !== "live";
  });
  return { live, soon };
}

function liveCard(app) {
  const href = app.external && /^https:\/\//.test(app.url || "") ? app.url : `/apps/${app.id}`;
  const label = app.external ? "Check my idea →" : `Get started, ${money(app.price)}`;
  const badge = app.external ? "Live · Free score" : "Available";
  const ext = app.external ? ' target="_blank" rel="noopener"' : "";
  return `<article>
<h3>${esc(app.name)}</h3>
<p>${esc(app.tagline)}</p>
<p>You give: ${esc(app.give)}</p>
<p>You get: ${esc(app.get)}</p>
<p>Price: ${esc(priceLine(app))}</p>
<p>How fast: ${esc(app.fast)}</p>
<p>${esc(badge)}</p>
<p><a href="${esc(href)}"${ext}>${esc(label)}</a></p>
</article>`;
}

function soonCard(app) {
  return `<article>
<h3>${esc(app.name)}</h3>
<p>Coming soon</p>
<p>${esc(app.tagline)}</p>
<p>${esc(app.get)}</p>
<p>Price: ${esc(priceLine(app))}</p>
<p>How fast: ${esc(app.fast)}</p>
</article>`;
}

function pathBlock(key, apps, card) {
  if (!apps.length) return "";
  const p = PATHS[key];
  if (!p) return apps.map(card).join("\n");
  return `<section id="${p.id}">
<p>${esc(p.eyebrow)}</p>
<h2>${esc(p.title)}</h2>
<p>${esc(p.who)}</p>
${apps.map(card).join("\n")}
</section>`;
}

export function renderHomeBody({ live = [], soon = [] } = {}) {
  const liveStart = live.filter((a) => a.path === "start");
  const liveGrow = live.filter((a) => a.path === "grow");
  const liveOther = live.filter((a) => a.path !== "start" && a.path !== "grow");
  const soonStart = soon.filter((a) => a.path === "start");
  const soonGrow = soon.filter((a) => a.path === "grow");
  const soonOther = soon.filter((a) => a.path !== "start" && a.path !== "grow");
  const how = [
    ["1", "Pick a tool", "Choose the one that fits where you are right now."],
    ["2", "Answer a few questions", "Simple questions about you and your business, no jargon."],
    ["3", "Pay once", "Secure checkout by Stripe. No account, no subscription."],
    ["4", "Get results in minutes", "Saved to a private link you can come back to anytime."],
  ].map(([n, t, d]) => `<li><strong>${esc(n)}. ${esc(t)}</strong> ${esc(d)}</li>`).join("");

  const coming = [...soonStart, ...soonGrow, ...soonOther];
  const growHeading = liveGrow.length ? "<h2>Grow Your Hustle</h2>" : '<h2 id="grow">Grow Your Hustle</h2>';
  const comingHtml = coming.length
    ? `<section id="coming-soon">
<h2>Coming soon</h2>
${soonStart.map(soonCard).join("\n")}
${soonGrow.length ? `${growHeading}<p>${esc(PATHS.grow.who)}</p>${soonGrow.map(soonCard).join("\n")}` : ""}
${soonOther.map(soonCard).join("\n")}
</section>`
    : "";

  // If a grow tool is already live, that section owns #grow. Otherwise the coming-soon block does.
  const growLive = pathBlock("grow", liveGrow, liveCard);

  return `${NAV}
<main>
<h1>Check whether your idea is worth your time.</h1>
<p>Affordable AI tools to start, run, and grow your business.</p>
<p>Pick a tool, answer a few simple questions, pay once, and get your results in minutes. No subscriptions. No tech skills needed.</p>
${pathBlock("start", liveStart, liveCard)}
${liveOther.map(liveCard).join("\n")}
${growLive}
${comingHtml}
<section>
<h2>How it works</h2>
<ol>${how}</ol>
<p>Our tools give you plans, scripts and ideas, not promises. Results depend on your effort and market; no income is guaranteed.</p>
</section>
</main>
${FOOT}`;
}

export function visibleWords(html) {
  const body = String(html).replace(/^[\s\S]*<body[^>]*>/i, " ").replace(/<\/body>[\s\S]*$/i, " ");
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  return text.split(/\s+/).filter(Boolean);
}

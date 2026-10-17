// Shared sponsor rules + copy (used by the site, the server and the tests).
export const SPONSOR_PRICE_LABEL = "Sponsor slot: $100/month";
export const SPONSOR_PRICE_ID = "price_1URbjlRTxRBnTgwhTWtuYip2"; // live Stripe price (prod_VSWncpa2ZJ79WQ)
export const LOGO_SPEC = "Logo: 300×100 px (3:1), PNG or SVG with transparent background preferred, up to 5 MB. We resize automatically.";
export const MAX_UPLOAD = 5 * 1024 * 1024;
export const POLICY_UPDATED = "2026-10-17";
export const PAST_DUE_GRACE_DAYS = 3;
export const PLACEMENTS = ["wall", "ticker", "home"];

export const COPY = {
  headline: "Market your business here",
  line: "Get your logo, name and offer in front of Hustle Vault visitors — on the sponsor wall and the scrolling ticker across the site.",
  cta: "Advertise with us",
  ctaHref: "/sponsors#inquire",
  houseBar: "Your business here — get your logo in front of Hustle Vault visitors.",
  houseBarCta: "Advertise →",
  footerLine: "Put your logo in front of our visitors",
};

// "YYYY-MM-DD" for a moment, in New York time.
export const etDay = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

// Is a sponsor allowed on the public site right now?
export function sponsorVisible(s, now = new Date()) {
  if (!s || !s.active || !s.logo) return false;
  if (s.subscriptionId) {
    const st = s.subStatus;
    if (st === "active" || st === "trialing") return true;
    if (st === "past_due") {
      const since = Date.parse(s.pastDueSince || "");
      return Number.isFinite(since) && now.getTime() - since < PAST_DUE_GRACE_DAYS * 864e5;
    }
    return false; // canceled, unpaid, incomplete, incomplete_expired, paused, unknown
  }
  if (s.endDate && /^\d{4}-\d{2}-\d{2}$/.test(s.endDate) && etDay(now) > s.endDate) return false;
  return true;
}

// Apply a fresh Stripe subscription object to a sponsor record (returns the updated copy).
export function applySubscription(s, sub, now = new Date()) {
  const next = { ...s, subscriptionId: sub.id, subStatus: sub.status, subCheckedAt: now.toISOString() };
  if (sub.customer) next.customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  if (sub.status === "past_due") next.pastDueSince = s.subStatus === "past_due" && s.pastDueSince ? s.pastDueSince : now.toISOString();
  else delete next.pastDueSince;
  return next;
}

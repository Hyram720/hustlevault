// Ties sponsors to Stripe subscriptions. We always re-fetch the subscription from Stripe
// (never trust a posted body) and store only its id, customer id and status.
import { verifiedStripe } from "./stripe.mjs";
import { baseUrl } from "./http.mjs";
import { updateSponsors, getSponsors, audit, rid, token } from "./content.mjs";
import { applySubscription, sponsorVisible, SPONSOR_PRICE_ID } from "../../shared/sponsors.js";
import { sendWelcome } from "./email.mjs";

export async function welcomeIfLive(before, after, trigger) {
  if (after && sponsorVisible(after) && !after.welcome?.sentAt && (!before || !sponsorVisible(before) || !before.welcome)) {
    return sendWelcome(after.id, { trigger });
  }
  return null;
}

// Re-fetch one subscription and apply it to every sponsor linked to it.
export async function syncSubscription(subId, trigger = "webhook") {
  if (!/^sub_[A-Za-z0-9]{8,64}$/.test(subId || "")) return null;
  const s = await verifiedStripe();
  const sub = await s.subscriptions.retrieve(subId);
  const changed = [];
  await updateSponsors((list) => {
    let any = false;
    for (let i = 0; i < list.length; i++) {
      if (list[i].subscriptionId !== subId) continue;
      const next = applySubscription(list[i], sub);
      if (next.subStatus !== list[i].subStatus || next.pastDueSince !== list[i].pastDueSince || next.customerId !== list[i].customerId) changed.push([list[i], next]);
      next.updatedAt = list[i].subStatus !== next.subStatus ? new Date().toISOString() : list[i].updatedAt;
      list[i] = next; any = true;
    }
    return any ? list : null;
  });
  for (const [b, a] of changed) {
    await audit("subscription_status", { sponsor: a.id, name: a.name, from: b.subStatus || "-", to: a.subStatus, trigger });
    await welcomeIfLive(b, a, trigger);
  }
  return { status: sub.status, sponsors: changed.length };
}

// checkout.session.completed for a sponsor subscription (session already verified by the webhook).
export async function onSponsorCheckout(session) {
  if (session.mode !== "subscription" || session.metadata?.hv_kind !== "sponsor") return false;
  const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subId) return true;
  const s = await verifiedStripe();
  const sub = await s.subscriptions.retrieve(subId);
  if (!sub.items?.data?.some((it) => it.price?.id === SPONSOR_PRICE_ID)) return true; // not our sponsor price
  let created;
  await updateSponsors((list) => {
    if (list.some((x) => x.subscriptionId === subId)) return null;
    const linkTo = session.metadata?.hv_sponsor_id && list.find((x) => x.id === session.metadata.hv_sponsor_id);
    if (linkTo) { Object.assign(linkTo, applySubscription(linkTo, sub)); created = linkTo; return list; }
    const now = new Date().toISOString();
    const name = String(session.metadata?.hv_business || session.customer_details?.name || "New sponsor").slice(0, 60);
    created = applySubscription({
      id: "sp_" + rid(9), name, offer: "", tickerLine: "", url: "", email: String(session.customer_details?.email || "").slice(0, 200).toLowerCase(),
      logo: "", active: false, ticker: true, sort: 100, source: "checkout", statsToken: token(), editToken: token(), createdAt: now, updatedAt: now,
    }, sub);
    list.push(created);
    return list;
  });
  if (created) await audit("sponsor_subscribed", { sponsor: created.id, name: created.name, subscription: subId, status: sub.status, note: "Needs review: add logo/offer/link and switch Active on." });
  return true;
}

// Daily backstop: re-check every linked subscription.
export async function syncAll() {
  const ids = [...new Set((await getSponsors()).list.map((x) => x.subscriptionId).filter(Boolean))];
  const out = [];
  for (const id of ids) {
    try { out.push({ id, ...(await syncSubscription(id, "daily")) }); } catch (e) { out.push({ id, error: e.message }); }
  }
  return out;
}

export async function createSponsorCheckout(req, { business, email: em, sponsorId }) {
  const s = await verifiedStripe();
  const base = baseUrl(req);
  return s.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: SPONSOR_PRICE_ID, quantity: 1 }],
    customer_email: em,
    success_url: `${base}/sponsors?subscribed=1`,
    cancel_url: `${base}/sponsors?canceled=1#inquire`,
    metadata: { hv_kind: "sponsor", hv_business: business, ...(sponsorId ? { hv_sponsor_id: sponsorId } : {}) },
    subscription_data: { metadata: { hv_kind: "sponsor", hv_business: business } },
    allow_promotion_codes: false,
  });
}


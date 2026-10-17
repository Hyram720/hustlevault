// Creates a Stripe Checkout Session for a Hustle Vault AI app (server-side; price comes from our catalog).
import { json, handle, readJson, HttpError, newId, cleanText, baseUrl, ipHash } from "../lib/http.mjs";
import { purchases, logEvent, rateLimit } from "../lib/store.mjs";
import { getApp, canBuy, hasPreview, STRIPE_PRODUCTS } from "../lib/apps.mjs";
import { validateCoachInputs } from "../lib/coach.mjs";
import { validateForm, hasGenerator } from "../lib/generators.mjs";
import { isFlagged } from "../lib/ai.mjs";
import { verifiedStripe } from "../lib/stripe.mjs";

const validatorFor = (id) => (id === "objection-coach" ? validateCoachInputs : hasGenerator(id) ? (raw) => validateForm(id, raw) : null);

function cleanUtm(u = {}) {
  const o = {};
  for (const k of ["source", "medium", "campaign", "content", "term", "ref", "landing"]) {
    const v = cleanText(u?.[k], k === "landing" ? 120 : 80);
    if (v) o[k] = v;
  }
  return o;
}

export default handle(async (req, context) => {
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
  if (!(await rateLimit("checkout", ipHash(context, req), 15, 600))) throw new HttpError(429, "Too many tries. Please wait a few minutes.");
  const body = await readJson(req, 6000);
  const app = await getApp(String(body.appId || ""));
  const preview = typeof body.preview === "string" ? body.preview.slice(0, 100) : "";
  if (!app || app.status === "hidden" && !hasPreview(preview)) throw new HttpError(404, "App not found");
  if (!canBuy(app, preview)) throw new HttpError(403, "This app is coming soon and can't be bought yet.");
  const validate = validatorFor(app.id);
  const product = STRIPE_PRODUCTS[app.id];
  if (!validate || !product) throw new HttpError(403, "This app is coming soon and can't be bought yet.");
  const inputs = validate(body.inputs || {});

  if (await isFlagged(Object.values(inputs).join("\n"))) {
    throw new HttpError(400, "We can't help with that request. Please change your answers and try again.");
  }

  const id = newId();
  const utm = cleanUtm(body.utm);
  const isPreview = app.status !== "live";
  const base = baseUrl(req);
  const meta = {
    hv_purchase_id: id, hv_app: app.id,
    ...(utm.source ? { utm_source: utm.source } : {}), ...(utm.medium ? { utm_medium: utm.medium } : {}),
    ...(utm.campaign ? { utm_campaign: utm.campaign } : {}), ...(isPreview ? { hv_preview: "1" } : {}),
  };

  const record = {
    id, appId: app.id, appName: app.name, amount: app.price, currency: "usd", status: "pending",
    inputs, utm, preview: isPreview, createdAt: new Date().toISOString(),
  };
  await purchases().setJSON(id, record, { onlyIfNew: true });

  let session;
  try {
    session = await (await verifiedStripe()).checkout.sessions.create({
      mode: "payment",
      line_items: [{ quantity: 1, price_data: { currency: "usd", product, unit_amount: app.price } }],
      client_reference_id: id,
      metadata: meta,
      payment_intent_data: { metadata: meta, description: `Hustle Vault — ${app.name}` },
      success_url: `${base}/my/${id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/apps/${app.id}?canceled=1${isPreview && preview ? `&preview=${encodeURIComponent(preview)}` : ""}`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      submit_type: "pay",
    }, { idempotencyKey: "hv-checkout-" + id });
  } catch (err) {
    console.error("stripe session create failed", err?.message);
    await purchases().setJSON(id, { ...record, status: "checkout_error" });
    throw new HttpError(502, "We couldn't open checkout. Please try again in a minute.");
  }

  await purchases().setJSON(id, { ...record, sessionId: session.id });
  await logEvent(isPreview ? "checkout_start_test" : "checkout_start", { app: app.id, source: utm.source, campaign: utm.campaign, amount: app.price });
  return json({ url: session.url, purchaseId: id });
});

export const config = {
  path: "/api/apps/checkout",
  method: "POST",
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] },
};

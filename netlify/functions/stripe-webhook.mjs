// Stripe webhook: signature-verified payment confirmation, fulfillment, failures and refunds.
import { json } from "../lib/http.mjs";
import { claimOnce, logEvent } from "../lib/store.mjs";
import { stripe, VENTURECHECK_PAYMENT_LINK } from "../lib/stripe.mjs";
import { markPaid, generate, setStatusIf, applyRefund } from "../lib/fulfill.mjs";
import { PURCHASE_ID_RE } from "../lib/http.mjs";

async function purchaseIdForCharge(charge) {
  if (charge.metadata?.hv_purchase_id) return charge.metadata.hv_purchase_id; // event is signature-verified
  const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!pi) return null;
  const intent = await stripe().paymentIntents.retrieve(pi);
  if (intent.metadata?.hv_purchase_id) return intent.metadata.hv_purchase_id;
  const list = await stripe().checkout.sessions.list({ payment_intent: pi, limit: 1 });
  return list.data[0]?.metadata?.hv_purchase_id || null;
}

export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const secret = process.env.HV_STRIPE_WEBHOOK_SECRET;
  if (!secret) return json({ error: "Webhook not configured" }, 503);
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.warn("Webhook signature check failed");
    return json({ error: "Invalid signature" }, 400);
  }

  try {
    const obj = event.data.object;
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        if (obj.payment_link === VENTURECHECK_PAYMENT_LINK && obj.payment_status === "paid") {
          if (await claimOnce("vc/" + obj.id)) await logEvent("vc_purchase", { app: "venturecheck", amount: obj.amount_total || 0 });
          break;
        }
        const id = obj.metadata?.hv_purchase_id;
        if (!id || !PURCHASE_ID_RE.test(id)) break; // not ours (other apps share this Stripe account)
        if (obj.payment_status === "paid") {
          await markPaid(id, obj);
          const work = generate(id).catch((e) => console.error("bg generate", e?.message));
          if (context?.waitUntil) context.waitUntil(work); else await work;
        } else {
          await setStatusIf(id, ["pending"], "processing");
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const id = obj.metadata?.hv_purchase_id;
        if (id && PURCHASE_ID_RE.test(id)) await setStatusIf(id, ["pending", "processing"], "failed");
        break;
      }
      case "checkout.session.expired": {
        const id = obj.metadata?.hv_purchase_id;
        if (id && PURCHASE_ID_RE.test(id)) await setStatusIf(id, ["pending"], "expired");
        break;
      }
      case "charge.refunded": {
        const id = await purchaseIdForCharge(obj);
        if (id && PURCHASE_ID_RE.test(id)) await applyRefund(id, obj);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handling error", event.type, err?.message);
    return json({ error: "Handler error" }, 500); // Stripe will retry; handlers are idempotent
  }
  return json({ received: true });
};

export const config = { path: "/api/stripe/webhook", method: "POST" };

// Payment confirmation, idempotent fulfillment, refunds.
import { getPurchase, updatePurchase, claimOnce, logEvent } from "./store.mjs";
import { addUsage } from "./ai.mjs";
import { generateCoachScript, startPractice } from "./coach.mjs";

const GEN_STALE_MS = 75_000;
const MAX_GEN_ATTEMPTS = 4;

// Mark a purchase paid from a verified Stripe Checkout Session. Safe to call many times.
export async function markPaid(purchaseId, session) {
  if (!session || session.metadata?.hv_purchase_id !== purchaseId) return null;
  if (session.payment_status !== "paid") return null;
  const updated = await updatePurchase(purchaseId, (p) => {
    if (p.sessionId && p.sessionId !== session.id) return null; // session must be the one we created
    if (p.amount && session.amount_total < p.amount) return null; // paid less than the price we set
    if (["paid", "refunded", "partially_refunded"].includes(p.status)) return null;
    p.status = "paid";
    p.paidAt = new Date().toISOString();
    p.sessionId = session.id;
    p.paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null;
    p.amountPaid = session.amount_total;
    p.livemode = session.livemode;
    p.email = (session.customer_details?.email || "").toLowerCase().slice(0, 200) || null;
    return p;
  });
  if (updated && (await claimOnce("paid/" + purchaseId))) {
    await logEvent(session.livemode ? "purchase" : "purchase_test", {
      app: updated.appId, source: updated.utm?.source, campaign: updated.utm?.campaign,
      amount: updated.amountPaid || 0, extra: purchaseId,
    });
  }
  return updated;
}

// Generate the paid result once. Concurrent callers wait/no-op via a lock stored on the purchase.
export async function generate(purchaseId) {
  let claimed = false;
  const p0 = await updatePurchase(purchaseId, (p) => {
    if (p.status !== "paid" || p.result) return null;
    const g = p.gen || { attempts: 0 };
    if (g.state === "running" && Date.now() - Date.parse(g.startedAt) < GEN_STALE_MS) return null;
    if ((g.attempts || 0) >= MAX_GEN_ATTEMPTS) return null;
    p.gen = { state: "running", startedAt: new Date().toISOString(), attempts: (g.attempts || 0) + 1 };
    claimed = true;
    return p;
  });
  if (!claimed || !p0) return p0;
  try {
    let out, usage;
    if (p0.appId === "objection-coach") ({ out, usage } = await generateCoachScript(p0.inputs));
    else throw new Error("No generator for app " + p0.appId);
    return await updatePurchase(purchaseId, (p) => {
      if (p.result) return null;
      p.result = out;
      if (p.appId === "objection-coach" && !p.practice) p.practice = startPractice(p.inputs);
      addUsage(p, usage);
      p.gen = { ...p.gen, state: "done", doneAt: new Date().toISOString() };
      return p;
    });
  } catch (err) {
    console.error("generate failed", purchaseId, err?.message);
    return await updatePurchase(purchaseId, (p) => {
      p.gen = { ...p.gen, state: "failed", error: "generation_failed" };
      return p;
    });
  }
}

export async function setStatusIf(purchaseId, fromStatuses, status) {
  return updatePurchase(purchaseId, (p) => {
    if (!fromStatuses.includes(p.status)) return null;
    p.status = status;
    return p;
  });
}

export async function applyRefund(purchaseId, charge) {
  const full = charge.refunded || charge.amount_refunded >= charge.amount;
  const updated = await updatePurchase(purchaseId, (p) => {
    const status = full ? "refunded" : "partially_refunded";
    if (p.status === status && p.amountRefunded === charge.amount_refunded) return null;
    p.status = status;
    p.amountRefunded = charge.amount_refunded;
    p.refundedAt = new Date().toISOString();
    return p;
  });
  if (updated && (await claimOnce(`refund/${charge.id}/${charge.amount_refunded}`))) {
    await logEvent(charge.livemode ? "refund" : "refund_test", { app: updated.appId, source: updated.utm?.source, campaign: updated.utm?.campaign, amount: charge.amount_refunded, extra: purchaseId });
  }
  return updated;
}

export { getPurchase };

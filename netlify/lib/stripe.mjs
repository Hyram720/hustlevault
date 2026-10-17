import Stripe from "stripe";

// Only ever talk to Fred's live Stripe account (Sun Marketing, LLC).
export const EXPECTED_ACCOUNT = "acct_1SXuWsRTxRBnTgwh";
const valid = (k) => typeof k === "string" && /^(sk|rk)_(live|test)_[A-Za-z0-9]{20,}$/.test(k);

let client, source, checked;
function pick() {
  if (valid(process.env.HV_STRIPE_SECRET_KEY)) return ["HV_STRIPE_SECRET_KEY", process.env.HV_STRIPE_SECRET_KEY];
  if (valid(process.env.STRIPE_SECRET_KEY)) return ["STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY];
  return [null, null];
}
export function stripe() {
  if (!client) {
    const [src, k] = pick();
    if (!k) throw new Error("Stripe not configured");
    // Local test runs can point the SDK at a mock Stripe (never honored in production).
    const host = process.env.HV_ALLOW_LOCALHOST === "1" && process.env.HV_STRIPE_API_HOST;
    client = host ? new Stripe(k, { host, port: +process.env.HV_STRIPE_API_PORT || 80, protocol: "http" }) : new Stripe(k);
    source = src;
  }
  return client;
}
// Verifies the key belongs to the expected account before we take money with it.
export async function verifiedStripe() {
  const s = stripe();
  if (checked === undefined) {
    try { const a = await s.accounts.retrieve(); checked = a.id === EXPECTED_ACCOUNT; }
    catch { checked = undefined; throw new Error("Stripe account check failed"); }
  }
  if (!checked) throw new Error("Stripe key is for an unexpected account");
  return s;
}
export const stripeSource = () => { try { stripe(); } catch {} return source || "none"; };

// VentureCheck runs on its own Stripe Payment Link in the same account; we only count its sales.
export const VENTURECHECK_PAYMENT_LINK = "plink_1URE95RTxRBnTgwhbaaUOKVe";

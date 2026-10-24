// Legacy ebook checkout. Every price is decided here on the server:
//  - normal price for the main product,
//  - the bump price only for a different product added as an order bump,
//  - the upsell price only for the one product offered after a verified, paid ebook purchase
//    (passed as `upsellOf`: that purchase's Checkout Session id), once per original purchase.
import { getProduct, UPSELL_FOR, legacyStripe, paidEbookSession, SESSION_RE } from "../lib/ebooks.mjs";
import { meta, rateLimit } from "../lib/store.mjs";
import { ipHash } from "../lib/http.mjs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

// One upsell per original purchase. Returns { prev } (existing upsell session) or { reserved: true }.
async function reserveUpsell(stripe, sourceId) {
  const key = "upsell/" + sourceId;
  const rec = await meta().get(key, { type: "json" });
  if (!rec) {
    const { modified } = await meta().setJSON(key, { pendingAt: Date.now() }, { onlyIfNew: true });
    return modified ? { reserved: true } : { busy: true };
  }
  if (!rec.sessionId) return Date.now() - (rec.pendingAt || 0) < 60_000 ? { busy: true } : { reserved: true };
  let prev = null;
  try { prev = await stripe.checkout.sessions.retrieve(rec.sessionId); } catch {}
  if (prev && prev.status !== "expired") return { prev };
  return { reserved: true }; // the earlier upsell checkout expired unpaid
}

export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const stripe = legacyStripe();
  if (!stripe) return json({ error: "Checkout is unavailable right now." }, 503);
  const CLIENT_URL = process.env.URL || "https://hustlevault.app";

  try {
    if (!(await rateLimit("ebook-checkout", ipHash(context, req), 15, 600))) return json({ error: "Too many tries. Please wait a few minutes." }, 429);
    const text = await req.text();
    if (text.length > 2000) return json({ error: "Request too large" }, 413);
    let body; try { body = JSON.parse(text || "{}"); } catch { return json({ error: "Invalid request" }, 400); }
    const productId = String(body.productId ?? "");
    const product = getProduct(productId);
    if (!product) return json({ error: "Invalid product ID" }, 400);

    // Upsell: only with a verified paid purchase whose offer is exactly this product.
    let upsellOf = null;
    if (body.isUpsell || body.upsellOf) {
      const src = String(body.upsellOf || "");
      if (!SESSION_RE.test(src)) return json({ error: "This offer isn't available." }, 403);
      const paid = await paidEbookSession(stripe, src);
      if (!paid.ok || paid.session.metadata?.hv_upsell_of) return json({ error: "This offer isn't available." }, 403);
      if (UPSELL_FOR[paid.ids[0]] !== String(product.id) || paid.ids.includes(String(product.id))) return json({ error: "This offer isn't available." }, 403);
      if (!(product.upsellPrice > 0)) return json({ error: "This offer isn't available." }, 403);
      const r = await reserveUpsell(stripe, src);
      if (r.busy) return json({ error: "Please wait a moment and try again." }, 409);
      if (r.prev?.status === "open" && r.prev.url) return json({ url: r.prev.url, sessionId: r.prev.id });
      if (r.prev) return json({ error: "This offer was already used." }, 409);
      upsellOf = src;
    }

    const unitAmount = upsellOf ? product.upsellPrice : product.price;
    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: { name: product.name, description: product.description },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ];

    const productIds = [String(product.id)];
    const productNames = [product.name];

    // Order bump: a different single product at its bump price (not with upsells).
    if (body.bumpId != null && body.bumpId !== "" && !upsellOf) {
      const bump = getProduct(String(body.bumpId));
      if (bump && String(bump.id) !== String(product.id)) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: { name: `BUMP: ${bump.name}`, description: "Special one-time offer" },
            unit_amount: bump.bumpPrice || bump.price,
          },
          quantity: 1,
        });
        productIds.push(String(bump.id));
        productNames.push(bump.name);
      }
    }

    const sessionParams = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}${upsellOf ? "&upsell=1" : ""}`,
      cancel_url: CLIENT_URL,
      metadata: {
        product_ids: productIds.join(","),
        product_names: productNames.join(", "),
        hv_kind: "ebook",
        ...(upsellOf ? { hv_upsell_of: upsellOf } : {}),
      },
    };

    const isMultiProduct = !upsellOf && (productIds.length > 1 || String(productId).startsWith("B"));
    if (isMultiProduct) {
      let coupon;
      try {
        coupon = await stripe.coupons.retrieve("VAULT20");
      } catch {
        coupon = await stripe.coupons.create({ id: "VAULT20", percent_off: 20, duration: "once", name: "Vault Bundle Discount" });
      }
      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    if (upsellOf) await meta().setJSON("upsell/" + upsellOf, { sessionId: session.id, at: new Date().toISOString() });
    return json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("ebook checkout failed", err?.message);
    return json({ error: "We couldn't open checkout. Please try again in a minute." }, 500);
  }
};

export const config = { path: "/api/create-checkout-session" };

import Stripe from "stripe";
import products from "../../server/data/products.json";
const _build = "2.0.1";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return json({ error: "Stripe not configured — key missing" }, 503);

  const stripe = new Stripe(stripeKey);
  const CLIENT_URL = process.env.URL || "https://hustlevault.app";

  try {
    const { productId, bumpId, isUpsell } = await req.json();
    const product = products[productId];

    if (!product) return json({ error: "Invalid product ID" }, 400);

    const unitAmount = isUpsell
      ? product.upsellPrice || product.price
      : product.price;

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

    if (bumpId) {
      const bump = products[bumpId];
      if (bump) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `BUMP: ${bump.name}`,
              description: "Special one-time offer",
            },
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
      success_url: `${CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: CLIENT_URL,
      metadata: {
        product_ids: productIds.join(","),
        product_names: productNames.join(", "),
      },
    };

    const isMultiProduct =
      productIds.length > 1 || String(productId).startsWith("B");

    if (isMultiProduct) {
      let coupon;
      try {
        coupon = await stripe.coupons.retrieve("VAULT20");
      } catch {
        coupon = await stripe.coupons.create({
          id: "VAULT20",
          percent_off: 20,
          duration: "once",
          name: "Vault Bundle Discount",
        });
      }
      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return json({ url: session.url, sessionId: session.id });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const config = { path: "/api/create-checkout-session" };

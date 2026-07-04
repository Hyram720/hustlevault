import Stripe from "stripe";
import { PRODUCTS } from "./products-data.mjs";

export default async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const stripe = new Stripe(stripeKey);

  try {
    const { productId, bumpId, isUpsell } = await req.json();
    const product = PRODUCTS[productId];
    if (!product) return Response.json({ error: "Invalid product ID" }, { status: 400 });

    const clientUrl = process.env.CLIENT_URL || new URL(req.url).origin;
    const unitAmount = isUpsell ? (product.upsellPrice || product.price) : product.price;

    const lineItems = [{
      price_data: {
        currency: "usd",
        product_data: { name: product.name, description: product.description },
        unit_amount: unitAmount,
      },
      quantity: 1,
    }];

    const productIds = [String(product.id)];
    const productNames = [product.name];

    if (bumpId) {
      const bumpProduct = PRODUCTS[bumpId];
      if (bumpProduct) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: { name: `BUMP: ${bumpProduct.name}`, description: "Special one-time offer" },
            unit_amount: bumpProduct.bumpPrice || bumpProduct.price,
          },
          quantity: 1,
        });
        productIds.push(String(bumpProduct.id));
        productNames.push(bumpProduct.name);
      }
    }

    const sessionParams = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cancel`,
      metadata: {
        product_ids: productIds.join(","),
        product_names: productNames.join(", "),
      },
    };

    // 20% discount for bundles or multi-product carts (order bump added)
    const isMultiProduct = productIds.length > 1 || String(productId).startsWith("B");
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
    return Response.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: "/api/create-checkout-session",
};

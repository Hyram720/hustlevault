import Stripe from "stripe";
import { PRODUCTS } from "./products-data.mjs";

export default async (req, context) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const stripe = new Stripe(stripeKey);

  try {
    const sessionId = context.params?.sessionId;
    if (!sessionId) return Response.json({ error: "Missing session ID" }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
    if (session.payment_status !== "paid") {
      return Response.json({ error: "Not paid" }, { status: 400 });
    }

    const productIds = (session.metadata?.product_ids || "").split(",");
    const contents = productIds.map((id) => PRODUCTS[id]?.digitalContent).filter(Boolean);

    let digitalContent = null;
    if (contents.length > 0) {
      digitalContent = {
        title: contents.length > 1 ? "Your Multi-Product Access" : contents[0].title,
        files: contents.flatMap((c) => c.files),
        accessNote: contents.length > 1 ? "You now have access to all your purchased blueprints below." : contents[0].accessNote,
        bonus: contents.map((c) => c.bonus).filter(Boolean).join(" | "),
      };
    }

    return Response.json({
      verified: true,
      productId: productIds[0],
      digitalContent,
      customer: session.customer_details,
      amountTotal: session.amount_total,
      lineItems: session.line_items?.data?.map((item) => ({
        name: item.description || item.price.product.name,
        amount: item.amount_total,
      })),
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: "/api/verify-session/:sessionId",
};

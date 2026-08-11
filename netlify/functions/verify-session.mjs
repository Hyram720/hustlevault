import Stripe from "stripe";
import products from "../../server/data/products.json";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return json({ error: "Stripe not configured" }, 503);

  const stripe = new Stripe(stripeKey);

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/");
    const sessionId = parts[parts.length - 1];

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    if (session.payment_status !== "paid") {
      return json({ error: "Not paid" }, 400);
    }

    const productIds = (session.metadata?.product_ids || "").split(",");
    const contents = productIds
      .map((id) => products[id]?.digitalContent)
      .filter(Boolean);

    let digitalContent = null;
    if (contents.length > 0) {
      digitalContent = {
        title:
          contents.length > 1
            ? "Your Multi-Product Access"
            : contents[0].title,
        files: contents.flatMap((c) => c.files),
        accessNote:
          contents.length > 1
            ? "You now have access to all your purchased blueprints below."
            : contents[0].accessNote,
        bonus: contents
          .map((c) => c.bonus)
          .filter(Boolean)
          .join(" | "),
      };
    }

    return json({
      verified: true,
      productId: productIds[0],
      digitalContent,
      customer: session.customer_details,
      amountTotal: session.amount_total,
      lineItems: session.line_items?.data?.map((item) => ({
        name: item.description || item.price?.product?.name,
        amount: item.amount_total,
      })),
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const config = { path: "/api/verify-session/:sessionId" };

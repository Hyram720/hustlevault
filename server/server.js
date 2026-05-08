import dotenv from "dotenv";
import express from "express";
import Stripe from "stripe";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import adminRoutes from "./admin-routes.js";
import store from "./data-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ── Config ──────────────────────────────────────────────────
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
let stripe = null;

if (STRIPE_KEY && !STRIPE_KEY.includes("REPLACE")) {
  stripe = new Stripe(STRIPE_KEY);
} else {
  console.warn("\n⚠️  No valid STRIPE_SECRET_KEY found in .env");
}

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();

function requireStripe(req, res, next) {
  if (!stripe) {
    return res.status(503).json({ error: "Stripe not configured" });
  }
  next();
}

app.use(cors({ origin: CLIENT_URL }));

app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      if (process.env.STRIPE_WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } else {
        event = JSON.parse(req.body.toString());
      }
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      store.addOrder({
        sessionId: session.id,
        customerEmail: session.customer_details?.email || "N/A",
        customerName: session.customer_details?.name || "N/A",
        amount: session.amount_total || 0,
        currency: session.currency || "usd",
        productNames: session.metadata?.product_names || "Unknown",
        productIds: session.metadata?.product_ids || "0",
        status: "completed",
        date: new Date().toISOString(),
      });
    }
    res.json({ received: true });
  }
);

app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use("/api/admin", adminRoutes);

adminRoutes._reloadStripe = (newKey) => {
  stripe = new Stripe(newKey);
};

// ── Create Checkout Session ─────────────────────────────────
app.post("/api/create-checkout-session", requireStripe, async (req, res) => {
  try {
    const { productId, bumpId, isUpsell, couponCode } = req.body;
    const products = store.getProducts();
    const product = products[productId];

    if (!product) return res.status(400).json({ error: "Invalid product ID" });

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
      const bumpProduct = products[bumpId];
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
      success_url: `${CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/cancel`,
      metadata: {
        product_ids: productIds.join(","),
        product_names: productNames.join(", "),
      },
    };

    // Automatically apply 20% discount if more than one product (Order Bump) or if it's a pre-defined Bundle
    const isMultiProduct = productIds.length > 1 || String(productId).startsWith("B");

    if (isMultiProduct) {
      let coupon;
      try { 
        coupon = await stripe.coupons.retrieve("VAULT20"); 
      } catch (err) {
        coupon = await stripe.coupons.create({ 
          id: "VAULT20", 
          percent_off: 20, 
          duration: "once", 
          name: "Vault Bundle Discount" 
        });
      }
      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Verify Session ──────────────────────────────────────────
app.get("/api/verify-session/:sessionId", requireStripe, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, { expand: ["line_items"] });
    if (session.payment_status !== "paid") return res.status(400).json({ error: "Not paid" });

    const productIds = (session.metadata?.product_ids || "").split(",");
    const contents = productIds.map(id => store.getProduct(id)?.digitalContent).filter(Boolean);

    let digitalContent = null;
    if (contents.length > 0) {
      digitalContent = {
        title: contents.length > 1 ? "Your Multi-Product Access" : contents[0].title,
        files: contents.flatMap(c => c.files),
        accessNote: contents.length > 1 ? "You now have access to all your purchased blueprints below." : contents[0].accessNote,
        bonus: contents.map(c => c.bonus).filter(Boolean).join(" | "),
      };
    }

    res.json({
      verified: true,
      productId: productIds[0],
      digitalContent,
      customer: session.customer_details,
      amountTotal: session.amount_total,
      lineItems: session.line_items?.data?.map(item => ({
        name: item.description || item.price.product.name,
        amount: item.amount_total,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🔒 Hustle Vault API running on http://localhost:${PORT}`);
});

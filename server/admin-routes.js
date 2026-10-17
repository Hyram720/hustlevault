import { Router } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import store from "./data-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, "../.env");

const router = Router();

// ── Token generation & validation ───────────────────────────
const activeTokens = new Map(); // token → { username, createdAt }

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  const token = auth.slice(7);
  const session = activeTokens.get(token);
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
  req.admin = session;
  next();
}

// ── LOGIN ───────────────────────────────────────────────────
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  // Legacy Express admin (not deployed). No default credentials: refuse unless both are set.
  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;
  if (!validUser || !validPass || validPass.length < 16) {
    return res.status(503).json({ error: "Admin login disabled" });
  }

  if (username !== validUser || password !== validPass) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken();
  activeTokens.set(token, {
    username,
    createdAt: new Date().toISOString(),
  });

  // Auto-expire after 24 hours
  setTimeout(() => activeTokens.delete(token), 24 * 60 * 60 * 1000);

  res.json({ token, username, message: "Login successful" });
});

// ── LOGOUT ──────────────────────────────────────────────────
router.post("/logout", requireAdmin, (req, res) => {
  const token = req.headers.authorization.slice(7);
  activeTokens.delete(token);
  res.json({ message: "Logged out" });
});

// ── VERIFY SESSION ──────────────────────────────────────────
router.get("/verify", requireAdmin, (req, res) => {
  res.json({ valid: true, username: req.admin.username });
});

// ── DASHBOARD STATS ─────────────────────────────────────────
router.get("/dashboard", requireAdmin, (req, res) => {
  const orders = store.getOrders();
  const products = store.getProducts();

  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalOrders = orders.length;
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Top products by order count
  const productCounts = {};
  orders.forEach((o) => {
    const name = o.productName || "Unknown";
    productCounts[name] = (productCounts[name] || 0) + 1;
  });
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Revenue by day (last 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const dailyRevenue = {};
  orders
    .filter((o) => new Date(o.date).getTime() > thirtyDaysAgo)
    .forEach((o) => {
      const day = o.date?.split("T")[0] || "unknown";
      dailyRevenue[day] = (dailyRevenue[day] || 0) + (o.amount || 0);
    });

  // Recent orders
  const recentOrders = orders.slice(0, 10);

  res.json({
    totalRevenue,
    totalOrders,
    avgOrder,
    totalProducts: Object.keys(products).length,
    topProducts,
    dailyRevenue,
    recentOrders,
  });
});

// ── ORDERS ──────────────────────────────────────────────────
router.get("/orders", requireAdmin, (req, res) => {
  const orders = store.getOrders();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  const start = (page - 1) * limit;

  res.json({
    orders: orders.slice(start, start + limit),
    total: orders.length,
    page,
    pages: Math.ceil(orders.length / limit),
  });
});

// ── PRODUCTS ────────────────────────────────────────────────
router.get("/products", requireAdmin, (req, res) => {
  const products = store.getProducts();
  res.json({ products: Object.values(products) });
});

router.post("/products", requireAdmin, (req, res) => {
  const { name, description, price } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: "Name and price are required" });
  }
  const product = store.addProduct({
    name,
    description: description || "",
    price: Math.round(Number(price)),
  });
  res.json({ product, message: "Product created" });
});

router.put("/products/:id", requireAdmin, (req, res) => {
  const { name, description, price, digitalContent, emoji } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = Math.round(Number(price));
  if (digitalContent !== undefined) updates.digitalContent = digitalContent;
  if (emoji !== undefined) updates.emoji = emoji;

  const product = store.updateProduct(req.params.id, updates);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ product, message: "Product updated" });
});

router.delete("/products/:id", requireAdmin, (req, res) => {
  const success = store.deleteProduct(req.params.id);
  if (!success) return res.status(404).json({ error: "Product not found" });
  res.json({ message: "Product deleted" });
});

// ── SETTINGS ────────────────────────────────────────────────
router.put("/settings/password", requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const validPass = process.env.ADMIN_PASSWORD;

  if (!validPass || currentPassword !== validPass || !newPassword || newPassword.length < 16) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  // In production, you'd update the .env or a DB.
  // For now, update the in-memory variable.
  process.env.ADMIN_PASSWORD = newPassword;
  res.json({ message: "Password updated (restart server to reset)" });
});

// ── STRIPE CONFIGURATION ────────────────────────────────────
function maskKey(key) {
  if (!key || key.includes("REPLACE")) return null;
  return key.slice(0, 8) + "••••••••" + key.slice(-4);
}

function readEnvFile() {
  try { return fs.readFileSync(ENV_PATH, "utf-8"); } catch { return ""; }
}

function writeEnvKey(envContent, key, value) {
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(envContent)) {
    return envContent.replace(regex, `${key}=${value}`);
  }
  return envContent + `\n${key}=${value}`;
}

// GET Stripe status + masked keys
router.get("/settings/stripe", requireAdmin, (req, res) => {
  const sk = process.env.STRIPE_SECRET_KEY;
  const pk = process.env.STRIPE_PUBLISHABLE_KEY;
  const wh = process.env.STRIPE_WEBHOOK_SECRET;

  const isActive = sk && !sk.includes("REPLACE");

  res.json({
    active: isActive,
    secretKey: maskKey(sk),
    publishableKey: maskKey(pk),
    webhookSecret: maskKey(wh),
    mode: isActive ? (sk.startsWith("sk_live") ? "live" : "test") : null,
  });
});

// PUT — save Stripe keys + hot-reload
router.put("/settings/stripe", requireAdmin, async (req, res) => {
  const { secretKey, publishableKey, webhookSecret } = req.body;

  if (!secretKey) {
    return res.status(400).json({ error: "Secret key is required" });
  }

  // Validate the key against Stripe API
  try {
    const testStripe = new Stripe(secretKey);
    await testStripe.balance.retrieve();
  } catch (err) {
    return res.status(400).json({
      error: `Invalid Stripe key: ${err.message}`,
    });
  }

  // Write keys to .env file
  let env = readEnvFile();
  env = writeEnvKey(env, "STRIPE_SECRET_KEY", secretKey);
  if (publishableKey) env = writeEnvKey(env, "STRIPE_PUBLISHABLE_KEY", publishableKey);
  if (webhookSecret) env = writeEnvKey(env, "STRIPE_WEBHOOK_SECRET", webhookSecret);
  fs.writeFileSync(ENV_PATH, env);

  // Update process.env
  process.env.STRIPE_SECRET_KEY = secretKey;
  if (publishableKey) process.env.STRIPE_PUBLISHABLE_KEY = publishableKey;
  if (webhookSecret) process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;

  // Hot-reload: update the global stripe instance in the app
  if (router._reloadStripe) {
    router._reloadStripe(secretKey);
  }

  const mode = secretKey.startsWith("sk_live") ? "LIVE" : "TEST";
  res.json({
    message: `Stripe ${mode} keys activated! Payments are now enabled.`,
    active: true,
    mode: mode.toLowerCase(),
  });
});

export default router;

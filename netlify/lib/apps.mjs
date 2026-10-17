import { APPS } from "../../shared/apps.js";
import { meta } from "./store.mjs";
import crypto from "node:crypto";
import { safeEqual } from "./http.mjs";

// Stripe product per app (created in the live Stripe account, metadata.app = hustlevault).
export const STRIPE_PRODUCTS = {
  "objection-coach": "prod_VSGSUbGqCfm8vQ",
  "first-sale-blueprint": "prod_VSGlgh02xKDGl1",
  "offer-builder": "prod_VSGlVkU8cmpzoZ",
  "lead-follow-up": "prod_VSGlhmlr5L5vIG",
  "reactivation-kit": "prod_VSGlCCTcMEHYZL",
  "lead-qualifier": "prod_VSTsGMezmXvpD8",
  "first-customer-finder": "prod_VSU0vWA9sMJZa3",
};

export async function getOverrides() {
  try { return (await meta().get("config/apps", { type: "json" })) || {}; } catch { return {}; }
}

export async function getCatalog() {
  const o = await getOverrides();
  return APPS.map((a) => ({ ...a, ...(o[a.id] || {}) }));
}

export async function getApp(id) {
  return (await getCatalog()).find((a) => a.id === id) || null;
}

// Unlisted preview access for real paid tests while an app is still "Coming soon".
// Only the SHA-256 of the token lives in code; the token itself is kept off the repo.
const PREVIEW_SHA256 = process.env.HV_PREVIEW_SHA256 || "baeb3418653bebd6fee60ea8b3c48ecad0159f17998663a89d134846d16dc06c";
export function hasPreview(token) {
  if (typeof token !== "string" || token.length < 24 || token.length > 100) return false;
  if (process.env.HV_PREVIEW_TOKEN && safeEqual(token, process.env.HV_PREVIEW_TOKEN)) return true;
  return safeEqual(crypto.createHash("sha256").update(token).digest("hex"), PREVIEW_SHA256);
}

// An app is sellable only if it has a Stripe product (= a built, server-side generator).
export const isBuilt = (id) => !!STRIPE_PRODUCTS[id];
export const canBuy = (app, previewToken) =>
  !!app && !app.external && isBuilt(app.id) && (app.status === "live" || hasPreview(previewToken));

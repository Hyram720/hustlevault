import { APPS } from "../../shared/apps.js";
import { meta } from "./store.mjs";
import { safeEqual } from "./http.mjs";

// Stripe product per app (created in the live Stripe account, metadata.app = hustlevault).
export const STRIPE_PRODUCTS = {
  "objection-coach": process.env.HV_PRODUCT_OBJECTION_COACH || "prod_VSGSUbGqCfm8vQ",
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
export function hasPreview(token) {
  return !!process.env.HV_PREVIEW_TOKEN && safeEqual(token, process.env.HV_PREVIEW_TOKEN);
}

export const canBuy = (app, previewToken) =>
  !!app && !app.external && (app.status === "live" || hasPreview(previewToken));

// Lightweight first-party analytics: visit, app_view, vc_click (VentureCheck referral clicks).
import { json, handle, readJson, cleanText, ipHash, HttpError } from "../lib/http.mjs";
import { logEvent, rateLimit } from "../lib/store.mjs";
import { APPS } from "../../shared/apps.js";

const TYPES = new Set(["visit", "app_view", "vc_click"]);
const IDS = new Set(APPS.map((a) => a.id));
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor/i;

export default handle(async (req, context) => {
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
  if (BOT.test(req.headers.get("user-agent") || "")) return json({ ok: true });
  if (!(await rateLimit("track", ipHash(context, req), 60, 600))) return json({ ok: true });
  const b = await readJson(req, 2000);
  if (!TYPES.has(b.type)) throw new HttpError(400, "bad type");
  const app = IDS.has(b.app) ? b.app : "-";
  const source = cleanText(b.utm?.source, 60) || "direct", campaign = cleanText(b.utm?.campaign, 60) || "-";
  await logEvent(b.type, { app, source, campaign, extra: cleanText(b.path, 120) });
  return json({ ok: true });
});
export const config = { path: "/api/track", method: "POST", rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ["ip", "domain"] } };

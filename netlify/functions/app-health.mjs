// Configuration health check — booleans only, never values.
import { json, handle, ipHash } from "../lib/http.mjs";
import { rateLimit } from "../lib/store.mjs";
import { verifiedStripe, stripeSource } from "../lib/stripe.mjs";
import { aiSource, chatJSON } from "../lib/ai.mjs";
import { redditMode, searchReddit } from "../lib/reddit.mjs";

export default handle(async (req, context) => {
  if (!(await rateLimit("health", ipHash(context, req), 10, 600))) return json({ error: "slow down" }, 429);
  const out = { stripeKeySource: stripeSource(), aiSource: aiSource(), webhookMode: /^whsec_/.test(process.env.HV_STRIPE_WEBHOOK_SECRET || "") ? "signature" : "api-refetch" };
  try { await verifiedStripe(); out.stripeAccountOk = true; } catch (e) { out.stripeAccountOk = false; out.stripeError = e.message; }
  if (new URL(req.url).searchParams.get("ai") === "1") {
    try { const r = await chatJSON([{ role: "user", content: 'Reply with JSON {"ok":true}' }], { maxTokens: 10 }); out.aiOk = r.data?.ok === true; } catch (e) { out.aiOk = false; out.aiError = e.message; }
  }
  if (new URL(req.url).searchParams.get("reddit") === "1") {
    out.redditMode = redditMode();
    try { await searchReddit("looking for recommendations", { limit: 1, time: "week" }); out.redditOk = true; } catch (e) { out.redditOk = false; out.redditError = String(e.message).slice(0, 40); }
  }
  return json(out);
});
export const config = { path: "/api/apps/health" };

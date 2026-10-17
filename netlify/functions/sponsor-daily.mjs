// Daily backstop: re-check every sponsor's Stripe subscription and drop old dedupe salts.
import { syncAll } from "../lib/sponsorsub.mjs";
import { cleanupStats } from "../lib/sponsorstats.mjs";
import { audit } from "../lib/content.mjs";

export default async () => {
  let subs = [], cleaned = 0;
  try { subs = await syncAll(); } catch (e) { console.error("syncAll", e?.message); }
  try { cleaned = await cleanupStats(); } catch (e) { console.error("cleanup", e?.message); }
  if (subs.length) await audit("daily_subscription_check", { checked: subs.length, errors: subs.filter((s) => s.error).length });
  console.log("sponsor-daily", JSON.stringify({ subs, cleaned }));
  return new Response("ok");
};

export const config = { schedule: "15 9 * * *" }; // 09:15 UTC daily

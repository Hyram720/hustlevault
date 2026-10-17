// Pricing Watcher scheduler. Runs every 15 minutes (UTC) and checks only watches that are due
// (each page is checked once a day; a suspected change is re-checked ~1 hour later to confirm before alerting).
// Scheduled functions have a 30 s limit, so runDue stops after a 20 s budget and continues next run.
import { runDue } from "../lib/watcher/service.mjs";

export default async () => {
  try {
    const r = await runDue({ budgetMs: 20000 });
    console.log("pricing-watcher run", JSON.stringify({ due: r.due, checked: r.checked, skipped: r.skipped || null }));
  } catch (e) {
    console.error("pricing-watcher run failed", e?.message);
  }
};

export const config = { schedule: "*/15 * * * *" };

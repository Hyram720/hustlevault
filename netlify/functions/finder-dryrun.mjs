// Preview-only dry run of the First Customer Finder search pipeline (no payment, nothing stored).
// Requires the unlisted preview token; tightly rate limited because each run makes 2 AI calls.
import { json, handle, readJson, HttpError, ipHash } from "../lib/http.mjs";
import { rateLimit } from "../lib/store.mjs";
import { hasPreview } from "../lib/apps.mjs";
import { validateForm } from "../lib/generators.mjs";
import { isFlagged } from "../lib/ai.mjs";
import { generateFinder } from "../lib/finder.mjs";

export default handle(async (req, context) => {
  if (req.method !== "POST") throw new HttpError(405, "POST only");
  const body = await readJson(req, 3000);
  if (!hasPreview(typeof body.preview === "string" ? body.preview.slice(0, 100) : "")) throw new HttpError(404, "Not found");
  if (!(await rateLimit("finder-dry", ipHash(context, req), 8, 3600)) || !(await rateLimit("finder-dry", "global", 40, 86400))) throw new HttpError(429, "Slow down a little.");
  const inputs = validateForm("first-customer-finder", body.inputs || {});
  if (await isFlagged(Object.values(inputs).join("\n"))) throw new HttpError(400, "We can't help with that request.");
  const t0 = Date.now();
  const { out, usage } = await generateFinder(inputs);
  return json({ ms: Date.now() - t0, usage, result: out });
});
export const config = { path: "/api/apps/finder-dryrun", method: ["POST"] };

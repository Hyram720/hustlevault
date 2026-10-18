// Preview-only dry run of a form app's AI generator (no payment, nothing stored).
// Lets Fred check real AI output on the live site before a real paid test. Requires the unlisted
// preview token and is tightly rate limited (one AI call per run).
import { json, handle, readJson, HttpError, ipHash } from "../lib/http.mjs";
import { rateLimit } from "../lib/store.mjs";
import { hasPreview } from "../lib/apps.mjs";
import { validateForm, generateForm } from "../lib/generators.mjs";
import { isFlagged } from "../lib/ai.mjs";

const DRYRUN_APPS = new Set(["offer-builder"]);

export default handle(async (req, context) => {
  if (req.method !== "POST") throw new HttpError(405, "POST only");
  const body = await readJson(req, 4000);
  if (!hasPreview(typeof body.preview === "string" ? body.preview.slice(0, 100) : "")) throw new HttpError(404, "Not found");
  const appId = String(body.appId || "");
  if (!DRYRUN_APPS.has(appId)) throw new HttpError(404, "Not found");
  if (!(await rateLimit("app-dry", ipHash(context, req), 10, 3600)) || !(await rateLimit("app-dry", "global", 40, 86400))) throw new HttpError(429, "Slow down a little.");
  const inputs = validateForm(appId, body.inputs || {});
  if (await isFlagged(Object.values(inputs).join("\n"))) throw new HttpError(400, "We can't help with that request.");
  const t0 = Date.now();
  const { out, usage } = await generateForm(appId, inputs);
  return json({ ms: Date.now() - t0, usage, result: out });
});
export const config = { path: "/api/apps/dryrun", method: ["POST"] };

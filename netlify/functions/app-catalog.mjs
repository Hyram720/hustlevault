// Public app catalog (prices, descriptions, live/coming-soon state).
import { json, handle } from "../lib/http.mjs";
import { getCatalog, hasPreview } from "../lib/apps.mjs";

export default handle(async (req) => {
  const preview = new URL(req.url).searchParams.get("preview") || "";
  const pv = hasPreview(preview);
  const apps = (await getCatalog())
    .filter((a) => a.status !== "hidden" || pv)
    .map(({ id, path, name, price, status, external, url, tagline, give, get, fast }) => ({
      id, path, name, price, status, external: !!external, url: url || null, tagline, give, get, fast,
      buyable: !external && (status === "live" || (pv && ["objection-coach"].includes(id))),
    }));
  return json({ apps, preview: pv });
});

export const config = { path: "/api/apps" };

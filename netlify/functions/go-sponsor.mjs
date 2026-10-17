// Sponsor click-through: count the click (bots filtered, per-visitor daily cap), then 302 to the sponsor.
import { visibleSponsors, SPONSOR_ID_RE } from "../lib/content.mjs";
import { isBot, visitor, capFilter, record } from "../lib/sponsorstats.mjs";
import { rateLimit } from "../lib/store.mjs";
import { ipHash } from "../lib/http.mjs";
import { etDay, PLACEMENTS } from "../../shared/sponsors.js";

const redirect = (to) => new Response(null, { status: 302, headers: { Location: to, "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "strict-origin-when-cross-origin" } });

export default async (req, context) => {
  const id = context.params?.id || "";
  if (!SPONSOR_ID_RE.test(id)) return redirect("/sponsors");
  let s;
  try { s = (await visibleSponsors()).find((x) => x.id === id); } catch { return redirect("/sponsors"); }
  if (!s || !/^https:\/\//.test(s.url || "")) return redirect("/sponsors");
  try {
    const p = new URL(req.url).searchParams.get("p");
    if (!isBot(req) && PLACEMENTS.includes(p) && (await rateLimit("sp-clk", ipHash(context, req), 30, 600))) {
      const day = etDay();
      const ok = await capFilter(await visitor(context, req, day), [[id, p, "clk"]], day);
      if (ok.length) await record(ok, day);
    }
  } catch (e) { console.error("click log failed", e?.message); }
  return redirect(s.url);
};

export const config = { path: "/go/sponsor/:id" };

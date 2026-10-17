// Pricing Watcher — one check of one watched page, with confirm-before-alert.
// Dependencies are injected so the whole flow is testable offline (fixtures, fake AI, in-memory store).
import { safeGet, validateUrl, checkRobots, looksBlockedByBot, FetchError } from "./net.mjs";
import { htmlToLines, pricingRegion, regionHash, parseTiersHeuristic, extractWithAI, normalizeTiers, pageCurrency } from "./extract.mjs";
import { diffTiers, changeSig } from "./diff.mjs";

// Owner "plan" lives in config so limits can change later without a schema change.
export const DEFAULT_PLAN = { id: "owner", maxWatches: 10, checkEveryHours: 24, confirmAfterMinutes: 60, maxAlertEmailsPerDay: 10 };
const HISTORY_MAX = 30;

export async function fetchPricingPage(url, { robotsCache } = {}) {
  const u = validateUrl(url);
  const rb = await checkRobots(u, robotsCache);
  if (!rb.allowed) throw new FetchError("robots", rb.reason);
  const r = await safeGet(u);
  if (looksBlockedByBot(r.status, r.headers, r.body)) throw new FetchError("bot_blocked", `The site blocked automated checks (HTTP ${r.status}). We don't try to get around bot protection.`);
  if (r.status < 200 || r.status >= 300) throw new FetchError("http", `The page returned HTTP ${r.status}.`);
  const ct = String(r.headers["content-type"] || "");
  if (ct && !/html|xml|text\/plain/i.test(ct)) throw new FetchError("not_html", `Not a web page (${ct.split(";")[0]}).`);
  return r.body;
}

// Extract tiers from HTML. AI first when available (validated against page text), deterministic parser otherwise.
export async function extract(html, { chat } = {}) {
  const lines = htmlToLines(html);
  const region = pricingRegion(lines);
  const hash = regionHash(region.text);
  if (!region.priceCount) return { hash, tiers: [], method: "none", noPrices: true, usage: null, dropped: 0 };
  const cur = pageCurrency(region.text);
  if (chat) {
    try {
      const ai = await extractWithAI(region.text, chat);
      if (ai.tiers.length) return { hash, tiers: normalizeTiers(ai.tiers, cur), method: "ai", usage: ai.usage, dropped: ai.dropped, regionText: region.text };
    } catch (e) { /* fall through to deterministic */ }
  }
  return { hash, tiers: normalizeTiers(parseTiersHeuristic(lines), cur), method: "parser", usage: null, dropped: 0, regionText: region.text };
}

const hours = (h) => h * 3600 * 1000;

// Runs one check. Returns { watch (updated), alert (or null), log }.
// deps: { fetchHtml(url) -> html, chat (optional AI), now (ms) }
export async function checkWatch(watch, plan, deps) {
  const now = deps.now ?? Date.now();
  const w = structuredClone(watch);
  w.lastCheckAt = new Date(now).toISOString();
  w.checks = (w.checks || 0) + 1;
  const next = (ms) => { w.nextCheckAt = new Date(now + ms).toISOString(); };
  next(hours(plan.checkEveryHours));
  const log = (event, extra = {}) => { w.history = [{ at: w.lastCheckAt, event, ...extra }, ...(w.history || [])].slice(0, HISTORY_MAX); };

  let html;
  try { html = await deps.fetchHtml(w.url); }
  catch (e) {
    w.status = e.code === "robots" ? "robots_disallowed" : e.code === "bot_blocked" ? "blocked" : "error";
    w.error = String(e.message || e).slice(0, 200);
    w.failures = (w.failures || 0) + 1;
    if (w.status === "error" && w.failures <= 3) next(hours(1)); // transient: retry soon
    log("fetch_failed", { error: w.error });
    return { watch: w, alert: null };
  }
  w.failures = 0; w.error = null;

  // Same text as the confirmed snapshot and nothing pending: nothing to do (no AI call).
  if (w.snapshot && !w.pending && w.snapshot.hash === regionHash(pricingRegion(htmlToLines(html)).text)) {
    w.status = "ok"; log("unchanged");
    return { watch: w, alert: null };
  }
  // Same text as the pending candidate: that's the second sighting -> confirm without re-extracting.
  let ex;
  if (w.pending && w.pending.hash === regionHash(pricingRegion(htmlToLines(html)).text)) ex = { hash: w.pending.hash, tiers: w.pending.tiers, method: "pending-reuse" };
  else ex = await extract(html, { chat: deps.chat });
  if (ex.usage) w.ai = { calls: (w.ai?.calls || 0) + 1, in: (w.ai?.in || 0) + ex.usage.in, out: (w.ai?.out || 0) + ex.usage.out };

  if (!ex.tiers.length) {
    // Never treat "no prices found" as "every plan removed".
    w.status = ex.noPrices ? "no_prices" : "no_tiers";
    w.error = ex.noPrices ? "No prices found in the page HTML — it may load prices with JavaScript (not supported yet)." : "Prices found but no plans could be identified.";
    log(w.status);
    return { watch: w, alert: null };
  }
  w.method = ex.method;

  if (!w.snapshot) {
    w.snapshot = { hash: ex.hash, tiers: ex.tiers, at: w.lastCheckAt };
    w.status = "ok"; log("baseline", { tiers: ex.tiers.length });
    return { watch: w, alert: null };
  }

  let changes = diffTiers(w.snapshot.tiers, ex.tiers);
  if (!changes.length) {
    if (w.pending) log("pending_discarded", { reason: "change not seen again" });
    w.pending = null;
    w.snapshot = { ...w.snapshot, hash: ex.hash, tiers: ex.tiers }; // adopt new wording/limits silently
    w.status = "ok"; log("no_price_change");
    return { watch: w, alert: null };
  }

  // AI results can wobble: re-extract the same text once and require the identical change set.
  if (ex.method === "ai" && deps.chat) {
    const again = await extract(html, { chat: deps.chat });
    if (again.usage) w.ai = { calls: w.ai.calls + 1, in: w.ai.in + again.usage.in, out: w.ai.out + again.usage.out };
    if (changeSig(diffTiers(w.snapshot.tiers, again.tiers)) !== changeSig(changes)) {
      w.status = "ok"; log("extraction_unstable", { changes: changes.length });
      return { watch: w, alert: null };
    }
  }

  const sig = changeSig(changes);
  if (w.pending && w.pending.sig === sig) {
    const alert = { watchId: w.id, url: w.url, label: w.label || "", changes, firstSeenAt: w.pending.firstSeenAt, confirmedAt: w.lastCheckAt };
    w.snapshot = { hash: ex.hash, tiers: ex.tiers, at: w.lastCheckAt };
    w.pending = null; w.status = "ok"; w.lastChangeAt = w.lastCheckAt;
    log("change_confirmed", { changes: changes.length });
    return { watch: w, alert };
  }
  w.pending = { sig, changes, hash: ex.hash, tiers: ex.tiers, firstSeenAt: w.lastCheckAt };
  w.status = "pending";
  next(plan.confirmAfterMinutes * 60 * 1000);
  log("change_pending", { changes: changes.length });
  return { watch: w, alert: null };
}

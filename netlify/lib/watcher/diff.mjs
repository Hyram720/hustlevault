// Pricing Watcher — compare two normalized snapshots. Only structural pricing facts count:
// tier added/removed, price amount/currency changed for a billing period, billing period added/removed.
// Wording, feature lists, limits text, order and layout are ignored by construction.
import { fmtPrice } from "./extract.mjs";

export function diffTiers(prev = [], next = []) {
  const changes = [];
  const P = new Map(prev.map((t) => [t.key, t])), N = new Map(next.map((t) => [t.key, t]));
  for (const [k, t] of N) if (!P.has(k)) changes.push({ type: "tier_added", tier: t.name, key: k, to: t.prices });
  for (const [k, t] of P) if (!N.has(k)) changes.push({ type: "tier_removed", tier: t.name, key: k, from: t.prices });
  for (const [k, a] of P) {
    const b = N.get(k); if (!b) continue;
    const per = (t) => { const m = new Map(); for (const p of t.prices) { if (!m.has(p.period)) m.set(p.period, []); m.get(p.period).push(p); } return m; };
    const pa = per(a), pb = per(b);
    for (const [period, list] of pb) {
      if (!pa.has(period)) { changes.push({ type: "period_added", tier: b.name, key: k, period, to: list }); continue; }
      const sig = (l) => l.map((p) => `${p.amount}|${p.currency}`).sort().join(",");
      if (sig(pa.get(period)) !== sig(list)) changes.push({ type: "price_changed", tier: b.name, key: k, period, from: pa.get(period), to: list });
    }
    for (const [period, list] of pa) if (!pb.has(period)) changes.push({ type: "period_removed", tier: a.name, key: k, period, from: list });
  }
  return changes.sort((x, y) => (x.key + x.type + (x.period || "")).localeCompare(y.key + y.type + (y.period || "")));
}

export const changeSig = (changes) => JSON.stringify(changes.map((c) => [c.type, c.key, c.period || "", (c.to || []).map((p) => `${p.amount}|${p.currency}|${p.period}`)]));

const list = (ps) => (ps || []).map(fmtPrice).join(" or ");
export function describeChange(c) {
  switch (c.type) {
    case "tier_added": return `New plan: ${c.tier} (${list(c.to)})`;
    case "tier_removed": return `Plan removed: ${c.tier} (was ${list(c.from)})`;
    case "price_changed": return `${c.tier}: ${list(c.from)} → ${list(c.to)}`;
    case "period_added": return `${c.tier}: new billing option ${list(c.to)}`;
    case "period_removed": return `${c.tier}: billing option removed (was ${list(c.from)})`;
    default: return c.type;
  }
}

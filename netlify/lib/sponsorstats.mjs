// Sponsor impressions/clicks: daily aggregates per sponsor per placement. No IPs or personal data
// are stored — visitors are only recognised within one day via a salted hash (salt rotates daily).
import crypto from "node:crypto";
import { statsStore } from "./content.mjs";
import { etDay, PLACEMENTS } from "../../shared/sponsors.js";

export const BOT_RE = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|httpclient|axios|node-fetch|go-http|java\/|facebookexternalhit|embedly|pingdom|uptime/i;
export const isBot = (req) => { const ua = req.headers.get("user-agent") || ""; return !ua || ua.length < 20 || BOT_RE.test(ua); };

async function salt(day) {
  const s = statsStore();
  let v = await s.get(`salt/${day}`);
  if (!v) { await s.set(`salt/${day}`, crypto.randomBytes(24).toString("base64url"), { onlyIfNew: true }); v = await s.get(`salt/${day}`); }
  return v;
}
export async function visitor(context, req, day = etDay()) {
  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || "unknown";
  return crypto.createHash("sha256").update(`${await salt(day)}|${ip}|${req.headers.get("user-agent") || ""}`).digest("hex").slice(0, 32);
}

// Per-visitor daily caps (dedupe): returns the subset of [id, placement, field] that may be counted.
export async function capFilter(vh, entries, day, { imp = 20, clk = 3 } = {}) {
  const s = statsStore(), key = `cap/${day}/${vh}`;
  for (let i = 0; i < 5; i++) {
    const r = await s.getWithMetadata(key, { type: "json" });
    const cur = r?.data || {};
    const allowed = [];
    for (const [id, p, f] of entries) {
      const k = `${id}|${p}|${f}`;
      if ((cur[k] || 0) < (f === "clk" ? clk : imp)) { cur[k] = (cur[k] || 0) + 1; allowed.push([id, p, f]); }
    }
    if (!allowed.length) return [];
    const res = r ? await s.setJSON(key, cur, { onlyIfMatch: r.etag }) : await s.setJSON(key, cur, { onlyIfNew: true });
    if (res.modified) return allowed;
  }
  return [];
}

export async function record(entries, day = etDay()) {
  const byId = new Map();
  for (const [id, p, f] of entries) { if (!PLACEMENTS.includes(p)) continue; if (!byId.has(id)) byId.set(id, []); byId.get(id).push([p, f]); }
  const s = statsStore();
  await Promise.all([...byId].map(async ([id, list]) => {
    const key = `s/${id}/${day}`;
    for (let i = 0; i < 8; i++) {
      const r = await s.getWithMetadata(key, { type: "json" });
      const cur = r?.data || {};
      for (const [p, f] of list) { cur[p] = cur[p] || { imp: 0, clk: 0 }; cur[p][f] = (cur[p][f] || 0) + 1; }
      const res = r ? await s.setJSON(key, cur, { onlyIfMatch: r.etag }) : await s.setJSON(key, cur, { onlyIfNew: true });
      if (res.modified) return;
      await new Promise((x) => setTimeout(x, 30 + Math.random() * 120));
    }
  }));
}

export async function sponsorStats(id, days = 30) {
  const s = statsStore();
  const out = [];
  const today = Date.now();
  const wanted = new Set();
  for (let i = 0; i < days; i++) wanted.add(etDay(new Date(today - i * 864e5)));
  const { blobs } = await s.list({ prefix: `s/${id}/` });
  const got = new Map(await Promise.all(blobs.filter((b) => wanted.has(b.key.split("/")[2])).map(async (b) => [b.key.split("/")[2], await s.get(b.key, { type: "json" }).catch(() => ({}))])));
  for (const day of [...wanted].sort()) {
    const d = got.get(day) || {};
    const row = { day };
    for (const p of PLACEMENTS) row[p] = { imp: d[p]?.imp || 0, clk: d[p]?.clk || 0 };
    out.push(row);
  }
  const totals = {};
  for (const p of PLACEMENTS) {
    const imp = out.reduce((a, r) => a + r[p].imp, 0), clk = out.reduce((a, r) => a + r[p].clk, 0);
    totals[p] = { imp, clk, ctr: imp ? +(clk / imp).toFixed(4) : null };
  }
  const imp = out.reduce((a, r) => a + PLACEMENTS.reduce((x, p) => x + r[p].imp, 0), 0), clk = out.reduce((a, r) => a + PLACEMENTS.reduce((x, p) => x + r[p].clk, 0), 0);
  totals.all = { imp, clk, ctr: imp ? +(clk / imp).toFixed(4) : null };
  return { days, daily: out, totals };
}

export async function deleteSponsorStats(id) {
  const s = statsStore();
  const { blobs } = await s.list({ prefix: `s/${id}/` });
  await Promise.all(blobs.map((b) => s.delete(b.key)));
}

// Drop old salts + dedupe caps so yesterday's hashes can't be linked to anything.
export async function cleanupStats() {
  const s = statsStore(), keep = new Set([etDay(), etDay(new Date(Date.now() - 864e5))]);
  let n = 0;
  for (const prefix of ["salt/", "cap/"]) {
    const { blobs } = await s.list({ prefix });
    for (const b of blobs) if (!keep.has(b.key.split("/")[1])) { await s.delete(b.key); n++; }
  }
  return n;
}

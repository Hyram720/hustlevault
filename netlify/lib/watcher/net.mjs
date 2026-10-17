// Pricing Watcher — safe outbound fetching: URL validation, SSRF protection (DNS-pinned private-IP block),
// robots.txt, identifying user agent, size/time caps, manual re-validated redirects.
import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import net from "node:net";
import zlib from "node:zlib";

export const UA_TOKEN = "HustleVaultPricingWatcher";
export const USER_AGENT = `Mozilla/5.0 (compatible; ${UA_TOKEN}/1.0; +https://hustlevault.app/apps/pricing-watcher)`;
const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 9000;

// Loopback is only ever allowed for local tests (netlify dev or unit tests), never in production.
let testLoopback = false;
export const __allowLoopbackForTests = (v = true) => { testLoopback = v; };
const loopbackOk = () => testLoopback || (process.env.NETLIFY_DEV === "true" && process.env.HV_WATCHER_ALLOW_LOOPBACK === "1");

export class FetchError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

function v4ToInt(ip) { return ip.split(".").reduce((a, o) => (a << 8) + (+o), 0) >>> 0; }
const V4_BLOCKS = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
].map(([b, m]) => [v4ToInt(b), m]);
const isLoopback = (ip) => /^127\./.test(ip) || ip === "::1" || /^::ffff:127\./i.test(ip);

export function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const n = v4ToInt(ip);
    return V4_BLOCKS.some(([b, m]) => (n >>> (32 - m)) === (b >>> (32 - m)));
  }
  if (net.isIPv6(ip)) {
    const s = ip.toLowerCase();
    const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/) || s.match(/^64:ff9b::(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    if (s === "::" || s === "::1") return true;
    if (/^::ffff:/.test(s) || /^64:ff9b:/.test(s)) return true; // hex-form mapped addresses: refuse
    const first = parseInt(s.split(":")[0] || "0", 16);
    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link local
    if ((first & 0xff00) === 0xff00) return true; // multicast
    if (/^2001:0?db8:/.test(s) || /^100::/.test(s) || /^2002:/.test(s)) return true; // doc, discard, 6to4
    return false;
  }
  return true;
}
const blocked = (ip) => isPrivateIp(ip) && !(loopbackOk() && isLoopback(ip));

export function validateUrl(raw) {
  if (typeof raw !== "string" || raw.length > 2000) throw new FetchError("bad_url", "Enter a full web address (https://…).");
  let u;
  try { u = new URL(raw.trim()); } catch { throw new FetchError("bad_url", "That doesn't look like a valid web address."); }
  if (!/^https?:$/.test(u.protocol)) throw new FetchError("bad_url", "Only http:// and https:// pages can be watched.");
  if (u.username || u.password) throw new FetchError("bad_url", "Addresses with a username or password aren't allowed.");
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const portOk = u.port === "" || u.port === "80" || u.port === "443" || (loopbackOk() && isLoopback(host === "localhost" ? "127.0.0.1" : host));
  if (!portOk) throw new FetchError("bad_url", "Only standard web ports (80/443) are allowed.");
  if (!host.includes(".") && !net.isIP(host) && !(loopbackOk() && host === "localhost")) throw new FetchError("bad_url", "Use a public website address.");
  if (/(^|\.)(localhost|local|internal|intranet|lan|home|corp|localdomain)$/.test(host) && !(loopbackOk() && host === "localhost")) throw new FetchError("blocked_host", "Private or internal addresses can't be watched.");
  if (net.isIP(host) && blocked(host)) throw new FetchError("blocked_host", "Private or internal addresses can't be watched.");
  u.hash = "";
  return u;
}

// DNS lookup that refuses private/internal addresses; used by the socket itself so the checked IP is the one connected to.
export function safeLookup(hostname, opts, cb) {
  if (typeof opts === "function") { cb = opts; opts = {}; }
  dns.lookup(hostname, { all: true, verbatim: true }, (err, addrs) => {
    if (err) return cb(err);
    if (!addrs.length) return cb(new FetchError("dns", "Address not found"));
    if (addrs.some((a) => blocked(a.address))) return cb(new FetchError("blocked_host", "That site resolves to a private or internal address."));
    if (opts && opts.all) return cb(null, addrs);
    cb(null, addrs[0].address, addrs[0].family);
  });
}

function once(u, { maxBytes, timeoutMs, accept }) {
  return new Promise((resolve, reject) => {
    const mod = u.protocol === "https:" ? https : http;
    const req = mod.request(u, {
      method: "GET", lookup: safeLookup, timeout: timeoutMs,
      headers: { "User-Agent": USER_AGENT, Accept: accept, "Accept-Encoding": "gzip, deflate, br", "Accept-Language": "en-US,en;q=0.8" },
    }, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) { res.resume(); return resolve({ status, location: res.headers.location, headers: res.headers }); }
      const enc = String(res.headers["content-encoding"] || "").toLowerCase();
      let stream = res;
      if (enc === "gzip" || enc === "x-gzip") stream = res.pipe(zlib.createGunzip());
      else if (enc === "deflate") stream = res.pipe(zlib.createInflate());
      else if (enc === "br") stream = res.pipe(zlib.createBrotliDecompress());
      const chunks = []; let size = 0;
      stream.on("data", (c) => { size += c.length; if (size > maxBytes) { req.destroy(); reject(new FetchError("too_large", "Page is too large to check.")); } else chunks.push(c); });
      stream.on("end", () => resolve({ status, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") }));
      stream.on("error", (e) => reject(new FetchError("network", e.message)));
    });
    req.on("timeout", () => req.destroy(new FetchError("timeout", "The site took too long to respond.")));
    req.on("error", (e) => reject(e instanceof FetchError ? e : new FetchError(e.code === "ENOTFOUND" ? "dns" : "network", e.code === "ENOTFOUND" ? "Site not found." : `Couldn't reach the site (${e.code || e.message}).`)));
    req.end();
  });
}

export async function safeGet(raw, { maxBytes = MAX_BYTES, timeoutMs = TIMEOUT_MS, accept = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5", maxRedirects = 3 } = {}) {
  let u = raw instanceof URL ? raw : validateUrl(raw);
  for (let i = 0; i <= maxRedirects; i++) {
    const r = await once(u, { maxBytes, timeoutMs, accept });
    if (r.location) {
      if (i === maxRedirects) throw new FetchError("redirects", "Too many redirects.");
      u = validateUrl(new URL(r.location, u).href);
      continue;
    }
    return { ...r, url: u.href };
  }
  throw new FetchError("redirects", "Too many redirects.");
}

// ---- robots.txt ----
export function parseRobots(txt) {
  const groups = []; let cur = null; let lastWasUA = false;
  for (const line of String(txt || "").split(/\r?\n/)) {
    const m = line.replace(/#.*/, "").trim().match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === "user-agent") {
      if (!cur || !lastWasUA) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(v.toLowerCase()); lastWasUA = true;
    } else {
      lastWasUA = false;
      if (cur && (k === "allow" || k === "disallow")) cur.rules.push({ allow: k === "allow", path: v });
    }
  }
  return groups;
}
function ruleMatches(path, pattern) {
  if (!pattern) return false;
  const anchored = pattern.endsWith("$");
  const re = new RegExp("^" + pattern.replace(/\$$/, "").replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + (anchored ? "$" : ""));
  return re.test(path);
}
export function robotsAllows(txt, pathWithQuery, token = UA_TOKEN) {
  const groups = parseRobots(txt);
  const t = token.toLowerCase();
  let g = groups.filter((x) => x.agents.some((a) => a !== "*" && t.includes(a)));
  if (!g.length) g = groups.filter((x) => x.agents.includes("*"));
  const rules = g.flatMap((x) => x.rules).filter((r) => r.path !== "" || !r.allow);
  let best = null;
  for (const r of rules) {
    if (r.path === "") continue; // "Disallow:" (empty) = allow all
    if (ruleMatches(pathWithQuery, r.path) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r;
  }
  return best ? best.allow : true;
}

// Returns { allowed, reason }. Cache is a {get,set} async pair (Blobs in prod, Map in tests).
export async function checkRobots(u, cache) {
  const key = "robots/" + Buffer.from(u.origin).toString("base64url");
  let entry = cache ? await cache.get(key) : null;
  if (!entry || Date.now() - entry.at > 24 * 3600 * 1000) {
    try {
      const r = await safeGet(new URL("/robots.txt", u.origin).href, { maxBytes: 300_000, accept: "text/plain,*/*;q=0.5" });
      if (r.status >= 200 && r.status < 300) entry = { at: Date.now(), txt: r.body.slice(0, 300_000) };
      else if (r.status >= 400 && r.status < 500) entry = { at: Date.now(), txt: "" };
      else return { allowed: false, reason: `robots.txt unavailable (HTTP ${r.status}) — will retry` };
    } catch (e) {
      if (e.code === "blocked_host") throw e;
      return { allowed: false, reason: "robots.txt couldn't be read — will retry" };
    }
    if (cache) await cache.set(key, entry);
  }
  const allowed = robotsAllows(entry.txt, u.pathname + u.search);
  return { allowed, reason: allowed ? "" : "The site's robots.txt asks bots not to read this page, so we don't." };
}

export function looksBlockedByBot(status, headers, body) {
  const server = String(headers?.server || "").toLowerCase();
  if ([403, 429, 503].includes(status) && (/cloudflare|akamai|datadome|perimeterx|incapsula/.test(server) || /cf-chl|challenge-platform|Just a moment\.\.\.|captcha/i.test(body || ""))) return true;
  return false;
}

// Local mocks for Stripe + Resend used by test/e2e-sponsors.mjs (never used in production).
//   node test/mocks/mock-services.mjs   (Stripe on :12111, Resend on :12112)
import http from "node:http";
const subs = new Map(), sessions = new Map(), emails = [];
const endpoint = { id: "we_mock", object: "webhook_endpoint", url: "https://hustlevault.app/api/stripe/webhook", enabled_events: ["checkout.session.completed", "checkout.session.expired", "charge.refunded"] };
const body = (req) => new Promise((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => r(b)); });
const send = (res, code, d) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(d)); };
const form = (s) => { const o = {}; for (const [k, v] of new URLSearchParams(s)) { if (k.endsWith("[]")) (o[k.slice(0, -2)] ||= []).push(v); else { const m = k.match(/^(\w+)\[(\d+)\]$/); if (m) (o[m[1]] ||= [])[+m[2]] = v; else o[k] = v; } } return o; };

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"), raw = await body(req);
  if (u.pathname === "/__set_sub") { const s = JSON.parse(raw); subs.set(s.id, s); return send(res, 200, { ok: true }); }
  if (u.pathname === "/__state") return send(res, 200, { endpoint, sessions: [...sessions.values()] });
  if (u.pathname === "/v1/account") return send(res, 200, { id: "acct_1SXuWsRTxRBnTgwh", object: "account" });
  let m;
  if ((m = u.pathname.match(/^\/v1\/subscriptions\/(sub_\w+)$/))) return subs.has(m[1]) ? send(res, 200, subs.get(m[1])) : send(res, 404, { error: { message: "No such subscription" } });
  if (u.pathname === "/v1/checkout/sessions" && req.method === "POST") {
    const f = form(raw), id = "cs_test_mock" + Math.random().toString(36).slice(2, 10);
    const s = { id, object: "checkout.session", mode: f.mode, amount_total: 10000, livemode: false, status: "open", url: `https://checkout.stripe.com/c/pay/${id}`, price: f["line_items[0][price]"], metadata: { hv_kind: f["metadata[hv_kind]"] } };
    sessions.set(id, s); return send(res, 200, s);
  }
  if ((m = u.pathname.match(/^\/v1\/checkout\/sessions\/(\w+)\/expire$/))) { const s = sessions.get(m[1]); if (!s) return send(res, 404, {}); s.status = "expired"; return send(res, 200, s); }
  if (u.pathname === "/v1/webhook_endpoints" && req.method === "GET") return send(res, 200, { object: "list", data: [endpoint], has_more: false });
  if (u.pathname === "/v1/webhook_endpoints/we_mock" && req.method === "POST") { endpoint.enabled_events = form(raw).enabled_events; return send(res, 200, endpoint); }
  send(res, 404, { error: { message: "mock: unknown " + u.pathname } });
}).listen(12111);

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"), raw = await body(req);
  if (u.pathname === "/emails" && req.method === "POST") {
    if (req.headers.authorization !== "Bearer re_mock_key") return send(res, 401, { message: "bad key" });
    const e = JSON.parse(raw); emails.push(e); return send(res, 200, { id: "em_" + emails.length });
  }
  if (u.pathname === "/__emails") return send(res, 200, emails);
  send(res, 404, {});
}).listen(12112);
console.log("mocks up: stripe :12111, resend :12112");

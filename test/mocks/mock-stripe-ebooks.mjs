// Local mock Stripe (+ a fake private file host) for test/e2e-ebooks.mjs. Never used in production.
//   node test/mocks/mock-stripe-ebooks.mjs   (Stripe on :12121, files on :12122)
import http from "node:http";
const sessions = new Map(); let coupon = null;
const body = (req) => new Promise((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => r(b)); });
const send = (res, code, d) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(d)); };
function form(s) { // minimal Stripe form decoder for the fields we use
  const o = { line_items: [], metadata: {} };
  for (const [k, v] of new URLSearchParams(s)) {
    let m;
    if ((m = k.match(/^line_items\[(\d+)\]\[price_data\]\[unit_amount\]$/))) (o.line_items[+m[1]] ||= {}).unit_amount = +v;
    else if ((m = k.match(/^line_items\[(\d+)\]\[price_data\]\[product_data\]\[name\]$/))) (o.line_items[+m[1]] ||= {}).name = v;
    else if ((m = k.match(/^metadata\[(\w+)\]$/))) o.metadata[m[1]] = v;
    else if (k === "discounts[0][coupon]") o.coupon = v;
    else o[k] = v;
  }
  return o;
}
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"), raw = await body(req); let m;
  if (u.pathname === "/__set_session") { const s = JSON.parse(raw); sessions.set(s.id, s); return send(res, 200, { ok: true }); }
  if ((m = u.pathname.match(/^\/__session\/(\w+)$/))) return send(res, 200, sessions.get(m[1]) || null);
  if (u.pathname === "/v1/checkout/sessions" && req.method === "POST") {
    const f = form(raw), id = "cs_test_mock" + Math.random().toString(36).slice(2, 12);
    const s = { id, object: "checkout.session", status: "open", payment_status: "unpaid", livemode: false, url: `https://checkout.stripe.com/c/pay/${id}`,
      metadata: f.metadata, line_items_sent: f.line_items, coupon: f.coupon || null, amount_total: f.line_items.reduce((a, l) => a + l.unit_amount, 0),
      customer_details: { name: "Pat Buyer", email: "pat.buyer@example.com", address: { line1: "1 Secret St", city: "Cherry Hill" } } };
    sessions.set(id, s); return send(res, 200, s);
  }
  if ((m = u.pathname.match(/^\/v1\/checkout\/sessions\/(\w+)$/)) && req.method === "GET") {
    const s = sessions.get(m[1]); if (!s) return send(res, 404, { error: { type: "invalid_request_error", message: "No such checkout.session: " + m[1] } });
    return send(res, 200, s);
  }
  if (u.pathname === "/v1/coupons/VAULT20") return coupon ? send(res, 200, coupon) : send(res, 404, { error: { type: "invalid_request_error", message: "No such coupon" } });
  if (u.pathname === "/v1/coupons" && req.method === "POST") { coupon = { id: "VAULT20", percent_off: 20 }; return send(res, 200, coupon); }
  send(res, 404, { error: { type: "invalid_request_error", message: "mock: unknown " + u.pathname } });
}).listen(12121);
http.createServer((req, res) => {
  if (req.url === "/private/repo-blueprint.pdf") { res.writeHead(200, { "Content-Type": "application/pdf" }); return res.end("%PDF-1.4 mock repo blueprint"); }
  res.writeHead(404); res.end();
}).listen(12122);
console.log("mock stripe :12121, files :12122");

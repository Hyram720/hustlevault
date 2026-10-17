// Production smoke test (no payment). Usage: PREVIEW=... node test/prod-smoke.mjs
// Needs STRIPE_SECRET_KEY in env only to expire the test sessions it creates.
const BASE = process.env.BASE || "https://hustlevault.app", PREVIEW = process.env.PREVIEW, SK = process.env.STRIPE_SECRET_KEY;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };
const j = async (path, opts = {}) => { const r = await fetch(BASE + path, opts); let d; try { d = await r.json(); } catch { d = null; } return { s: r.status, d }; };
const post = (path, body, headers = {}) => j(path, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
const expire = (cs) => fetch(`https://api.stripe.com/v1/checkout/sessions/${cs}/expire`, { method: "POST", headers: { Authorization: "Bearer " + SK } }).then((r) => r.json());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const inputs = { industry: "life_insurance", objection: "I already have coverage through work.", offer: "Term life for young families" };

let r = await j("/api/apps/health?ai=1");
console.log("health", JSON.stringify(r.d));
ok(r.d?.stripeAccountOk && r.d?.aiOk, "Stripe key is Fred's account + AI reachable");
r = await j("/api/apps");
ok(r.d?.apps?.find((a) => a.id === "objection-coach")?.buyable === false, "public: coach Coming soon / not buyable");
ok(r.d?.apps?.find((a) => a.id === "venturecheck")?.url?.startsWith("https://venturecheck-dun.vercel.app"), "VentureCheck listed as external link");
r = await j("/api/apps?preview=" + PREVIEW);
ok(r.d?.preview === true && r.d.apps.find((a) => a.id === "objection-coach").buyable === true, "preview token unlocks coach");
ok((await post("/api/apps/checkout", { appId: "objection-coach", inputs })).s === 403, "no token -> 403");
ok((await post("/api/apps/checkout", { appId: "objection-coach", inputs, preview: "x".repeat(32) })).s === 403, "wrong token -> 403");
ok((await post("/api/apps/checkout", { appId: "objection-coach", inputs: { industry: "solar", objection: "" }, preview: PREVIEW })).s === 400, "invalid input -> 400");
r = await post("/api/apps/checkout", { appId: "objection-coach", inputs, preview: PREVIEW, utm: { source: "e2e-test", campaign: "prod-smoke" } });
const pid = r.d?.purchaseId, cs = (r.d?.url || "").match(/cs_live_[A-Za-z0-9]+/)?.[0];
ok(r.s === 200 && pid && cs, "live Checkout Session created for $5 coach");
const sess = cs && await fetch(`https://api.stripe.com/v1/checkout/sessions/${cs}`, { headers: { Authorization: "Bearer " + SK } }).then((x) => x.json());
ok(sess?.amount_total === 500 && sess?.metadata?.hv_purchase_id === pid && sess?.success_url?.startsWith(`https://hustlevault.app/my/${pid}`), "session: $5.00, purchase id in metadata, success URL -> /my/<id>");
r = await j(`/api/purchase/${pid}`);
ok(r.d?.status === "pending" && !r.d.result, "purchase pending, nothing unlocked");
ok((await post(`/api/purchase/${pid}/practice`, { message: "hello there" })).s === 403, "practice blocked before payment");
r = await post("/api/stripe/webhook", { id: "evt_1FakeFakeFakeFake", type: "checkout.session.completed", data: { object: { id: cs, metadata: { hv_purchase_id: pid }, payment_status: "paid", amount_total: 500 } } });
ok(r.s === 400, "forged webhook (fake event) rejected");
ok((await j(`/api/purchase/${pid}`)).d?.status === "pending", "forged webhook did not unlock");
const ex = await expire(cs);
ok(ex.status === "expired", "expired session via Stripe API");
let st;
for (let i = 0; i < 20; i++) { st = (await j(`/api/purchase/${pid}`)).d?.status; if (st === "expired") break; await sleep(3000); }
ok(st === "expired", "REAL Stripe webhook delivered -> purchase marked expired (pipeline works)");
r = await post("/api/create-checkout-session", { productId: 1 });
const ecs = (r.d?.url || "").match(/cs_live_[A-Za-z0-9]+/)?.[0];
ok(r.s === 200 && !!ecs, "legacy ebook checkout still creates a session");
if (ecs) await expire(ecs);
r = await j("/api/verify-session/cs_live_doesnotexist");
ok(r.s >= 400, "legacy verify-session path still responds (bogus id -> error)");
console.log(`\n${pass} passed, ${fail} failed  purchase=${pid}`);

// Legacy ebook lockdown checks against `netlify dev` + test/mocks/mock-stripe-ebooks.mjs (no real Stripe).
//   BASE=http://localhost:8888 node test/e2e-ebooks.mjs
const BASE = process.env.BASE || "http://localhost:8888", MOCK = "http://127.0.0.1:12121";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };
const j = async (url, opts = {}) => { const r = await fetch(url, opts); const t = await r.text(); let d; try { d = JSON.parse(t); } catch { d = null; } return { s: r.status, d, t, h: r.headers }; };
const post = (body) => j(BASE + "/api/create-checkout-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const mockS = async (id) => (await j(`${MOCK}/__session/${id}`)).d;
const setS = (s) => fetch(`${MOCK}/__set_session`, { method: "POST", body: JSON.stringify(s) });
const pay = async (id, extra = {}) => { const s = await mockS(id); await setS({ ...s, status: "complete", payment_status: "paid", payment_intent: { id: "pi_x", latest_charge: { id: "ch_x", amount: s.amount_total, amount_refunded: 0, refunded: false } }, ...extra }); };
const sid = (r) => r.d?.sessionId;

// Normal checkout: server price.
let r = await post({ productId: 1 });
ok(r.s === 200 && /^cs_test_/.test(sid(r) || ""), "normal checkout created");
let s = await mockS(sid(r));
ok(s.amount_total === 5700 && s.metadata.hv_kind === "ebook" && s.metadata.product_ids === "1", "normal price 5700 decided by server");
const src = sid(r);

// Client upsell flag alone is ignored -> refused.
r = await post({ productId: "B5", isUpsell: true });
ok(r.s === 403, "isUpsell without a verified purchase refused (403)");
r = await post({ productId: 6, upsellOf: src });
ok(r.s === 403, "upsell against an UNPAID session refused");
await pay(src);
r = await post({ productId: "B5", upsellOf: src });
ok(r.s === 403, "upsell for a product not offered for this purchase refused");
r = await post({ productId: 1, upsellOf: src });
ok(r.s === 403, "upsell for the product already bought refused");
r = await post({ productId: 6, upsellOf: "cs_test_doesnotexist12345" });
ok(r.s === 403, "upsell against unknown session refused");
r = await post({ productId: 6, upsellOf: src });
s = r.s === 200 && (await mockS(sid(r)));
ok(s && s.amount_total === 2700 && s.metadata.hv_upsell_of === src && !s.coupon, "upsell price 2700 only with verified paid purchase");
const up = sid(r);
r = await post({ productId: 6, upsellOf: src });
ok(r.s === 200 && sid(r) === up, "repeat upsell request reuses the same open checkout (no second discount)");
await pay(up);
r = await post({ productId: 6, upsellOf: src });
ok(r.s === 409, "upsell can't be used twice once paid (409)");
r = await post({ productId: 7, upsellOf: up });
ok(r.s === 403, "an upsell purchase can't chain another upsell");

// Other-app session in the same Stripe account can't be used.
await setS({ id: "cs_test_otherapp0000001", status: "complete", payment_status: "paid", amount_total: 100, metadata: { product_ids: "1", product_names: "Something else" }, customer_details: { email: "x@example.com" } });
r = await post({ productId: 6, upsellOf: "cs_test_otherapp0000001" });
ok(r.s === 403, "session from another app (names don't match) can't unlock upsell");

// Bumps.
r = await post({ productId: 2, bumpId: 3 });
s = await mockS(sid(r));
ok(s.amount_total === 4700 + 1700 && s.metadata.product_ids === "2,3" && s.coupon === "VAULT20", "order bump priced by server (+1700) with bundle coupon as before");
r = await post({ productId: 2, bumpId: 2 });
s = await mockS(sid(r));
ok(s.amount_total === 4700 && s.metadata.product_ids === "2", "bumping the same product is ignored");
r = await post({ productId: "nope" });
ok(r.s === 400, "unknown product rejected");

// verify-session: no buyer PII, only matching product files, signed links.
r = await j(`${BASE}/api/verify-session/${src}`);
ok(r.s === 200 && r.d?.verified === true, "paid session verified");
ok(!/pat\.buyer|Pat Buyer|Secret St|Cherry Hill|customer|email|address/i.test(r.t), "response has no name/email/address");
ok(!/drive\.google|127\.0\.0\.1/.test(r.t), "response has no file locations");
const files = r.d?.digitalContent?.files || [];
ok(files.length === 1 && files[0].name === "Unit Gold Storage Auction Blueprint HustleVault.pdf" && /^\/api\/ebook-file\/[\w-]+\.[\w-]+$/.test(files[0].url), "only the purchased product's file, as a signed link");
r = await j(`${BASE}/api/verify-session/${up}`);
ok(r.d?.digitalContent?.files?.length === 1 && /Print_On_Demand/.test(r.d.digitalContent.files[0].name), "upsell session shows only the upsell product's file");
r = await j(`${BASE}/api/verify-session/cs_test_otherapp0000001`);
ok([400, 404].includes(r.s) && !/x@example/.test(r.t) && !r.d?.verified, "other-app session: refused (404; netlify dev may retry as .html -> 400) and no data");
const unpaid = sid(await post({ productId: 3 }));
r = await j(`${BASE}/api/verify-session/${unpaid}`);
ok(r.s === 402, "unpaid session: 402");
await pay(unpaid, { payment_intent: { id: "pi_r", latest_charge: { id: "ch_r", amount: 3700, amount_refunded: 3700, refunded: true } } });
r = await j(`${BASE}/api/verify-session/${unpaid}`);
ok(r.s === 410, "fully refunded session: 410, no links");
r = await j(`${BASE}/api/verify-session/not-a-session`);
ok(r.s === 400 && !/No such/.test(r.t), "bad id: 400, no raw Stripe error echoed");

// Downloads.
const b3 = sid(await post({ productId: "B1" })); await pay(b3);
r = await j(`${BASE}/api/verify-session/${b3}`);
const repo = r.d.digitalContent.files.find((f) => /Repo_Blueprint/.test(f.name));
const unit = r.d.digitalContent.files.find((f) => /Unit Gold/.test(f.name));
ok(r.d.digitalContent.files.length === 3 && repo && unit, "bundle lists its 3 files");
let d = await fetch(BASE + repo.url);
const body = await d.text();
ok(d.status === 200 && body.startsWith("%PDF") && /attachment/.test(d.headers.get("content-disposition") || "") && /no-store/.test(d.headers.get("cache-control") || ""), "signed link streams the file (private source, attachment, no-store)");
d = await fetch(BASE + unit.url);
ok(d.status === 503, "file not configured -> 503 with support message (no location leaked)");
const [bdy, sig] = repo.url.split("/").pop().split(".");
d = await fetch(`${BASE}/api/ebook-file/${bdy}.${sig.slice(0, -2)}xx`);
ok(d.status === 403, "tampered signature rejected");
const forged = Buffer.from(JSON.stringify({ f: "repo-blueprint.pdf", s: "x", x: Date.now() + 1e9 })).toString("base64url");
d = await fetch(`${BASE}/api/ebook-file/${forged}.${sig}`);
ok(d.status === 403, "forged link body rejected");
const expired = Buffer.from(JSON.stringify({ f: "repo-blueprint.pdf", s: "x", x: Date.now() - 1000 })).toString("base64url");
d = await fetch(`${BASE}/api/ebook-file/${expired}.${sig}`);
ok(d.status === 403, "expired link rejected");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

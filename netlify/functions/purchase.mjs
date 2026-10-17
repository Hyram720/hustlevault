// Purchase retrieval (/my/<id>), on-demand fulfillment, and the Objection Coach practice session.
import { json, handle, readJson, HttpError, cleanText, PURCHASE_ID_RE, ipHash } from "../lib/http.mjs";
import { rateLimit, updatePurchase } from "../lib/store.mjs";
import { stripe } from "../lib/stripe.mjs";
import { markPaid, generate, getPurchase } from "../lib/fulfill.mjs";
import { practiceReply } from "../lib/coach.mjs";
import { addUsage } from "../lib/ai.mjs";

const ACCESS = ["paid", "partially_refunded"];

function view(p) {
  const access = ACCESS.includes(p.status);
  const v = {
    id: p.id, appId: p.appId, appName: p.appName, amount: p.amount, status: p.status,
    createdAt: p.createdAt, paidAt: p.paidAt || null, inputs: p.inputs,
    gen: p.gen ? { state: p.gen.state, attempts: p.gen.attempts } : null,
    preview: !!p.preview,
  };
  if (access) {
    v.result = p.result || null;
    if (p.practice) {
      const { turns, scores, used, maxTurns, done, summary } = p.practice;
      v.practice = { turns, scores, used, maxTurns, done, summary };
    }
  }
  return v;
}

async function load(id) {
  if (!PURCHASE_ID_RE.test(id)) throw new HttpError(404, "Purchase not found");
  const cur = await getPurchase(id);
  if (!cur) throw new HttpError(404, "Purchase not found");
  return cur.data;
}

// Fallback when the browser returns from Stripe before the webhook lands.
async function confirmFromSession(p, sessionId) {
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId || "")) return p;
  if (!["pending", "processing"].includes(p.status) || p.sessionId !== sessionId) return p;
  const s = await stripe().checkout.sessions.retrieve(sessionId);
  if (s.payment_status === "paid") return (await markPaid(p.id, s)) || p;
  return p;
}

async function practice(req, p) {
  if (!ACCESS.includes(p.status)) throw new HttpError(403, "This purchase isn't active.");
  if (p.appId !== "objection-coach" || !p.practice) throw new HttpError(409, "Practice isn't ready yet.");
  const body = await readJson(req, 3000);
  const text = cleanText(body.message, 600);
  if (text.length < 2) throw new HttpError(400, "Type your reply first.");

  // Reserve one turn server-side before calling the AI (enforces the session limit).
  let reserved = false;
  await updatePurchase(p.id, (x) => {
    const pr = x.practice;
    if (!pr || pr.done || pr.used >= pr.maxTurns) return null;
    if (pr.pendingAt && Date.now() - Date.parse(pr.pendingAt) < 60_000) return null;
    pr.used += 1; pr.pendingAt = new Date().toISOString();
    reserved = true;
    return x;
  });
  if (!reserved) {
    const cur = (await getPurchase(p.id)).data;
    if (cur.practice.pendingAt) throw new HttpError(409, "Still working on your last reply. One moment.");
    throw new HttpError(409, "This practice session is finished. Each purchase includes one session.");
  }
  const cur = (await getPurchase(p.id)).data;
  let r;
  try {
    r = await practiceReply(cur.inputs, cur.practice, text);
  } catch (err) {
    console.error("practice AI failed", err?.message);
    await updatePurchase(p.id, (x) => { x.practice.used = Math.max(0, x.practice.used - 1); x.practice.pendingAt = null; return x; });
    throw new HttpError(502, "The coach didn't answer. Your turn wasn't used — please try again.");
  }
  const updated = await updatePurchase(p.id, (x) => {
    const pr = x.practice;
    pr.turns.push({ role: "you", text }, { role: "customer", text: r.customer_reply });
    pr.scores.push({ score: r.score, feedback: r.feedback });
    pr.pendingAt = null;
    if (pr.used >= pr.maxTurns) {
      pr.done = true;
      const avg = pr.scores.reduce((a, s) => a + s.score, 0) / pr.scores.length;
      pr.summary = { average: Math.round(avg * 10) / 10, text: r.summary || "Session complete." };
    }
    addUsage(x, r.usage);
    return x;
  });
  return json(view(updated));
}

export default handle(async (req, context) => {
  const { id, action } = context.params || {};
  const who = ipHash(context, req);
  if (req.method === "GET" && !action) {
    if (!(await rateLimit("purchase-get", who, 120, 60))) throw new HttpError(429, "Slow down a little.");
    let p = await load(id);
    const sid = new URL(req.url).searchParams.get("session_id");
    if (sid) p = await confirmFromSession(p, sid);
    return json(view(p));
  }
  if (req.method === "POST" && action === "generate") {
    if (!(await rateLimit("generate", who, 20, 600))) throw new HttpError(429, "Slow down a little.");
    const p = await load(id);
    if (!ACCESS.includes(p.status)) return json(view(p));
    const updated = p.result ? p : (await generate(id)) || (await load(id));
    return json(view(updated));
  }
  if (req.method === "POST" && action === "practice") {
    if (!(await rateLimit("practice", who, 30, 600))) throw new HttpError(429, "Slow down a little.");
    return practice(req, await load(id));
  }
  throw new HttpError(404, "Not found");
});

export const config = {
  path: ["/api/purchase/:id", "/api/purchase/:id/:action"],
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ["ip", "domain"] },
};

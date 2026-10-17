// Sales Objection Coach: input validation, script generation, and the practice session.
import { COACH_INDUSTRIES, COACH_MAX_TURNS } from "../../shared/apps.js";
import { cleanText, HttpError } from "./http.mjs";
import { chatJSON, GUARD, fence, str } from "./ai.mjs";

export function validateCoachInputs(raw = {}) {
  const industry = String(raw.industry || "");
  if (!COACH_INDUSTRIES[industry]) throw new HttpError(400, "Please pick an industry.");
  const otherIndustry = industry === "other" ? cleanText(raw.otherIndustry, 60) : "";
  if (industry === "other" && otherIndustry.length < 2) throw new HttpError(400, "Please tell us your industry.");
  const objection = cleanText(raw.objection, 200);
  if (objection.length < 4) throw new HttpError(400, "Please choose or type the objection.");
  const offer = cleanText(raw.offer, 300);
  return { industry, otherIndustry, objection, offer };
}

const industryName = (i) => (i.industry === "other" ? i.otherIndustry : COACH_INDUSTRIES[i.industry].label);

export async function generateCoachScript(inputs) {
  const sys = `You are an ethical, friendly sales coach for beginners. You write short, natural things a salesperson can say out loud.
${GUARD}
Return JSON with exactly these keys:
"acknowledge": an empathetic acknowledgement of the objection (1-2 sentences),
"clarify": one clarifying question to understand the real concern,
"respond": a calm, honest response that addresses the concern (2-4 sentences, no made-up statistics),
"follow_up": one follow-up question that checks if the response helped,
"close": an ethical, low-pressure next step or close (1-2 sentences; the customer can always say no),
"why_it_works": array of 3 short bullet strings explaining why this approach works,
"avoid": array of 3 short bullet strings of things NOT to say or do (manipulative or misleading tactics to avoid).
Use plain, beginner-friendly words. No jargon.`;
  const user = `Write the objection script for this salesperson.\n${fence({ industry: industryName(inputs), customer_objection: inputs.objection, what_they_sell: inputs.offer || "not given" })}`;
  const { data, usage } = await chatJSON([{ role: "system", content: sys }, { role: "user", content: user }], { maxTokens: 650 });
  const list = (v) => (Array.isArray(v) ? v : []).slice(0, 4).map((x) => str(x, 220)).filter(Boolean);
  const out = {
    acknowledge: str(data.acknowledge, 400), clarify: str(data.clarify, 300), respond: str(data.respond, 800),
    follow_up: str(data.follow_up, 300), close: str(data.close, 400),
    why_it_works: list(data.why_it_works), avoid: list(data.avoid),
  };
  if (!out.acknowledge || !out.respond || !out.close) throw new Error("Incomplete AI script");
  return { out, usage };
}

export function startPractice(inputs) {
  return {
    maxTurns: COACH_MAX_TURNS, used: 0, done: false, pendingAt: null,
    turns: [{ role: "customer", text: inputs.objection }],
    scores: [], summary: null,
  };
}

export async function practiceReply(inputs, practice, userText) {
  const turnNo = practice.used; // already reserved (1-based count after reservation)
  const last = turnNo >= practice.maxTurns;
  const sys = `You run a sales role-play for a beginner. You play a realistic, polite but skeptical customer in ${industryName(inputs)} who raised this objection: "${inputs.objection.replace(/"/g, "'")}".
${GUARD}
Score the salesperson's latest reply from 1 to 10 for empathy, honesty, clarity, and asking good questions. Reward honest, respectful replies. Give a low score to pressure, manipulation, fake urgency, or false claims.
Return JSON: {"score": integer 1-10, "feedback": "1-2 sentences of coaching on their latest reply", "customer_reply": "what the customer says next (1-3 sentences, stay in character; may soften if the reply was good)", "customer_ready": true if the customer is now open to a next step, otherwise false${last ? `, "summary": "2-3 sentences: overall strengths and the one thing to practice next"` : ""}}.`;
  const history = practice.turns.slice(-10).map((t) => ({ who: t.role, said: t.text }));
  const user = `Conversation so far, then the salesperson's newest reply (turn ${turnNo} of ${practice.maxTurns}).\n${fence({ what_they_sell: inputs.offer || "not given", conversation: history, salesperson_new_reply: userText })}`;
  const { data, usage } = await chatJSON([{ role: "system", content: sys }, { role: "user", content: user }], { maxTokens: last ? 380 : 260, temperature: 0.7 });
  let score = Math.round(Number(data.score));
  if (!Number.isFinite(score)) score = 5;
  score = Math.max(1, Math.min(10, score));
  return {
    score, feedback: str(data.feedback, 400), customer_reply: str(data.customer_reply, 500) || "Okay. Tell me more.",
    customer_ready: data.customer_ready === true, summary: last ? str(data.summary, 600) : null, usage,
  };
}

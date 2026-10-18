// Generic validation + AI generation for form-based apps. One small-model call per purchase.
import { APP_FORMS } from "../../shared/apps.js";
import { cleanText, HttpError } from "./http.mjs";
import { chatJSON, GUARD, fence, str } from "./ai.mjs";
import { generateFinder } from "./finder.mjs";

export function validateForm(appId, raw = {}) {
  const fields = APP_FORMS[appId];
  if (!fields) throw new HttpError(400, "Unknown app");
  const out = {};
  for (const f of fields) {
    if (f.type === "select") {
      const v = String(raw[f.name] ?? "");
      if (!f.options.includes(v)) throw new HttpError(400, `Please choose: ${f.label}`);
      out[f.name] = v;
    } else {
      const v = cleanText(raw[f.name], f.max);
      if (v.length < (f.min ?? 1)) throw new HttpError(400, `Please fill in: ${f.label}`);
      out[f.name] = v;
    }
  }
  return out;
}

const L = (v, n, max) => (Array.isArray(v) ? v : []).slice(0, n).map((x) => str(x, max)).filter(Boolean);
const BASE = `You help beginners start and grow small businesses using plain, friendly language with no jargon.
Be realistic and specific to the person's situation, budget, location and time. Never promise or estimate income. Suggest only legal, honest tactics.`;

const SPECS = {
  "first-sale-blueprint": {
    maxTokens: 1700,
    task: "Create a First Sale Blueprint: a 7-day action plan to get a first paying customer, a starter offer, pricing, and three outreach messages.",
    format: `{"plan":[{"day":1,"focus":"short title","tasks":["3 short concrete tasks"]} ... exactly 7 days],
"offer":{"name":"","description":"2 sentences","includes":["3-5 items"]},
"pricing":{"price":"a specific starter price or range in USD","reasoning":"2 sentences","options":["1-2 optional add-ons or tiers"]},
"outreach":[{"channel":"e.g. Text to a friend / Facebook group post / Email to local business","message":"ready-to-send message, 40-90 words, with [brackets] for names"} ... exactly 3],
"tips":["3 short tips"]}`,
    norm: (d) => ({
      plan: (Array.isArray(d.plan) ? d.plan : []).slice(0, 7).map((x, i) => ({ day: i + 1, focus: str(x?.focus, 80), tasks: L(x?.tasks, 4, 220) })),
      offer: { name: str(d.offer?.name, 100), description: str(d.offer?.description, 500), includes: L(d.offer?.includes, 6, 160) },
      pricing: { price: str(d.pricing?.price, 80), reasoning: str(d.pricing?.reasoning, 500), options: L(d.pricing?.options, 3, 200) },
      outreach: (Array.isArray(d.outreach) ? d.outreach : []).slice(0, 3).map((m) => ({ channel: str(m?.channel, 80), message: str(m?.message, 900) })),
      tips: L(d.tips, 4, 220),
    }),
    ok: (o) => o.plan.length === 7 && o.outreach.length === 3 && o.offer.name,
  },
  "offer-builder": {
    maxTokens: 1400,
    task: `Turn this person's skills and experience into one clearly defined service offer they can sell to the people they want to help.
Fit it to their experience level, delivery style, time and starting budget ("Not sure yet" means unknown). Keep the offer small enough for them to deliver well.
The price is only a suggested starting range for this one service, based on its scope, their experience and typical market rates; explain the reasoning plainly.
Never promise, estimate or imply income, earnings, profit, number of clients or results. Don't invent credentials, certifications or testimonials they didn't give.
The pitch is a draft they post or send themselves: honest, friendly, no hype, no fake urgency.`,
    format: `{"name":"short offer name","description":"one paragraph, 50-90 words, describing the service and the result it helps with","who_its_for":"1 sentence","problem":"1 sentence",
"deliverables":["4-6 specific items included"],"timeline":"delivery timeline, e.g. 'Kickoff call on day 1, first draft in 3 days, finished in 1 week'",
"price_low":number in USD,"price_high":number in USD,"price_unit":"e.g. per project / per month / per session","price_reasoning":"2-3 sentences",
"options":["1-2 optional add-ons with suggested prices"],"pitch_short":"one sentence","pitch_long":"60-110 word post or message they can share",
"faq":[{"q":"","a":""} ... 3]}`,
    norm: (d) => {
      const n = (v) => { const x = Math.round(Number(String(v ?? "").replace(/[^0-9.]/g, ""))); return Number.isFinite(x) && x > 0 && x < 1e6 ? x : 0; };
      let lo = n(d.price_low), hi = n(d.price_high);
      if (lo && hi && lo > hi) [lo, hi] = [hi, lo];
      const unit = str(d.price_unit, 40);
      const fmt = (x) => "$" + x.toLocaleString("en-US");
      const range = lo && hi ? (lo === hi ? fmt(lo) : `${fmt(lo)} – ${fmt(hi)}`) : str(d.price, 60);
      return {
        name: str(d.name, 100), description: str(d.description, 900), who_its_for: str(d.who_its_for, 300), problem: str(d.problem, 300),
        deliverables: L(d.deliverables, 7, 200), timeline: str(d.timeline, 240),
        price_low: lo, price_high: hi, price_unit: unit, price: range ? `${range}${unit ? " " + unit : ""}` : "",
        price_reasoning: str(d.price_reasoning, 600), options: L(d.options, 3, 200),
        pitch_short: str(d.pitch_short, 300), pitch_long: str(d.pitch_long, 1000),
        faq: (Array.isArray(d.faq) ? d.faq : []).slice(0, 4).map((f) => ({ q: str(f?.q, 200), a: str(f?.a, 400) })).filter((f) => f.q && f.a),
      };
    },
    ok: (o) => o.name && o.description && o.deliverables.length >= 3 && o.price && o.pitch_short && o.pitch_long,
  },
  "lead-follow-up": {
    maxTokens: 1200,
    task: "Write a 5-message follow-up sequence mixing text (SMS) and email, with timing, ending in a clear, low-pressure ask for the appointment. These are drafts the person sends themselves.",
    format: `{"messages":[{"timing":"e.g. Day 1 — within 1 hour","channel":"sms or email","subject":"email subject or empty for sms","body":"SMS under 300 characters; email 50-120 words; use [Name] placeholders"} ... exactly 5],"tips":["3 short tips"]}`,
    norm: (d) => ({
      messages: (Array.isArray(d.messages) ? d.messages : []).slice(0, 5).map((m) => ({ timing: str(m?.timing, 80), channel: /email/i.test(m?.channel) ? "email" : "sms", subject: str(m?.subject, 120), body: str(m?.body, 1200) })),
      tips: L(d.tips, 4, 220),
    }),
    ok: (o) => o.messages.length === 5,
  },
  "lead-qualifier": {
    maxTokens: 700,
    task: `Qualify a sales prospect from their reply. Decide one verdict:
- "Push": clear interest or buying signals (asks about price, timing, next steps, decision-maker involved) — move toward a close or booked call now.
- "Nurture": some interest but not ready (timing, budget later, needs info, polite but vague) — stay helpful and follow up later.
- "Walk away": clear no, hostile, asked not to be contacted, no need/budget/authority at all, or signs of a scam — stop spending time.
If they asked not to be contacted, the verdict must be "Walk away" and the next message must only politely confirm you won't contact them again.
Base everything only on what the reply and context actually say. Do not invent facts about the user's business: if the next message needs a price, plan option, date or detail the user didn't give, use a [placeholder] like [start date] or [smaller plan option] instead. Never pressure, mislead or create fake urgency. The suggested next message is a draft the user sends themselves.`,
    format: `{"verdict":"Push|Nurture|Walk away","confidence":"high|medium|low","reason":"1-2 plain sentences",
"buying_signals":["0-4 short bullets quoting or paraphrasing the reply"],"red_flags":["0-4 short bullets"],
"next_step":"what to do next in under 15 words","next_message":"ready-to-send reply, matched to the channel (text/DM under 300 characters, email 40-120 words), [Name] placeholders"}`,
    norm: (d) => {
      const v = String(d.verdict || "").toLowerCase();
      return {
        verdict: v.startsWith("push") ? "Push" : v.startsWith("nurt") ? "Nurture" : v.startsWith("walk") ? "Walk away" : "",
        confidence: ["high", "medium", "low"].includes(String(d.confidence).toLowerCase()) ? String(d.confidence).toLowerCase() : "",
        reason: str(d.reason, 400), buying_signals: L(d.buying_signals, 5, 200), red_flags: L(d.red_flags, 5, 200),
        next_step: str(d.next_step, 140), next_message: str(d.next_message, 1200),
      };
    },
    ok: (o) => o.verdict && o.reason && o.next_message,
  },
  "reactivation-kit": {
    maxTokens: 1700,
    task: "Create a customer reactivation (win-back) campaign. Do not ask for or use any customer records; use placeholders like [First name].",
    format: `{"plan":["4-6 short steps: who to send to, when, how to track replies"],
"emails":[{"timing":"e.g. Day 1","subject":"","body":"80-150 words"} ... 3 emails, or [] if text only],
"sms":[{"timing":"e.g. Day 2","body":"under 300 characters, ends with 'Reply STOP to opt out'"} ... 3 texts, or [] if email only]}`,
    norm: (d) => ({
      plan: L(d.plan, 7, 240),
      emails: (Array.isArray(d.emails) ? d.emails : []).slice(0, 3).map((m) => ({ timing: str(m?.timing, 80), subject: str(m?.subject, 120), body: str(m?.body, 1500) })),
      sms: (Array.isArray(d.sms) ? d.sms : []).slice(0, 3).map((m) => ({ timing: str(m?.timing, 80), body: str(m?.body, 500) })),
    }),
    ok: (o) => o.plan.length && (o.emails.length || o.sms.length),
  },
};

export const hasGenerator = (appId) => !!SPECS[appId] || appId === "first-customer-finder";

export async function generateForm(appId, inputs) {
  if (appId === "first-customer-finder") return generateFinder(inputs);
  const spec = SPECS[appId];
  if (!spec) throw new Error("No generator");
  const sys = `${BASE}\n${GUARD}\nTask: ${spec.task}\nReturn JSON exactly in this shape:\n${spec.format}`;
  const { data, usage } = await chatJSON([{ role: "system", content: sys }, { role: "user", content: `Here is the person's information.\n${fence(inputs)}` }], { maxTokens: spec.maxTokens });
  const out = spec.norm(data || {});
  if (!spec.ok(out)) throw new Error("Incomplete AI result");
  return { out, usage };
}

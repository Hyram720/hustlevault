// Offline unit test for the AI Offer Builder: form validation, AI output normalization, rendering.
//   node test/unit/offer-builder.mjs
process.env.OPENAI_API_KEY = "test-dummy"; process.env.OPENAI_BASE_URL = "http://ai.invalid/v1";
const { validateForm, generateForm } = await import("../../netlify/lib/generators.mjs");
const { toSections, toPlainText } = await import("../../shared/render.js");
const { APPS, APP_FORMS } = await import("../../shared/apps.js");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };
const throws = (fn) => { try { fn(); return false; } catch { return true; } };

const app = APPS.find((a) => a.id === "offer-builder");
ok(app.price === 900 && app.status === "soon" && !app.external, "catalog: $9, Coming soon, not external");
const base = { skills: "Bookkeeping", background: "", audience: "Food trucks", experience: "Some experience", delivery: "Online / remote", time: "Not sure yet", budget: "Not sure yet" };
ok(!throws(() => validateForm("offer-builder", base)), "optional experience/time/budget accepted when skipped");
ok(throws(() => validateForm("offer-builder", { ...base, budget: "a lot" })), "unlisted budget rejected");
ok(throws(() => validateForm("offer-builder", { ...base, skills: "" })), "skills required");
ok(throws(() => validateForm("offer-builder", { ...base, audience: "" })), "audience required");
ok(APP_FORMS["offer-builder"].filter((f) => /optional/.test(f.label)).length === 3, "three fields marked optional");

let reply = {}, sent = null;
globalThis.fetch = async (url, init) => { sent = JSON.parse(init.body); return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply) } }], usage: { prompt_tokens: 10, completion_tokens: 10 } }), { status: 200 }); };
const full = { name: "Books <b>Tune-Up</b>", description: "One paragraph.", who_its_for: "Owners", problem: "Messy books", deliverables: ["a", "b", "c", "d"], timeline: "1 week",
  price_low: "$300", price_high: 150, price_unit: "per project", price_reasoning: "Because.", options: ["Upkeep $75/mo"], pitch_short: "Short.", pitch_long: "Longer post.", faq: [{ q: "Q?", a: "A." }, { q: "", a: "x" }] };
reply = full;
const { out } = await generateForm("offer-builder", base);
ok(out.price === "$150 – $300 per project" && out.price_low === 150 && out.price_high === 300, `price range normalized and ordered (${out.price})`);
ok(!/[<>]/.test(out.name), "angle brackets stripped");
ok(out.faq.length === 1, "empty FAQ entries dropped");
const sys = sent.messages[0].content;
ok(/Never promise, estimate or imply income/.test(sys) && /suggested starting range/.test(sys), "prompt forbids income promises and frames price as suggested");
ok(sent.model === "gpt-4o-mini" && /<user_data>/.test(sent.messages[1].content), "gpt-4o-mini with fenced user data");
reply = { ...full, description: "" };
ok(await generateForm("offer-builder", base).then(() => false, () => true), "incomplete AI result rejected (no description)");
reply = { ...full, price_low: null, price_high: null, price: "$200 flat" };
ok((await generateForm("offer-builder", base)).out.price.startsWith("$200 flat"), "falls back to price text when no numbers");

const secs = toSections("offer-builder", out);
const hs = secs.map((s) => s.h);
ok(["Your offer", "Who it's for", "What's included", "Delivery timeline", "Suggested pricing", "Your pitch"].every((h) => hs.includes(h)), "all result sections present");
ok(secs.filter((s) => s.copy).length >= 3, "copy buttons on offer, includes and pitch");
const txt = toPlainText("AI Offer Builder", "offer-builder", out);
ok(/Suggested range: \$150 – \$300/.test(txt) && /not a promise of income/.test(txt), "text download says suggested, no income promise");
const legacy = { name: "Old", who_its_for: "x", problem: "y", deliverables: ["a", "b", "c"], timeline: "t", price: "$99", price_reasoning: "r", pitch_short: "s", pitch_long: "l", faq: [] };
ok(toSections("offer-builder", legacy).length >= 5, "older saved results still render");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

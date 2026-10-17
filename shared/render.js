// Turns a generated result into display sections — used by the results page and the PDF.
export const DISCLAIMER = "These are AI-generated suggestions for education only. Results depend on your effort, market and many other factors — no income, sales or results are guaranteed. Check local rules, licenses and taxes before you start.";

const L = (v) => (Array.isArray(v) ? v : []);

export function toSections(appId, o = {}) {
  switch (appId) {
    case "first-sale-blueprint":
      return [
        { h: "Your 7-day action plan", items: L(o.plan).map((d) => ({ label: `Day ${d.day} — ${d.focus}`, text: L(d.tasks).map((t) => "• " + t).join("\n") })) },
        { h: "Your starter offer", items: [{ label: o.offer?.name, text: [o.offer?.description, ...L(o.offer?.includes).map((x) => "• " + x)].filter(Boolean).join("\n") }] },
        { h: "Pricing", items: [{ label: o.pricing?.price, text: [o.pricing?.reasoning, ...L(o.pricing?.options).map((x) => "• " + x)].filter(Boolean).join("\n") }] },
        { h: "3 outreach messages", copy: true, items: L(o.outreach).map((m) => ({ label: m.channel, text: m.message })) },
        { h: "Tips", items: L(o.tips).map((t) => ({ text: "• " + t })) },
      ];
    case "offer-builder":
      return [
        { h: "Your service package", items: [{ label: o.name, text: [o.who_its_for && `Who it's for: ${o.who_its_for}`, o.problem && `Problem it solves: ${o.problem}`].filter(Boolean).join("\n") }] },
        { h: "What's included", items: L(o.deliverables).map((t) => ({ text: "• " + t })).concat(o.timeline ? [{ label: "Timeline", text: o.timeline }] : []) },
        { h: "Pricing", items: [{ label: o.price, text: o.price_reasoning }].concat(L(o.options).map((x) => ({ text: "• " + x }))) },
        { h: "Your pitch", copy: true, items: [{ label: "Short (one line)", text: o.pitch_short }, { label: "Longer (message or post)", text: o.pitch_long }] },
        { h: "Questions people will ask", items: L(o.faq).map((f) => ({ label: f.q, text: f.a })) },
      ];
    case "lead-follow-up":
      return [
        { h: "Your 5-message follow-up sequence", copy: true, items: L(o.messages).map((m, i) => ({ label: `${i + 1}. ${m.timing} — ${String(m.channel || "").toUpperCase()}${m.subject ? ` — Subject: ${m.subject}` : ""}`, text: m.body })) },
        { h: "Tips", items: L(o.tips).map((t) => ({ text: "• " + t })) },
        { h: "Reminder", items: [{ text: "These are drafts — nothing is sent for you. Only text or email people who gave you permission to contact them, and honor any request to stop." }] },
      ];
    case "lead-qualifier":
      return [
        { h: "Verdict", items: [{ label: o.verdict ? `${o.verdict.toUpperCase()}${o.confidence ? ` — ${o.confidence} confidence` : ""}` : "", text: o.reason }] },
        { h: "Buying signals", items: L(o.buying_signals).map((t) => ({ text: "• " + t })) },
        { h: "Red flags", items: L(o.red_flags).map((t) => ({ text: "• " + t })) },
        { h: "Suggested next message", copy: true, items: [{ label: o.next_step, text: o.next_message }] },
        { h: "Reminder", items: [{ text: "This is a draft — nothing is sent for you. A verdict is a judgment call, not a guarantee the prospect will or won't buy." }] },
      ].filter((s) => s.items.length);
    case "reactivation-kit":
      return [
        { h: "Campaign plan", items: L(o.plan).map((t) => ({ text: "• " + t })) },
        { h: "Email campaign", copy: true, items: L(o.emails).map((m, i) => ({ label: `Email ${i + 1} — ${m.timing}${m.subject ? ` — Subject: ${m.subject}` : ""}`, text: m.body })) },
        { h: "Text campaign", copy: true, items: L(o.sms).map((m, i) => ({ label: `Text ${i + 1} — ${m.timing}`, text: m.body })) },
        { h: "Before you send", items: [{ text: "Only contact customers who agreed to hear from you. Include a way to opt out (e.g. 'Reply STOP to opt out' for texts), and keep your customer list in your own system — never upload it anywhere you don't trust." }] },
      ].filter((s) => s.items.length);
    default:
      return [];
  }
}

export function toPlainText(title, appId, o) {
  const lines = [title, ""];
  for (const s of toSections(appId, o)) {
    lines.push(s.h.toUpperCase(), "");
    for (const it of s.items) { if (it.label) lines.push(it.label); if (it.text) lines.push(it.text); lines.push(""); }
  }
  lines.push(DISCLAIMER);
  return lines.join("\n");
}

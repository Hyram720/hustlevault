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
        { h: "Your offer", copy: true, items: [{ label: o.name, text: o.description || o.problem }] },
        { h: "Who it's for", items: [{ text: [o.who_its_for, o.problem && o.description && `Problem it solves: ${o.problem}`].filter(Boolean).join("\n") }] },
        { h: "What's included", copy: true, items: [{ text: L(o.deliverables).map((t) => "• " + t).join("\n") }] },
        { h: "Delivery timeline", items: o.timeline ? [{ text: o.timeline }] : [] },
        { h: "Suggested pricing", items: [{ label: o.price ? `Suggested range: ${o.price}` : "", text: [o.price_reasoning, ...L(o.options).map((x) => "• " + x)].filter(Boolean).join("\n") },
          { text: "This is a suggested starting price, not a promise of income or sales. Check what others charge near you and adjust." }] },
        { h: "Your pitch", copy: true, items: [{ label: "Short (one line)", text: o.pitch_short }, { label: "Post or message", text: o.pitch_long }].filter((x) => x.text) },
        { h: "Questions people will ask", items: L(o.faq).map((f) => ({ label: f.q, text: f.a })) },
      ].filter((s) => s.items.length && s.items.some((it) => it.text));
    case "lead-follow-up":
      return [
        { h: "Your 5-message follow-up sequence", copy: true, items: L(o.messages).map((m, i) => ({ label: `${i + 1}. ${m.timing} — ${String(m.channel || "").toUpperCase()}${m.subject ? ` — Subject: ${m.subject}` : ""}`, text: m.body })) },
        { h: "Tips", items: L(o.tips).map((t) => ({ text: "• " + t })) },
        { h: "Reminder", items: [{ text: "These are drafts — nothing is sent for you. Only text or email people who gave you permission to contact them, and honor any request to stop." }] },
      ];
    case "first-customer-finder":
      return [
        { h: L(o.results).length ? (L(o.results).length === 1 ? "Your top lead" : `Your top ${L(o.results).length} leads`) : "No strong leads right now", items: L(o.results).length
          ? L(o.results).map((r, i) => ({ label: `${i + 1}. ${r.sourceLabel} · ${r.date} · match ${r.score}/10`, text: [r.title, r.excerpt && `“${r.excerpt}”`, r.why && `Why it fits: ${r.why}`].filter(Boolean).join("\n\n"), link: r.url }))
          : [{ text: `We checked ${o.scanned || 0} recent public Bluesky and Hacker News posts and didn't find anyone clearly asking for this in the last year. That's common for local or very specific services — try the searches below yourself every few days, widen your area, or describe your service the way a customer would.` }] },
        { h: "How to reach out (the right way)", items: [{ text: "• Reply publicly with genuinely helpful advice; mention what you do only if it fits.\n• Only send a direct message if the poster invited offers or replies by DM.\n• Never copy-paste the same message to many people or tag strangers in promos.\n• Posts are public, but people aren't leads until they say yes." }] },
        { h: "Searches we ran", items: [{ text: L(o.queries).map((q) => "• " + q).join("\n") }] },
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
    for (const it of s.items) { if (it.label) lines.push(it.label); if (it.text) lines.push(it.text); if (it.link) lines.push(it.link); lines.push(""); }
  }
  lines.push(DISCLAIMER);
  return lines.join("\n");
}

// Optional transactional email via Resend's REST API. Off unless HV_RESEND_API_KEY + HV_EMAIL_FROM are set.
import { esc } from "../../shared/markdown.js";
import { LOGO_SPEC } from "../../shared/sponsors.js";
import { audit, updateSponsors, getSponsors } from "./content.mjs";

export const emailConfigured = () => !!(process.env.HV_RESEND_API_KEY && process.env.HV_EMAIL_FROM);
const SITE = "https://hustlevault.app";
export const sponsorLinks = (s) => ({
  stats: `${SITE}/sponsors/stats/${s.statsToken}`,
  edit: `${SITE}/sponsors/edit/${s.editToken}`,
  policy: `${SITE}/sponsors/policy`,
});

export function welcomeEmail(s) {
  const L = sponsorLinks(s);
  const subject = "Your Hustle Vault sponsor links";
  const textBody = [
    `Hi ${s.name},`,
    "",
    "Thanks for sponsoring Hustle Vault — your listing is now live on the sponsor wall and the scrolling ticker at hustlevault.app.",
    "",
    "Your private links (keep them to yourself):",
    `• Stats: ${L.stats}`,
    "  See how many times your logo was shown and clicked, by placement and by day.",
    `• Edit your listing: ${L.edit}`,
    "  Send us a new logo, offer line or link. We review changes before they go live.",
    "",
    LOGO_SPEC,
    "",
    "Your sponsorship is month to month — you can cancel anytime. Please keep your ad within our Ad Policy:",
    L.policy,
    "",
    "— Hustle Vault",
  ].join("\n");
  const a = (href, label) => `<a href="${esc(href)}" style="color:#9A6F12">${esc(label)}</a>`;
  const html = `<!doctype html><html><body style="margin:0;background:#f6f3ec;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #e6dfcc;border-radius:8px">
<tr><td style="background:#05050A;padding:18px 24px;border-radius:8px 8px 0 0;color:#C9A84C;font-weight:bold;letter-spacing:4px;font-size:14px">HUSTLE VAULT</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.6">
<p>Hi ${esc(s.name)},</p>
<p>Thanks for sponsoring Hustle Vault — your listing is now live on the sponsor wall and the scrolling ticker at ${a(SITE, "hustlevault.app")}.</p>
<p><b>Your private links</b> (keep them to yourself):</p>
<p><b>Stats:</b> ${a(L.stats, "View your sponsor stats")}<br><span style="color:#555">How many times your logo was shown and clicked, by placement and by day.</span></p>
<p><b>Edit your listing:</b> ${a(L.edit, "Update your logo, offer or link")}<br><span style="color:#555">We review changes before they go live.</span></p>
<p style="color:#555;font-size:13px">${esc(LOGO_SPEC)}</p>
<p>Your sponsorship is month to month — cancel anytime. Please keep your ad within our ${a(L.policy, "Ad Policy")}.</p>
<p>— Hustle Vault</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, text: textBody, html };
}

export async function sendEmail({ to, subject, text, html }) {
  const url = process.env.HV_RESEND_API_URL || "https://api.resend.com/emails";
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.HV_RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.HV_EMAIL_FROM, to: [to], subject, text, html, ...(process.env.HV_EMAIL_REPLY_TO ? { reply_to: process.env.HV_EMAIL_REPLY_TO } : {}) }),
    signal: AbortSignal.timeout(10000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Resend ${r.status}: ${String(d.message || d.name || "error").slice(0, 120)}`);
  return d.id || "sent";
}

// Sends the welcome email once per sponsor (force=true for the admin "Resend" button).
export async function sendWelcome(sponsorId, { force = false, trigger = "auto" } = {}) {
  const s = (await getSponsors()).list.find((x) => x.id === sponsorId);
  if (!s) return { ok: false, reason: "not_found" };
  if (!force && s.welcome?.sentAt) return { ok: true, already: true };
  const mark = async (welcome) => {
    await updateSponsors((list) => { const x = list.find((y) => y.id === sponsorId); if (!x) return null; x.welcome = welcome; return list; });
  };
  if (!s.email) { await mark({ ...(s.welcome || {}), skipped: "no_email", at: new Date().toISOString() }); return { ok: false, reason: "no_email" }; }
  if (!emailConfigured()) { await mark({ ...(s.welcome || {}), skipped: "not_configured", at: new Date().toISOString() }); return { ok: false, reason: "not_configured" }; }
  // Claim before sending so concurrent triggers can't double-send.
  if (!force) {
    let claimed = false;
    await updateSponsors((list) => {
      const x = list.find((y) => y.id === sponsorId);
      if (!x || x.welcome?.sentAt || x.welcome?.sending) return null;
      x.welcome = { sending: new Date().toISOString() }; claimed = true; return list;
    });
    if (!claimed) return { ok: true, already: true };
  }
  try {
    const id = await sendEmail({ to: s.email, ...welcomeEmail(s) });
    await mark({ sentAt: new Date().toISOString(), messageId: String(id).slice(0, 80), to: s.email });
    await audit("welcome_email_sent", { sponsor: s.id, name: s.name, to: s.email, trigger });
    return { ok: true };
  } catch (e) {
    await mark({ error: String(e.message).slice(0, 200), at: new Date().toISOString() });
    await audit("welcome_email_failed", { sponsor: s.id, name: s.name, error: String(e.message).slice(0, 200), trigger });
    return { ok: false, reason: "send_failed", error: e.message };
  }
}

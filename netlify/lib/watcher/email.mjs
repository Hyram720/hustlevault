// Pricing Watcher alert email via Resend REST. Off unless HV_RESEND_API_KEY + HV_EMAIL_FROM are set
// (same env vars as the sponsor welcome email). When off, alerts are stored and shown in the app instead.
import { describeChange } from "./diff.mjs";

export const emailConfigured = () => !!(process.env.HV_RESEND_API_KEY && process.env.HV_EMAIL_FROM);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const SITE = () => (process.env.URL && /^https:\/\//.test(process.env.URL) ? process.env.URL : "https://hustlevault.app");

export function alertEmail(alert, { unsubscribeUrl } = {}) {
  let host = alert.url; try { host = new URL(alert.url).hostname.replace(/^www\./, ""); } catch {}
  const name = alert.label || host;
  const lines = alert.changes.map(describeChange);
  const subject = `Pricing change: ${name} — ${lines[0]}${lines.length > 1 ? ` (+${lines.length - 1} more)` : ""}`.slice(0, 180);
  const app = `${SITE()}/apps/pricing-watcher`;
  const text = [
    `${name} changed its pricing page.`, "", ...lines.map((l) => "• " + l), "",
    `Page: ${alert.url}`, `First seen: ${alert.firstSeenAt}  ·  Confirmed: ${alert.confirmedAt} (UTC)`, "",
    `Open Pricing Watcher: ${app}`, unsubscribeUrl ? `Stop these emails: ${unsubscribeUrl}` : "", "",
    "— Hustle Vault Pricing Watcher (checked automatically; please double-check the page before acting)",
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f6f3ec;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #e6dfcc;border-radius:8px">
<tr><td style="background:#05050A;padding:18px 24px;border-radius:8px 8px 0 0;color:#C9A84C;font-weight:bold;letter-spacing:4px;font-size:14px">HUSTLE VAULT · PRICING WATCHER</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.6">
<p><b>${esc(name)}</b> changed its pricing page.</p>
<ul>${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
<p style="color:#555;font-size:13px">Page: <a href="${esc(alert.url)}" style="color:#9A6F12">${esc(alert.url)}</a><br>First seen ${esc(alert.firstSeenAt)} · confirmed ${esc(alert.confirmedAt)} (UTC)</p>
<p><a href="${esc(app)}" style="color:#9A6F12">Open Pricing Watcher</a></p>
<p style="color:#888;font-size:12px">Checked automatically — please double-check the page before acting.${unsubscribeUrl ? ` <a href="${esc(unsubscribeUrl)}" style="color:#888">Stop these emails</a>` : ""}</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}

export async function sendEmail({ to, subject, text, html, unsubscribeUrl }) {
  const url = process.env.HV_RESEND_API_URL || "https://api.resend.com/emails";
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.HV_RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.HV_EMAIL_FROM, to: [to], subject, text, html,
      ...(unsubscribeUrl ? { headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
      ...(process.env.HV_EMAIL_REPLY_TO ? { reply_to: process.env.HV_EMAIL_REPLY_TO } : {}),
    }),
    signal: AbortSignal.timeout(10000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Resend ${r.status}: ${String(d.message || d.name || "error").slice(0, 120)}`);
  return d.id || "sent";
}

// Legacy ebook success page data. Returns only what the buyer needs for the products in a paid
// ebook session: product titles, amount, and short-lived signed download links.
// Never returns the buyer's name, email or address, and never returns file locations.
import { legacyStripe, paidEbookSession, getProduct, signLink, LINK_TTL_MS } from "../lib/ebooks.mjs";
import { rateLimit } from "../lib/store.mjs";
import { ipHash } from "../lib/http.mjs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });

const MESSAGES = { 400: "Invalid order link.", 402: "Payment isn't complete yet.", 404: "Order not found.", 410: "This order was refunded." };

export default async (req, context) => {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
  const stripe = legacyStripe();
  if (!stripe) return json({ error: "Unavailable right now." }, 503);

  try {
    if (!(await rateLimit("ebook-verify", ipHash(context, req), 30, 600))) return json({ error: "Too many requests. Please wait a few minutes." }, 429);
    const sessionId = decodeURIComponent(new URL(req.url).pathname.split("/").pop() || "");
    const r = await paidEbookSession(stripe, sessionId);
    if (!r.ok) return json({ error: MESSAGES[r.status] || "Order not found." }, r.status);

    const items = r.ids.map(getProduct);
    const contents = items.map((p) => p.digitalContent).filter(Boolean);
    const seen = new Set();
    const files = [];
    for (const c of contents) for (const f of c.files || []) {
      if (!f.key || seen.has(f.key)) continue;
      seen.add(f.key);
      files.push({ name: f.name, type: f.type, size: f.size, url: `/api/ebook-file/${await signLink(f.key, sessionId)}` });
    }

    const digitalContent = contents.length
      ? {
          title: contents.length > 1 ? "Your Multi-Product Access" : contents[0].title,
          files,
          accessNote: contents.length > 1 ? "You now have access to all your purchased blueprints below." : contents[0].accessNote,
          bonus: contents.map((c) => c.bonus).filter(Boolean).join(" | "),
          linksExpireInMinutes: Math.round(LINK_TTL_MS / 60000),
        }
      : null;

    return json({
      verified: true,
      productId: r.ids[0],
      products: items.map((p) => ({ id: String(p.id), name: p.name })),
      digitalContent,
      amountTotal: r.session.amount_total,
    });
  } catch (err) {
    console.error("verify-session failed", err?.message);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
};

export const config = { path: "/api/verify-session/:sessionId" };

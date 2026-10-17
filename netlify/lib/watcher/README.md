# Competitor Pricing Watcher (private, admin-only)

Page: `/apps/pricing-watcher`. The public sees **Coming soon** (noindex). The working app needs the existing Hustle Vault admin session; the same token as `/admin` is stored in `sessionStorage.hv_admin_token`. The admin header links to it.

## How it works
- `watcher-scheduled` runs every 15 min (UTC). It checks only watches that are due: each page once a day, plus a confirmation re-check about 1 h after a suspected change. It stops after a 20 s budget because scheduled functions have a 30 s limit.
- `net.mjs` handles fetching. Only http/https on ports 80/443 are allowed, with no credentials in the URL. Private, loopback, link-local, CGNAT and metadata IPs are blocked at DNS-lookup time, on the socket itself, so DNS rebinding is covered. Every redirect is re-validated. robots.txt is honored and cached for 24 h. Requests send the UA `HustleVaultPricingWatcher/1.0`. Limits are 9 s and 2 MB per page. Bot walls such as Cloudflare are reported as "blocked" and never bypassed.
- `extract.mjs` turns HTML into visible text, then a pricing region, which is hashed. That region goes to gpt-4o-mini via Netlify AI Gateway (`netlify/lib/ai.mjs`) when available. Every name and price the model returns must appear in the page text, or it's dropped. Without AI, a deterministic parser is used. Tiers are then normalized (name key, cents, ISO currency, billing period).
- `diff.mjs` alerts only on: tier added or removed, price changed, billing period added or removed. Wording, features, limits and layout are ignored.
- `core.mjs` handles confirmation. A change must be seen on two consecutive fetches. When AI is used, the same text is also re-extracted once and must give the identical change set. If the page text is unchanged, the AI isn't called. "No prices found" (for example, JS-rendered pages) never counts as "all plans removed".
- `email.mjs` sends via Resend REST, but only when `HV_RESEND_API_KEY` and `HV_EMAIL_FROM` are set. The recipient is the admin setting, which has no default. Otherwise the alert is stored with `not_configured`/`no_recipient` and shown in the app. Emails are capped at 10 per day and carry a signed unsubscribe link plus a List-Unsubscribe header.
- Storage is the Netlify Blobs store `hv-watcher`: `settings` (alertEmail, plan limits), `watch/<id>`, `alert/<ts>_<id>`, `robots/*`, `emailcount/<day>`.
- The plan lives in settings (`maxWatches` 10, `checkEveryHours` 24, `confirmAfterMinutes` 60), so limits can change without a schema change.

## Tests
- `node test/watcher-unit.mjs` runs offline: fixtures, a local fixture server, a fake AI and a mock Resend.
- `HV_WATCHER_ALLOW_LOOPBACK=1 netlify dev --offline --port 8899 …` and then `BASE=http://localhost:8899 HV_ADMIN_PW=… node test/e2e-watcher.mjs` runs against local dev only. The loopback switch only works under `NETLIFY_DEV`.

## Limitations
- Pages that render prices with JavaScript are flagged "no prices". A headless fallback is a possible later add (Browserless free tier, 1k units a month).
- Checks run from Netlify's US region, so prices that vary by location show the US version.
- Renaming a tier shows up as one tier removed and one added.

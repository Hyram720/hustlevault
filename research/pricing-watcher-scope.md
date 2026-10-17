# Competitor Pricing Watcher — scope (Hustle Vault app)
Researched Sat Oct 17, 2026 (ET). Prices read from official pricing pages that day unless marked (3rd-party).

## Competitors
| Tool | Free tier | Paid (monthly) | Fastest check | Pages/checks | Alerts | Source |
|---|---|---|---|---|---|---|
| Visualping | 150 checks, 5 pages, 60 min | Personal $14 (1K checks/10 pages/15 min), $35 (5K/20/5 min), $70 (10K/40/2 min); Business $140–$350 | 2 min | check-based | email, Slack/Teams, webhooks (Business) | https://visualping.io/pricing |
| Distill.io | 25 monitors (5 cloud), 6 h, 1,000 cloud checks, 30 emails | Starter $15 (50 monitors, 10 min, 30K checks), Pro $35 (150, 5 min, 100K), Flexi $80+ | 2 min cloud | check-based | email, push, SMS, webhook | https://distill.io/pricing/ |
| ChangeTower | 5-day trial | Lite $12 (25 pages, daily), Essential $36 (100, hourly), Business $78 (200, Slack/webhooks) | hourly | page-based | email, Slack, webhook | https://www.changetower.com/pricing/ |
| Fluxguard | 3 sites | $110 (25 sites), $220 (50), $550 (100; AI filtering, 5 min, webhooks) | 5 min | credit-based (~10 pages/site/day) | email, webhooks | https://fluxguard.com/pricing |
| PageCrawl.io | 6 pages, 220 checks, 60 min | Standard $13.33/mo annual (200 pages, 15 min), Enterprise $25 (500, 5 min), Ultimate $83.25 | 1–2 min | page+check | email, Slack, etc.; Web Unblocker $10/GB | https://pagecrawl.io/pricing |
| Sken.io | — | €3 (500 checks), €12 (3K), €45 (15K) | 1 min | check-based | email etc. | https://sken.io/pricing |
| changedetection.io | Self-host open source (free) | Hosted $8.99/mo, 5,000 URL watches | — | — | email, Slack, Discord, many via Apprise | https://changedetection.io/ |
| Wachete (3rd-party, pricing page unreachable) | 5 static pages, 24 h | Starter $5.40 (50 pages, 60 min), Standard $10.90, Premium $54.90, Ultimate $329.90 | 5 min | page-based, no check cap | email, push, Slack/Teams/Discord/Telegram | https://www.wachete.com/faq ; https://monity.ai/blog/wachete-alternatives/ |
| Hexowatch (3rd-party, page JS-only) | no free tier listed | Pro $29 (4,500 checks, 15 min), Business $55 (10K, 5 min), Business+ $99.99 (25K, API) | 5 min | check-based | email, Slack, Telegram, webhooks | https://slicey.ai/tools/hexowatch |
| **Pricing-specific AI** | | | | | | |
| PriceMon | 1 competitor, manual | Starter $5 (5 competitors, daily), Pro $15 (25, hourly, email+Slack) | hourly | | email, Slack | https://pricemon.io/ |
| CostPeek | 3 competitors, weekly digest | Pro $9/mo, $79/yr | weekly | | email, Telegram | https://costpeek.com/ |
| PricePul | trial | $15 (5 URLs), $30 (20), $100 (unlimited) | 6–24 h | | Slack, email, CRM, webhook | https://pricepul.com/ |
| SaasTrack | 1 competitor, weekly | $39 (10 slots, daily), $99 (30) | daily | | email | https://www.saastrack.app/ |
| PricingMonitor.io | ? | not captured | daily | | email, Slack, Telegram | https://pricingmonitor.io/ |
| Klue / Crayon / Kompyte | none | quote only; ~$30K/yr median (Vendr, 3rd-party) | — | enterprise CI | — | https://calven.ai/resources/comparisons/klue-pricing |

Takeaway: generic monitors alert on any pixel/text change (noisy); pricing-specific AI tools are $5–$39/mo for 5–10 competitors with daily checks. Gap for Hustle Vault: beginner-friendly, "only tell me when a number or tier changes", cheap.

## Tech approach (Netlify Functions + Scheduled Functions + Blobs + AI Gateway + Stripe)
- **Fetch:** plain `fetch` with identifying UA (`HustleVaultPricingWatcher/1.0 (+url)`), 10 s timeout, 2 MB cap, manual redirects (re-validated). JS-rendered pages = v1 limitation (detected when no prices found → "page needs a browser" status). Headless options if needed later: Browserless free 1k units/mo, Prototyping $25/mo annual (20k units) https://www.browserless.io/pricing ; ScrapingBee 1,000 free credits, Hobby $19/mo https://www.scrapingbee.com/pricing/ .
- **Safety:** URL validation (http/https, ports 80/443, no creds), DNS resolve + block private/loopback/link-local/CGNAT/metadata IPs (SSRF), robots.txt honored, per-host rate limit, max 5 URLs/user. Cloudflare challenges → mark "blocked", do not bypass. Respect ToS; we only read public pages once/day.
- **Extract:** strip scripts/styles → visible text around currency tokens; deterministic regex parse of price cards first; LLM (gpt-4o-mini via Netlify AI Gateway, $0.15/1M in, $0.60/1M out — https://developers.openai.com/api/docs/pricing) to JSON `{tiers:[{name, price, currency, period, limits}]}`. ~6k in + 600 out tokens ≈ $0.0013/check → 5 pages daily ≈ $0.20/user/month.
- **Normalize & diff:** lowercase/trim tier names, price → number, period → month/year/one-time, currency ISO; ignore features wording. Alert only on tier added/removed, price change, period change. Confirm: change must appear on immediate re-fetch (and is held as "pending" otherwise) to kill A/B tests/promos.
- **Schedule:** Netlify scheduled functions run on cron (UTC), 30 s execution limit (https://docs.netlify.com/build/functions/scheduled-functions/) → scheduler fans out to a background function per batch.
- **Alerts:** Resend REST (Free: 3,000 emails/mo, 100/day; Pro $20 for 50K — https://resend.com/pricing). Slack incoming webhooks = v2. If email env unset, alert stored and shown in app.

## MVP v1
Add up to 5 competitor URLs + alert email; "Check now" preview of extracted tiers; daily scheduled check; change history; email alert; delete watch; unsubscribe link.

## Pricing suggestion
Free: 1 URL weekly. Starter $5/mo: 5 URLs daily. Pro $12/mo: 20 URLs, daily + Slack. Undercuts SaasTrack ($39), matches PriceMon ($5/$15), cheaper than Visualping for this use.

## Effort
MVP ~3–4 agent-days (fetch/safety 1, extraction+diff+tests 1, UI/storage/scheduler 1, polish/email 0.5–1). Headless fallback +1. Stripe billing +1.

## Gotchas
JS-only pricing pages; Cloudflare/bot walls; geo/currency by IP (Netlify servers are US); monthly/annual toggles (both shown in HTML vs one); LLM hallucination (mitigated: price must appear verbatim in page text); A/B tests; 30 s scheduled limit; Blobs is eventually consistent; email deliverability; legal/ToS of target sites.

## Open questions for Fred
1. Pricing tiers OK ($0/$5/$12)? 2. Daily enough, or hourly for Pro? 3. Slack in v1? 4. Pay for headless (~$25/mo) for JS sites? 5. Verified sending domain for Resend? 6. Name ("Pricing Watcher" / "PriceTripwire")?

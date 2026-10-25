import { useState } from "react";
import { Link } from "react-router-dom";
import { API } from "./config";
import { useSEO } from "./seo";
import { THEME, GRADIENT, GRADIENT_TEXT, ACCENT_RGB, BAR_BG } from "../shared/theme.js";

const C = { ...THEME };
const GG = GRADIENT;
const GT = GRADIENT_TEXT;

const CASE_STUDIES = [
  {
    num: "Case Study 1",
    title: "The 12-Month Track A Turnkey Flip ($201 Build to $2,250 Exit · $2,049 Net)",
    desc: "How a $189 Wyoming filing + $12 digital infrastructure stack sold to an Ohio 3PL logistics operator, including the Dual-Address FinCEN CDD banking fix that cleared Mercury onboarding in 3 hours."
  },
  {
    num: "Case Study 2",
    title: "The 90-Day Track B 80-Paydex Sprint ($614 Build to $3,850 Exit)",
    desc: "Building a verified 80+ Dun & Bradstreet Paydex profile across 5 Tier-1 Net-30 vendor tradelines, curing a Week-5 D&B split file, and transferring the EIN cleanly with IRS Form 8822-B."
  },
  {
    num: "Case Study 3",
    title: "The 5-Company Batch Portfolio Pipeline ($969 Base Build to $11,400 Combined Exit)",
    desc: "Running the 90-minute 5-corporation afternoon formation sprint and rescuing a restricted-word entity name ('Credit & Capital') via a $60 WyoBiz Articles of Amendment without losing its original formation date."
  },
  {
    num: "Case Study 4",
    title: "Rescuing a Distressed 3-Year Administratively Dissolved Corp ($410 Cost to $3,400 Exit)",
    desc: "Acquiring and reinstating a delinquent Wyoming corporation under W.S. 17-16-1422 so its 3-year charter age is restored retroactively with full buyer disclosure."
  },
  {
    num: "Case Study 5",
    title: "The Foreign Qualification & Multi-State Trap ($300 Build to $2,650 Exit)",
    desc: "How an out-of-state buyer in New Jersey and Pennsylvania uses a 2-year Wyoming C-Corporation for commercial banking and local contracting without resetting corporate age."
  },
  {
    num: "Case Study 6",
    title: "The Broker & Wholesale Exit Channel ($2,750 Sale via 20% Partner Split)",
    desc: "Partnering with commercial funding brokers, CPAs, and equipment finance advisors to move aged corporate inventory in 7 to 14 days with $0.00 in advertising spend."
  }
];

const TEMPLATES = [
  {
    name: "Template 1: 50-State & Domain Name-Screening Worksheet",
    desc: "The 4-Gate clearance checklist covering WyoBiz availability, exact .com domain registration, USPTO Class 35/36 word mark screening, and restricted banking keyword filters.",
    url: "/ebooks/aged-corporation-playbook/templates/template-1-50-state-domain-name-screening-worksheet.md"
  },
  {
    name: "Template 2: Bank-Ready Digital Bundle 14-Point Underwriting Checklist",
    desc: "Step-by-step verification for the 6-page corporate website, SSL/TLS, custom domain MX/SPF/DKIM/DMARC records, and corporate governance binder.",
    url: "/ebooks/aged-corporation-playbook/templates/template-2-bank-ready-digital-bundle-14-point-checklist.md"
  },
  {
    name: "Template 3: 90-Day 80-Paydex Net-30 Vendor Seasoning Tracker",
    desc: "Invoice cycle tracker for Uline, Quill, Grainger, CEO Creative, and Crown Office Supplies to trigger an 80-85 D&B Paydex score in 75 to 90 days.",
    url: "/ebooks/aged-corporation-playbook/templates/template-3-90-day-80-paydex-net30-vendor-seasoning-tracker.md"
  },
  {
    name: "Template 4: 7-Document Same-Day Closing & Ownership Transfer Checklist",
    desc: "Complete closing protocol covering the Stock Purchase Agreement, Irrevocable Stock Power, Officer/Director Resignation & Election, WyoBiz update, and IRS EIN handoff.",
    url: "/ebooks/aged-corporation-playbook/templates/template-4-7-document-same-day-closing-transfer-checklist.md"
  }
];

export default function AgedCorpPlaybook() {
  const [loading, setLoading] = useState(false);

  useSEO({
    title: "The Aged Corporation Playbook (2026 Edition) – Buy, Build & Flip Shelf Corporations | Hustle Vault",
    description: "How to Buy, Build, and Flip Shelf Corporations for $1,500 to $4,500+: 7-Chapter Execution Guide, 6 Wyoming C-Corp Case Studies & 4 Closing Checklists. 115-page 6x9 print & digital edition.",
    path: "/aged-corporation-playbook",
    image: "https://hustlevault.app/og/aged-corporation-playbook.jpg",
    type: "book",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Book",
      "name": "The Aged Corporation Playbook",
      "alternativeHeadline": "How to Buy, Build, and Flip Shelf Corporations for $1,500 to $4,500+: 7-Chapter Execution Guide, 6 Wyoming C-Corp Case Studies & 4 Closing Checklists",
      "BookFormat": "https://schema.org/EBook",
      "numberOfPages": 115,
      "bookEdition": "1st Edition (2026)",
      "author": { "@type": "Organization", "name": "Hustle Vault" },
      "publisher": { "@type": "Organization", "name": "Hustle Vault", "url": "https://hustlevault.app" },
      "image": "https://hustlevault.app/ebooks/aged-corporation-playbook/cover-variant-a.jpg",
      "url": "https://hustlevault.app/aged-corporation-playbook",
      "offers": [
        {
          "@type": "Offer",
          "name": "Hustle Vault Direct Digital Bundle (115-Page 6x9 PDF + 4 Operational Checklists)",
          "price": "12.99",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": "https://hustlevault.app/aged-corporation-playbook"
        },
        {
          "@type": "Offer",
          "name": "6x9 Paperback Print Edition (Amazon KDP)",
          "price": "24.99",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      ]
    }
  });

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: "aged-corporation-playbook" })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.open("/ebooks/aged-corporation-playbook/the-aged-corporation-playbook.pdf", "_blank");
      }
    } catch {
      window.open("/ebooks/aged-corporation-playbook/the-aged-corporation-playbook.pdf", "_blank");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.cream, fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Top Bar */}
      <div style={{ background: BAR_BG, borderBottom: `1px solid ${C.gold}40`, padding: "10px 20px", textAlign: "center", fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 2, textTransform: "uppercase" }}>
        Hustle Vault Business Playbook Series · 2026 Edition · 115 Pages (6" × 9")
      </div>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: "0 20px", background: C.surface }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ ...GT, fontSize: 15, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", textDecoration: "none" }}>
            ← Hustle Vault
          </Link>
          <div style={{ display: "flex", gap: 18, alignItems: "center", fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase", fontFamily: "Georgia, serif" }}>
            <Link to="/#start" style={{ color: C.muted, textDecoration: "none" }}>AI Tools</Link>
            <Link to="/blog" style={{ color: C.muted, textDecoration: "none" }}>Blog</Link>
            <Link to="/sponsors" style={{ color: C.muted, textDecoration: "none" }}>Advertise</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ maxWidth: 1160, margin: "0 auto", padding: "56px 20px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 44, alignItems: "center", marginBottom: 64 }}>
          {/* Cover Image */}
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-block", padding: 12, background: C.surface, border: `1px solid ${C.gold}55`, borderRadius: 10, boxShadow: `0 28px 70px rgba(0,0,0,0.75), 0 0 35px rgba(${ACCENT_RGB},0.15)` }}>
              <img
                src="/ebooks/aged-corporation-playbook/cover-variant-a.jpg"
                alt="The Aged Corporation Playbook - High-Contrast Cover Variant A"
                style={{ width: "100%", maxWidth: 360, height: "auto", borderRadius: 6, display: "block" }}
              />
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: C.muted }}>
              6" × 9" Trim · 115 Rendered Pages · 6 Case Studies · 4 Checklists &amp; 7 Closing Templates
            </div>
          </div>

          {/* Copy & CTA */}
          <div>
            <div style={{ display: "inline-block", background: `${C.gold}18`, border: `1px solid ${C.gold}50`, color: C.gold, fontSize: 10, fontWeight: 800, letterSpacing: 2.5, padding: "5px 14px", borderRadius: 100, textTransform: "uppercase", marginBottom: 16 }}>
              Hustle Vault Business Playbook Series · Edition 1 (2026)
            </div>
            <h1 style={{ fontSize: "clamp(30px, 4.5vw, 46px)", fontWeight: 950, lineHeight: 1.08, marginBottom: 14 }}>
              <span style={GT}>The Aged Corporation Playbook</span>
            </h1>
            <p style={{ fontSize: 18, color: C.cream, fontWeight: 700, lineHeight: 1.45, marginBottom: 16 }}>
              How to Buy, Build, and Flip Shelf Corporations for $1,500 to $4,500+: 7-Chapter Execution Guide, 6 Wyoming C-Corp Case Studies &amp; 4 Closing Checklists
            </p>
            <p style={{ fontSize: 15, color: C.body, lineHeight: 1.7, marginBottom: 24 }}>
              Turn a $189 Wyoming state filing and a $12 digital infrastructure stack into a $1,995 to $4,500+ turnkey corporate asset. Learn why bare paper filings fail modern bank KYC checks, and how to build <strong style={{ color: C.cream }}>Track A Bank-Ready Digital Bundles</strong> (EIN-free during aging so zero Form 1120 returns are due) and <strong style={{ color: C.cream }}>Track B 90-Day 80-Paydex Credit-Seasoned Wyoming C-Corporations</strong>.
            </p>

            {/* Pricing Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, marginBottom: 24 }}>
              <div style={{ background: C.surface, border: `2px solid ${C.gold}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 10, color: C.gold, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Hustle Vault Direct Digital Bundle</div>
                <div style={{ fontSize: 32, fontWeight: 950, color: C.cream, margin: "6px 0" }}>$12.99 <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>USD</span></div>
                <div style={{ fontSize: 12, color: C.body, lineHeight: 1.5 }}>Instant Digital Download: Complete 115-Page 6"×9" PDF Playbook + 4 Standalone Operational Checklists &amp; Closing Templates</div>
              </div>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Amazon KDP Print &amp; Kindle Editions</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.cream, margin: "8px 0 4px" }}>$24.99 <span style={{ fontSize: 12, color: C.muted }}>6"×9" Paperback</span></div>
                <div style={{ fontSize: 13, color: C.gold, fontWeight: 700, marginBottom: 4 }}>$9.99 Kindle eBook Edition</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>115 Pages · Black &amp; White Interior · High-Contrast Full-Wrap Cover Variant A</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <button
                onClick={handleCheckout}
                disabled={loading}
                style={{
                  background: GG,
                  color: "#000",
                  border: "none",
                  padding: "16px 28px",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontFamily: "Georgia, serif",
                  borderRadius: 4,
                  cursor: "pointer",
                  boxShadow: `0 8px 28px rgba(${ACCENT_RGB},0.35)`
                }}
              >
                {loading ? "Opening Checkout..." : "Buy Direct Digital Bundle — $12.99"}
              </button>
              <a
                href="/ebooks/aged-corporation-playbook/the-aged-corporation-playbook.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "transparent",
                  color: C.gold,
                  border: `1px solid ${C.gold}`,
                  padding: "16px 24px",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontFamily: "Georgia, serif",
                  borderRadius: 4,
                  textDecoration: "none"
                }}
              >
                Download 115-Page 6×9 PDF ↓
              </a>
            </div>
            <p style={{ fontSize: 11, color: C.dim, lineHeight: 1.5 }}>
              Educational and operational business guide only; not legal, tax, or securities advice.
            </p>
          </div>
        </div>

        {/* Part I: 7 Core Chapters */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 18 }}>
            <span style={GT}>Part I: The 7 Core Strategy &amp; Execution Chapters</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              ["Chapter 1: The Economics of Time-in-Business", "Why commercial banks, equipment lessors, and warehouse REITs enforce a strict 12-to-24-month entity-age filter, and why buyers pay $1,500 to $4,500+ for clean aged C-Corporations."],
              ["Chapter 2: Why Wyoming C-Corporations Win", "100,000 Common Shares at No Par Value ($0.0000), $102 online WyoBiz formation, $60/year annual report, 0% state corporate income tax, and the 4-Gate Prestige Corporate Naming Formula."],
              ["Chapter 3: Track A ($12 Digital Bundle) vs. Track B (80-Paydex)", "How to deploy the 6-page corporate website, matching .com domain, and custom DNS email for $12, plus the 5-step 90-day Dun & Bradstreet 80-Paydex vendor seasoning protocol."],
              ["Chapter 4: Critical Tax, Legal & FinCEN Banking Compliance", "Avoiding the $220/month IRS Form 1120 trap by keeping Track A inventory EIN-free during aging, transferring Track B EINs via IRS Form 8822-B, and never selling pre-opened bank accounts."],
              ["Chapter 5: Pricing Tiers & High-Converting Buyer Channels", "How to price 12-month, 24-month, and 80-Paydex corporations across direct buyer marketplaces, CPAs, commercial loan brokers, and equipment finance partners."],
              ["Chapter 6: The 7-Document Same-Day Closing & Transfer Protocol", "Executing the Stock Purchase Agreement, Bill of Sale & Irrevocable Stock Power, Resignation & Election of Officers/Directors, Stock Certificate #2, and live WyoBiz updates in 30 minutes."],
              ["Chapter 7: Portfolio Scaling & The 4-Quarter Cohort Model", "How forming 5 Wyoming C-Corporations per quarter builds a rolling 20-entity corporate vault with predictable annual renewal and exit margins."]
            ].map(([title, desc]) => (
              <div key={title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: C.gold, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13.5, color: C.body, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Part II: 6 Case Studies */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 18 }}>
            <span style={GT}>Part II: 6 Full-Number Wyoming C-Corp Flip Case Studies</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {CASE_STUDIES.map((cs) => (
              <div key={cs.num} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 22 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.green, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{cs.num}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: C.cream, marginBottom: 8 }}>{cs.title}</h3>
                <p style={{ fontSize: 13.5, color: C.body, lineHeight: 1.6 }}>{cs.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Part III: 4 Operational Checklists & Templates */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 18 }}>
            <span style={GT}>Part III: 4 Included Operational Checklists &amp; Closing Templates</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {TEMPLATES.map((tpl) => (
              <div key={tpl.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: C.cream, marginBottom: 8 }}>{tpl.name}</h3>
                  <p style={{ fontSize: 13, color: C.body, lineHeight: 1.6, marginBottom: 16 }}>{tpl.desc}</p>
                </div>
                <a
                  href={tpl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: 1.5, textTransform: "uppercase", textDecoration: "none" }}
                >
                  Download Template (.MD) →
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

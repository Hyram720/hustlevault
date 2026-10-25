# APPENDIX B (TEMPLATE 2): Bank-Ready Digital Bundle 14-Point Underwriting Checklist

**Purpose:** Use this 14-Point Quality Assurance Checklist on every Track A and Track B corporation before listing the entity for sale or handing the package to a buyer. Passing all 14 points ensures the corporation satisfies automated underwriting verification scans (Middesk, LexisNexis Risk Solutions, Alloy, Socure, D&B, and Stripe).

---

## PART 1: SECRETARY OF STATE & GOVERNANCE VERIFICATION (POINTS 1 - 4)

- [ ] **Point 1 - Active Wyoming Good Standing Verified Today:**
  Pulled a fresh PDF **Certificate of Good Standing** from `wyobiz.wyo.gov` confirming Status = `Active`, Standing = `Good Standing`, and zero delinquent annual reports.
- [ ] **Point 2 - Certified Articles of Incorporation & Initial Filing Receipt:**
  Saved original stamped PDF Articles of Incorporation showing `100,000 Common Shares` at `$0.0000 No Par Value` and initial incorporator details.
- [ ] **Point 3 - Standardized USPS NAP String Consistency:**
  Verified that the corporate legal name (including `, Inc.` or `, Corp.`) and registered office street/suite formatting are 100% character-for-character identical across WyoBiz, website footer, letterhead, and corporate binder.
- [ ] **Point 4 - Complete Digital Corporate Binder Assembled:**
  Verified inclusion of:
  1. Corporate Bylaws (signed & dated as of Formation Date)
  2. Initial Organizational Minutes of the Board of Directors
  3. Corporate Stock Ledger (showing Certificate #1 issued for 100,000 Common Shares)
  4. High-Resolution Stock Certificate #1 & Blank Stock Certificate #2 Template
  5. Board of Directors Banking Resolution Template (ready for Buyer's bank)

---

## PART 2: DOMAIN, SSL WEBSITE & EMAIL INFRASTRUCTURE (POINTS 5 - 10)

- [ ] **Point 5 - Matching `.com` Domain Active & Unlocked for Transfer:**
  Confirmed `companyname.com` is active, WHOIS Creation Date matches the entity aging window, and registrar account is ready for instant push to the Buyer.
- [ ] **Point 6 - Valid HTTPS / SSL Certificate Active (`https://`):**
  Confirmed automatic Let's Encrypt TLS/SSL certificate is active on both apex (`companyname.com`) and `www.companyname.com` with automatic HTTP-to-HTTPS redirect enabled.
- [ ] **Point 7 - All 6 Required Corporate Webpage Routes Live & Mobile-Responsive:**
  1. `/index.html` (Home - Legal corporate name in header/footer, value proposition, core services)
  2. `/about.html` (About Us - Corporate overview, governance standards, year established)
  3. `/services.html` (Services - Clear, low-risk B2B management/advisory/logistics descriptions matching NAICS `541611`)
  4. `/leadership.html` (Leadership & Governance - Ready for Buyer's executive bio)
  5. `/contact.html` (Contact - Working contact form, corporate address, business hours, phone, and `@companyname.com` email)
  6. `/privacy.html` & `/terms.html` (Privacy Policy & Terms of Service - Mandatory for Stripe/bank/10DLC compliance)
- [ ] **Point 8 - Zero Placeholder Text or Broken Links:**
  Audited every page of the website to confirm zero `"Lorem Ipsum"`, zero `"Coming Soon"` banners, and zero broken links.
- [ ] **Point 9 - Custom `@companyname.com` Email Accounts Active:**
  Configured `info@`, `admin@`, and `executive@companyname.com` mailboxes and verified instant inbound/outbound mail flow.
- [ ] **Point 10 - DNS Email Authentication Records (`SPF`, `DKIM`, `DMARC`) Passing:**
  Verified DNS TXT records for `SPF`, `DKIM`, and `DMARC` so automated bank email-domain checks score 10/10.

---

## PART 3: CORPORATE IDENTITY KIT & CLEAN-ENTITY AUDIT (POINTS 11 - 14)

- [ ] **Point 11 - Executive Corporate Identity Kit Included:**
  Packaged high-resolution PNG/SVG Corporate Logo, editable Word/Google Docs Corporate Letterhead, and Business Card template.
- [ ] **Point 12 - UCC-1 Lien & Litigation Clear Sweep:**
  Confirmed zero UCC-1 financing statements and zero federal/state court filings against the corporate name.
- [ ] **Point 13 - Tax & EIN Status Verified & Documented:**
  - *If Track A:* Confirmed **NO prior EIN** has ever been requested (`100% Virgin Tax Status`), requiring zero prior Form 1120 returns.
  - *If Track B:* Included IRS CP 575 EIN Confirmation Letter, copies of any prior-year `$0`-activity Form 1120 filings, and pre-filled **IRS Form 8822-B** for Buyer signature at closing.
- [ ] **Point 14 - Buyer "Day-1 Bank Onboarding Cheat Sheet" Attached:**
  Included the 1-page instruction sheet reminding the Buyer to list the Wyoming Registered Agent address as the *Legal/Registered Address* and their actual home office or commercial suite as the *Physical Operating Address (KYC Address)* when opening their bank account.

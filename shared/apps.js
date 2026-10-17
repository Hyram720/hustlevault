// Hustle Vault AI app catalog — shared by the website and the server functions.
// Prices are in cents. `status`: "live" (anyone can buy), "soon" (shown as Coming soon,
// not buyable), "hidden" (not shown). Admin overrides live in storage and win over these defaults.
// New apps default to "soon" until a real paid test passes.

export const VENTURECHECK_URL = "https://venturecheck-dun.vercel.app/";

export const APPS = [
  {
    id: "venturecheck", path: "start", name: "VentureCheck", price: 499, status: "live", external: true,
    url: VENTURECHECK_URL,
    tagline: "Find out if your business idea is worth your time.",
    give: "Your business idea and 7 quick answers about you",
    get: "A free score, then a full report with your next steps",
    fast: "About 3 minutes",
  },
  {
    id: "first-sale-blueprint", path: "start", name: "First Sale Blueprint", price: 900, status: "soon",
    tagline: "A simple 7-day plan to go after your first paying customer.",
    give: "Your idea, budget, location, free time and experience",
    get: "A 7-day action plan, a starter offer, pricing, and 3 outreach messages (PDF)",
    fast: "About 2 minutes",
  },
  {
    id: "offer-builder", path: "start", name: "AI Offer Builder", price: 900, status: "soon",
    tagline: "Turn what you're good at into a service people can buy.",
    give: "Your skills and who you'd like to help",
    get: "A ready-to-sell service package with pricing and a short pitch",
    fast: "About 2 minutes",
  },
  {
    id: "first-customer-finder", path: "start", name: "First Customer Finder", price: 500, status: "soon",
    tagline: "Find real people on Reddit who are asking for what you sell.",
    give: "Your business idea and (optionally) your city or area",
    get: "Up to 10 recent public Reddit posts from people looking for your service — with the post, subreddit, date and link",
    fast: "About 1 minute",
  },
  {
    id: "objection-coach", path: "grow", name: "Sales Objection Coach", price: 500, status: "soon",
    tagline: "Know exactly what to say when a customer pushes back.",
    give: "Your industry and the objection you keep hearing",
    get: "A 5-step answer script plus one practice session where AI plays the customer and scores you",
    fast: "Under 1 minute",
  },
  {
    id: "lead-follow-up", path: "grow", name: "Lead Follow-Up Builder", price: 900, status: "soon",
    tagline: "Never let a warm lead go cold again.",
    give: "Who the lead is and what you sell",
    get: "5 text + email follow-ups with timing and an appointment ask (you send them yourself)",
    fast: "About 1 minute",
  },
  {
    id: "reactivation-kit", path: "grow", name: "Customer Reactivation Kit", price: 1900, status: "soon",
    tagline: "Win back past customers without sharing any customer data.",
    give: "Your business type and a reason to come back (no customer lists needed)",
    get: "Ready-to-send email and text campaigns you can download",
    fast: "About 2 minutes",
  },
  {
    id: "lead-qualifier", path: "grow", name: "Lead Qualifier", price: 500, status: "soon",
    tagline: "Know if a prospect is ready to buy — or wasting your time.",
    give: "A prospect's reply (email, text or DM) and a little context",
    get: "A clear verdict — Push, Nurture or Walk away — with the reasons, buying signals, red flags and a suggested next message",
    fast: "Under 1 minute",
  },
];

export const COACH_INDUSTRIES = {
  real_estate: {
    label: "Real estate",
    objections: [
      "I want to wait until interest rates come down.",
      "Your commission is too high.",
      "I'm going to sell it myself.",
      "We're just looking right now.",
      "I need to talk it over with my spouse.",
    ],
  },
  life_insurance: {
    label: "Life insurance",
    objections: [
      "I can't afford it right now.",
      "I already have coverage through work.",
      "I'm young and healthy, I don't need it yet.",
      "I need to think about it.",
      "I don't trust insurance companies.",
    ],
  },
  solar: {
    label: "Solar",
    objections: [
      "Solar is too expensive.",
      "I'm planning to move in a few years.",
      "I don't want a loan or a lien on my house.",
      "My roof is too old or too shady.",
      "I want to get a few more quotes first.",
    ],
  },
  other: {
    label: "Other",
    objections: [
      "It's too expensive.",
      "I need to think about it.",
      "Now isn't a good time.",
      "I'm already working with someone else.",
      "Just send me some information.",
    ],
  },
};

export const COACH_MAX_TURNS = 6;

// Input forms for the generic app page + server validation (same schema both sides).
const BUDGETS = ["$0 — no money to spend", "Under $100", "$100 – $500", "$500 – $2,000", "More than $2,000"];
const HOURS = ["Less than 5 hours a week", "5 – 10 hours a week", "10 – 20 hours a week", "20+ hours a week"];
const EXPERIENCE = ["Total beginner", "Some experience", "Experienced"];

export const APP_FORMS = {
  "first-sale-blueprint": [
    { name: "idea", label: "What do you want to sell or offer?", type: "textarea", max: 240, min: 4, placeholder: "e.g. Mobile car detailing for busy parents" },
    { name: "budget", label: "How much can you spend to start?", type: "select", options: BUDGETS },
    { name: "location", label: "Where are you? (city/area, or 'online only')", type: "text", max: 80, min: 2, placeholder: "e.g. Camden County, NJ" },
    { name: "time", label: "How much time do you have?", type: "select", options: HOURS },
    { name: "experience", label: "Your experience with this", type: "select", options: EXPERIENCE },
    { name: "skills", label: "Anything you're already good at? (optional)", type: "textarea", max: 240, min: 0, placeholder: "e.g. Talking to people, organizing, social media" },
  ],
  "offer-builder": [
    { name: "skills", label: "What are you good at?", type: "textarea", max: 300, min: 4, placeholder: "e.g. Bookkeeping, I'm organized and patient" },
    { name: "audience", label: "Who would you like to help?", type: "text", max: 120, min: 3, placeholder: "e.g. Small restaurants and food trucks" },
    { name: "experience", label: "Your experience level", type: "select", options: EXPERIENCE },
    { name: "time", label: "How much time can you give clients?", type: "select", options: HOURS },
    { name: "delivery", label: "How would you deliver it?", type: "select", options: ["In person", "Online / remote", "Either"] },
  ],
  "lead-follow-up": [
    { name: "business", label: "What do you sell?", type: "text", max: 120, min: 3, placeholder: "e.g. Roof replacements" },
    { name: "leadSource", label: "Where did the lead come from?", type: "select", options: ["Website form", "Phone call", "Door knock / in person", "Referral", "Social media", "Event or trade show", "Other"] },
    { name: "leadStage", label: "Where are they now?", type: "select", options: ["New — haven't talked yet", "Talked once, went quiet", "Got a quote, didn't decide", "Said 'not right now'"] },
    { name: "appointment", label: "What appointment do you want?", type: "text", max: 80, min: 3, placeholder: "e.g. 20-minute free roof inspection" },
    { name: "tone", label: "Tone", type: "select", options: ["Friendly", "Professional", "Casual"] },
    { name: "notes", label: "Anything else? (optional — no names or phone numbers)", type: "textarea", max: 240, min: 0, placeholder: "e.g. They mentioned a leak in the back bedroom" },
  ],
  "first-customer-finder": [
    { name: "idea", label: "What do you sell or want to offer?", type: "text", max: 160, min: 4, placeholder: "e.g. Mobile notary, dog walking, website design" },
    { name: "area", label: "Who can you serve?", type: "select", options: ["People near me (local)", "Anyone (online / remote)"] },
    { name: "location", label: "Your city or area (optional, for local)", type: "text", max: 80, min: 0, placeholder: "e.g. Philadelphia, PA" },
  ],
  "lead-qualifier": [
    { name: "reply", label: "Paste the prospect's reply", type: "textarea", max: 1500, min: 10, rows: 6, placeholder: "e.g. \"Sounds interesting but we're pretty busy right now. What would this cost us?\" (remove phone numbers and email addresses)" },
    { name: "channel", label: "Where did they reply?", type: "select", options: ["Email", "Text message", "DM (social media)", "Other"] },
    { name: "offer", label: "What did you offer? (optional)", type: "text", max: 160, min: 0, placeholder: "e.g. Monthly lawn care service" },
    { name: "pricePoint", label: "Price point (optional)", type: "text", max: 60, min: 0, placeholder: "e.g. $150/month" },
    { name: "context", label: "Anything else we should know? (optional)", type: "textarea", max: 300, min: 0, placeholder: "e.g. Second follow-up, they asked for a quote last week" },
  ],
  "reactivation-kit": [
    { name: "business", label: "What kind of business do you run?", type: "text", max: 120, min: 3, placeholder: "e.g. Hair salon" },
    { name: "offer", label: "What's your reason for them to come back?", type: "textarea", max: 240, min: 3, placeholder: "e.g. 15% off a return visit this month, or a new service" },
    { name: "since", label: "How long since they last bought?", type: "select", options: ["1 – 3 months", "3 – 6 months", "6 – 12 months", "Over a year"] },
    { name: "tone", label: "Tone", type: "select", options: ["Warm and personal", "Professional", "Fun and upbeat"] },
    { name: "channels", label: "Which campaigns do you want?", type: "select", options: ["Email and text", "Email only", "Text only"] },
  ],
};

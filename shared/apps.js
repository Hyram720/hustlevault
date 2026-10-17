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

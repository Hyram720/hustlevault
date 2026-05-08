// Digital product content — what customers get after purchase
// In production, replace these with real PDF URLs, Google Drive links, or hosted file URLs.
// You can also manage these from the admin panel.

const DIGITAL_PRODUCTS = {
  1: {
    id: 1,
    title: "UNIT GOLD — Storage Auction Blueprint",
    files: [
      { name: "Unit Gold Blueprint — Full Guide.pdf", type: "pdf", size: "2.4 MB", url: "" },
      { name: "Auction Day Checklist.pdf", type: "pdf", size: "340 KB", url: "" },
      { name: "Flip Profit Calculator.xlsx", type: "spreadsheet", size: "180 KB", url: "" },
    ],
    accessNote: "You now have lifetime access to the Unit Gold Blueprint. Download your files below or access them anytime from your email.",
    bonus: "BONUS: Join our private community for live auction tips.",
  },
  2: {
    id: 2,
    title: "DEALER LICENSE — Car Flipping Blueprint",
    files: [
      { name: "Dealer License Blueprint — Full Guide.pdf", type: "pdf", size: "3.1 MB", url: "" },
      { name: "State-by-State License Requirements.pdf", type: "pdf", size: "520 KB", url: "" },
      { name: "Car Flip Profit Tracker.xlsx", type: "spreadsheet", size: "210 KB", url: "" },
    ],
    accessNote: "You now have lifetime access to the Dealer License Blueprint. Download your files below.",
    bonus: "BONUS: Access our wholesale car auction contact list.",
  },
  3: {
    id: 3,
    title: "HUSTLE BUNDLE — Unit Gold + Dealer License",
    files: [
      { name: "Unit Gold Blueprint — Full Guide.pdf", type: "pdf", size: "2.4 MB", url: "" },
      { name: "Auction Day Checklist.pdf", type: "pdf", size: "340 KB", url: "" },
      { name: "Flip Profit Calculator.xlsx", type: "spreadsheet", size: "180 KB", url: "" },
      { name: "Dealer License Blueprint — Full Guide.pdf", type: "pdf", size: "3.1 MB", url: "" },
      { name: "State-by-State License Requirements.pdf", type: "pdf", size: "520 KB", url: "" },
      { name: "Car Flip Profit Tracker.xlsx", type: "spreadsheet", size: "210 KB", url: "" },
    ],
    accessNote: "You now have lifetime access to BOTH blueprints. Download all your files below.",
    bonus: "BONUS: Full community access + wholesale contact list.",
  },
  4: {
    id: 4,
    title: "REPO BLUEPRINT — Vehicle Repossession",
    files: [
      { name: "Repo Blueprint — Full Guide.pdf", type: "pdf", size: "2.8 MB", url: "" },
      { name: "Repo Company Startup Checklist.pdf", type: "pdf", size: "290 KB", url: "" },
      { name: "Client Outreach Templates.docx", type: "doc", size: "150 KB", url: "" },
    ],
    accessNote: "You now have lifetime access to the Repo Blueprint. Download your files below.",
    bonus: "BONUS: Pre-built client outreach email templates included.",
  },
  5: {
    id: 5,
    title: "LAND FLIP FORMULA — Buy Cheap Land, Sell 3X",
    files: [
      { name: "Land Flip Formula — Full Guide.pdf", type: "pdf", size: "3.4 MB", url: "" },
      { name: "County Research Worksheet.pdf", type: "pdf", size: "280 KB", url: "" },
      { name: "Deal Analyzer Spreadsheet.xlsx", type: "spreadsheet", size: "195 KB", url: "" },
    ],
    accessNote: "You now have lifetime access to the Land Flip Formula. Download your files below.",
    bonus: "BONUS: Top 50 counties for cheap land deals list included.",
  },
  6: {
    id: 6,
    title: "NEMT BLUEPRINT — Medical Transport Business",
    files: [
      { name: "NEMT Blueprint — Full Guide.pdf", type: "pdf", size: "3.2 MB", url: "" },
      { name: "Medicaid Enrollment Guide.pdf", type: "pdf", size: "410 KB", url: "" },
      { name: "Route & Revenue Planner.xlsx", type: "spreadsheet", size: "220 KB", url: "" },
    ],
    accessNote: "You now have lifetime access to the NEMT Blueprint. Download your files below.",
    bonus: "BONUS: State Medicaid enrollment steps included.",
  },
};

export default DIGITAL_PRODUCTS;

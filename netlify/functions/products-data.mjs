// Product catalog used by the checkout functions.
// Prices are in cents. Keep in sync with server/data/products.json.
export const PRODUCTS = {
  1: {
    id: 1, name: "UNIT GOLD — Storage Auction Blueprint", description: "Win storage auctions and flip contents for profit.",
    price: 5700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "UNIT GOLD — Storage Auction Blueprint",
      files: [{ name: "Unit Gold Storage Auction Blueprint HustleVault.pdf", type: "pdf", size: "7.8 KB", key: "unit-gold-storage-auction-blueprint.pdf" }],
      accessNote: "You now have lifetime access to the Unit Gold Blueprint.",
      bonus: "BONUS: Join our private community for live auction tips.",
    },
  },
  2: {
    id: 2, name: "DEALER LICENSE — Car Dealer License Guide", description: "Get licensed and access wholesale auctions to flip cars.",
    price: 4700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "DEALER LICENSE — Car Dealer License Guide",
      files: [{ name: "Dealer_License_Guide_HustleVault.pdf", type: "pdf", size: "30 KB", key: "dealer-license-guide.pdf" }],
      accessNote: "You now have lifetime access to the Dealer License Guide.",
    },
  },
  3: {
    id: 3, name: "REPO BLUEPRINT — Vehicle Repossession Business", description: "Get paid per vehicle recovered. Recession-proof income.",
    price: 3700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "REPO BLUEPRINT — Vehicle Repossession Business",
      files: [{ name: "Repo_Blueprint_HustleVault.pdf", type: "pdf", size: "32 KB", key: "repo-blueprint.pdf" }],
      accessNote: "You now have lifetime access to the Repo Blueprint.",
    },
  },
  4: {
    id: 4, name: "LAND FLIP FORMULA — Buy and Flip Vacant Land", description: "Buy vacant land from motivated sellers and flip it.",
    price: 4700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "LAND FLIP FORMULA — Buy and Flip Vacant Land",
      files: [{ name: "Land_Flip_Formula_HustleVault.pdf", type: "pdf", size: "31 KB", key: "land-flip-formula.pdf" }],
      accessNote: "You now have lifetime access to the Land Flip Formula.",
    },
  },
  5: {
    id: 5, name: "NEMT BLUEPRINT — Medical Transport Business", description: "Government-contracted medical transport routes. Recurring Medicaid income.",
    price: 4700, bumpPrice: 1700, upsellPrice: 3700,
    digitalContent: {
      title: "NEMT BLUEPRINT — Medical Transport Business",
      files: [{ name: "NEMT Startup Guide HustleVault.pdf", type: "pdf", size: "39 KB", key: "nemt-startup-guide.pdf" }],
      accessNote: "You now have lifetime access to the NEMT Blueprint.",
    },
  },
  6: {
    id: 6, name: "PRINT ON DEMAND — Zero Inventory Online Store", description: "Upload designs once, earn royalties forever.",
    price: 4700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "PRINT ON DEMAND — Zero Inventory Online Store",
      files: [{ name: "Print_On_Demand_HustleVault.pdf", type: "pdf", size: "84 KB", key: "print-on-demand.pdf" }],
      accessNote: "You now have lifetime access to the Print On Demand Guide.",
    },
  },
  7: {
    id: 7, name: "DOMAIN FLIPPING — Buy Low, Sell Domains for Profit", description: "Register or buy undervalued domains and sell them for profit.",
    price: 4700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "DOMAIN FLIPPING — Buy Low, Sell Domains for Profit",
      files: [{ name: "Domain_Flipping_HustleVault.pdf", type: "pdf", size: "64 KB", key: "domain-flipping.pdf" }],
      accessNote: "You now have lifetime access to the Domain Flipping Guide.",
    },
  },
  8: {
    id: 8, name: "ASSISTED LIVING — Residential Care Home Business", description: "Operate a residential care home with government-backed resident payments.",
    price: 4700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "ASSISTED LIVING — Residential Care Home Business",
      files: [{ name: "Assisted_Living_Guide_HustleVault.pdf", type: "pdf", size: "35 KB", key: "assisted-living-guide.pdf" }],
      accessNote: "You now have lifetime access to the Assisted Living Guide.",
    },
  },
  9: {
    id: 9, name: "VETERANS HOUSING — HUD-VASH Programs", description: "Accept HUD-VASH vouchers and get government-guaranteed rent.",
    price: 4700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "VETERANS HOUSING — HUD-VASH Programs",
      files: [{ name: "Veterans_Housing_Guide_HustleVault.pdf", type: "pdf", size: "34 KB", key: "veterans-housing-guide.pdf" }],
      accessNote: "You now have lifetime access to the Veterans Housing Guide.",
    },
  },
  10: {
    id: 10, name: "VENDING MACHINE — Cash Flow While You Sleep", description: "Place machines, stock product, collect cash.",
    price: 4700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "VENDING MACHINE — Cash Flow While You Sleep",
      files: [{ name: "Vending_Machine_Guide_HustleVault.pdf", type: "pdf", size: "35 KB", key: "vending-machine-guide.pdf" }],
      accessNote: "You now have lifetime access to the Vending Machine Guide.",
    },
  },
  B1: {
    id: "B1", name: "QUICK CASH BUNDLE", description: "Unit Gold, Repo, and Dealer License.",
    price: 14100, bumpPrice: 0, upsellPrice: 0,
    digitalContent: {
      title: "QUICK CASH BUNDLE",
      files: [
        { name: "Unit Gold Storage Auction Blueprint HustleVault.pdf", type: "pdf", size: "7.8 KB", key: "unit-gold-storage-auction-blueprint.pdf" },
        { name: "Repo_Blueprint_HustleVault.pdf", type: "pdf", size: "32 KB", key: "repo-blueprint.pdf" },
        { name: "Dealer_License_Guide_HustleVault.pdf", type: "pdf", size: "30 KB", key: "dealer-license-guide.pdf" },
      ],
      accessNote: "You now have access to the Quick Cash Bundle.",
    },
  },
  B2: {
    id: "B2", name: "BUSINESS BUILDER BUNDLE", description: "6 complete business blueprints.",
    price: 28200, bumpPrice: 0, upsellPrice: 0,
    digitalContent: {
      title: "BUSINESS BUILDER BUNDLE",
      files: [
        { name: "Land_Flip_Formula_HustleVault.pdf", type: "pdf", size: "31 KB", key: "land-flip-formula.pdf" },
        { name: "NEMT Startup Guide HustleVault.pdf", type: "pdf", size: "39 KB", key: "nemt-startup-guide.pdf" },
        { name: "Assisted_Living_Guide_HustleVault.pdf", type: "pdf", size: "35 KB", key: "assisted-living-guide.pdf" },
        { name: "Veterans_Housing_Guide_HustleVault.pdf", type: "pdf", size: "34 KB", key: "veterans-housing-guide.pdf" },
        { name: "Vending_Machine_Guide_HustleVault.pdf", type: "pdf", size: "35 KB", key: "vending-machine-guide.pdf" },
        { name: "Dealer_License_Guide_HustleVault.pdf", type: "pdf", size: "30 KB", key: "dealer-license-guide.pdf" },
      ],
      accessNote: "You now have access to the Business Builder Bundle.",
    },
  },
  B3: {
    id: "B3", name: "DIGITAL EMPIRE BUNDLE", description: "Unit Gold, POD, and Domain Flipping.",
    price: 15100, bumpPrice: 1700, upsellPrice: 0,
    digitalContent: {
      title: "DIGITAL EMPIRE BUNDLE",
      files: [
        { name: "Unit Gold Storage Auction Blueprint HustleVault.pdf", type: "pdf", size: "7.8 KB", key: "unit-gold-storage-auction-blueprint.pdf" },
        { name: "Print_On_Demand_HustleVault.pdf", type: "pdf", size: "84 KB", key: "print-on-demand.pdf" },
        { name: "Domain_Flipping_HustleVault.pdf", type: "pdf", size: "64 KB", key: "domain-flipping.pdf" },
      ],
      accessNote: "You now have access to the Digital Empire Bundle.",
    },
  },
  B4: {
    id: "B4", name: "HOUSING EMPIRE BUNDLE", description: "Land, Assisted Living, Veterans, NEMT.",
    price: 18800, bumpPrice: 0, upsellPrice: 0,
    digitalContent: {
      title: "HOUSING EMPIRE BUNDLE",
      files: [
        { name: "Land_Flip_Formula_HustleVault.pdf", type: "pdf", size: "31 KB", key: "land-flip-formula.pdf" },
        { name: "Assisted_Living_Guide_HustleVault.pdf", type: "pdf", size: "35 KB", key: "assisted-living-guide.pdf" },
        { name: "Veterans_Housing_Guide_HustleVault.pdf", type: "pdf", size: "34 KB", key: "veterans-housing-guide.pdf" },
        { name: "NEMT Startup Guide HustleVault.pdf", type: "pdf", size: "39 KB", key: "nemt-startup-guide.pdf" },
      ],
      accessNote: "You now have access to the Housing Empire Bundle.",
    },
  },
  B5: {
    id: "B5", name: "COMPLETE VAULT — ALL 10", description: "Every single Hustle Vault blueprint.",
    price: 47000, bumpPrice: 0, upsellPrice: 9700,
    digitalContent: {
      title: "COMPLETE VAULT — ALL 10",
      files: [
        { name: "Unit Gold Storage Auction Blueprint HustleVault.pdf", type: "pdf", size: "7.8 KB", key: "unit-gold-storage-auction-blueprint.pdf" },
        { name: "Dealer_License_Guide_HustleVault.pdf", type: "pdf", size: "30 KB", key: "dealer-license-guide.pdf" },
        { name: "Repo_Blueprint_HustleVault.pdf", type: "pdf", size: "32 KB", key: "repo-blueprint.pdf" },
        { name: "Land_Flip_Formula_HustleVault.pdf", type: "pdf", size: "31 KB", key: "land-flip-formula.pdf" },
        { name: "NEMT Startup Guide HustleVault.pdf", type: "pdf", size: "39 KB", key: "nemt-startup-guide.pdf" },
        { name: "Print_On_Demand_HustleVault.pdf", type: "pdf", size: "84 KB", key: "print-on-demand.pdf" },
        { name: "Domain_Flipping_HustleVault.pdf", type: "pdf", size: "64 KB", key: "domain-flipping.pdf" },
        { name: "Assisted_Living_Guide_HustleVault.pdf", type: "pdf", size: "35 KB", key: "assisted-living-guide.pdf" },
        { name: "Veterans_Housing_Guide_HustleVault.pdf", type: "pdf", size: "34 KB", key: "veterans-housing-guide.pdf" },
        { name: "Vending_Machine_Guide_HustleVault.pdf", type: "pdf", size: "35 KB", key: "vending-machine-guide.pdf" },
      ],
      accessNote: "You now have lifetime access to the COMPLETE Hustle Vault.",
    },
  },
};

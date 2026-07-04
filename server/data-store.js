import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Default products ────────────────────────────────────────
// Prices in cents. 
// standard: base price
// bump: price when added as an order bump (typically $17)
// upsell: price when offered as an upsell (typically $27 or $37)
const DEFAULT_PRODUCTS = {
  1: { 
    id: 1, name: "UNIT GOLD — Storage Auction Blueprint", description: "Win storage auctions and flip contents for profit.", 
    price: 5700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "UNIT GOLD — Storage Auction Blueprint",
      files: [
        { name: "Unit Gold Storage Auction Blueprint HustleVault.pdf", type: "pdf", size: "7.8 KB", url: "https://drive.google.com/uc?export=download&id=1b7io0leJ-7kjFe0YxetlEhgmQW_JfLbm" },
      ],
      accessNote: "You now have lifetime access to the Unit Gold Blueprint.",
      bonus: "BONUS: Join our private community for live auction tips."
    }
  },
  2: {
    id: 2, name: "DEALER LICENSE — Car Dealer License Guide", description: "Get licensed and access wholesale auctions to flip cars.",
    price: 4700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "DEALER LICENSE — Car Dealer License Guide",
      files: [{ name: "Dealer_License_Guide_HustleVault.pdf", type: "pdf", size: "30 KB", url: "https://drive.google.com/uc?export=download&id=1E5EHYmSbGGt3m1Yb6ntlkXqycOlKDjKi" }],
      accessNote: "You now have lifetime access to the Dealer License Guide.",
    }
  },
  3: {
    id: 3, name: "REPO BLUEPRINT — Vehicle Repossession Business", description: "Get paid per vehicle recovered. Recession-proof income.",
    price: 3700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "REPO BLUEPRINT — Vehicle Repossession Business",
      files: [{ name: "Repo_Blueprint_HustleVault.pdf", type: "pdf", size: "32 KB", url: "https://drive.google.com/uc?export=download&id=1bPXSiyVSMh68alXL8hGQhKEWdBxyHluw" }],
      accessNote: "You now have lifetime access to the Repo Blueprint.",
    }
  },
  4: {
    id: 4, name: "LAND FLIP FORMULA — Buy and Flip Vacant Land", description: "Buy vacant land from motivated sellers and flip it.",
    price: 4700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "LAND FLIP FORMULA — Buy and Flip Vacant Land",
      files: [{ name: "Land_Flip_Formula_HustleVault.pdf", type: "pdf", size: "31 KB", url: "https://drive.google.com/uc?export=download&id=1NEeNAHxeWbin477eJ-MjhYq42PBW-8Tc" }],
      accessNote: "You now have lifetime access to the Land Flip Formula.",
    }
  },
  5: { 
    id: 5, name: "NEMT BLUEPRINT — Medical Transport Business", description: "Government-contracted medical transport routes. Recurring Medicaid income.", 
    price: 4700, bumpPrice: 1700, upsellPrice: 3700,
    digitalContent: {
      title: "NEMT BLUEPRINT — Medical Transport Business",
      files: [{ name: "NEMT Startup Guide HustleVault.pdf", type: "pdf", size: "39 KB", url: "https://drive.google.com/uc?export=download&id=1DyE7xlL37sCnQLyq50xsfjSxTW4NyZPn" }],
      accessNote: "You now have lifetime access to the NEMT Blueprint.",
    }
  },
  6: {
    id: 6, name: "PRINT ON DEMAND — Zero Inventory Online Store", description: "Upload designs once, earn royalties forever.",
    price: 4700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "PRINT ON DEMAND — Zero Inventory Online Store",
      files: [{ name: "Print_On_Demand_HustleVault.pdf", type: "pdf", size: "84 KB", url: "https://drive.google.com/uc?export=download&id=1ZuX265K1nhADd90OPncm9CB-qmstAHbt" }],
      accessNote: "You now have lifetime access to the Print On Demand Guide.",
    }
  },
  7: {
    id: 7, name: "DOMAIN FLIPPING — Buy Low, Sell Domains for Profit", description: "Register or buy undervalued domains and sell them for profit.",
    price: 4700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "DOMAIN FLIPPING — Buy Low, Sell Domains for Profit",
      files: [{ name: "Domain_Flipping_HustleVault.pdf", type: "pdf", size: "64 KB", url: "https://drive.google.com/uc?export=download&id=1bsVYabgaE5tdUbU4BnPEy5aNpQW_DBjy" }],
      accessNote: "You now have lifetime access to the Domain Flipping Guide.",
    }
  },
  8: {
    id: 8, name: "ASSISTED LIVING — Residential Care Home Business", description: "Operate a residential care home with government-backed resident payments.",
    price: 4700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "ASSISTED LIVING — Residential Care Home Business",
      files: [{ name: "Assisted_Living_Guide_HustleVault.pdf", type: "pdf", size: "35 KB", url: "https://drive.google.com/uc?export=download&id=1mZbthMdhyIKZKpmqZZt2VxYrLQ5uk0is" }],
      accessNote: "You now have lifetime access to the Assisted Living Guide.",
    }
  },
  9: {
    id: 9, name: "VETERANS HOUSING — HUD-VASH Programs", description: "Accept HUD-VASH vouchers and get government-guaranteed rent.",
    price: 4700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "VETERANS HOUSING — HUD-VASH Programs",
      files: [{ name: "Veterans_Housing_Guide_HustleVault.pdf", type: "pdf", size: "34 KB", url: "https://drive.google.com/uc?export=download&id=1mT-GXWj0MpRYDIGxo_zeC35Lx52c4ZAt" }],
      accessNote: "You now have lifetime access to the Veterans Housing Guide.",
    }
  },
  10: {
    id: 10, name: "VENDING MACHINE — Cash Flow While You Sleep", description: "Place machines, stock product, collect cash.",
    price: 4700, bumpPrice: 1700, upsellPrice: 2700,
    digitalContent: {
      title: "VENDING MACHINE — Cash Flow While You Sleep",
      files: [{ name: "Vending_Machine_Guide_HustleVault.pdf", type: "pdf", size: "35 KB", url: "https://drive.google.com/uc?export=download&id=1OURjLXcfoANi5addxutEYpBH2TBa-a3u" }],
      accessNote: "You now have lifetime access to the Vending Machine Guide.",
    }
  },
  // ── Bundles ──────────────────────────────────────────────
  "B1": {
    id: "B1", name: "QUICK CASH BUNDLE", description: "Unit Gold, Repo, and Dealer License.",
    price: 14100, bumpPrice: 0, upsellPrice: 0,
    digitalContent: {
       title: "QUICK CASH BUNDLE",
       files: [
         { name: "Unit Gold Blueprint.pdf", type: "pdf", size: "2.4 MB", url: "" },
         { name: "Repo Blueprint.pdf", type: "pdf", size: "2.8 MB", url: "" },
         { name: "Dealer License Guide.pdf", type: "pdf", size: "3.1 MB", url: "" },
       ],
       accessNote: "You now have access to the Quick Cash Bundle."
    }
  },
  "B2": {
    id: "B2", name: "BUSINESS BUILDER BUNDLE", description: "6 complete business blueprints.",
    price: 28200, bumpPrice: 0, upsellPrice: 0,
    digitalContent: {
       title: "BUSINESS BUILDER BUNDLE",
       files: [
         { name: "Land Flip.pdf", type: "pdf", size: "3.4 MB", url: "" },
         { name: "NEMT.pdf", type: "pdf", size: "3.2 MB", url: "" },
         { name: "Assisted Living.pdf", type: "pdf", size: "4.2 MB", url: "" },
         { name: "Veterans Housing.pdf", type: "pdf", size: "3.8 MB", url: "" },
         { name: "Vending.pdf", type: "pdf", size: "2.5 MB", url: "" },
         { name: "Dealer License.pdf", type: "pdf", size: "3.1 MB", url: "" },
       ],
       accessNote: "You now have access to the Business Builder Bundle."
    }
  },
  "B3": {
    id: "B3", name: "DIGITAL EMPIRE BUNDLE", description: "Unit Gold, POD, and Domain Flipping.",
    price: 15100, bumpPrice: 1700, upsellPrice: 0,
    digitalContent: {
       title: "DIGITAL EMPIRE BUNDLE",
       files: [
         { name: "Unit Gold.pdf", type: "pdf", size: "2.4 MB", url: "" },
         { name: "POD Guide.pdf", type: "pdf", size: "2.9 MB", url: "" },
         { name: "Domain Flipping.pdf", type: "pdf", size: "2.1 MB", url: "" },
       ],
       accessNote: "You now have access to the Digital Empire Bundle."
    }
  },
  "B4": {
    id: "B4", name: "HOUSING EMPIRE BUNDLE", description: "Land, Assisted Living, Veterans, NEMT.",
    price: 18800, bumpPrice: 0, upsellPrice: 0,
    digitalContent: {
       title: "HOUSING EMPIRE BUNDLE",
       files: [
         { name: "Land Flip.pdf", type: "pdf", size: "3.4 MB", url: "" },
         { name: "Assisted Living.pdf", type: "pdf", size: "4.2 MB", url: "" },
         { name: "Veterans Housing.pdf", type: "pdf", size: "3.8 MB", url: "" },
         { name: "NEMT.pdf", type: "pdf", size: "3.2 MB", url: "" },
       ],
       accessNote: "You now have access to the Housing Empire Bundle."
    }
  },
  "B5": {
    id: "B5", name: "COMPLETE VAULT — ALL 10", description: "Every single Hustle Vault blueprint.",
    price: 47000, bumpPrice: 0, upsellPrice: 9700,
    digitalContent: {
       title: "COMPLETE VAULT — ALL 10",
       files: [
         { name: "Hustle Vault Complete — 10 Guides.zip", type: "archive", size: "32 MB", url: "" },
       ],
       accessNote: "You now have lifetime access to the COMPLETE Hustle Vault."
    }
  }
};

// ── Product Store ───────────────────────────────────────────
function loadProducts() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      return JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
    }
  } catch { /* fall through */ }
  saveProducts(DEFAULT_PRODUCTS);
  return { ...DEFAULT_PRODUCTS };
}

function saveProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// ── Order Store ─────────────────────────────────────────────
function loadOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
    }
  } catch { /* fall through */ }
  return [];
}

function saveOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function addOrder(order) {
  const orders = loadOrders();
  orders.unshift(order); // newest first
  saveOrders(orders);
}

// ── Exports ─────────────────────────────────────────────────
const store = {
  getProducts: loadProducts,
  getProduct: (id) => loadProducts()[id],
  saveProducts,
  addProduct: (product) => {
    const products = loadProducts();
    const maxId = Math.max(0, ...Object.keys(products).filter(k=>!k.startsWith("B")).map(Number));
    const newId = maxId + 1;
    product.id = newId;
    products[newId] = product;
    saveProducts(products);
    return product;
  },
  updateProduct: (id, updates) => {
    const products = loadProducts();
    if (!products[id]) return null;
    products[id] = { ...products[id], ...updates, id };
    saveProducts(products);
    return products[id];
  },
  deleteProduct: (id) => {
    const products = loadProducts();
    if (!products[id]) return false;
    delete products[id];
    saveProducts(products);
    return true;
  },

  getOrders: loadOrders,
  addOrder,
};

export default store;

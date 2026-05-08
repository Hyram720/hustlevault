import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname);
const LOCAL_URL = "http://localhost:3001/public/sample_blueprint.pdf";

function walk(dir, callback) {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (f !== 'node_modules' && f !== '.git' && f !== 'dist') {
      isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    }
  });
};

console.log("🚀 Starting Global Hustle Vault Asset Sync...");

// 1. Force fix all files in src and server
walk(ROOT, (filePath) => {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.json')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('r2.dev')) {
      console.log(`✅ Fixing legacy links in: ${filePath}`);
      const updated = content.replace(/https:\/\/pub-[^"'\s]+\.r2\.dev\/[^"'\s]+/g, LOCAL_URL);
      fs.writeFileSync(filePath, updated);
    }
  }
});

// 2. Explicitly overwrite products.json
const productsPath = path.join(ROOT, 'server', 'data', 'products.json');
if (fs.existsSync(productsPath)) {
    console.log("📦 Enforcing products.json integrity...");
    let products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    Object.keys(products).forEach(id => {
        if (products[id].digitalContent && products[id].digitalContent.files) {
            products[id].digitalContent.files.forEach(f => { f.url = LOCAL_URL; });
        }
    });
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
}

console.log("✨ All legacy links have been purged and synchronized to localhost:3001.");

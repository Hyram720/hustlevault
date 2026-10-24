// One-time helper: copy the ebook PDFs into the PRIVATE Netlify Blobs store "hv-ebook-files".
// Run from a trusted computer after downloading the PDFs into one folder:
//   NETLIFY_SITE_ID=<site id> NETLIFY_AUTH_TOKEN=<personal access token> node scripts/upload-ebooks.mjs ./ebooks
// File names are matched to the keys in server/data/products.json (e.g. "Repo_Blueprint_HustleVault.pdf").
// Nothing here is public: files are served only through /api/ebook-file with a signed, 10-minute link.
import fs from "node:fs";
import path from "node:path";
import { getStore } from "@netlify/blobs";

const dir = process.argv[2];
const { NETLIFY_SITE_ID: siteID, NETLIFY_AUTH_TOKEN: token } = process.env;
if (!dir || !siteID || !token) { console.error("Usage: NETLIFY_SITE_ID=... NETLIFY_AUTH_TOKEN=... node scripts/upload-ebooks.mjs <folder>"); process.exit(1); }
const products = JSON.parse(fs.readFileSync(new URL("../server/data/products.json", import.meta.url)));
const byName = new Map();
for (const p of Object.values(products)) for (const f of p.digitalContent?.files || []) byName.set(f.name.toLowerCase(), f.key);
const store = getStore({ name: "hv-ebook-files", siteID, token });
const done = new Set();
for (const file of fs.readdirSync(dir)) {
  const key = byName.get(file.toLowerCase());
  if (!key) { console.log("skip (not in catalog):", file); continue; }
  const buf = fs.readFileSync(path.join(dir, file));
  if (buf.subarray(0, 4).toString() !== "%PDF") { console.log("skip (not a PDF):", file); continue; }
  await store.set(key, buf, { metadata: { name: file, bytes: buf.length } });
  done.add(key); console.log("uploaded", file, "->", key, buf.length, "bytes");
}
const missing = [...new Set(byName.values())].filter((k) => !done.has(k));
console.log(missing.length ? "MISSING: " + missing.join(", ") : "All ebook files uploaded.");

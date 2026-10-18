// Prints what the public sees for VentureCheck: its app page and its home-page card.
// BASE=https://hustlevault.app node test/inspect-venturecheck.mjs
import puppeteer from "puppeteer-core";
const B = process.env.BASE || "https://hustlevault.app";
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 900 });
await p.goto(B + "/apps/venturecheck", { waitUntil: "networkidle0" }); await new Promise((r) => setTimeout(r, 1500));
console.log("APPPAGE:", (await p.evaluate(() => document.querySelector("main")?.innerText || document.body.innerText)).replace(/\s+/g, " ").slice(0, 700));
console.log("robots:", await p.evaluate(() => document.querySelector("meta[name=robots]")?.content || "(none)"));
await p.goto(B + "/", { waitUntil: "networkidle0" }); await new Promise((r) => setTimeout(r, 8500));
console.log("CARD:", await p.evaluate(() => { const el = [...document.querySelectorAll("div")].find((d) => d.children.length > 2 && /VentureCheck/.test(d.textContent) && /You give/i.test(d.textContent) && d.textContent.length < 900); return el ? el.innerText.replace(/\s+/g, " ") : "none"; }));
await b.close();

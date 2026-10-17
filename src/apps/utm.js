// First-touch UTM capture, stored on this device and attached to checkout.
const KEY = "hv_ft_utm";
export function captureUtm() {
  try {
    if (localStorage.getItem(KEY)) return;
    const q = new URLSearchParams(window.location.search);
    const pick = (k) => (q.get(k) || "").slice(0, 80);
    const utm = { source: pick("utm_source"), medium: pick("utm_medium"), campaign: pick("utm_campaign"), content: pick("utm_content"), term: pick("utm_term"), ref: pick("ref") };
    if (!utm.source && document.referrer) {
      try { const h = new URL(document.referrer).hostname; if (!/hustlevault\.app$/.test(h)) { utm.source = h.slice(0, 80); utm.medium = "referral"; } } catch {}
    }
    if (!utm.source) utm.source = "direct";
    utm.landing = window.location.pathname.slice(0, 120);
    utm.at = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(utm));
  } catch {}
}
export function getUtm() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
const MINE = "hv_my_purchases";
export function rememberPurchase(id, appName) {
  try {
    const list = JSON.parse(localStorage.getItem(MINE) || "[]").filter((x) => x.id !== id);
    list.unshift({ id, appName, at: new Date().toISOString() });
    localStorage.setItem(MINE, JSON.stringify(list.slice(0, 30)));
  } catch {}
}
export function myPurchases() {
  try { return JSON.parse(localStorage.getItem(MINE) || "[]"); } catch { return []; }
}

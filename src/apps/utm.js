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

// First-party event tracking (no cookies, no third parties).
export function track(type, app) {
  try {
    const u = getUtm();
    const body = JSON.stringify({ type, app, utm: { source: u.source, campaign: u.campaign }, path: window.location.pathname });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch {}
}
export function trackVisitOnce() {
  try { if (sessionStorage.getItem("hv_visit")) return; sessionStorage.setItem("hv_visit", "1"); } catch {}
  track("visit");
}

// Preview token (Fred's private test links) survives navigation within the tab.
export function previewToken(fromQuery) {
  try {
    if (fromQuery) sessionStorage.setItem("hv_preview", fromQuery);
    return fromQuery || sessionStorage.getItem("hv_preview") || "";
  } catch { return fromQuery || ""; }
}
export const withPreview = (path, token) => (token ? `${path}${path.includes("?") ? "&" : "?"}preview=${encodeURIComponent(token)}` : path);

export function ventureCheckUrl(base, content = "start_path") {
  const u = getUtm();
  const q = new URLSearchParams({ utm_source: "hustlevault", utm_medium: "referral", utm_campaign: (u.campaign && u.campaign !== "-" ? u.campaign : "hustlevault_home").slice(0, 60), utm_content: content });
  return `${base}${base.includes("?") ? "&" : "?"}${q}`;
}

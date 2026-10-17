// Sponsor data (one fetch per page load, or the server-embedded copy) + impression beacons.
import { useEffect, useState } from "react";

let cache = null, pending = null;
const embedded = () => (typeof window !== "undefined" && Array.isArray(window.__HV_DATA__?.sponsors) ? { sponsors: window.__HV_DATA__.sponsors, checkout: false } : null);
export function loadSponsors() {
  if (!pending) pending = fetch("/api/sponsors").then((r) => (r.ok ? r.json() : { sponsors: [] })).catch(() => ({ sponsors: [] }))
    .then((d) => (cache = { sponsors: Array.isArray(d.sponsors) ? d.sponsors : [], checkout: !!d.checkout }));
  return pending;
}
export function useSponsors() {
  const [d, setD] = useState(() => cache || embedded());
  useEffect(() => { let on = true; loadSponsors().then((x) => on && setD(x)); return () => { on = false; }; }, []);
  return d;
}
export const goUrl = (id, placement) => `/go/sponsor/${encodeURIComponent(id)}?p=${placement}`;

// ── impressions: ≥50% visible for ≥1s, once per sponsor+placement per page view, batched ──
let pv = Math.random().toString(36).slice(2, 12);
const seen = new Set(), queue = [], timers = new Map();
let io = null, flushT = null;
export function newPageView() { pv = Math.random().toString(36).slice(2, 12); seen.clear(); }
function flush() {
  clearTimeout(flushT); flushT = null;
  if (!queue.length) return;
  const body = JSON.stringify({ pv, items: queue.splice(0, 40) });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon("/api/sponsors/imp", new Blob([body], { type: "application/json" }))) return;
  } catch { /* fall through */ }
  fetch("/api/sponsors/imp", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
}
if (typeof window !== "undefined") {
  addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
}
function observer() {
  if (io || typeof IntersectionObserver === "undefined") return io;
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const el = e.target, key = `${el.dataset.sp}|${el.dataset.pl}`;
      if (e.isIntersecting && e.intersectionRatio >= 0.5) {
        if (seen.has(key) || timers.has(el)) continue;
        timers.set(el, setTimeout(() => {
          timers.delete(el);
          if (seen.has(key) || document.visibilityState !== "visible") return;
          seen.add(key); queue.push([el.dataset.sp, el.dataset.pl]);
          if (!flushT) flushT = setTimeout(flush, 4000);
        }, 1000));
      } else if (timers.has(el)) { clearTimeout(timers.get(el)); timers.delete(el); }
    }
  }, { threshold: [0, 0.5, 1] });
  return io;
}
export function useImpression(ref, id, placement) {
  useEffect(() => {
    const el = ref.current, o = observer();
    if (!el || !o || !id) return;
    el.dataset.sp = id; el.dataset.pl = placement;
    o.observe(el);
    return () => { o.unobserve(el); if (timers.has(el)) { clearTimeout(timers.get(el)); timers.delete(el); } };
  }, [ref, id, placement]);
}

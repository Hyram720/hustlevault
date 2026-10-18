// Fixed bottom bar on public pages: a seamless sponsor ticker, or — when no sponsor is in the
// ticker — one slim, dismissible "Your business here" bar. Never on admin, purchase or checkout-result pages.
import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { loadSponsors, goUrl, useImpression, newPageView } from "./data";
import { COPY } from "../../shared/sponsors.js";
import { THEME, BAR_BG } from "../../shared/theme.js";

const HIDE = /^\/(admin|my|success|cancel|door-script|sponsors\/(stats|edit))(\/|$)/;
const BAR_H = 44;
const G = { ...THEME };
const dismissedKey = (k) => `hv_bar_closed_${k}`;
const isDismissed = (k) => { try { return sessionStorage.getItem(dismissedKey(k)) === "1"; } catch { return false; } };

function TickItem({ s, dup }) {
  const ref = useRef(null);
  useImpression(ref, dup ? null : s.id, "ticker");
  return (
    <a ref={ref} href={goUrl(s.id, "ticker")} rel="sponsored noopener" target="_blank" className={"hv-ti" + (dup ? " hv-dup" : "")}
      aria-hidden={dup ? "true" : undefined} tabIndex={dup ? -1 : undefined}>
      <picture><source srcSet={s.logo.tick} type="image/webp" /><img src={s.logo.tickPng} alt={dup ? "" : `${s.name} logo`} height="32" style={{ height: 32, width: "auto", maxWidth: 140 }} loading="lazy" decoding="async" /></picture>
      <b>{s.name}</b><span>{s.tickerLine}</span>
    </a>
  );
}

export default function SiteBar() {
  const loc = useLocation();
  const [data, setData] = useState(null);
  const [closed, setClosed] = useState({ ticker: isDismissed("ticker"), house: isDismissed("house") });
  useEffect(() => { newPageView(); }, [loc.pathname]);
  useEffect(() => {
    let on = true;
    const go = () => loadSponsors().then((d) => on && setData(d));
    // Lazy: wait until the page is idle so the bar never competes with the main content.
    const ric = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
    const start = () => ric(go, { timeout: 3000 });
    if (document.readyState === "complete") start(); else addEventListener("load", start, { once: true });
    return () => { on = false; };
  }, []);

  const hiddenRoute = HIDE.test(loc.pathname);
  const items = (data?.sponsors || []).filter((s) => s.ticker && s.logo);
  const kind = !data || hiddenRoute ? null : items.length ? "ticker" : loc.pathname === "/sponsors" ? null : "house";
  const show = kind && !closed[kind];

  useEffect(() => {
    document.body.style.paddingBottom = show ? `${BAR_H + 4}px` : "";
    return () => { document.body.style.paddingBottom = ""; };
  }, [show]);
  if (!show) return null;

  const close = () => { try { sessionStorage.setItem(dismissedKey(kind), "1"); } catch { /* private mode */ } setClosed((c) => ({ ...c, [kind]: true })); };
  let loop = items;
  while (loop.length && loop.length < 6) loop = loop.concat(items);
  const secs = Math.max(20, loop.length * 7);

  return (
    <div className="hv-bar" role="region" aria-label={kind === "ticker" ? "Sponsors" : "Advertise on Hustle Vault"} data-hv-bar={kind}>
      <style>{`
        .hv-bar{position:fixed;left:0;right:0;bottom:0;height:${BAR_H}px;z-index:90;display:flex;align-items:center;background:${BAR_BG};border-top:1px solid ${G.gold}66;font-family:Inter,system-ui,sans-serif;color:${G.cream};contain:layout paint}
        .hv-bar-lab{flex:0 0 auto;margin:0 8px 0 10px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#000;background:${G.gold};padding:3px 6px;border-radius:2px;font-weight:800}
        .hv-tv{flex:1;overflow:hidden;height:100%;display:flex;align-items:center;-webkit-mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent);mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent)}
        .hv-tt{display:flex;width:max-content;animation:hvtick ${secs}s linear infinite}
        .hv-bar:hover .hv-tt,.hv-bar:focus-within .hv-tt{animation-play-state:paused}
        @keyframes hvtick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .hv-ti{display:inline-flex;align-items:center;gap:8px;padding:0 26px;height:${BAR_H}px;white-space:nowrap;text-decoration:none;color:${G.cream};font-size:13px}
        .hv-ti b{font-weight:800;color:${G.cream}}.hv-ti span{color:${G.muted};font-weight:600}
        .hv-ti:focus-visible{outline:2px solid ${G.goldBri};outline-offset:-4px}
        .hv-bar-x{flex:0 0 auto;width:36px;height:36px;margin:0 4px;background:none;border:none;color:${G.muted};font-size:20px;line-height:1;cursor:pointer;border-radius:4px}
        .hv-bar-x:hover,.hv-bar-x:focus-visible{color:${G.cream};outline:1px solid ${G.border}}
        .hv-house{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:10px;padding:0 6px;font-size:13px;color:${G.cream};text-decoration:none;white-space:nowrap;overflow:hidden}
        .hv-house span{overflow:hidden;text-overflow:ellipsis}.hv-house b{color:${G.goldBri};flex:0 0 auto}
        @media(prefers-reduced-motion:reduce){.hv-tt{animation:none}.hv-tv{overflow-x:auto;-webkit-mask-image:none;mask-image:none}.hv-dup{display:none}.hv-bar{animation:hvfade .4s ease-out}@keyframes hvfade{from{opacity:0}to{opacity:1}}}
        @media(max-width:480px){.hv-ti{padding:0 16px;font-size:12px}.hv-ti span{display:none}.hv-house{font-size:12px;justify-content:flex-start}}
      `}</style>
      {kind === "ticker" ? (
        <>
          <span className="hv-bar-lab">Sponsored</span>
          <div className="hv-tv"><div className="hv-tt">{loop.map((s, i) => <TickItem key={s.id + i} s={s} dup={i >= items.length} />)}{loop.map((s, i) => <TickItem key={"d" + s.id + i} s={s} dup />)}</div></div>
        </>
      ) : (
        <Link to={COPY.ctaHref} className="hv-house"><span>{COPY.houseBar}</span><b>{COPY.houseBarCta}</b></Link>
      )}
      <button className="hv-bar-x" onClick={close} aria-label={kind === "ticker" ? "Hide sponsor ticker" : "Hide this message"}>×</button>
    </div>
  );
}

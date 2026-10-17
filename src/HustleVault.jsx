import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { APPS } from "../shared/apps.js";
import { track, ventureCheckUrl } from "./apps/utm";
import { useSEO } from "./seo";
import { SponsoredStrip, AdvertiseCallout } from "./sponsors/HomeBits";

// ── BRAND ──────────────────────────────────────────────────────
const C = {
  bg:"#05050A", surface:"#09090F", panel:"#0E0E18", deep:"#060609",
  border:"#16162A", borderH:"#28284A", borderG:"#C9A84C40",
  gold:"#C9A84C", goldBri:"#F0C040", goldDim:"#7A5A18",
  cream:"#F5F0E8", muted:"#9A8A6A", dim:"#4A4A5A",
  green:"#2ECC71", red:"#E74C3C", blue:"#3498DB", purple:"#8E44AD",
};
const GG  = `linear-gradient(135deg,#7A5A18 0%,${C.gold} 30%,${C.goldBri} 55%,${C.gold} 80%,#7A5A18 100%)`;
const GT  = { background:GG, WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent", display:"inline-block" };

// ── IMAGES (Higgsfield-generated, dark-gold vault aesthetic) ───
const IMG = "https://d8j0ntlcm91z4.cloudfront.net/user_391qpEAynVndVvvLA4RZWiHERjU/";
const HERO_IMG = IMG + "hf_20260810_204014_47196f1f-19bc-4591-8ed2-50a21cf519aa.png";
const VAULT_VIDEO = IMG + "hf_20260811_165934_1c5a7a1f-5e2b-4b79-a7fd-42cca3f35a0a.mp4";

const ICON = { "venturecheck":"🧭", "first-sale-blueprint":"🗺️", "offer-builder":"🧰", "objection-coach":"🎯", "lead-follow-up":"📨", "reactivation-kit":"🔁", "lead-qualifier":"🚦", "first-customer-finder":"🔎" };
const ACCENT = { start:"#2ECC71", grow:"#3498DB" };
const money = c => "$" + (c % 100 === 0 ? c/100 : (c/100).toFixed(2));

// ── COMPONENTS ─────────────────────────────────────────────────
function VaultIcon({size=24,color=C.goldBri}) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs><linearGradient id="vg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7A5A18"/><stop offset="50%" stopColor={color}/><stop offset="100%" stopColor="#7A5A18"/></linearGradient></defs>
      <rect x="8" y="10" width="64" height="56" rx="4" fill={C.surface} stroke="url(#vg3)" strokeWidth="2"/>
      <circle cx="40" cy="38" r="13" fill="none" stroke="url(#vg3)" strokeWidth="2"/>
      <circle cx="40" cy="38" r="8" fill={C.bg}/><circle cx="40" cy="38" r="2.5" fill="url(#vg3)"/>
      <line x1="40" y1="26" x2="40" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="40" y1="46" x2="40" y2="50" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="28" y1="38" x2="32" y2="38" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="48" y1="38" x2="52" y2="38" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function Btn({children,onClick,variant="primary",style={},disabled=false,full=false}) {
  const [h,setH]=useState(false);
  const base={padding:"13px 22px",fontSize:11,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",fontFamily:"Georgia,serif",border:"none",cursor:disabled?"not-allowed":"pointer",transition:"all 0.18s",borderRadius:2,opacity:disabled?0.5:1,width:full?"100%":"auto"};
  const v={
    primary:{background:GG,color:"#000",transform:h?"translateY(-1px)":"none",boxShadow:h?`0 10px 30px rgba(201,168,76,0.4)`:`0 4px 16px rgba(201,168,76,0.2)`},
    secondary:{background:"transparent",color:C.gold,border:`1px solid ${C.gold}`,transform:h?"translateY(-1px)":"none"},
    ghost:{background:h?C.panel:"transparent",color:C.muted,border:`1px solid ${C.border}`},
  };
  return <button onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} onClick={onClick} disabled={disabled} style={{...base,...v[variant],...style}}>{children}</button>;
}

function Badge({children,color=C.gold,dark=false}) {
  return <span style={{background:color,color:dark?"#fff":"#000",fontSize:9,fontWeight:700,letterSpacing:2,padding:"3px 10px",textTransform:"uppercase",clipPath:"polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%)",fontFamily:"Georgia,serif"}}>{children}</span>;
}

function AppCard({app}) {
  const [h,setH]=useState(false);
  const soon = !app.external && !app.buyable;
  const row=(k,v)=>(<div style={{display:"flex",gap:10,fontSize:13,lineHeight:1.5,padding:"6px 0",borderTop:`1px solid ${C.border}`}}><span style={{width:74,flexShrink:0,color:C.muted,fontSize:10,letterSpacing:1.5,textTransform:"uppercase",paddingTop:2}}>{k}</span><span style={{color:"#D8D0C0"}}>{v}</span></div>);
  const btn={display:"block",textAlign:"center",padding:"13px",fontSize:12,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"Georgia,serif",borderRadius:3,textDecoration:"none"};
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{background:C.surface,border:`1px solid ${h?C.borderH:C.border}`,borderRadius:8,overflow:"hidden",display:"flex",flexDirection:"column",transition:"all 0.25s",transform:h&&!soon?"translateY(-4px)":"none",opacity:soon?0.92:1}}>
      <div style={{height:3,background:`linear-gradient(90deg,transparent,${ACCENT[app.path]},transparent)`}}/>
      <div style={{padding:"20px 20px 6px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:10}}>
          <div style={{fontSize:30,lineHeight:1}}>{ICON[app.id]||"✨"}</div>
          {soon ? <Badge color="#4A4A5A" dark>Coming soon</Badge> : app.external ? <Badge color={C.green}>Free score</Badge> : <Badge color={C.goldBri}>Available</Badge>}
        </div>
        <div style={{...GT,fontSize:18,fontWeight:900,letterSpacing:1}}>{app.name}</div>
        <p style={{fontSize:14,color:"#C0B8A8",lineHeight:1.6,margin:"6px 0 12px"}}>{app.tagline}</p>
        {row("You give",app.give)}{row("You get",app.get)}{row("Price",app.price==null?"Coming soon":app.external?`Free score · ${money(app.price)} full report`:`${money(app.price)} one time`)}{row("How fast",app.fast)}
      </div>
      <div style={{padding:"12px 20px 20px",marginTop:"auto"}}>
        {app.external
          ? <a href={ventureCheckUrl(app.url,"home_card")} target="_blank" rel="noopener" onClick={()=>track("vc_click",app.id)} style={{...btn,background:GG,color:"#000"}}>Check my idea →</a>
          : soon
            ? <div style={{...btn,border:`1px solid ${C.border}`,color:C.dim,cursor:"not-allowed"}}>Coming soon</div>
            : <Link to={`/apps/${app.id}`} style={{...btn,background:GG,color:"#000"}}>Get started — {money(app.price)}</Link>}
      </div>
    </div>
  );
}

function PathSection({id,eyebrow,title,who,apps}) {
  return (
    <section id={id} style={{padding:"56px 20px",maxWidth:1200,margin:"0 auto",scrollMarginTop:70}}>
      <div style={{marginBottom:28,maxWidth:680}}>
        <div style={{fontSize:11,color:ACCENT[id],letterSpacing:3,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>{eyebrow}</div>
        <h2 style={{fontSize:"clamp(28px,5vw,40px)",fontWeight:900,marginBottom:10}}><span style={GT}>{title}</span></h2>
        <p style={{fontSize:16,color:C.muted,lineHeight:1.6}}>{who}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,300px),1fr))",gap:20}}>
        {apps.map(a=><AppCard key={a.id} app={a}/>)}
      </div>
    </section>
  );
}

// ── VAULT INTRO OVERLAY ────────────────────────────────────────
function IntroOverlay({onDone}) {
  const [fading,setFading]=useState(false);
  const finish=()=>{setFading(true);setTimeout(onDone,800);};
  useEffect(()=>{const t=setTimeout(finish,7500);return()=>clearTimeout(t);},[]);
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",opacity:fading?0:1,transition:"opacity 0.8s ease",pointerEvents:fading?"none":"auto"}}>
      <video src={VAULT_VIDEO} autoPlay muted playsInline onEnded={finish} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
      <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at center,transparent 55%,${C.bg} 100%)`,pointerEvents:"none"}}/>
      <button onClick={finish} style={{position:"absolute",bottom:28,right:28,background:"rgba(0,0,0,0.35)",border:`1px solid ${C.gold}`,color:C.gold,fontSize:11,letterSpacing:2,padding:"9px 20px",borderRadius:2,cursor:"pointer",fontFamily:"Georgia,serif",textTransform:"uppercase"}}>Enter The Vault →</button>
    </div>
  );
}

// ── MAIN LANDING PAGE ──────────────────────────────────────────
const FALLBACK_APPS = APPS.filter(a=>a.status!=="hidden").map(a=>({...a,buyable:false}));

export default function HustleVault() {
  const [showIntro, setShowIntro] = useState(true);
  const [apps, setApps] = useState(FALLBACK_APPS);
  const [scrolled, setScrolled] = useState(false);

  useEffect(()=>{const h=()=>setScrolled(window.scrollY>60);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);
  useEffect(()=>{ const h=window.location.hash.slice(1); if(h==="start"||h==="grow"){ const t=setTimeout(()=>document.getElementById(h)?.scrollIntoView(),300); return()=>clearTimeout(t);} },[]);
  useEffect(()=>{ fetch("/api/apps").then(r=>r.json()).then(d=>{ if(Array.isArray(d.apps)) setApps(d.apps); }).catch(()=>{}); },[]);
  const doneIntro=()=>setShowIntro(false);

  useSEO({
    title:"Hustle Vault – Affordable AI Tools to Start, Run & Grow Your Business",
    description:"Pay-per-use AI tools for beginners and business owners. Check your idea, plan your first sale, handle sales objections and win back customers — no subscriptions, results in minutes.",
    path:"/",
    type:"website",
    jsonLd:{
      "@context":"https://schema.org",
      "@graph":[
        {"@type":"Organization","@id":"https://hustlevault.app/#org","name":"Hustle Vault","url":"https://hustlevault.app","logo":"https://hustlevault.app/favicon.svg","description":"Affordable AI tools to start, run, and grow your business."},
        {"@type":"WebSite","@id":"https://hustlevault.app/#website","url":"https://hustlevault.app","name":"Hustle Vault","publisher":{"@id":"https://hustlevault.app/#org"}}
      ]
    }
  });

  const start = apps.filter(a=>a.path==="start"), grow = apps.filter(a=>a.path==="grow");
  const go = id => document.getElementById(id)?.scrollIntoView({behavior:"smooth"});
  const navA = {color:C.muted,fontSize:11,letterSpacing:2,textTransform:"uppercase",textDecoration:"none",fontFamily:"Georgia,serif",background:"none",border:"none",cursor:"pointer"};

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.cream,fontFamily:"Inter, system-ui, sans-serif"}}>
      {showIntro && <IntroOverlay onDone={doneIntro}/>}
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:rgba(201,168,76,0.3);color:#F5F0E8;}
        @keyframes ticker{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        .ticker-wrap{animation:ticker 30s linear infinite;width:max-content;display:flex;}
        .hv-navlinks{display:flex;align-items:center;gap:20px}
        @media(max-width:720px){.hv-navlinks .hv-hide-m{display:none}}
      `}</style>

      {/* Ticker */}
      <div style={{background:`linear-gradient(90deg,#1A0A00,#2A1400,#1A0A00)`,borderBottom:`1px solid ${C.gold}30`,padding:"10px 0",overflow:"hidden"}}>
        <div className="ticker-wrap">
          {["Affordable AI tools for your business","Pay per use — no subscriptions","Results in minutes","Start your hustle","Grow your hustle","Beginner-friendly — no tech skills needed"].flatMap(x=>[x,x]).map((t,i)=>(
            <span key={i} style={{fontSize:10,color:C.gold,letterSpacing:2,whiteSpace:"nowrap",padding:"0 40px"}}>◆ {t}</span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:scrolled?`${C.surface}F0`:"transparent",backdropFilter:scrolled?"blur(15px)":"none",borderBottom:scrolled?`1px solid ${C.border}`:"none",transition:"0.3s",padding:"0 18px"}}>
        <div style={{maxWidth:1200,margin:"0 auto",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
           <Link to="/" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}><VaultIcon size={24}/><div style={{...GT,fontSize:14,fontWeight:900,letterSpacing:4,textTransform:"uppercase"}}>Hustle Vault</div></Link>
           <div className="hv-navlinks">
             <button onClick={()=>go("start")} style={navA}>Start</button>
             <button onClick={()=>go("grow")} style={navA}>Grow</button>
             <Link to="/blog" className="hv-hide-m" style={navA}>Blog</Link>
             <Link to="/sponsors" className="hv-hide-m" style={navA}>Advertise</Link>
             <Link to="/door-script" className="hv-hide-m" style={navA}>Door Script</Link>
             <Link to="/my" className="hv-hide-m" style={navA}>My purchases</Link>
           </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{padding:"80px 20px 60px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,zIndex:0}}>
          <img src={HERO_IMG} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.30}}/>
          <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at center,${C.gold}10,transparent 55%),linear-gradient(to bottom,${C.bg}D9,${C.bg}F2 62%,${C.bg})`}}/>
        </div>
        <div style={{position:"relative",zIndex:1,maxWidth:800,margin:"0 auto"}}>
           <div style={{display:"inline-flex",background:`${C.gold}15`,border:`1px solid ${C.gold}40`,borderRadius:100,padding:"6px 16px",marginBottom:24,fontSize:10,color:C.gold,letterSpacing:3}}>AI TOOLS FOR BEGINNERS & BUSINESS OWNERS</div>
           <h1 style={{fontSize:"clamp(40px,7vw,76px)",fontWeight:950,lineHeight:0.95,letterSpacing:-2,marginBottom:20}}><span style={GT}>HUSTLE VAULT</span></h1>
           <p style={{fontSize:"clamp(16px,2.6vw,20px)",color:C.cream,fontWeight:700,marginBottom:12}}>Affordable AI tools to start, run, and grow your business.</p>
           <p style={{fontSize:16,color:C.muted,lineHeight:1.6,maxWidth:600,margin:"0 auto 32px"}}>Pick a tool, answer a few simple questions, pay once, and get your results in minutes. No subscriptions. No tech skills needed.</p>
           <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <Btn onClick={()=>go("start")} style={{padding:"15px 30px"}}>Start Your Hustle</Btn>
              <Btn onClick={()=>go("grow")} variant="secondary" style={{padding:"15px 30px"}}>Grow Your Hustle</Btn>
           </div>
        </div>
      </section>

      <PathSection id="start" eyebrow="New to business?" title="Start Your Hustle" who="For beginners who want to start making money with AI — find a good idea, turn your skills into an offer, and go after your first sale." apps={start}/>
      <PathSection id="grow" eyebrow="Already in business?" title="Grow Your Hustle" who="For entrepreneurs and salespeople who want to close more deals, follow up faster, and bring past customers back." apps={grow}/>

      {/* How it works */}
      <section style={{padding:"56px 20px 80px",maxWidth:1000,margin:"0 auto"}}>
        <h2 style={{fontSize:28,fontWeight:900,textAlign:"center",marginBottom:28}}><span style={GT}>How it works</span></h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
          {[["1","Pick a tool","Choose the one that fits where you are right now."],["2","Answer a few questions","Simple questions about you and your business — no jargon."],["3","Pay once","Secure checkout by Stripe. No account, no subscription."],["4","Get results in minutes","Saved to a private link you can come back to anytime."]].map(([n,t,d])=>(
            <div key={n} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:20}}>
              <div style={{...GT,fontSize:28,fontWeight:900}}>{n}</div>
              <div style={{fontWeight:800,margin:"6px 0"}}>{t}</div>
              <div style={{fontSize:14,color:C.muted,lineHeight:1.6}}>{d}</div>
            </div>
          ))}
        </div>
        <p style={{textAlign:"center",fontSize:12,color:C.dim,marginTop:24,lineHeight:1.7}}>Our tools give you plans, scripts and ideas — not promises. Results depend on your effort and market; no income is guaranteed.</p>
      </section>

      <SponsoredStrip/>
      <AdvertiseCallout/>

      <footer style={{padding:"48px 24px",textAlign:"center",background:C.surface,color:C.dim,fontSize:10,letterSpacing:2}}>
         <div style={{display:"flex",gap:22,justifyContent:"center",flexWrap:"wrap",marginBottom:18}}>
            <a href="/#start" style={{color:C.muted,textDecoration:"none"}}>Start Your Hustle</a>
            <a href="/#grow" style={{color:C.muted,textDecoration:"none"}}>Grow Your Hustle</a>
            <Link to="/blog" style={{color:C.muted,textDecoration:"none"}}>Blog</Link>
            <Link to="/sponsors" title="Put your logo in front of our visitors" style={{color:C.muted,textDecoration:"none"}}>Advertise</Link>
            <Link to="/sponsors/policy" style={{color:C.muted,textDecoration:"none"}}>Ad Policy</Link>
            <Link to="/door-script" style={{color:C.muted,textDecoration:"none"}}>Door Script</Link>
            <Link to="/my" style={{color:C.muted,textDecoration:"none"}}>My purchases</Link>
            <a href="/terms.html" style={{color:C.muted,textDecoration:"none"}}>Terms</a>
            <a href="/refund-policy.html" style={{color:C.muted,textDecoration:"none"}}>Refunds</a>
            <a href="/privacy.html" style={{color:C.muted,textDecoration:"none"}}>Privacy</a>
            <a href="/earnings-disclaimer.html" style={{color:C.muted,textDecoration:"none"}}>Earnings disclaimer</a>
         </div>
         <div style={{marginBottom:10,letterSpacing:1}}><Link to="/sponsors#inquire" style={{color:C.muted,textDecoration:"none"}}>Advertise: put your logo in front of our visitors →</Link></div>
         <div style={{marginBottom:10}}>HUSTLE VAULT · © 2026 · ALL RIGHTS RESERVED</div>
      </footer>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { APPS } from "../shared/apps.js";
import { track, ventureCheckUrl } from "./apps/utm";
import { useSEO } from "./seo";
import { homeMeta } from "../shared/homeseo.js";
import { SponsoredStrip, AdvertiseCallout } from "./sponsors/HomeBits";
import { THEME, GRADIENT, GRADIENT_TEXT, ACCENT_RGB, BAR_BG } from "../shared/theme.js";

// ── BRAND ──────────────────────────────────────────────────────
const C = { ...THEME };
const GG  = GRADIENT;
const GT  = GRADIENT_TEXT;

// ── IMAGES (Higgsfield-generated, dark-gold vault aesthetic) ───
const IMG = "https://d8j0ntlcm91z4.cloudfront.net/user_391qpEAynVndVvvLA4RZWiHERjU/";
const HERO_IMG = IMG + "hf_20260810_204014_47196f1f-19bc-4591-8ed2-50a21cf519aa.png";
// Intro: navy/lime color-graded copy of Fred's Higgsfield video (same frames, length and fps).
// Original gold version kept at VAULT_VIDEO_ORIGINAL and in media-originals/ (see README there).
const VAULT_VIDEO_ORIGINAL = IMG + "hf_20260811_165934_1c5a7a1f-5e2b-4b79-a7fd-42cca3f35a0a.mp4"; // eslint-disable-line no-unused-vars
const VAULT_VIDEO = "/intro/vault-navy-lime.mp4";

const ICON = { "venturecheck":"🧭", "first-sale-blueprint":"🗺️", "offer-builder":"🧰", "objection-coach":"🎯", "lead-follow-up":"📨", "reactivation-kit":"🔁", "lead-qualifier":"🚦", "first-customer-finder":"🔎" };
const ACCENT = { start:C.green, grow:C.blue };
const money = c => "$" + (c % 100 === 0 ? c/100 : (c/100).toFixed(2));

// ── COMPONENTS ─────────────────────────────────────────────────
function VaultIcon({size=24,color=C.goldBri}) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs><linearGradient id="vg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={C.goldDim}/><stop offset="50%" stopColor={color}/><stop offset="100%" stopColor={C.goldDim}/></linearGradient></defs>
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
    primary:{background:GG,color:"#000",transform:h?"translateY(-1px)":"none",boxShadow:h?`0 10px 30px rgba(${ACCENT_RGB},0.4)`:`0 4px 16px rgba(${ACCENT_RGB},0.2)`},
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
          {soon ? <Badge color={C.soon} dark>Coming soon</Badge> : app.external ? <Badge color={C.green}>Live · Free score</Badge> : <Badge color={C.goldBri}>Available</Badge>}
        </div>
        <div style={{...GT,fontSize:18,fontWeight:900,letterSpacing:1}}>{app.name}</div>
        <p style={{fontSize:14,color:C.body,lineHeight:1.6,margin:"6px 0 12px"}}>{app.tagline}</p>
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

// Client-only overlay. The prerendered homepage (in #root before hydration) is what
// non-JS crawlers read. React replaces #root on load, then this splash plays as it does today.
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
const FALLBACK_APPS = APPS.filter(a=>a.status==="live").map(a=>({...a,buyable:!!a.external}));

export default function HustleVault() {
  const [showIntro, setShowIntro] = useState(true);
  const [apps, setApps] = useState(FALLBACK_APPS);
  const [scrolled, setScrolled] = useState(false);

  useEffect(()=>{const h=()=>setScrolled(window.scrollY>60);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);
  useEffect(()=>{ const h=window.location.hash.slice(1); if(h==="start"||h==="grow"){ const t=setTimeout(()=>document.getElementById(h)?.scrollIntoView(),300); return()=>clearTimeout(t);} },[]);
  useEffect(()=>{ fetch("/api/apps").then(r=>r.json()).then(d=>{ if(Array.isArray(d.apps)) setApps(d.apps); }).catch(()=>{}); },[]);
  const doneIntro=()=>setShowIntro(false);

  useSEO(homeMeta());

  const start = apps.filter(a=>a.path==="start"), grow = apps.filter(a=>a.path==="grow");
  const go = id => document.getElementById(id)?.scrollIntoView({behavior:"smooth"});
  const navA = {color:C.muted,fontSize:11,letterSpacing:2,textTransform:"uppercase",textDecoration:"none",fontFamily:"Georgia,serif",background:"none",border:"none",cursor:"pointer"};

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.cream,fontFamily:"Inter, system-ui, sans-serif"}}>
      {showIntro && <IntroOverlay onDone={doneIntro}/>}
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:rgba(${ACCENT_RGB},0.3);color:${C.cream};}
        @keyframes ticker{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        .ticker-wrap{animation:ticker 30s linear infinite;width:max-content;display:flex;}
        .hv-navlinks{display:flex;align-items:center;gap:20px}
        @media(max-width:720px){.hv-navlinks .hv-hide-m{display:none}}
      `}</style>

      {/* Ticker */}
      <div style={{background:BAR_BG,borderBottom:`1px solid ${C.gold}55`,padding:"10px 0",overflow:"hidden"}}>
        <div className="ticker-wrap">
          {["Affordable AI tools for your business","Pay per use — no subscriptions","Results in minutes","Start your hustle","Grow your hustle","Beginner-friendly — no tech skills needed"].flatMap(x=>[x,x]).map((t,i)=>(
            <span key={i} style={{fontSize:12,fontWeight:700,color:C.gold,letterSpacing:2,whiteSpace:"nowrap",padding:"0 40px"}}>◆ {t}</span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:scrolled?`${C.surface}F0`:"transparent",backdropFilter:scrolled?"blur(15px)":"none",borderBottom:scrolled?`1px solid ${C.border}`:"none",transition:"0.3s",padding:"0 18px"}}>
        <div style={{maxWidth:1200,margin:"0 auto",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
           <Link to="/" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}><VaultIcon size={24}/><div style={{...GT,fontSize:14,fontWeight:900,letterSpacing:4,textTransform:"uppercase"}}>Hustle Vault</div></Link>
           <div className="hv-navlinks">
             <button onClick={()=>go("start")} style={navA}>Start</button>
             {grow.length>0&&<button onClick={()=>go("grow")} style={navA}>Grow</button>}
             <Link to="/aged-corporation-playbook" style={navA}>Playbook</Link>
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
              {grow.length>0&&<Btn onClick={()=>go("grow")} variant="secondary" style={{padding:"15px 30px"}}>Grow Your Hustle</Btn>}
           </div>
        </div>
      </section>

      <PathSection id="start" eyebrow="New to business?" title="Start Your Hustle" who="For beginners who want to start a business with AI — check whether your idea is worth your time, then turn your skills into an offer people can buy." apps={start}/>
      {grow.length>0&&<PathSection id="grow" eyebrow="Already in business?" title="Grow Your Hustle" who="For entrepreneurs and salespeople who want to close more deals, follow up faster, and bring past customers back." apps={grow}/>}

      {/* Featured Business Playbook */}
      <section id="playbook" style={{padding:"44px 20px",maxWidth:1200,margin:"0 auto"}}>
        <div style={{background:C.surface,border:`1px solid ${C.gold}55`,borderRadius:10,padding:"32px 28px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,280px),1fr))",gap:32,alignItems:"center",boxShadow:`0 24px 60px rgba(0,0,0,0.55)`}}>
          <div style={{textAlign:"center"}}>
            <Link to="/aged-corporation-playbook" style={{display:"inline-block"}}>
              <img src="/ebooks/aged-corporation-playbook/cover-variant-a.jpg" alt="The Aged Corporation Playbook - 2026 Edition Cover" style={{width:"100%",maxWidth:240,borderRadius:6,border:`1px solid ${C.gold}60`,boxShadow:"0 16px 40px rgba(0,0,0,0.7)"}}/>
            </Link>
          </div>
          <div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
              <Badge color={C.goldBri}>New 2026 Release</Badge>
              <span style={{fontSize:11,color:C.muted,letterSpacing:1.5,textTransform:"uppercase"}}>115-Page 6"×9" Print &amp; Digital Edition</span>
            </div>
            <h2 style={{fontSize:"clamp(24px,4vw,34px)",fontWeight:950,lineHeight:1.1,marginBottom:10}}>
              <Link to="/aged-corporation-playbook" style={{...GT,textDecoration:"none"}}>The Aged Corporation Playbook</Link>
            </h2>
            <p style={{fontSize:15,color:C.cream,fontWeight:700,lineHeight:1.45,marginBottom:10}}>
              How to Buy, Build, and Flip Shelf Corporations for $1,500 to $4,500+: 7-Chapter Execution Guide, 6 Wyoming C-Corp Case Studies &amp; 4 Closing Checklists
            </p>
            <p style={{fontSize:14,color:C.body,lineHeight:1.65,marginBottom:20}}>
              Turn a $189 Wyoming state filing and a $12 digital infrastructure stack into a turnkey corporate asset. Includes Track A ($12 Bank-Ready Digital Bundle), Track B (90-Day 80-Paydex Credit-Seasoned Build), 6 full-number Wyoming C-Corp case studies, and 4 ready-to-use closing checklists.
            </p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
              <Link to="/aged-corporation-playbook" style={{background:GG,color:"#000",padding:"13px 24px",fontSize:11,fontWeight:900,letterSpacing:2,textTransform:"uppercase",fontFamily:"Georgia,serif",borderRadius:3,textDecoration:"none"}}>
                Get Digital Bundle — $12.99 →
              </Link>
              <a href="/ebooks/aged-corporation-playbook/the-aged-corporation-playbook.pdf" target="_blank" rel="noopener noreferrer" style={{border:`1px solid ${C.gold}`,color:C.gold,padding:"13px 20px",fontSize:11,fontWeight:800,letterSpacing:2,textTransform:"uppercase",fontFamily:"Georgia,serif",borderRadius:3,textDecoration:"none"}}>
                Download 115-Page PDF ↓
              </a>
              <span style={{fontSize:12,color:C.muted}}>Also in 6"×9" Paperback ($24.99 on Amazon)</span>
            </div>
          </div>
        </div>
      </section>


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
            {grow.length>0&&<a href="/#grow" style={{color:C.muted,textDecoration:"none"}}>Grow Your Hustle</a>}
            <Link to="/aged-corporation-playbook" style={{color:C.muted,textDecoration:"none"}}>The Aged Corporation Playbook</Link>
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

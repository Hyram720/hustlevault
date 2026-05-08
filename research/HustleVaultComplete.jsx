import { useState, useEffect, useRef, useCallback } from "react";

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
const GGB = { background:GG };

// ── ALL 10 PRODUCTS ────────────────────────────────────────────
const PRODUCTS = [
  { id:1,  emoji:"🔐", title:"UNIT GOLD",           sub:"Storage Auction Blueprint",        price:57,  orig:97,  accent:"#C9A84C", cat:"Quick Cash",  tag:"BEST SELLER",  tagC:"#F0C040", desc:"Win storage auctions and flip the contents for profit. First income possible in 7 days.", inc:["9 Complete Chapters","Profit Formula Calculator","3 Real Case Studies","Auction Finder Guide","Selling Platform Cheat Sheet","Scaling Roadmap"] },
  { id:2,  emoji:"🚗", title:"DEALER LICENSE",      sub:"Car Dealer License Guide",         price:47,  orig:79,  accent:"#C0392B", cat:"Business",     tag:"HIGH INCOME",  tagC:"#E74C3C", desc:"Get licensed and access wholesale auctions to flip cars for $1,000–$5,000 profit per deal.", inc:["State-by-State Requirements","Application Walkthrough","Wholesale Auction Access","Deal Formula Calculator","4 Case Studies","Compliance Checklist"] },
  { id:3,  emoji:"🔑", title:"REPO BLUEPRINT",      sub:"Vehicle Repossession Business",    price:37,  orig:67,  accent:"#2471A3", cat:"Quick Cash",   tag:"NEW",          tagC:"#3498DB", desc:"Get paid $200–$400 per vehicle recovered. Recession-proof income with low startup cost.", inc:["State Licensing Guide","Finding BHPH Clients","Recovery Process Steps","Pricing and Rate Sheet","3 Case Studies","Safety and Legal Guide"] },
  { id:4,  emoji:"📦", title:"LAND FLIP FORMULA",   sub:"Buy Cheap Land Sell for 3X",      price:47,  orig:89,  accent:"#27AE60", cat:"Business",     tag:"PASSIVE",      tagC:"#2ECC71", desc:"Buy vacant land from motivated sellers for pennies on the dollar and sell it online for 3X.", inc:["County Tax Record System","Seller Letter Template","Valuation Framework","5 Case Studies","Due Diligence Checklist","Seller Finance Strategy"] },
  { id:5,  emoji:"🏥", title:"NEMT BLUEPRINT",      sub:"Medical Transport Business",       price:47,  orig:89,  accent:"#16A085", cat:"Business",     tag:"RECURRING",    tagC:"#1ABC9C", desc:"Government-contracted medical routes pay $30–$80 per trip. Steady recurring Medicaid income.", inc:["Medicaid Enrollment Guide","Broker Contact List","Vehicle Requirements","3 Case Studies","Billing System","Fleet Scaling Roadmap"] },
  { id:6,  emoji:"🎨", title:"PRINT ON DEMAND",     sub:"Zero Inventory Online Store",      price:47,  orig:89,  accent:"#8E44AD", cat:"Digital",      tag:"PASSIVE",      tagC:"#9B59B6", desc:"Upload designs once, earn royalties forever. No inventory, no shipping, no employees.", inc:["50 Proven Niches","Design Creation System","Platform Setup Guide","Marketing Blueprint","3 Case Studies","500-Design Scaling Plan"] },
  { id:7,  emoji:"🌐", title:"DOMAIN FLIPPING",     sub:"Buy $10 Domains Sell for Thousands",price:47, orig:89,  accent:"#1F618D", cat:"Digital",      tag:"LOW STARTUP",  tagC:"#2980B9", desc:"Register or buy domains for $10–$500 and sell them to businesses for $1,000–$50,000+.", inc:["Valuation Framework","NameBio Research System","Outreach Email Templates","4 Case Studies","Marketplace Directory","Portfolio Strategy"] },
  { id:8,  emoji:"🏠", title:"ASSISTED LIVING",     sub:"Residential Care Home Business",   price:47,  orig:89,  accent:"#884EA0", cat:"Housing",      tag:"HIGH INCOME",  tagC:"#9B59B6", desc:"A 6-bed home generates $27,000/month gross. Government-backed resident payments.", inc:["State Licensing Navigator","Property Setup Guide","Staffing Framework","4 Case Studies","Medicaid Waiver Enrollment","Multi-Home Scaling"] },
  { id:9,  emoji:"🇺🇸", title:"VETERANS HOUSING",   sub:"HUD-VASH and Government Programs", price:47,  orig:89,  accent:"#1A5276", cat:"Housing",      tag:"GOVT BACKED",  tagC:"#2471A3", desc:"Accept HUD-VASH vouchers and get government-guaranteed rent with near-zero vacancy.", inc:["HUD-VASH Landlord Guide","GPD Grant Application","SSVF Partnership System","3 Case Studies","VA Contact Directory","Portfolio Scaling"] },
  { id:10, emoji:"🥤", title:"VENDING MACHINE",     sub:"Cash Flow While You Sleep",        price:47,  orig:89,  accent:"#D35400", cat:"Physical",     tag:"CASH DAILY",   tagC:"#E67E22", desc:"Place machines, stock product, collect cash. 50–70% margins. Scales to full-time income.", inc:["Location Pitch Script","Machine Comparison Chart","Stocking Strategy","3 Case Studies","Route Management System","Cashless Tech Guide"] },
];

// ── BUNDLES ────────────────────────────────────────────────────
const BUNDLES = [
  {
    id:"B1", emoji:"⚡", title:"QUICK CASH BUNDLE", tag:"FASTEST INCOME",
    tagC:C.green, accent:"#2ECC71", price:97, orig:181,
    desc:"Three blueprints for people who need money fast. Storage auctions, repo, and car flipping — all income possible within 30 days.",
    productIds:[1,3,2],
    saves:84, features:["First income in 7 days","$200-$5,000 per deal","Low startup cost","No experience needed"],
  },
  {
    id:"B2", emoji:"🏢", title:"BUSINESS BUILDER BUNDLE", tag:"BUILD ASSETS",
    tagC:"#3498DB", accent:"#3498DB", price:127, orig:271,
    desc:"Six complete business blueprints — land flipping, NEMT, assisted living, veterans housing, vending, and dealer license.",
    productIds:[2,4,5,8,9,10],
    saves:144, features:["6 complete businesses","Government-backed income streams","Multiple physical and digital","Recurring monthly revenue"],
  },
  {
    id:"B3", emoji:"💻", title:"DIGITAL EMPIRE BUNDLE", tag:"100% ONLINE",
    tagC:C.purple, accent:"#8E44AD", price:87, orig:183,
    desc:"Three fully digital, location-independent income streams. Print on demand, domain flipping, and storage auctions — all online.",
    productIds:[1,6,7],
    saves:96, features:["Work from anywhere","No physical inventory","Scales without employees","Passive income potential"],
  },
  {
    id:"B4", emoji:"🏘️", title:"HOUSING EMPIRE BUNDLE", tag:"REAL ESTATE",
    tagC:"#884EA0", accent:"#884EA0", price:117, orig:272,
    desc:"Four housing and real estate income streams — land flipping, assisted living, veterans housing, and NEMT for residents.",
    productIds:[4,5,8,9],
    saves:155, features:["Government-guaranteed payments","Real estate wealth building","Recurring monthly income","Mission-driven impact"],
  },
  {
    id:"B5", emoji:"🔥", title:"COMPLETE VAULT — ALL 10", tag:"BEST VALUE",
    tagC:"#F0C040", accent:"#F0C040", price:197, orig:474,
    desc:"Every single Hustle Vault blueprint in one purchase. 10 complete income systems. $474 worth of blueprints for $197.",
    productIds:[1,2,3,4,5,6,7,8,9,10],
    saves:277, features:["All 10 complete blueprints","Every income category covered","Lifetime future updates","Priority email support"],
    featured:true,
  },
];

// ── UPSELLS (shown post-purchase) ──────────────────────────────
const UPSELLS = {
  1:  { productId:6,  title:"ADD: Print on Demand Blueprint",  price:27, orig:47, headline:"You flipped your first unit — now build passive digital income too." },
  2:  { productId:4,  title:"ADD: Land Flip Formula",          price:27, orig:47, headline:"You have your dealer license — land flipping is the perfect next asset." },
  3:  { productId:2,  title:"ADD: Dealer License Blueprint",   price:27, orig:47, headline:"Repo gets you in the cars — a dealer license lets you sell them legally." },
  4:  { productId:9,  title:"ADD: Veterans Housing Blueprint", price:27, orig:47, headline:"You flip land — now hold some of it for government-backed veteran housing." },
  5:  { productId:8,  title:"ADD: Assisted Living Blueprint",  price:27, orig:47, headline:"You already drive medical — now house the patients for monthly income too." },
  6:  { productId:7,  title:"ADD: Domain Flipping Blueprint",  price:27, orig:47, headline:"You design for POD — domain names are another digital asset you can flip." },
  7:  { productId:6,  title:"ADD: Print on Demand Blueprint",  price:27, orig:47, headline:"You flip domains — build a permanent passive income store with POD." },
  8:  { productId:9,  title:"ADD: Veterans Housing Blueprint", price:27, orig:47, headline:"You run assisted living — veterans housing is the same model, govt-backed." },
  9:  { productId:8,  title:"ADD: Assisted Living Blueprint",  price:27, orig:47, headline:"You house veterans — assisted living is the highest-income care model." },
  10: { productId:4,  title:"ADD: Land Flip Formula",          price:27, orig:47, headline:"You have vending routes — land flipping builds wealth on the side." },
  B1: { productId:5,  title:"ADD: NEMT Blueprint",             price:37, orig:47, headline:"You're in cash and cars — add government medical transport for recurring income." },
  B2: { productId:"B5",title:"UPGRADE: Complete Vault",        price:97, orig:197, headline:"You have 6 — get all 10 for just $97 more. Save $277 total." },
  B3: { productId:5,  title:"ADD: NEMT Blueprint",             price:37, orig:47, headline:"You're digital — NEMT is the perfect offline income to balance your portfolio." },
  B4: { productId:"B5",title:"UPGRADE: Complete Vault",        price:97, orig:197, headline:"You have 4 housing blueprints — get all 10 for just $97 more." },
  B5: null,
};

// ── ORDER BUMPS (shown at checkout) ───────────────────────────
const ORDER_BUMPS = {
  1:  { title:"Add the Repo Blueprint for just $17 more",       productId:3,  price:17 },
  2:  { title:"Add the Land Flip Formula for just $17 more",    productId:4,  price:17 },
  3:  { title:"Add the Dealer License Blueprint for just $17",  productId:2,  price:17 },
  4:  { title:"Add the NEMT Blueprint for just $17 more",       productId:5,  price:17 },
  5:  { title:"Add the Assisted Living Blueprint for $17 more", productId:8,  price:17 },
  6:  { title:"Add Domain Flipping for just $17 more",          productId:7,  price:17 },
  7:  { title:"Add Print on Demand for just $17 more",          productId:6,  price:17 },
  8:  { title:"Add Veterans Housing for just $17 more",         productId:9,  price:17 },
  9:  { title:"Add Assisted Living for just $17 more",          productId:8,  price:17 },
  10: { title:"Add the Repo Blueprint for just $17 more",       productId:3,  price:17 },
  B1: { title:"Add Land Flip Formula to your bundle for $17",   productId:4,  price:17 },
  B2: { title:"Upgrade: Add the Digital Empire Bundle for $47", productId:"B3",price:47 },
  B3: { title:"Add NEMT Blueprint to your order for $17",       productId:5,  price:17 },
  B4: { title:"Add Print on Demand Blueprint for $17 more",     productId:6,  price:17 },
  B5: null,
};

// ── HELPERS ────────────────────────────────────────────────────
const getProduct = id => PRODUCTS.find(p=>p.id===id) || BUNDLES.find(b=>b.id===id);
const cats = ["All","Quick Cash","Business","Digital","Housing","Physical","Bundles"];

// ── VAULT ICON ─────────────────────────────────────────────────
function VaultIcon({size=24,color=C.goldBri}) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs><linearGradient id="vg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7A5A18"/><stop offset="50%" stopColor={color}/><stop offset="100%" stopColor="#7A5A18"/></linearGradient></defs>
      <rect x="8" y="10" width="64" height="56" rx="4" fill={C.surface} stroke="url(#vg3)" strokeWidth="2"/>
      <rect x="14" y="16" width="52" height="44" rx="3" fill="none" stroke={C.border} strokeWidth="1"/>
      <circle cx="40" cy="38" r="13" fill="none" stroke="url(#vg3)" strokeWidth="2"/>
      <circle cx="40" cy="38" r="8" fill={C.bg}/>
      <circle cx="40" cy="38" r="2.5" fill="url(#vg3)"/>
      <line x1="40" y1="26" x2="40" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="40" y1="46" x2="40" y2="50" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="28" y1="38" x2="32" y2="38" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="48" y1="38" x2="52" y2="38" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <rect x="56" y="34" width="5" height="8" rx="2.5" fill="url(#vg3)"/>
      <rect x="14" y="22" width="4" height="5" rx="1" fill={C.border}/>
      <rect x="14" y="41" width="4" height="5" rx="1" fill={C.border}/>
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
    danger:{background:h?"#922B21":C.red,color:"#fff"},
    success:{background:h?"#1E8449":C.green,color:"#fff",transform:h?"translateY(-1px)":"none"},
    purple:{background:h?"#7D3C98":C.purple,color:"#fff",transform:h?"translateY(-1px)":"none"},
  };
  return <button onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} onClick={onClick} disabled={disabled} style={{...base,...v[variant],...style}}>{children}</button>;
}

function Badge({children,color=C.gold,dark=false}) {
  return <span style={{background:color,color:dark?"#fff":"#000",fontSize:9,fontWeight:700,letterSpacing:2,padding:"3px 10px",textTransform:"uppercase",clipPath:"polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%)",fontFamily:"Georgia,serif"}}>{children}</span>;
}

// ── PRODUCT CARD ───────────────────────────────────────────────
function ProductCard({item, onBuy, onView, highlight=false}) {
  const [h,setH]=useState(false);
  const isBundle = !!item.productIds;
  const save = item.orig - item.price;
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{background:C.surface,border:`1px solid ${h||highlight?C.borderH:C.border}`,borderRadius:6,overflow:"hidden",transition:"all 0.28s",transform:h?"translateY(-5px)":"none",boxShadow:h?`0 20px 60px rgba(0,0,0,0.65), 0 0 0 1px ${item.accent}40`:"0 4px 20px rgba(0,0,0,0.3)",display:"flex",flexDirection:"column",position:"relative"}}>
      <div style={{height:3,background:`linear-gradient(90deg,transparent,${item.accent},transparent)`}}/>
      {item.featured && <div style={{position:"absolute",top:0,right:0,background:GG,color:"#000",fontSize:8,fontWeight:700,letterSpacing:2,padding:"4px 14px",textTransform:"uppercase",fontFamily:"Georgia,serif",zIndex:2}}>Most Popular</div>}
      <div style={{background:`radial-gradient(ellipse at 25% 50%,${item.accent}18 0%,transparent 65%),${C.panel}`,padding:"22px 20px 16px",position:"relative"}}>
        <div style={{fontSize:36,marginBottom:8,lineHeight:1}}>{item.emoji}</div>
        <Badge color={item.tagC}>{item.tag}</Badge>
        <div style={{marginTop:10}}>
          <div style={{...GT,fontSize:16,fontWeight:900,letterSpacing:2,textTransform:"uppercase"}}>{item.title}</div>
          <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginTop:3,textTransform:"uppercase"}}>{item.sub}</div>
        </div>
        {isBundle && (
          <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:4}}>
            {item.productIds.slice(0,4).map(pid=>{const p=PRODUCTS.find(x=>x.id===pid);return p?<span key={pid} style={{fontSize:16}}>{p.emoji}</span>:null})}
            {item.productIds.length>4&&<span style={{fontSize:10,color:C.muted,alignSelf:"center"}}>+{item.productIds.length-4}</span>}
          </div>
        )}
      </div>
      <div style={{padding:"14px 20px",flex:1,display:"flex",flexDirection:"column",gap:10}}>
        <p style={{fontSize:12,color:"#C0B8A8",lineHeight:1.7,margin:0,fontStyle:"italic"}}>{item.desc}</p>
        {isBundle && item.features && (
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {item.features.map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:4,height:4,background:item.accent,borderRadius:1,transform:"rotate(45deg)",flexShrink:0}}/>
                <span style={{fontSize:11,color:C.muted}}>{f}</span>
              </div>
            ))}
          </div>
        )}
        {!isBundle && (
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {item.inc.slice(0,3).map((inc,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:4,height:4,background:item.accent,borderRadius:1,transform:"rotate(45deg)",flexShrink:0}}/>
                <span style={{fontSize:11,color:C.muted}}>{inc}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginTop:"auto",paddingTop:6}}>
          <span style={{...GT,fontSize:26,fontWeight:900}}>${item.price}</span>
          <span style={{fontSize:12,color:C.dim,textDecoration:"line-through"}}>${item.orig}</span>
          <span style={{fontSize:10,color:C.green,fontWeight:700}}>Save ${save}</span>
        </div>
      </div>
      <div style={{padding:"0 20px 20px",display:"flex",gap:8}}>
        <Btn onClick={()=>onBuy(item)} style={{flex:1,padding:"11px"}}>Get Access</Btn>
        <Btn onClick={()=>onView(item)} variant="ghost" style={{padding:"11px 12px",fontSize:10}}>Info</Btn>
      </div>
    </div>
  );
}

// ── PREVIEW MODAL ──────────────────────────────────────────────
function PreviewModal({item, onClose, onBuy}) {
  useEffect(()=>{const h=e=>e.key==="Escape"&&onClose();window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[onClose]);
  const isBundle = !!item.productIds;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(10px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.borderH}`,borderRadius:8,maxWidth:560,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{height:4,background:`linear-gradient(90deg,transparent,${item.accent},${C.goldBri},${item.accent},transparent)`}}/>
        <div style={{background:`radial-gradient(ellipse at 30% 50%,${item.accent}22 0%,transparent 60%),${C.panel}`,padding:"28px 32px 20px",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:12,right:16,background:"none",border:"none",color:C.dim,fontSize:22,cursor:"pointer"}}>×</button>
          <div style={{fontSize:48,marginBottom:8}}>{item.emoji}</div>
          <Badge color={item.tagC}>{item.tag}</Badge>
          <div style={{...GT,fontSize:22,fontWeight:900,letterSpacing:3,textTransform:"uppercase",marginTop:10}}>{item.title}</div>
          <div style={{fontSize:10,color:C.muted,letterSpacing:3,textTransform:"uppercase",marginTop:3}}>{item.sub}</div>
        </div>
        <div style={{padding:"24px 32px"}}>
          <p style={{fontSize:13,color:"#C8C0B0",lineHeight:1.8,marginBottom:20,fontStyle:"italic"}}>{item.desc}</p>
          {isBundle && (
            <>
              <div style={{fontSize:10,color:C.gold,letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>Products Included</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
                {item.productIds.map(pid=>{const p=PRODUCTS.find(x=>x.id===pid);return p?(
                  <div key={pid} style={{display:"flex",alignItems:"center",gap:12,background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,padding:"8px 12px"}}>
                    <span style={{fontSize:18}}>{p.emoji}</span>
                    <div><div style={{fontSize:12,fontWeight:700,color:C.cream}}>{p.title}</div><div style={{fontSize:10,color:C.muted}}>{p.sub}</div></div>
                    <div style={{marginLeft:"auto",fontSize:11,color:C.dim,textDecoration:"line-through"}}>${p.orig}</div>
                  </div>
                ):null})}
              </div>
            </>
          )}
          {!isBundle && (
            <>
              <div style={{fontSize:10,color:C.gold,letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>Everything Included</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
                {item.inc.map((inc,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:`${item.accent}20`,border:`1px solid ${item.accent}60`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:item.accent,fontSize:10}}>✓</span></div>
                    <span style={{fontSize:12,color:C.cream}}>{inc}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-start",marginBottom:20}}>
            <span style={{fontSize:20}}>🛡️</span>
            <div><div style={{fontSize:11,fontWeight:700,color:C.cream,marginBottom:2}}>30-Day Money-Back Guarantee</div><div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>Full refund if you're not satisfied. No questions asked.</div></div>
          </div>
          <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:14}}>
            <span style={{...GT,fontSize:36,fontWeight:900}}>${item.price}</span>
            <span style={{fontSize:13,color:C.dim,textDecoration:"line-through"}}>${item.orig}</span>
            <span style={{fontSize:11,color:C.green}}>Save ${item.orig-item.price}</span>
          </div>
          <Btn onClick={()=>{onClose();onBuy(item);}} full>Get Instant Access — ${item.price}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── CHECKOUT MODAL ─────────────────────────────────────────────
function CheckoutModal({item, onClose, onSuccess}) {
  const bump = ORDER_BUMPS[item.id];
  const bumpProduct = bump ? getProduct(bump.productId) : null;
  const [bumpAdded, setBumpAdded] = useState(false);
  const [form, setForm] = useState({name:"",email:"",card:"",exp:"",cvv:"",coupon:""});
  const [coupon, setCoupon] = useState({applied:false,error:""});
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);

  const basePrice = item.price + (bumpAdded && bump ? bump.price : 0);
  const final = coupon.applied ? Math.round(basePrice*0.8) : basePrice;

  const validate=()=>{
    const e={};
    if(!form.name.trim())e.name="Required";
    if(!form.email.includes("@"))e.email="Valid email required";
    if(form.card.replace(/\s/g,"").length<16)e.card="Full card number required";
    if(!form.exp.match(/^\d{2}\/\d{2}$/))e.exp="MM/YY";
    if(form.cvv.length<3)e.cvv="3+ digits";
    setErrors(e);
    return Object.keys(e).length===0;
  };
  const submit=()=>{if(!validate())return;setStep(2);setTimeout(()=>setStep(3),2200);};
  const fmtCard=v=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp=v=>{const d=v.replace(/\D/g,"").slice(0,4);return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d;};
  const inp=f=>({width:"100%",padding:"11px 13px",background:C.bg,border:`1px solid ${errors[f]?C.red:C.border}`,borderRadius:3,color:C.cream,fontSize:12,fontFamily:"Georgia,serif",outline:"none",boxSizing:"border-box"});
  const lbl={fontSize:9,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:4,display:"block"};

  if(step===3) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(10px)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.surface,border:`1px solid ${C.borderH}`,borderRadius:8,maxWidth:420,width:"100%",padding:"48px 36px",textAlign:"center"}}>
        <div style={{fontSize:60,marginBottom:16}}>🎉</div>
        <div style={{...GT,fontSize:24,fontWeight:900,letterSpacing:2,marginBottom:10}}>Order Complete!</div>
        <p style={{fontSize:13,color:C.muted,lineHeight:1.8,marginBottom:22}}>Your download link was sent to <strong style={{color:C.cream}}>{form.email}</strong></p>
        <div style={{background:C.bg,border:`1px solid ${C.green}40`,borderRadius:4,padding:"12px 16px",marginBottom:22}}>
          <div style={{fontSize:11,color:C.green,fontWeight:700,marginBottom:3}}>✓ Instant Access Confirmed</div>
          <div style={{fontSize:11,color:C.muted}}>{item.title}{bumpAdded&&bump?` + ${bumpProduct?.title||""}`:""} · ${final} paid</div>
        </div>
        <Btn onClick={()=>{onSuccess(item);onClose();}} full>Continue</Btn>
      </div>
    </div>
  );

  if(step===2) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(10px)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:48,height:48,border:`3px solid ${C.border}`,borderTopColor:C.gold,borderRadius:"50%",margin:"0 auto 20px",animation:"spin 0.8s linear infinite"}}/>
        <div style={{...GT,fontSize:13,letterSpacing:4,textTransform:"uppercase"}}>Processing Payment</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(10px)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.borderH}`,borderRadius:8,maxWidth:480,width:"100%",maxHeight:"94vh",overflowY:"auto"}}>
        <div style={{height:4,background:GG}}/>
        <div style={{padding:"22px 28px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
            <div>
              <div style={{fontSize:9,color:C.muted,letterSpacing:3,textTransform:"uppercase",marginBottom:3}}>Secure Checkout</div>
              <div style={{...GT,fontSize:16,fontWeight:900,letterSpacing:2}}>{item.title}</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:C.dim,fontSize:20,cursor:"pointer"}}>×</button>
          </div>

          {/* Order bump */}
          {bumpProduct && (
            <div onClick={()=>setBumpAdded(!bumpAdded)} style={{background:bumpAdded?`${C.green}10`:`${C.goldBri}08`,border:`1px solid ${bumpAdded?C.green+"60":C.gold+"40"}`,borderRadius:4,padding:"12px 16px",marginBottom:16,cursor:"pointer",transition:"all 0.2s"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                <div style={{width:20,height:20,borderRadius:3,border:`2px solid ${bumpAdded?C.green:C.gold}`,background:bumpAdded?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                  {bumpAdded&&<span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:bumpAdded?C.green:C.gold,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>⚡ Special One-Time Add-On</div>
                  <div style={{fontSize:12,color:C.cream,fontWeight:700,marginBottom:2}}>{bump.title}</div>
                  <div style={{display:"flex",gap:8,alignItems:"baseline"}}>
                    <span style={{fontSize:14,color:C.goldBri,fontWeight:900}}>${bump.price}</span>
                    <span style={{fontSize:11,color:C.dim,textDecoration:"line-through"}}>${bumpProduct.price||bumpProduct.orig}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order summary */}
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,padding:"11px 14px",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:12,color:C.muted}}>{item.title}</span>
              <span style={{fontSize:12,color:C.cream}}>${item.price}</span>
            </div>
            {bumpAdded&&bump&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,color:C.green}}>{bumpProduct?.title}</span><span style={{fontSize:12,color:C.green}}>${bump.price}</span></div>}
            {coupon.applied&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,color:C.green}}>Coupon VAULT20 (20% off)</span><span style={{fontSize:12,color:C.green}}>-${Math.round(basePrice*0.2)}</span></div>}
            <div style={{height:1,background:C.border,margin:"8px 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:700,color:C.cream}}>Total</span><span style={{...GT,fontSize:16,fontWeight:900}}>${final}</span></div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <div><label style={lbl}>Full Name</label><input style={inp("name")} placeholder="John Smith" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>{errors.name&&<div style={{fontSize:9,color:C.red,marginTop:2}}>{errors.name}</div>}</div>
            <div><label style={lbl}>Email Address</label><input style={inp("email")} placeholder="john@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>{errors.email&&<div style={{fontSize:9,color:C.red,marginTop:2}}>{errors.email}</div>}</div>
            <div><label style={lbl}>Card Number</label><input style={inp("card")} placeholder="4242 4242 4242 4242" value={form.card} onChange={e=>setForm({...form,card:fmtCard(e.target.value)})}/>{errors.card&&<div style={{fontSize:9,color:C.red,marginTop:2}}>{errors.card}</div>}</div>
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1}}><label style={lbl}>Expiry</label><input style={inp("exp")} placeholder="MM/YY" value={form.exp} onChange={e=>setForm({...form,exp:fmtExp(e.target.value)})}/>{errors.exp&&<div style={{fontSize:9,color:C.red,marginTop:2}}>{errors.exp}</div>}</div>
              <div style={{flex:1}}><label style={lbl}>CVV</label><input style={inp("cvv")} placeholder="123" value={form.cvv} onChange={e=>setForm({...form,cvv:e.target.value.replace(/\D/g,"").slice(0,4)})}/>{errors.cvv&&<div style={{fontSize:9,color:C.red,marginTop:2}}>{errors.cvv}</div>}</div>
            </div>
            <div>
              <label style={lbl}>Coupon Code</label>
              <div style={{display:"flex",gap:6}}>
                <input style={{...inp("coupon"),flex:1}} placeholder="Try VAULT20" value={form.coupon} onChange={e=>setForm({...form,coupon:e.target.value})} disabled={coupon.applied}/>
                <Btn onClick={()=>{if(form.coupon.toUpperCase()==="VAULT20")setCoupon({applied:true,error:""});else setCoupon({applied:false,error:"Invalid"});}} variant="secondary" style={{padding:"10px 12px",fontSize:9}} disabled={coupon.applied}>{coupon.applied?"✓":"Apply"}</Btn>
              </div>
              {coupon.error&&<div style={{fontSize:9,color:C.red,marginTop:2}}>{coupon.error}</div>}
              {coupon.applied&&<div style={{fontSize:9,color:C.green,marginTop:2}}>20% discount applied!</div>}
            </div>
          </div>
          <Btn onClick={submit} full style={{padding:"15px",fontSize:12,marginTop:18}}>Complete Purchase — ${final}</Btn>
          <div style={{textAlign:"center",marginTop:10,display:"flex",justifyContent:"center",gap:14,flexWrap:"wrap"}}>
            {["🔒 SSL Secure","⚡ Instant Delivery","↩️ 30-Day Guarantee"].map((t,i)=><span key={i} style={{fontSize:9,color:C.dim}}>{t}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── UPSELL MODAL ───────────────────────────────────────────────
function UpsellModal({purchasedItem, onAccept, onDecline}) {
  const upsell = UPSELLS[purchasedItem.id];
  if(!upsell) { onDecline(); return null; }
  const upsellItem = getProduct(upsell.productId);
  if(!upsellItem) { onDecline(); return null; }
  const [loading, setLoading] = useState(false);

  const handleAccept = () => {
    setLoading(true);
    setTimeout(()=>{onAccept(upsellItem);},1800);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",backdropFilter:"blur(12px)",zIndex:4000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      {loading ? (
        <div style={{textAlign:"center"}}>
          <div style={{width:48,height:48,border:`3px solid ${C.border}`,borderTopColor:C.gold,borderRadius:"50%",margin:"0 auto 20px",animation:"spin 0.8s linear infinite"}}/>
          <div style={{...GT,fontSize:13,letterSpacing:4,textTransform:"uppercase"}}>Adding to Your Order</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
        </div>
      ) : (
        <div style={{background:C.surface,border:`1px solid ${C.borderH}`,borderRadius:8,maxWidth:520,width:"100%",textAlign:"center",overflow:"hidden"}}>
          <div style={{height:5,background:GG}}/>
          <div style={{padding:"36px 36px 28px"}}>
            <div style={{fontSize:11,color:C.gold,letterSpacing:4,textTransform:"uppercase",marginBottom:12}}>⚡ Wait — One Time Offer</div>
            <div style={{...GT,fontSize:26,fontWeight:900,letterSpacing:2,marginBottom:12}}>Your Order Is Complete</div>
            <p style={{fontSize:14,color:C.muted,lineHeight:1.75,marginBottom:24,fontStyle:"italic"}}>{upsell.headline}</p>
            <div style={{background:`radial-gradient(ellipse at center,${upsellItem.accent}18 0%,transparent 70%),${C.panel}`,border:`1px solid ${upsellItem.accent}40`,borderRadius:6,padding:"20px 24px",marginBottom:24}}>
              <div style={{fontSize:40,marginBottom:8}}>{upsellItem.emoji}</div>
              <div style={{...GT,fontSize:18,fontWeight:900,letterSpacing:2,marginBottom:4}}>{upsellItem.title}</div>
              <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:14,textTransform:"uppercase"}}>{upsellItem.sub}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:10,justifyContent:"center"}}>
                <span style={{...GT,fontSize:32,fontWeight:900}}>${upsell.price}</span>
                <span style={{fontSize:14,color:C.dim,textDecoration:"line-through"}}>${upsellItem.price||upsellItem.orig}</span>
                <span style={{fontSize:11,color:C.green,fontWeight:700}}>One-time discount</span>
              </div>
            </div>
            <Btn onClick={handleAccept} full style={{padding:"17px",fontSize:12,marginBottom:12}}>
              Yes — Add This To My Order (${upsell.price})
            </Btn>
            <button onClick={onDecline} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:11,fontFamily:"Georgia,serif",letterSpacing:1,textDecoration:"underline",textUnderlineOffset:3}}>
              No thanks, I don't need this
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────
export default function HustleVaultComplete() {
  const [filter, setFilter]         = useState("All");
  const [preview, setPreview]       = useState(null);
  const [checkout, setCheckout]     = useState(null);
  const [upsellItem, setUpsellItem] = useState(null);
  const [scrolled, setScrolled]     = useState(false);
  const [purchased, setPurchased]   = useState([]);
  const [ticker, setTicker]         = useState(0);
  const [successNote, setSuccessNote] = useState(null);

  useEffect(()=>{const h=()=>setScrolled(window.scrollY>60);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);
  useEffect(()=>{const t=setInterval(()=>setTicker(x=>x+1),4200);return()=>clearInterval(t);},[]);

  const handleBuy = useCallback((item) => { setCheckout(item); }, []);

  const handleCheckoutSuccess = useCallback((item) => {
    setPurchased(p=>[...p, item.id]);
    const upsell = UPSELLS[item.id];
    if(upsell) setTimeout(()=>setUpsellItem(item), 400);
    else { setSuccessNote(`✓ ${item.title} — Access Sent!`); setTimeout(()=>setSuccessNote(null),4000); }
  }, []);

  const handleUpsellAccept = useCallback((addedItem) => {
    setPurchased(p=>[...p, addedItem.id]);
    setUpsellItem(null);
    setSuccessNote(`✓ ${addedItem.title} added to your order!`);
    setTimeout(()=>setSuccessNote(null),4000);
  }, []);

  const handleUpsellDecline = useCallback(() => {
    setUpsellItem(null);
    setSuccessNote("✓ Your access was sent — check your email!");
    setTimeout(()=>setSuccessNote(null),4000);
  }, []);

  const allItems = filter==="Bundles" ? BUNDLES :
    filter==="All" ? PRODUCTS :
    PRODUCTS.filter(p=>p.cat===filter);

  const notifications = [
    "Marcus just got the Complete Vault — All 10",
    "Tamara just purchased NEMT Blueprint",
    "Derrick just got the Quick Cash Bundle",
    "Keisha just got Assisted Living Blueprint",
    "James just got Domain Flipping Blueprint",
    "Tanya just purchased Veterans Housing Blueprint",
    "Andre just got the Business Builder Bundle",
    "Monique just got Print on Demand Blueprint",
  ];

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.cream,fontFamily:"Georgia,serif",overflowX:"hidden"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:rgba(201,168,76,0.3);color:#F5F0E8;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:#05050A;}::-webkit-scrollbar-thumb{background:#282840;border-radius:3px;}
        input{outline:none;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
        @keyframes ticker{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes slideIn{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        .fu{animation:fadeUp 0.7s ease both;}.fu2{animation:fadeUp 0.7s 0.12s ease both;}.fu3{animation:fadeUp 0.7s 0.24s ease both;}.fu4{animation:fadeUp 0.7s 0.36s ease both;}
      `}</style>

      {/* Ticker bar */}
      <div style={{background:`linear-gradient(90deg,#1A0A00,#2A1400,#1A0A00)`,borderBottom:`1px solid ${C.gold}40`,padding:"9px 0",overflow:"hidden"}}>
        <div style={{display:"flex",animation:"ticker 28s linear infinite",width:"200%"}}>
          {["10 complete income blueprints — one vault","Bills don't stop — neither should your income","First income possible in 7 days with Unit Gold","Government-backed income streams inside","2400+ customers already building income","Complete Vault — all 10 blueprints for $197"].flatMap(x=>[x,x]).map((t,i)=>(
            <span key={i} style={{fontSize:10,color:C.gold,letterSpacing:2,whiteSpace:"nowrap",padding:"0 44px"}}>◆ {t}</span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:scrolled?`${C.surface}F4`:"transparent",backdropFilter:scrolled?"blur(18px)":"none",borderBottom:scrolled?`1px solid ${C.border}`:"none",transition:"all 0.3s",padding:"0 28px"}}>
        <div style={{maxWidth:1280,margin:"0 auto",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <VaultIcon size={24}/>
            <div>
              <div style={{...GT,fontSize:14,fontWeight:900,letterSpacing:4,textTransform:"uppercase",lineHeight:1}}>Hustle</div>
              <div style={{fontSize:8,letterSpacing:7,color:C.muted,textTransform:"uppercase"}}>Vault</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {purchased.length>0&&<div style={{fontSize:9,color:C.green,background:`${C.green}15`,border:`1px solid ${C.green}40`,borderRadius:100,padding:"3px 10px",letterSpacing:1}}>✓ {purchased.length} purchased</div>}
            <div style={{fontSize:9,color:C.dim,letterSpacing:2,display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:C.green,display:"inline-block",animation:"pulse 2s infinite"}}/>OPEN
            </div>
            <Btn onClick={()=>document.getElementById("bundles")?.scrollIntoView({behavior:"smooth"})} variant="secondary" style={{padding:"7px 16px",fontSize:9}}>Bundle Deals</Btn>
            <Btn onClick={()=>handleBuy(BUNDLES.find(b=>b.id==="B5"))} style={{padding:"7px 16px",fontSize:9}}>Complete Vault $197</Btn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{position:"relative",padding:"80px 28px 60px",textAlign:"center",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"20%",left:"50%",transform:"translate(-50%,-50%)",width:700,height:500,background:`radial-gradient(ellipse,${C.gold}12 0%,transparent 65%)`,pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:0,opacity:0.02,backgroundImage:`linear-gradient(${C.gold} 1px,transparent 1px),linear-gradient(90deg,${C.gold} 1px,transparent 1px)`,backgroundSize:"52px 52px",pointerEvents:"none"}}/>
        <div style={{position:"relative",maxWidth:820,margin:"0 auto"}}>
          <div className="fu" style={{display:"inline-flex",alignItems:"center",gap:8,background:`${C.gold}18`,border:`1px solid ${C.gold}40`,borderRadius:100,padding:"6px 18px",marginBottom:24}}>
            <VaultIcon size={13}/><span style={{fontSize:10,color:C.gold,letterSpacing:3,textTransform:"uppercase"}}>10 Complete Income Blueprints</span>
          </div>
          <h1 className="fu2" style={{margin:"0 0 18px",lineHeight:1.02}}>
            <span style={{...GT,fontSize:"clamp(40px,7vw,72px)",fontWeight:900,letterSpacing:4,textTransform:"uppercase",display:"block"}}>Hustle Vault</span>
            <span style={{fontSize:"clamp(16px,2.5vw,22px)",color:C.muted,display:"block",fontStyle:"italic",fontWeight:400,letterSpacing:2,marginTop:8}}>Real Blueprints for People Who Need Income Now</span>
          </h1>
          <p className="fu3" style={{fontSize:"clamp(13px,1.8vw,16px)",color:C.muted,lineHeight:1.85,maxWidth:580,margin:"0 auto 32px",fontStyle:"italic"}}>
            10 step-by-step income systems covering quick cash, digital income, real estate, government-backed programs, and physical businesses. First income in as little as 7 days.
          </p>
          <div className="fu4" style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <Btn onClick={()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"})} style={{padding:"14px 32px",fontSize:11}}>Browse All 10 Products</Btn>
            <Btn onClick={()=>handleBuy(BUNDLES.find(b=>b.id==="B5"))} variant="secondary" style={{padding:"14px 32px",fontSize:11}}>🔥 Complete Vault — $197</Btn>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{background:C.surface,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"22px 28px"}}>
        <div style={{maxWidth:1000,margin:"0 auto",display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:18}}>
          {[["10","Blueprints"],["$474","Total Value"],["2,400+","Customers"],["$197","Complete Vault"]].map((s,i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <div style={{...GT,fontSize:24,fontWeight:900,letterSpacing:2}}>{s[0]}</div>
              <div style={{fontSize:9,color:C.dim,letterSpacing:3,textTransform:"uppercase",marginTop:3}}>{s[1]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BUNDLES SECTION ── */}
      <section id="bundles" style={{padding:"72px 28px 0",maxWidth:1280,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:9,color:C.gold,letterSpacing:6,textTransform:"uppercase",marginBottom:10}}>Best Value</div>
          <h2 style={{fontSize:"clamp(22px,3.5vw,36px)",fontWeight:900,color:C.cream,letterSpacing:2,marginBottom:12}}>Bundle Deals — Save More, Build More</h2>
          <div style={{width:60,height:2,background:GG,margin:"0 auto 16px"}}/>
          <p style={{fontSize:13,color:C.muted,maxWidth:500,margin:"0 auto"}}>Curated bundles by income category. Buy what you need most — or get everything for one price.</p>
        </div>

        {/* Featured complete vault */}
        <div style={{marginBottom:24}}>
          {BUNDLES.filter(b=>b.id==="B5").map(b=>(
            <div key={b.id} style={{background:`linear-gradient(135deg,${C.panel},#0F0D00,${C.panel})`,border:`2px solid ${C.gold}60`,borderRadius:8,padding:"32px 40px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:GG}}/>
              <div style={{position:"absolute",top:12,right:16}}><Badge color={C.goldBri}>🔥 Best Value — Save $277</Badge></div>
              <div style={{display:"flex",alignItems:"center",gap:32,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:260}}>
                  <div style={{fontSize:10,color:C.gold,letterSpacing:4,textTransform:"uppercase",marginBottom:8}}>Complete Vault</div>
                  <h3 style={{fontSize:"clamp(20px,3vw,30px)",fontWeight:900,color:C.cream,marginBottom:10,letterSpacing:2}}>All 10 Blueprints — One Price</h3>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                    {PRODUCTS.map(p=>(
                      <div key={p.id} title={p.title} style={{display:"flex",alignItems:"center",gap:4,background:C.bg,border:`1px solid ${C.border}`,borderRadius:100,padding:"3px 10px"}}>
                        <span style={{fontSize:12}}>{p.emoji}</span>
                        <span style={{fontSize:9,color:C.muted,letterSpacing:1}}>{p.title.split(" ")[0]}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{fontSize:13,color:C.muted,lineHeight:1.7}}>{b.desc}</p>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,flexShrink:0}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{...GT,fontSize:52,fontWeight:900,lineHeight:1}}>${b.price}</div>
                    <div style={{fontSize:14,color:C.dim,textDecoration:"line-through"}}>${b.orig} value</div>
                    <div style={{fontSize:12,color:C.green,fontWeight:700}}>You save ${b.saves}</div>
                  </div>
                  <Btn onClick={()=>handleBuy(b)} style={{padding:"16px 36px",fontSize:12}}>Get Complete Vault</Btn>
                  <div style={{fontSize:10,color:C.dim}}>🛡️ 30-day guarantee · Instant delivery</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Other 4 bundles */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:18,marginBottom:80}}>
          {BUNDLES.filter(b=>b.id!=="B5").map(b=>(
            <ProductCard key={b.id} item={b} onBuy={handleBuy} onView={setPreview}/>
          ))}
        </div>
      </section>

      {/* ── INDIVIDUAL PRODUCTS ── */}
      <section id="products" style={{padding:"0 28px 80px",maxWidth:1280,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:9,color:C.gold,letterSpacing:6,textTransform:"uppercase",marginBottom:10}}>Individual Blueprints</div>
          <h2 style={{fontSize:"clamp(22px,3.5vw,36px)",fontWeight:900,color:C.cream,letterSpacing:2,marginBottom:14}}>Buy Just What You Need</h2>
          <div style={{width:60,height:2,background:GG,margin:"0 auto 24px"}}/>
          <div style={{display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap"}}>
            {cats.map(cat=>(
              <button key={cat} onClick={()=>setFilter(cat)} style={{background:filter===cat?GG:"transparent",color:filter===cat?"#000":C.muted,border:`1px solid ${filter===cat?C.goldBri:C.border}`,padding:"7px 16px",fontSize:9,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",borderRadius:2,fontFamily:"Georgia,serif",transition:"all 0.2s"}}>{cat}</button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(268px,1fr))",gap:18}}>
          {(filter==="Bundles"?BUNDLES:filter==="All"?PRODUCTS:PRODUCTS.filter(p=>p.cat===filter)).map(item=>(
            <ProductCard key={item.id} item={item} onBuy={handleBuy} onView={setPreview} highlight={purchased.includes(item.id)}/>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section style={{padding:"0 28px 80px",maxWidth:1000,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:9,color:C.gold,letterSpacing:6,textTransform:"uppercase",marginBottom:10}}>Real Results</div>
          <h2 style={{fontSize:"clamp(20px,3vw,30px)",fontWeight:900,color:C.cream,letterSpacing:2}}>People Who Took Action</h2>
          <div style={{width:50,height:2,background:GG,margin:"14px auto 0"}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
          {[
            {n:"Marcus T.",c:"Houston TX",t:"Won my first unit for $150 — netted $510 in two weeks. Formula alone worth 10x the price.",p:"Unit Gold"},
            {n:"Tamara W.",c:"Atlanta GA",t:"Got my dealer license in 3 weeks. First car flip: $3,400 profit.",p:"Dealer License"},
            {n:"Keisha M.",c:"Detroit MI",t:"NEMT — 2 Medicaid contracts in 6 weeks. Now doing $7,200/month.",p:"NEMT Blueprint"},
            {n:"Derrick P.",c:"Newark NJ",t:"Domain I registered for $12 sold for $3,200 in 44 days.",p:"Domain Flipping"},
            {n:"James W.",c:"Phoenix AZ",t:"POD store at 200 designs now doing $3,800/month. Pure passive.",p:"Print on Demand"},
            {n:"Sandra K.",c:"Memphis TN",t:"HUD-VASH landlord — all 4 units filled in 60 days. Near-zero vacancy.",p:"Veterans Housing"},
          ].map((t,i)=>(
            <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:GG}}/>
              <div style={{display:"flex",gap:3,marginBottom:10}}>{"★★★★★".split("").map((s,j)=><span key={j} style={{color:C.goldBri,fontSize:12}}>{s}</span>)}</div>
              <p style={{fontSize:12,color:"#C0B8A8",lineHeight:1.7,marginBottom:12,fontStyle:"italic"}}>"{t.t}"</p>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:GG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#000"}}>{t.n[0]}</div>
                <div><div style={{fontSize:11,fontWeight:700,color:C.cream}}>{t.n}</div><div style={{fontSize:9,color:C.dim}}>{t.c} · {t.p}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── GUARANTEE ── */}
      <section style={{padding:"0 28px 80px",maxWidth:640,margin:"0 auto",textAlign:"center"}}>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"40px 36px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",bottom:-30,left:"50%",transform:"translateX(-50%)",width:260,height:160,background:`radial-gradient(ellipse,${C.gold}08,transparent 70%)`,pointerEvents:"none"}}/>
          <div style={{fontSize:48,marginBottom:16}}>🛡️</div>
          <div style={{...GT,fontSize:20,fontWeight:900,letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>30-Day Guarantee</div>
          <p style={{fontSize:13,color:C.muted,lineHeight:1.85}}>Every product in the Vault comes with a full 30-day money-back guarantee. Read it, apply it, and if it doesn't deliver — full refund, no questions, no forms, no waiting.</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{background:C.surface,borderTop:`1px solid ${C.border}`,padding:"28px",textAlign:"center"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}}>
          <VaultIcon size={16}/><span style={{...GT,fontSize:12,fontWeight:900,letterSpacing:4,textTransform:"uppercase"}}>Hustle Vault</span>
        </div>
        <p style={{fontSize:10,color:C.dim,marginBottom:10}}>hustlevault.com · 10 Premium Digital Blueprints</p>
        <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap",marginBottom:10}}>
          {["Privacy Policy","Terms of Service","Refund Policy","Contact"].map((t,i)=><span key={i} style={{fontSize:9,color:C.dim,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>{t}</span>)}
        </div>
        <div style={{fontSize:9,color:"#1A1A28"}}>© 2026 Hustle Vault. All rights reserved. Results vary by individual effort and market conditions.</div>
      </footer>

      {/* Live notification */}
      <div style={{position:"fixed",bottom:20,left:20,zIndex:500}}>
        <div key={ticker} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"9px 14px",display:"flex",alignItems:"center",gap:8,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",maxWidth:260,animation:"slideIn 0.4s ease"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:C.green,flexShrink:0,animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:10,color:C.muted}}>{notifications[ticker%notifications.length]}</span>
        </div>
      </div>

      {/* Success notification */}
      {successNote && (
        <div style={{position:"fixed",bottom:20,right:20,zIndex:500,background:C.green,borderRadius:6,padding:"12px 18px",boxShadow:"0 8px 32px rgba(46,204,113,0.3)",animation:"slideIn 0.4s ease"}}>
          <span style={{fontSize:12,color:"#000",fontWeight:700,fontFamily:"Georgia,serif"}}>{successNote}</span>
        </div>
      )}

      {/* Modals */}
      {preview && <PreviewModal item={preview} onClose={()=>setPreview(null)} onBuy={item=>{setPreview(null);handleBuy(item);}}/>}
      {checkout && <CheckoutModal item={checkout} onClose={()=>setCheckout(null)} onSuccess={handleCheckoutSuccess}/>}
      {upsellItem && <UpsellModal purchasedItem={upsellItem} onAccept={handleUpsellAccept} onDecline={handleUpsellDecline}/>}
    </div>
  );
}

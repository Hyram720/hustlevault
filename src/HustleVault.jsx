import { useState, useEffect, useRef, useCallback } from "react";
import { API } from "./config";

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

// US flag as inline SVG — the 🇺🇸 emoji renders as plain "US" text on Windows
function USFlag({width=40}) {
  const stripe = 28/13;
  return (
    <svg width={width} height={width*0.7} viewBox="0 0 40 28" style={{borderRadius:3,display:"block",boxShadow:"0 2px 8px rgba(0,0,0,0.4)"}}>
      <rect width="40" height="28" fill="#B22234"/>
      {[1,3,5,7,9,11].map(i=><rect key={i} y={i*stripe} width="40" height={stripe} fill="#FFFFFF"/>)}
      <rect width="17" height={stripe*7} fill="#3C3B6E"/>
      {[0,1,2,3,4].map(r=>
        [0,1,2,3,4].map(c=>{
          const odd = r%2===1;
          if(odd && c===4) return null;
          return <circle key={`${r}-${c}`} cx={2.2+(odd?1.6:0)+c*3.2} cy={2.2+r*2.4} r="0.85" fill="#FFFFFF"/>;
        })
      )}
    </svg>
  );
}

// ── PRODUCTS ───────────────────────────────────────────────────
const PRODUCTS = [
  { id:1,  emoji:"🔐", title:"UNIT GOLD",           sub:"Storage Auction Blueprint",        price:57,  orig:97,  accent:"#C9A84C", cat:"Quick Cash",  tag:"BEST SELLER",  tagC:"#F0C040", desc:"Win storage auctions and flip the contents for profit. First income possible in 7 days.", inc:["9 Complete Chapters","Profit Formula Calculator","3 Real Case Studies","Auction Finder Guide","Selling Platform Cheat Sheet","Scaling Roadmap"] },
  { id:2,  emoji:"🚗", title:"DEALER LICENSE",      sub:"Car Dealer License Guide",         price:47,  orig:79,  accent:"#C0392B", cat:"Business",     tag:"HIGH INCOME",  tagC:"#E74C3C", desc:"Get licensed and access wholesale auctions to flip cars for profit.", inc:["State-by-State Requirements","Application Walkthrough","Wholesale Auction Access","Deal Formula Calculator","4 Case Studies","Compliance Checklist"] },
  { id:3,  emoji:"🔑", title:"REPO BLUEPRINT",      sub:"Vehicle Repossession Business",    price:37,  orig:67,  accent:"#2471A3", cat:"Quick Cash",   tag:"NEW",          tagC:"#3498DB", desc:"Get paid per vehicle recovered. Recession-proof income with low startup cost.", inc:["State Licensing Guide","Finding BHPH Clients","Recovery Process Steps","Pricing and Rate Sheet","3 Case Studies","Safety and Legal Guide"] },
  { id:4,  emoji:"📦", title:"LAND FLIP FORMULA",   sub:"Buy and Flip Vacant Land",        price:47,  orig:89,  accent:"#27AE60", cat:"Business",     tag:"PASSIVE",      tagC:"#2ECC71", desc:"Buy vacant land from motivated sellers for pennies on the dollar and sell it online.", inc:["County Tax Record System","Seller Letter Template","Valuation Framework","5 Case Studies","Due Diligence Checklist","Seller Finance Strategy"] },
  { id:5,  emoji:"🏥", title:"NEMT BLUEPRINT",      sub:"Medical Transport Business",       price:47,  orig:89,  accent:"#16A085", cat:"Business",     tag:"RECURRING",    tagC:"#1ABC9C", desc:"Government-contracted medical transport routes. Steady recurring Medicaid income.", inc:["Medicaid Enrollment Guide","Broker Contact List","Vehicle Requirements","3 Case Studies","Billing System","Fleet Scaling Roadmap"] },
  { id:6,  emoji:"🎨", title:"PRINT ON DEMAND",     sub:"Zero Inventory Online Store",      price:47,  orig:89,  accent:"#8E44AD", cat:"Digital",      tag:"PASSIVE",      tagC:"#9B59B6", desc:"Upload designs once, earn royalties forever. No inventory, no shipping, no employees.", inc:["50 Proven Niches","Design Creation System","Platform Setup Guide","Marketing Blueprint","3 Case Studies","500-Design Scaling Plan"] },
  { id:7,  emoji:"🌐", title:"DOMAIN FLIPPING",     sub:"Buy Low, Sell Domains for Profit",price:47, orig:89,  accent:"#1F618D", cat:"Digital",      tag:"LOW STARTUP",  tagC:"#2980B9", desc:"Register or buy undervalued domains and sell them to businesses for profit.", inc:["Valuation Framework","NameBio Research System","Outreach Email Templates","4 Case Studies","Marketplace Directory","Portfolio Strategy"] },
  { id:8,  emoji:"🏠", title:"ASSISTED LIVING",     sub:"Residential Care Home Business",   price:47,  orig:89,  accent:"#884EA0", cat:"Housing",      tag:"HIGH INCOME",  tagC:"#9B59B6", desc:"Operate a residential care home with government-backed resident payments.", inc:["State Licensing Navigator","Property Setup Guide","Staffing Framework","4 Case Studies","Medicaid Waiver Enrollment","Multi-Home Scaling"] },
  { id:9,  emoji:<USFlag/>, title:"VETERANS HOUSING",   sub:"HUD-VASH and Government Programs", price:47,  orig:89,  accent:"#1A5276", cat:"Housing",      tag:"GOVT BACKED",  tagC:"#2471A3", desc:"Accept HUD-VASH vouchers and get government-guaranteed rent with near-zero vacancy.", inc:["HUD-VASH Landlord Guide","GPD Grant Application","SSVF Partnership System","3 Case Studies","VA Contact Directory","Portfolio Scaling"] },
  { id:10, emoji:"🥤", title:"VENDING MACHINE",     sub:"Cash Flow While You Sleep",        price:47,  orig:89,  accent:"#D35400", cat:"Physical",     tag:"CASH DAILY",   tagC:"#E67E22", desc:"Place machines, stock product, collect cash. Scales to full-time income.", inc:["Location Pitch Script","Machine Comparison Chart","Stocking Strategy","3 Case Studies","Route Management System","Cashless Tech Guide"] },
];

const BUNDLES = [
  { id:"B1", emoji:"⚡", title:"QUICK CASH BUNDLE", tag:"FASTEST INCOME", tagC:C.green, accent:"#2ECC71", price:141, orig:141, desc:"Storage auctions, repo, and car flipping — all income possible within 30 days.", productIds:[1,3,2], saves:28, features:["First income possible in 7 days","Flip physical assets for profit","Low startup cost","No experience needed"] },
  { id:"B2", emoji:"🏢", title:"BUSINESS BUILDER BUNDLE", tag:"BUILD ASSETS", tagC:"#3498DB", accent:"#3498DB", price:282, orig:282, desc:"6 complete business blueprints — land flipping, NEMT, assisted living, veterans housing, vending, and dealer license.", productIds:[2,4,5,8,9,10], saves:56, features:["6 complete businesses","Government-backed income","Multiple physical and digital","Recurring monthly revenue"] },
  { id:"B3", emoji:"💻", title:"DIGITAL EMPIRE BUNDLE", tag:"100% ONLINE", tagC:C.purple, accent:"#8E44AD", price:151, orig:151, desc:"3 location-independent streams. Print on demand, domain flipping, and storage auctions.", productIds:[1,6,7], saves:30, features:["Work from anywhere","No physical inventory","Scales without employees","Passive income potential"] },
  { id:"B4", emoji:"🏘️", title:"HOUSING EMPIRE BUNDLE", tag:"REAL ESTATE", tagC:"#884EA0", accent:"#884EA0", price:188, orig:188, desc:"4 housing streams — land flipping, assisted living, veterans housing, and NEMT.", productIds:[4,5,8,9], saves:38, features:["Government-guaranteed payments","Real estate wealth building","Recurring monthly income","Mission-driven impact"] },
  { id:"B5", emoji:"🔥", title:"COMPLETE VAULT — ALL 10", tag:"BEST VALUE", tagC:"#F0C040", accent:"#F0C040", price:470, orig:470, desc:"Every single Hustle Vault blueprint in one purchase. $470 worth of blueprints for $376.", productIds:[1,2,3,4,5,6,7,8,9,10], saves:94, features:["All 10 complete blueprints","Every income category covered","Lifetime future updates","Priority email support"], featured:true },
];

const ORDER_BUMPS = {
  1:  { title:"Add the Repo Blueprint",             productId:3,  price:17 },
  2:  { title:"Add the Land Flip Formula",          productId:4,  price:17 },
  3:  { title:"Add the Dealer License Blueprint",   productId:2,  price:17 },
  4:  { title:"Add the NEMT Blueprint",             productId:5,  price:17 },
  5:  { title:"Add the Assisted Living Blueprint",  productId:8,  price:17 },
  6:  { title:"Add Domain Flipping",                productId:7,  price:17 },
  7:  { title:"Add Print on Demand",                productId:6,  price:17 },
  8:  { title:"Add Veterans Housing",               productId:9,  price:17 },
  9:  { title:"Add Assisted Living",                productId:8,  price:17 },
  10: { title:"Add the Repo Blueprint",             productId:3,  price:17 },
  B1: { title:"Add Land Flip Formula",              productId:4,  price:17 },
  B2: { title:"Upgrade: Add Digital Empire Bundle", productId:"B3",price:47 },
  B3: { title:"Add NEMT Blueprint",                 productId:5,  price:17 },
  B4: { title:"Add Print on Demand",                productId:6,  price:17 },
  B5: null,
};

const getProduct = id => PRODUCTS.find(p=>p.id===id) || BUNDLES.find(b=>b.id===id);
const cats = ["All","Quick Cash","Business","Digital","Housing","Physical","Bundles"];

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

function ProductCard({item, onBuy, onView, highlight=false}) {
  const [h,setH]=useState(false);
  const isBundle = !!item.productIds;
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{background:C.surface,border:`1px solid ${h||highlight?C.borderH:C.border}`,borderRadius:6,overflow:"hidden",transition:"all 0.28s",transform:h?"translateY(-5px)":"none",boxShadow:h?`0 20px 60px rgba(0,0,0,0.65)`:"0 4px 20px rgba(0,0,0,0.3)",display:"flex",flexDirection:"column",position:"relative"}}>
      <div style={{height:3,background:`linear-gradient(90deg,transparent,${item.accent},transparent)`}}/>
      {item.featured && <div style={{position:"absolute",top:0,right:0,background:GG,color:"#000",fontSize:8,fontWeight:700,letterSpacing:2,padding:"4px 14px",textTransform:"uppercase",zIndex:2}}>Most Popular</div>}
      <div style={{background:`radial-gradient(ellipse at 25% 50%,${item.accent}18 0%,transparent 65%),${C.panel}`,padding:"22px 20px 16px"}}>
        <div style={{fontSize:36,marginBottom:8,lineHeight:1}}>{item.emoji}</div>
        <Badge color={item.tagC}>{item.tag}</Badge>
        <div style={{marginTop:10}}>
          <div style={{...GT,fontSize:16,fontWeight:900,letterSpacing:2,textTransform:"uppercase"}}>{item.title}</div>
          <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginTop:3,textTransform:"uppercase"}}>{item.sub}</div>
        </div>
      </div>
      <div style={{padding:"14px 20px",flex:1,display:"flex",flexDirection:"column",gap:10}}>
        <p style={{fontSize:12,color:"#C0B8A8",lineHeight:1.7,margin:0,fontStyle:"italic"}}>{item.desc}</p>
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginTop:"auto",paddingTop:6}}>
          <span style={{...GT,fontSize:26,fontWeight:900}}>${isBundle ? Math.round(item.price * 0.8) : item.price}</span>
          <span style={{fontSize:12,color:C.dim,textDecoration:"line-through"}}>${isBundle ? item.price : item.orig}</span>
        </div>
      </div>
      <div style={{padding:"0 20px 20px",display:"flex",gap:8}}>
        <Btn onClick={()=>onBuy(item)} style={{flex:1,padding:"11px"}}>Get Access</Btn>
        <Btn onClick={()=>onView(item)} variant="ghost" style={{padding:"11px 12px",fontSize:10}}>Info</Btn>
      </div>
    </div>
  );
}

// ── MODALS ─────────────────────────────────────────────────────
function PreviewModal({item, onClose, onBuy}) {
  const isBundle = !!item.productIds;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(10px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.borderH}`,borderRadius:8,maxWidth:500,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{height:4,background:GG}}/>
        <div style={{background:`radial-gradient(ellipse at 30% 50%,${item.accent}22 0%,transparent 60%),${C.panel}`,padding:"28px 32px 20px",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:12,right:16,background:"none",border:"none",color:C.dim,fontSize:22,cursor:"pointer"}}>×</button>
          <div style={{fontSize:48,marginBottom:8}}>{item.emoji}</div>
          <Badge color={item.tagC}>{item.tag}</Badge>
          <div style={{...GT,fontSize:22,fontWeight:900,letterSpacing:3,textTransform:"uppercase",marginTop:10}}>{item.title}</div>
        </div>
        <div style={{padding:"24px 32px"}}>
          <p style={{fontSize:13,color:"#C8C0B0",lineHeight:1.8,marginBottom:20}}>{item.desc}</p>

          {item.inc && (
            <div style={{marginBottom:22}}>
              <div style={{fontSize:10,color:C.gold,letterSpacing:3,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>What's Inside</div>
              <div style={{display:"grid",gap:8}}>
                {item.inc.map(x=>(
                  <div key={x} style={{display:"flex",alignItems:"center",gap:10,fontSize:12,color:"#C8C0B0"}}>
                    <span style={{color:C.green,fontSize:11,flexShrink:0}}>✓</span>{x}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isBundle && (
            <div style={{marginBottom:22}}>
              <div style={{fontSize:10,color:C.gold,letterSpacing:3,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Includes {item.productIds.length} Blueprints</div>
              <div style={{display:"grid",gap:8,marginBottom:16}}>
                {item.productIds.map(pid=>{
                  const p = getProduct(pid);
                  return p && (
                    <div key={pid} style={{display:"flex",alignItems:"center",gap:10,fontSize:12,color:"#C8C0B0"}}>
                      <span style={{color:C.gold,fontSize:11,flexShrink:0}}>◆</span>{p.title} <span style={{color:C.dim}}>— ${p.price}</span>
                    </div>
                  );
                })}
              </div>
              {item.features && (
                <div style={{display:"grid",gap:8}}>
                  {item.features.map(f=>(
                    <div key={f} style={{display:"flex",alignItems:"center",gap:10,fontSize:12,color:"#C8C0B0"}}>
                      <span style={{color:C.green,fontSize:11,flexShrink:0}}>✓</span>{f}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:14}}>
            <span style={{...GT,fontSize:36,fontWeight:900}}>${isBundle ? Math.round(item.price * 0.8) : item.price}</span>
            <span style={{fontSize:13,color:C.dim,textDecoration:"line-through"}}>${isBundle ? item.price : item.orig}</span>
          </div>
          <Btn onClick={()=>{onClose();onBuy(item);}} full>Get Instant Access — ${isBundle ? Math.round(item.price * 0.8) : item.price}</Btn>
        </div>
      </div>
    </div>
  );
}

function CheckoutModal({item, onClose}) {
  const bump = ORDER_BUMPS[item.id];
  const bumpProduct = bump ? getProduct(bump.productId) : null;
  const [bumpAdded, setBumpAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Automatically apply discount if it's a pre-defined bundle OR if an order bump is added
  const isBundled = !!item.productIds || bumpAdded;
  const basePrice = item.price + (bumpAdded && bump ? bump.price : 0);
  const final = isBundled ? Math.round(basePrice * 0.8) : basePrice;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          productId: item.id,
          bumpId: bumpAdded ? bump.productId : null,
          couponCode: isBundled ? "VAULT20" : null
        })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Failed to create checkout session");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(10px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.borderH}`,borderRadius:8,maxWidth:460,width:"100%"}}>
        <div style={{height:4,background:GG}}/>
        <div style={{padding:"22px 28px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
            <div><div style={{fontSize:9,color:C.muted,letterSpacing:3,textTransform:"uppercase"}}>Checkout</div><div style={{...GT,fontSize:18,fontWeight:900}}>{item.title}</div></div>
            <button onClick={onClose} style={{background:"none",border:"none",color:C.dim,fontSize:20,cursor:"pointer"}}>×</button>
          </div>

          {bumpProduct && (
            <div onClick={()=>setBumpAdded(!bumpAdded)} style={{background:bumpAdded?`${C.green}10`:`${C.goldBri}08`,border:`1px solid ${bumpAdded?C.green:C.gold}40`,borderRadius:4,padding:"12px 16px",marginBottom:16,cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                <div style={{width:20,height:20,borderRadius:3,border:`2px solid ${bumpAdded?C.green:C.gold}`,background:bumpAdded?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                  {bumpAdded&&<span style={{color:"#fff",fontSize:12}}>✓</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:bumpAdded?C.green:C.gold,fontWeight:700,textTransform:"uppercase",marginBottom:2}}>⚡ Special Add-On</div>
                  <div style={{fontSize:12,color:C.cream,fontWeight:700}}>{bump.title} (+${bump.price})</div>
                </div>
              </div>
            </div>
          )}

          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,padding:"11px 14px",marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,color:C.muted}}>{item.title}</span><span style={{fontSize:12,color:C.cream}}>${item.price}</span></div>
            {bumpAdded&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,color:C.green}}>{bumpProduct.title}</span><span style={{fontSize:12,color:C.green}}>${bump.price}</span></div>}
            {isBundled && <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,color:C.green}}>Bundle Discount (20%)</span><span style={{fontSize:12,color:C.green}}>-${Math.round(basePrice*0.2)}</span></div>}
            <div style={{height:1,background:C.border,margin:"8px 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:700,color:C.cream}}>Total</span><span style={{...GT,fontSize:18,fontWeight:900}}>${final}</span></div>
          </div>



          <Btn onClick={handleCheckout} disabled={loading} full style={{padding:"15px",fontSize:12}}>
            {loading ? "Redirecting to Stripe..." : `Proceed to Checkout — $${final}`}
          </Btn>
          <div style={{textAlign:"center",marginTop:10,fontSize:9,color:C.dim}}>🔒 SSL Secure · ⚡ Instant Delivery</div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN LANDING PAGE ──────────────────────────────────────────
export default function HustleVault() {
  const [filter, setFilter] = useState("All");
  const [preview, setPreview] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(()=>{const h=()=>setScrolled(window.scrollY>60);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);

  const allItems = filter==="Bundles"?BUNDLES:filter==="All"?PRODUCTS:PRODUCTS.filter(p=>p.cat===filter);

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.cream,fontFamily:"Inter, system-ui, sans-serif"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:rgba(201,168,76,0.3);color:#F5F0E8;}
        @keyframes ticker{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        .ticker-wrap{animation:ticker 30s linear infinite;width:max-content;display:flex;}
      `}</style>

      {/* Ticker */}
      <div style={{background:`linear-gradient(90deg,#1A0A00,#2A1400,#1A0A00)`,borderBottom:`1px solid ${C.gold}30`,padding:"10px 0",overflow:"hidden"}}>
        <div className="ticker-wrap">
          {["10 Blueprints — One Vault","Bills don't stop — neither should your income","Step-by-step systems, not theory","Government-backed income streams","Instant download — lifetime access"].flatMap(x=>[x,x]).map((t,i)=>(
            <span key={i} style={{fontSize:10,color:C.gold,letterSpacing:2,whiteSpace:"nowrap",padding:"0 40px"}}>◆ {t}</span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:scrolled?`${C.surface}F0`:"transparent",backdropFilter:scrolled?"blur(15px)":"none",borderBottom:scrolled?`1px solid ${C.border}`:"none",transition:"0.3s",padding:"0 24px"}}>
        <div style={{maxWidth:1280,margin:"0 auto",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
           <div style={{display:"flex",alignItems:"center",gap:10}}><VaultIcon size={24}/><div><div style={{...GT,fontSize:14,fontWeight:900,letterSpacing:4,textTransform:"uppercase"}}>Hustle Vault</div></div></div>
           <Btn onClick={()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"})} style={{padding:"9px 20px",fontSize:9}}>Get The Vault $376</Btn>
        </div>
      </nav>

      {/* Hero */}
      <section style={{padding:"90px 24px",textAlign:"center",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:600,height:400,background:`radial-gradient(ellipse at center,${C.gold}10,transparent 70%)`}}/>
        <div style={{position:"relative",maxWidth:800,margin:"0 auto"}}>
           <div style={{display:"inline-flex",background:`${C.gold}15`,border:`1px solid ${C.gold}40`,borderRadius:100,padding:"6px 16px",marginBottom:24,fontSize:10,color:C.gold,letterSpacing:3}}>10 COMPLETE INCOME BLUEPRINTS</div>
           <h1 style={{fontSize:"clamp(40px,7vw,76px)",fontWeight:950,lineHeight:0.95,letterSpacing:-2,marginBottom:20}}><span style={GT}>HUSTLE VAULT</span></h1>
           <p style={{fontSize:18,color:C.muted,lineHeight:1.6,maxWidth:600,margin:"0 auto 32px"}}>Real income systems for people who need cash now. Every blueprint, every step, one vault.</p>
           <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <Btn onClick={()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"})} style={{padding:"15px 36px"}}>Browse All Blueprints</Btn>
              <Btn onClick={()=>setCheckout(BUNDLES[4])} variant="secondary" style={{padding:"15px 36px"}}>Save 20% — Complete Vault</Btn>
           </div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="products" style={{padding:"60px 24px 100px",maxWidth:1280,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
           <h2 style={{fontSize:32,fontWeight:900,marginBottom:24}}>Explore The Vault</h2>
           <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
             {cats.map(c=><button key={c} onClick={()=>setFilter(c)} style={{background:filter===c?GG:"transparent",color:filter===c?"#000":C.muted,border:`1px solid ${filter===c?C.goldBri:C.border}`,padding:"8px 16px",fontSize:10,borderRadius:2,cursor:"pointer",letterSpacing:1}}>{c}</button>)}
           </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:24}}>
          {allItems.map(item=><ProductCard key={item.id} item={item} onBuy={setCheckout} onView={setPreview}/>)}
        </div>
      </section>
      <footer style={{padding:"40px 24px",textAlign:"center",background:C.surface,color:C.dim,fontSize:10,letterSpacing:2}}>
         <div style={{marginBottom:14}}>HUSTLE VAULT · © 2026 · ALL RIGHTS RESERVED</div>
         <div style={{display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap",marginBottom:12}}>
           {[["Terms of Service","/terms.html"],["Refund Policy","/refund-policy.html"],["Privacy Policy","/privacy.html"],["Earnings Disclaimer","/earnings-disclaimer.html"]].map(([label,href])=>(
             <a key={href} href={href} style={{color:C.muted,textDecoration:"none",fontSize:10,letterSpacing:2,textTransform:"uppercase"}}>{label}</a>
           ))}
         </div>
         <div style={{color:C.dim,fontSize:9,maxWidth:640,margin:"0 auto 10px",lineHeight:1.6,letterSpacing:1,textTransform:"none"}}>Income figures shown are examples of what these business models can produce, not typical results or guarantees. Your results depend on your effort, location, and market conditions. See our <a href="/earnings-disclaimer.html" style={{color:C.muted}}>Earnings Disclaimer</a>.</div>
         <div style={{color:C.dim,fontSize:9}}>Support: sunmarketingllc@gmail.com</div>
      </footer>

      {/* Modals */}
      {preview && <PreviewModal item={preview} onClose={()=>setPreview(null)} onBuy={setCheckout}/>}
      {checkout && <CheckoutModal item={checkout} onClose={()=>setCheckout(null)}/>}
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { API } from "./config";
import { useSEO } from "./seo";

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
const PRODUCT_IMG = {
  1:  IMG + "hf_20260810_204014_842ea22c-c197-4158-97ee-f015154aa0a8.png",
  2:  IMG + "hf_20260810_204014_182f9339-d846-4e02-a1a5-08fbccd3e110.png",
  3:  IMG + "hf_20260810_204948_5044c160-fed5-4494-b144-78f0364d568e.png",
  4:  IMG + "hf_20260810_204948_58364e63-4de7-4c86-ad01-17119ec69fdd.png",
  5:  IMG + "hf_20260810_204948_4f6f4ed6-e5aa-4c47-b438-e6b879f1bbca.png",
  6:  IMG + "hf_20260810_204014_9aa2d346-deba-46e7-86e1-48ed269c49f3.png",
  7:  IMG + "hf_20260810_204948_a597cda6-6f67-45d1-b9fb-d4f3a227b0df.png",
  8:  IMG + "hf_20260810_204948_3af1cb31-f56a-411b-87b3-5ca900f07e76.png",
  9:  IMG + "hf_20260810_204948_38f6e06e-a59d-4996-8e7c-440811c368f9.png",
  10: IMG + "hf_20260810_204948_cca9d646-2749-4d2d-a4ef-322985cc466e.png",
};

// ── PRODUCTS ───────────────────────────────────────────────────
const PRODUCTS = [
  { id:1,  emoji:"🔐", title:"UNIT GOLD",           sub:"Storage Auction Blueprint",        price:57,  orig:97,  accent:"#C9A84C", cat:"Quick Cash",  tag:"BEST SELLER",  tagC:"#F0C040", desc:"Win storage auctions and flip the contents for profit.", inc:["9 Complete Chapters","Profit Formula Calculator","3 Real Case Studies","Auction Finder Guide","Selling Platform Cheat Sheet","Scaling Roadmap"] },
  { id:2,  emoji:"🚗", title:"DEALER LICENSE",      sub:"Car Dealer License Guide",         price:47,  orig:79,  accent:"#C0392B", cat:"Business",     tag:"HIGH INCOME",  tagC:"#E74C3C", desc:"Get licensed and access wholesale auctions to flip cars for profit.", inc:["State-by-State Requirements","Application Walkthrough","Wholesale Auction Access","Deal Formula Calculator","4 Case Studies","Compliance Checklist"] },
  { id:3,  emoji:"🔑", title:"REPO BLUEPRINT",      sub:"Vehicle Repossession Business",    price:37,  orig:67,  accent:"#2471A3", cat:"Quick Cash",   tag:"NEW",          tagC:"#3498DB", desc:"Get paid per vehicle recovered. Recession-proof income with low startup cost.", inc:["State Licensing Guide","Finding BHPH Clients","Recovery Process Steps","Pricing and Rate Sheet","3 Case Studies","Safety and Legal Guide"] },
  { id:4,  emoji:"📦", title:"LAND FLIP FORMULA",   sub:"Buy and Flip Vacant Land",         price:47,  orig:89,  accent:"#27AE60", cat:"Business",     tag:"PASSIVE",      tagC:"#2ECC71", desc:"Buy vacant land from motivated sellers for pennies on the dollar and sell it online.", inc:["County Tax Record System","Seller Letter Template","Valuation Framework","5 Case Studies","Due Diligence Checklist","Seller Finance Strategy"] },
  { id:5,  emoji:"🏥", title:"NEMT BLUEPRINT",      sub:"Medical Transport Business",       price:47,  orig:89,  accent:"#16A085", cat:"Business",     tag:"RECURRING",    tagC:"#1ABC9C", desc:"Government-contracted medical transport routes. Steady recurring Medicaid income.", inc:["Medicaid Enrollment Guide","Broker Contact List","Vehicle Requirements","3 Case Studies","Billing System","Fleet Scaling Roadmap"] },
  { id:6,  emoji:"🎨", title:"PRINT ON DEMAND",     sub:"Zero Inventory Online Store",      price:47,  orig:89,  accent:"#8E44AD", cat:"Digital",      tag:"PASSIVE",      tagC:"#9B59B6", desc:"Upload designs once, earn royalties forever. No inventory, no shipping, no employees.", inc:["50 Proven Niches","Design Creation System","Platform Setup Guide","Marketing Blueprint","3 Case Studies","500-Design Scaling Plan"] },
  { id:7,  emoji:"🌐", title:"DOMAIN FLIPPING",     sub:"Buy Low, Sell Domains for Profit", price:47,  orig:89,  accent:"#1F618D", cat:"Digital",      tag:"LOW STARTUP",  tagC:"#2980B9", desc:"Register or buy undervalued domains and sell them to businesses for profit.", inc:["Valuation Framework","NameBio Research System","Outreach Email Templates","4 Case Studies","Marketplace Directory","Portfolio Strategy"] },
  { id:8,  emoji:"🏠", title:"ASSISTED LIVING",     sub:"Residential Care Home Business",   price:47,  orig:89,  accent:"#884EA0", cat:"Housing",      tag:"HIGH INCOME",  tagC:"#9B59B6", desc:"Operate a residential care home with government-backed resident payments.", inc:["State Licensing Navigator","Property Setup Guide","Staffing Framework","4 Case Studies","Medicaid Waiver Enrollment","Multi-Home Scaling"] },
  { id:9,  emoji:"🇺🇸", title:"VETERANS HOUSING",   sub:"HUD-VASH and Government Programs", price:47,  orig:89,  accent:"#1A5276", cat:"Housing",      tag:"GOVT BACKED",  tagC:"#2471A3", desc:"Accept HUD-VASH vouchers and get government-guaranteed rent with near-zero vacancy.", inc:["HUD-VASH Landlord Guide","GPD Grant Application","SSVF Partnership System","3 Case Studies","VA Contact Directory","Portfolio Scaling"] },
  { id:10, emoji:"🥤", title:"VENDING MACHINE",     sub:"Cash Flow While You Sleep",        price:47,  orig:89,  accent:"#D35400", cat:"Physical",     tag:"CASH DAILY",   tagC:"#E67E22", desc:"Place machines, stock product, collect cash. Scales to full-time income.", inc:["Location Pitch Script","Machine Comparison Chart","Stocking Strategy","3 Case Studies","Route Management System","Cashless Tech Guide"] },
];

const BUNDLES = [
  { id:"B1", emoji:"⚡", title:"QUICK CASH BUNDLE", tag:"FASTEST INCOME", tagC:C.green, accent:"#2ECC71", price:141, orig:141, desc:"Storage auctions, repo, and car flipping — three fast-start business models in one.", productIds:[1,3,2], saves:28, features:["Three fast-start models","Low startup cost","No experience needed","Step-by-step guides"] },
  { id:"B2", emoji:"🏢", title:"BUSINESS BUILDER BUNDLE", tag:"BUILD ASSETS", tagC:"#3498DB", accent:"#3498DB", price:282, orig:282, desc:"6 complete business blueprints — land flipping, NEMT, assisted living, veterans housing, vending, and dealer license.", productIds:[2,4,5,8,9,10], saves:56, features:["6 complete businesses","Government-backed income","Multiple physical and digital","Recurring monthly revenue"] },
  { id:"B3", emoji:"💻", title:"DIGITAL EMPIRE BUNDLE", tag:"100% ONLINE", tagC:C.purple, accent:"#8E44AD", price:151, orig:151, desc:"3 location-independent streams. Print on demand, domain flipping, and storage auctions.", productIds:[1,6,7], saves:30, features:["Work from anywhere","No physical inventory","Scales without employees","Passive income potential"] },
  { id:"B4", emoji:"🏘️", title:"HOUSING EMPIRE BUNDLE", tag:"REAL ESTATE", tagC:"#884EA0", accent:"#884EA0", price:188, orig:188, desc:"4 housing streams — land flipping, assisted living, veterans housing, and NEMT.", productIds:[4,5,8,9], saves:38, features:["Government-guaranteed payments","Real estate wealth building","Recurring monthly income","Mission-driven impact"] },
  { id:"B5", emoji:"🔥", title:"COMPLETE VAULT — ALL 10", tag:"BEST VALUE", tagC:"#F0C040", accent:"#F0C040", price:470, orig:470, desc:"Every single Hustle Vault blueprint in one purchase.", productIds:[1,2,3,4,5,6,7,8,9,10], saves:94, features:["All 10 complete blueprints","Every income category covered","Lifetime future updates","Priority email support"], featured:true },
];

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
  B1: { title:"Add Land Flip Formula for $17",                 productId:4,  price:17 },
  B2: { title:"Upgrade: Add Digital Empire Bundle for $47",    productId:"B3",price:47 },
  B3: { title:"Add NEMT Blueprint for $17",                    productId:5,  price:17 },
  B4: { title:"Add Print on Demand for $17",                   productId:6,  price:17 },
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
  const cover = PRODUCT_IMG[item.id];
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{background:C.surface,border:`1px solid ${h||highlight?C.borderH:C.border}`,borderRadius:6,overflow:"hidden",transition:"all 0.28s",transform:h?"translateY(-5px)":"none",boxShadow:h?`0 20px 60px rgba(0,0,0,0.65)`:"0 4px 20px rgba(0,0,0,0.3)",display:"flex",flexDirection:"column",position:"relative"}}>
      <div style={{height:3,background:`linear-gradient(90deg,transparent,${item.accent},transparent)`}}/>
      {item.featured && <div style={{position:"absolute",top:0,right:0,background:GG,color:"#000",fontSize:8,fontWeight:700,letterSpacing:2,padding:"4px 14px",textTransform:"uppercase",zIndex:2}}>Most Popular</div>}
      <div style={{position:"relative",overflow:"hidden"}}>
        {cover && <img src={cover} alt={`${item.title} — ${item.sub}`} loading="lazy" width="600" height="450" style={{width:"100%",height:158,objectFit:"cover",display:"block"}}/>}
        <div style={{position:cover?"absolute":"static",inset:0,display:"flex",flexDirection:"column",justifyContent:"flex-end",background:cover?`linear-gradient(to top,${C.panel} 3%,${C.panel}D9 26%,transparent 72%),radial-gradient(ellipse at 25% 100%,${item.accent}22 0%,transparent 60%)`:`radial-gradient(ellipse at 25% 50%,${item.accent}18 0%,transparent 65%),${C.panel}`,padding:"22px 20px 16px"}}>
          {!cover && <div style={{fontSize:36,marginBottom:8,lineHeight:1}}>{item.emoji}</div>}
          <Badge color={item.tagC}>{item.tag}</Badge>
          <div style={{marginTop:10}}>
            <div style={{...GT,fontSize:16,fontWeight:900,letterSpacing:2,textTransform:"uppercase"}}>{item.title}</div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginTop:3,textTransform:"uppercase"}}>{item.sub}</div>
          </div>
        </div>
      </div>
      <div style={{padding:"14px 20px",flex:1,display:"flex",flexDirection:"column",gap:10}}>
        <p style={{fontSize:12,color:"#C0B8A8",lineHeight:1.7,margin:0,fontStyle:"italic"}}>{item.desc}</p>
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginTop:"auto",paddingTop:6}}>
          <span style={{...GT,fontSize:26,fontWeight:900}}>${isBundle ? Math.round(item.price * 0.8) : item.price}</span>
          <span style={{fontSize:12,color:C.dim,textDecoration:"line-through"}}>${item.price}</span>
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

          <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:14}}>
            <span style={{...GT,fontSize:36,fontWeight:900}}>${isBundle ? Math.round(item.price * 0.8) : item.price}</span>
            <span style={{fontSize:13,color:C.dim,textDecoration:"line-through"}}>${item.price}</span>
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
            {loading ? "Redirecting to Stripe..." : `Redirecting to Checkout — ${final}`}
          </Btn>
          <div style={{textAlign:"center",marginTop:10,fontSize:9,color:C.dim}}>🔒 SSL Secure · ⚡ Instant Delivery</div>
        </div>
      </div>
    </div>
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
export default function HustleVault() {
  const [showIntro, setShowIntro] = useState(true);
  const [filter, setFilter] = useState("All");
  const [preview, setPreview] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(()=>{const h=()=>setScrolled(window.scrollY>60);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);

  useSEO({
    title:"Hustle Vault – Digital Business Blueprints & Marketing Ebooks for Entrepreneurs",
    description:"Hustle Vault delivers premium digital business blueprints and marketing ebooks — storage auctions, land flipping, print on demand, and more. Instant download, lifetime access, real strategies.",
    path:"/",
    type:"website",
    jsonLd:{
      "@context":"https://schema.org",
      "@graph":[
        {"@type":"Organization","@id":"https://hustlevault.app/#org","name":"Hustle Vault","url":"https://hustlevault.app","logo":"https://hustlevault.app/favicon.svg","description":"Premium digital business blueprints and marketing ebooks for entrepreneurs and side hustlers."},
        {"@type":"WebSite","@id":"https://hustlevault.app/#website","url":"https://hustlevault.app","name":"Hustle Vault","publisher":{"@id":"https://hustlevault.app/#org"}},
        {"@type":"ItemList","name":"Hustle Vault Blueprints","itemListElement":PRODUCTS.map((p,i)=>({"@type":"ListItem","position":i+1,"item":{"@type":"Product","name":p.title+" – "+p.sub,"description":p.desc,"image":PRODUCT_IMG[p.id],"brand":{"@type":"Brand","name":"Hustle Vault"},"offers":{"@type":"Offer","price":p.price,"priceCurrency":"USD","availability":"https://schema.org/InStock","url":"https://hustlevault.app/"}}}))}
      ]
    }
  });

  const allItems = filter==="Bundles"?BUNDLES:filter==="All"?PRODUCTS:PRODUCTS.filter(p=>p.cat===filter);

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.cream,fontFamily:"Inter, system-ui, sans-serif"}}>
      {showIntro && <IntroOverlay onDone={()=>setShowIntro(false)}/>}
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:rgba(201,168,76,0.3);color:#F5F0E8;}
        @keyframes ticker{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        .ticker-wrap{animation:ticker 30s linear infinite;width:max-content;display:flex;}
      `}</style>

      {/* Ticker */}
      <div style={{background:`linear-gradient(90deg,#1A0A00,#2A1400,#1A0A00)`,borderBottom:`1px solid ${C.gold}30`,padding:"10px 0",overflow:"hidden"}}>
        <div className="ticker-wrap">
          {["10 Blueprints — One Vault","Bills don't stop — neither should your income","First income in 7 days possible","Government-backed income streams","Join 2400+ customers building wealth"].flatMap(x=>[x,x]).map((t,i)=>(
            <span key={i} style={{fontSize:10,color:C.gold,letterSpacing:2,whiteSpace:"nowrap",padding:"0 40px"}}>◆ {t}</span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:scrolled?`${C.surface}F0`:"transparent",backdropFilter:scrolled?"blur(15px)":"none",borderBottom:scrolled?`1px solid ${C.border}`:"none",transition:"0.3s",padding:"0 24px"}}>
        <div style={{maxWidth:1280,margin:"0 auto",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
           <Link to="/" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}><VaultIcon size={24}/><div style={{...GT,fontSize:14,fontWeight:900,letterSpacing:4,textTransform:"uppercase"}}>Hustle Vault</div></Link>
           <div style={{display:"flex",alignItems:"center",gap:22}}>
             <a href="/#products" style={{color:C.muted,fontSize:11,letterSpacing:2,textTransform:"uppercase",textDecoration:"none",fontFamily:"Georgia,serif"}}>Blueprints</a>
             <Link to="/blog" style={{color:C.muted,fontSize:11,letterSpacing:2,textTransform:"uppercase",textDecoration:"none",fontFamily:"Georgia,serif"}}>Blog</Link>
             <Link to="/door-script" style={{color:C.muted,fontSize:11,letterSpacing:2,textTransform:"uppercase",textDecoration:"none",fontFamily:"Georgia,serif"}}>Door Script</Link>
             <Btn onClick={()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"})} style={{padding:"9px 20px",fontSize:9}}>Get The Vault $376</Btn>
           </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{padding:"90px 24px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,zIndex:0}}>
          <img src={HERO_IMG} alt="Hustle Vault — premium digital business blueprints and guides for entrepreneurs" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.30}}/>
          <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at center,${C.gold}10,transparent 55%),linear-gradient(to bottom,${C.bg}D9,${C.bg}F2 62%,${C.bg})`}}/>
        </div>
        <div style={{position:"relative",zIndex:1,maxWidth:800,margin:"0 auto"}}>
           <div style={{display:"inline-flex",background:`${C.gold}15`,border:`1px solid ${C.gold}40`,borderRadius:100,padding:"6px 16px",marginBottom:24,fontSize:10,color:C.gold,letterSpacing:3}}>10 COMPLETE INCOME BLUEPRINTS</div>
           <h1 style={{fontSize:"clamp(40px,7vw,76px)",fontWeight:950,lineHeight:0.95,letterSpacing:-2,marginBottom:20}}><span style={GT}>HUSTLE VAULT</span></h1>
           <p style={{fontSize:13,color:C.gold,letterSpacing:2,fontWeight:700,marginBottom:12,textTransform:"uppercase"}}>Digital Products for Entrepreneurs</p>
           <p style={{fontSize:18,color:C.muted,lineHeight:1.6,maxWidth:600,margin:"0 auto 32px"}}>Premium business blueprints and digital guides. Every strategy, every step, one vault.</p>
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
      <footer style={{padding:"48px 24px",textAlign:"center",background:C.surface,color:C.dim,fontSize:10,letterSpacing:2}}>
         <div style={{display:"flex",gap:24,justifyContent:"center",flexWrap:"wrap",marginBottom:18}}>
            <a href="/#products" style={{color:C.muted,textDecoration:"none"}}>Blueprints</a>
            <Link to="/blog" style={{color:C.muted,textDecoration:"none"}}>Blog</Link>
            <Link to="/door-script" style={{color:C.muted,textDecoration:"none"}}>Door Script</Link>
            <a href="/#products" style={{color:C.muted,textDecoration:"none"}}>Bundles</a>
         </div>
         <div style={{marginBottom:10}}>HUSTLE VAULT · © 2026 · ALL RIGHTS RESERVED</div>
      </footer>

      {/* Modals */}
      {preview && <PreviewModal item={preview} onClose={()=>setPreview(null)} onBuy={setCheckout}/>}
      {checkout && <CheckoutModal item={checkout} onClose={()=>setCheckout(null)}/>}
    </div>
  );
}

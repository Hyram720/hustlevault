import { useState, useEffect, useRef } from "react";

const C = {
  bg:      "#05050A",
  surface: "#09090F",
  panel:   "#0E0E18",
  border:  "#18182A",
  borderH: "#282840",
  gold:    "#C9A84C",
  goldBri: "#F0C040",
  goldDim: "#7A5A18",
  cream:   "#F5F0E8",
  muted:   "#9A8A6A",
  dim:     "#4A4A5A",
  red:     "#E74C3C",
  green:   "#2ECC71",
  blue:    "#3498DB",
};

const GG = `linear-gradient(135deg, #7A5A18 0%, ${C.gold} 30%, ${C.goldBri} 55%, ${C.gold} 80%, #7A5A18 100%)`;
const GT = { background: GG, WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent", display:"inline-block" };

const PRODUCTS = [
  {
    id:1, emoji:"🔐",
    title:"UNIT GOLD",
    sub:"Storage Auction Blueprint",
    price:57, orig:97,
    tag:"BEST SELLER", tagC: C.goldBri,
    accent:"#C9A84C",
    cat:"Quick Cash",
    pitch:"Start making money this weekend. Find a storage auction near you, bid smart, and flip the contents for profit — no experience needed.",
    timeline:"First profit possible: 7 days",
    includes:["9 Complete Chapters","Profit Formula Calculator","3 Real Case Studies","Auction Finder Guide","Platform Selling Cheat Sheet","Bonus Scaling Roadmap"],
  },
  {
    id:2, emoji:"🚗",
    title:"DEALER LICENSE",
    sub:"Car Flipping Blueprint",
    price:47, orig:79,
    tag:"HIGH INCOME", tagC:"#E74C3C",
    accent:"#E74C3C",
    cat:"Business",
    pitch:"Get your dealer license and flip cars legally from your driveway. One car flip can replace a week of work income.",
    timeline:"License in hand: 3-4 weeks",
    includes:["State-by-State Requirements","Application Walkthrough","Wholesale Buying Secrets","Auction Access Guide","Profit Per Car Calculator","Legal Compliance Checklist"],
  },
  {
    id:3, emoji:"💰",
    title:"HUSTLE BUNDLE",
    sub:"Unit Gold + Dealer License",
    price:87, orig:156,
    tag:"SAVE $69", tagC: C.green,
    accent:"#2ECC71",
    cat:"Bundle",
    featured:true,
    pitch:"Two complete income streams at one price. Storage auctions give you fast cash now. Car flipping builds long-term income. Get both.",
    timeline:"First income: within 7 days",
    includes:["Everything in Unit Gold","Everything in Dealer License","Exclusive Bundle Bonus","Private Community Access","Priority Email Support","Future Updates Free"],
  },
  {
    id:4, emoji:"🔑",
    title:"REPO BLUEPRINT",
    sub:"Vehicle Repossession Business",
    price:37, orig:67,
    tag:"NEW", tagC: C.blue,
    accent:"#3498DB",
    cat:"Quick Cash",
    pitch:"Repo companies pay $200-$400 per vehicle recovered. Learn how to get licensed, find clients, and build steady recurring income.",
    timeline:"First client: 2-3 weeks",
    includes:["Licensing Requirements","Client Acquisition Scripts","Equipment Checklist","Legal Protection Guide","Rate Setting Framework","First Client Blueprint"],
  },
  {
    id:5, emoji:"📦",
    title:"LAND FLIP FORMULA",
    sub:"Buy Cheap Land, Sell for 3X",
    price:47, orig:89,
    tag:"PASSIVE", tagC:"#9B59B6",
    accent:"#9B59B6",
    cat:"Business",
    pitch:"Buy vacant land for $500-$2,000 and sell it online for 3x the price. No tenants. No repairs. No mortgage needed.",
    timeline:"First deal: 30-60 days",
    includes:["Finding Undervalued Land","Due Diligence Checklist","Pricing Formula","Listing on Land Sites","Seller Finance Strategy","Deal Calculator Spreadsheet"],
  },
  {
    id:6, emoji:"🏥",
    title:"NEMT BLUEPRINT",
    sub:"Non-Emergency Medical Transport",
    price:47, orig:89,
    tag:"RECURRING", tagC:"#1ABC9C",
    accent:"#1ABC9C",
    cat:"Business",
    pitch:"Government-contracted medical transport pays $30-$80 per ride. Start with one vehicle. Build a fleet. Medicaid contracts = steady income.",
    timeline:"First contract: 30-45 days",
    includes:["State Licensing Guide","Medicaid Enrollment","Vehicle Requirements","Insurance Blueprint","Contract Acquisition","Scheduling Software Guide"],
  },
];

const STORIES = [
  { name:"Derrick P.", city:"Newark, NJ", lost:"Laid off from warehouse job", income:"$2,100 in first month", how:"Storage auctions — won 6 units", product:"Unit Gold", weeks:4 },
  { name:"Tamara W.", city:"Atlanta, GA", lost:"Hours cut at retail job", income:"$3,400 first car flip", how:"Got dealer license, bought at auction", product:"Dealer License", weeks:5 },
  { name:"Marcus J.", city:"Houston, TX", lost:"Construction slowdown", income:"$890 first week", how:"Found 2 storage auctions locally", product:"Unit Gold", weeks:1 },
  { name:"Keisha M.", city:"Detroit, MI", lost:"Company downsized her position", income:"$4,200/month steady", how:"NEMT — 2 Medicaid contracts", product:"NEMT Blueprint", weeks:8 },
];

const URGENCY_ITEMS = [
  "Bills don't pause while you figure this out",
  "Every week without income is a week behind",
  "These blueprints exist so you don't have to figure it out alone",
  "Real people are making real money from these exact systems",
];

// ── Vault Icon ──
function VaultIcon({ size=28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="vig" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7A5A18"/>
          <stop offset="50%" stopColor={C.goldBri}/>
          <stop offset="100%" stopColor="#7A5A18"/>
        </linearGradient>
        <filter id="viglow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect x="8" y="10" width="64" height="56" rx="4" fill={C.surface} stroke="url(#vig)" strokeWidth="2"/>
      <rect x="14" y="16" width="52" height="44" rx="3" fill="none" stroke={C.border} strokeWidth="1"/>
      <circle cx="40" cy="38" r="13" fill="none" stroke="url(#vig)" strokeWidth="2" filter="url(#viglow)"/>
      <circle cx="40" cy="38" r="8" fill={C.bg}/>
      <circle cx="40" cy="38" r="2.5" fill="url(#vig)"/>
      <line x1="40" y1="26" x2="40" y2="30" stroke={C.goldBri} strokeWidth="2" strokeLinecap="round"/>
      <line x1="40" y1="46" x2="40" y2="50" stroke={C.goldBri} strokeWidth="2" strokeLinecap="round"/>
      <line x1="28" y1="38" x2="32" y2="38" stroke={C.goldBri} strokeWidth="2" strokeLinecap="round"/>
      <line x1="48" y1="38" x2="52" y2="38" stroke={C.goldBri} strokeWidth="2" strokeLinecap="round"/>
      <rect x="56" y="34" width="5" height="8" rx="2.5" fill="url(#vig)"/>
      <rect x="14" y="22" width="4" height="5" rx="1" fill={C.border}/>
      <rect x="14" y="41" width="4" height="5" rx="1" fill={C.border}/>
    </svg>
  );
}

function Btn({ children, onClick, variant="primary", style={}, disabled=false }) {
  const [h, setH] = useState(false);
  const base = { padding:"14px 28px", fontSize:11, fontWeight:700, letterSpacing:3, textTransform:"uppercase", fontFamily:"Georgia,serif", border:"none", cursor:disabled?"not-allowed":"pointer", transition:"all 0.2s", borderRadius:2, opacity:disabled?0.5:1 };
  const v = {
    primary:   { background:GG, color:"#000", transform:h?"translateY(-2px)":"none", boxShadow:h?`0 12px 40px rgba(201,168,76,0.4)`:`0 4px 20px rgba(201,168,76,0.2)` },
    secondary: { background:"transparent", color:C.gold, border:`1px solid ${C.gold}`, transform:h?"translateY(-1px)":"none" },
    ghost:     { background:h?C.panel:"transparent", color:C.muted, border:`1px solid ${C.border}` },
    danger:    { background:h?"#C0392B":C.red, color:"#fff", transform:h?"translateY(-1px)":"none" },
  };
  return <button onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} onClick={onClick} disabled={disabled} style={{...base,...v[variant],...style}}>{children}</button>;
}

function Badge({ children, color=C.gold }) {
  return <span style={{ background:color, color:"#000", fontSize:9, fontWeight:700, letterSpacing:2, padding:"3px 12px", textTransform:"uppercase", clipPath:"polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)", fontFamily:"Georgia,serif" }}>{children}</span>;
}

function ProductCard({ p, onBuy, onView }) {
  const [h, setH] = useState(false);
  const save = p.orig - p.price;
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{ background:C.surface, border:`1px solid ${h?C.borderH:C.border}`, borderRadius:6, overflow:"hidden", transition:"all 0.3s", transform:h?"translateY(-5px)":"none", boxShadow:h?`0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${C.borderH}`:"0 4px 20px rgba(0,0,0,0.3)", display:"flex", flexDirection:"column" }}>
      <div style={{ height:3, background:`linear-gradient(90deg, transparent, ${p.accent}, transparent)` }}/>
      <div style={{ background:`radial-gradient(ellipse at 25% 50%, ${p.accent}18 0%, transparent 65%), ${C.panel}`, padding:"28px 24px 20px", position:"relative" }}>
        {p.featured && <div style={{ position:"absolute", top:0, right:0, background:GG, color:"#000", fontSize:8, fontWeight:700, letterSpacing:2, padding:"4px 16px", textTransform:"uppercase", fontFamily:"Georgia,serif" }}>Most Popular</div>}
        <div style={{ fontSize:44, marginBottom:10, lineHeight:1 }}>{p.emoji}</div>
        <Badge color={p.tagC}>{p.tag}</Badge>
        <div style={{ marginTop:12 }}>
          <div style={{ ...GT, fontSize:20, fontWeight:900, letterSpacing:3, textTransform:"uppercase" }}>{p.title}</div>
          <div style={{ fontSize:11, color:C.muted, letterSpacing:2, marginTop:3, textTransform:"uppercase" }}>{p.sub}</div>
        </div>
        {/* Timeline badge */}
        <div style={{ marginTop:12, display:"inline-flex", alignItems:"center", gap:6, background:`${p.accent}18`, border:`1px solid ${p.accent}50`, borderRadius:100, padding:"4px 12px" }}>
          <span style={{ fontSize:10 }}>⏱</span>
          <span style={{ fontSize:10, color:p.accent, letterSpacing:1 }}>{p.timeline}</span>
        </div>
      </div>
      <div style={{ padding:"18px 24px", flex:1, display:"flex", flexDirection:"column", gap:14 }}>
        <p style={{ fontSize:13, color:"#C8C0B0", lineHeight:1.75, margin:0, fontStyle:"italic" }}>"{p.pitch}"</p>
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {p.includes.slice(0,4).map((item,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:5, height:5, background:p.accent, borderRadius:1, transform:"rotate(45deg)", flexShrink:0 }}/>
              <span style={{ fontSize:12, color:C.muted }}>{item}</span>
            </div>
          ))}
          {p.includes.length>4 && <div style={{ fontSize:11, color:C.dim, marginLeft:13 }}>+ {p.includes.length-4} more included</div>}
        </div>
        <div style={{ display:"flex", alignItems:"baseline", gap:10, marginTop:"auto" }}>
          <span style={{ ...GT, fontSize:30, fontWeight:900 }}>${p.price}</span>
          <span style={{ fontSize:13, color:C.dim, textDecoration:"line-through" }}>${p.orig}</span>
          <span style={{ fontSize:11, color:C.green, fontWeight:700 }}>Save ${save}</span>
        </div>
      </div>
      <div style={{ padding:"0 24px 24px", display:"flex", gap:8 }}>
        <Btn onClick={()=>onBuy(p)} style={{ flex:1, padding:"13px" }}>Get Access Now</Btn>
        <Btn onClick={()=>onView(p)} variant="ghost" style={{ padding:"13px 14px" }}>Info</Btn>
      </div>
    </div>
  );
}

function PreviewModal({ p, onClose, onBuy }) {
  useEffect(() => {
    const h = e => e.key==="Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  },[onClose]);
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(10px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, border:`1px solid ${C.borderH}`, borderRadius:8, maxWidth:540, width:"100%", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 40px 100px rgba(0,0,0,0.9)" }}>
        <div style={{ height:4, background:`linear-gradient(90deg, transparent, ${p.accent}, ${C.goldBri}, ${p.accent}, transparent)` }}/>
        <div style={{ background:`radial-gradient(ellipse at 30% 50%, ${p.accent}22 0%, transparent 60%), ${C.panel}`, padding:"32px 36px 24px", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:14, right:18, background:"none", border:"none", color:C.dim, fontSize:22, cursor:"pointer" }}>×</button>
          <div style={{ fontSize:52, marginBottom:10 }}>{p.emoji}</div>
          <Badge color={p.tagC}>{p.tag}</Badge>
          <div style={{ ...GT, fontSize:26, fontWeight:900, letterSpacing:3, textTransform:"uppercase", marginTop:12 }}>{p.title}</div>
          <div style={{ fontSize:11, color:C.muted, letterSpacing:3, textTransform:"uppercase", marginTop:4 }}>{p.sub}</div>
          <div style={{ marginTop:14, display:"inline-flex", alignItems:"center", gap:6, background:`${p.accent}18`, border:`1px solid ${p.accent}50`, borderRadius:100, padding:"5px 14px" }}>
            <span style={{ fontSize:11 }}>⏱</span>
            <span style={{ fontSize:11, color:p.accent, letterSpacing:1 }}>{p.timeline}</span>
          </div>
        </div>
        <div style={{ padding:"28px 36px" }}>
          <p style={{ fontSize:14, color:"#C8C0B0", lineHeight:1.85, margin:"0 0 24px", fontStyle:"italic" }}>"{p.pitch}"</p>
          <div style={{ fontSize:11, color:C.gold, letterSpacing:3, textTransform:"uppercase", marginBottom:12 }}>Everything Included</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
            {p.includes.map((item,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:`${p.accent}20`, border:`1px solid ${p.accent}60`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ color:p.accent, fontSize:10 }}>✓</span>
                </div>
                <span style={{ fontSize:13, color:C.cream }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:4, padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start", marginBottom:22 }}>
            <span style={{ fontSize:22 }}>🛡️</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:C.cream, marginBottom:3 }}>30-Day Money-Back Guarantee</div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>If you're not satisfied for any reason, full refund. No questions asked.</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:14, marginBottom:16 }}>
            <span style={{ ...GT, fontSize:38, fontWeight:900 }}>${p.price}</span>
            <div>
              <div style={{ fontSize:12, color:C.dim, textDecoration:"line-through" }}>${p.orig}</div>
              <div style={{ fontSize:11, color:C.green }}>You save ${p.orig-p.price}</div>
            </div>
          </div>
          <Btn onClick={()=>{ onClose(); onBuy(p); }} style={{ width:"100%", padding:"17px", fontSize:12 }}>Get Instant Access — ${p.price}</Btn>
          <div style={{ textAlign:"center", marginTop:10, fontSize:11, color:C.dim }}>Instant delivery · Stripe secure · 30-day guarantee</div>
        </div>
      </div>
    </div>
  );
}

function CheckoutModal({ p, onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:"", email:"", card:"", exp:"", cvv:"", coupon:"" });
  const [coupon, setCoupon] = useState({ applied:false, error:"" });
  const [errors, setErrors] = useState({});
  const final = coupon.applied ? Math.round(p.price*0.8) : p.price;

  const validate = () => {
    const e={};
    if(!form.name.trim()) e.name="Required";
    if(!form.email.includes("@")) e.email="Valid email required";
    if(form.card.replace(/\s/g,"").length<16) e.card="Enter full card number";
    if(!form.exp.match(/^\d{2}\/\d{2}$/)) e.exp="MM/YY";
    if(form.cvv.length<3) e.cvv="3+ digits";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const submit = () => {
    if(!validate()) return;
    setStep(2);
    setTimeout(()=>setStep(3), 2500);
  };

  const fmtCard = v => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp  = v => { const d=v.replace(/\D/g,"").slice(0,4); return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d; };

  const inp = field => ({
    width:"100%", padding:"12px 14px", background:C.bg,
    border:`1px solid ${errors[field]?C.red:C.border}`,
    borderRadius:3, color:C.cream, fontSize:13, fontFamily:"Georgia,serif",
    outline:"none", boxSizing:"border-box",
  });
  const lbl = { fontSize:10, color:C.muted, letterSpacing:2, textTransform:"uppercase", marginBottom:5, display:"block" };

  if(step===3) return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", backdropFilter:"blur(10px)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, border:`1px solid ${C.borderH}`, borderRadius:8, maxWidth:420, width:"100%", padding:"52px 40px", textAlign:"center" }}>
        <div style={{ fontSize:64, marginBottom:20 }}>🎉</div>
        <div style={{ ...GT, fontSize:26, fontWeight:900, letterSpacing:2, marginBottom:14 }}>You're In!</div>
        <p style={{ fontSize:14, color:C.muted, lineHeight:1.8, marginBottom:28 }}>
          Your download link was sent to <strong style={{ color:C.cream }}>{form.email}</strong>. Check your inbox — it's there now.
        </p>
        <div style={{ background:C.bg, border:`1px solid ${C.green}40`, borderRadius:4, padding:"14px 20px", marginBottom:24 }}>
          <div style={{ fontSize:12, color:C.green, fontWeight:700, marginBottom:3 }}>✓ Instant Access Confirmed</div>
          <div style={{ fontSize:12, color:C.muted }}>{p.title} · ${final} paid</div>
        </div>
        <Btn onClick={onClose} style={{ width:"100%" }}>Back to the Vault</Btn>
      </div>
    </div>
  );

  if(step===2) return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", backdropFilter:"blur(10px)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:52, height:52, border:`3px solid ${C.border}`, borderTopColor:C.gold, borderRadius:"50%", margin:"0 auto 24px", animation:"spin 0.8s linear infinite" }}/>
        <div style={{ ...GT, fontSize:14, letterSpacing:4, textTransform:"uppercase" }}>Securing Your Access</div>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", backdropFilter:"blur(10px)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, border:`1px solid ${C.borderH}`, borderRadius:8, maxWidth:480, width:"100%", maxHeight:"94vh", overflowY:"auto" }}>
        <div style={{ height:4, background:GG }}/>
        <div style={{ padding:"26px 32px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
            <div>
              <div style={{ fontSize:10, color:C.muted, letterSpacing:3, textTransform:"uppercase", marginBottom:3 }}>Secure Checkout</div>
              <div style={{ ...GT, fontSize:18, fontWeight:900, letterSpacing:2 }}>{p.title}</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:C.dim, fontSize:22, cursor:"pointer" }}>×</button>
          </div>

          {/* Order summary */}
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:4, padding:"13px 18px", marginBottom:22 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:13, color:C.muted }}>{p.sub}</span>
              <span style={{ fontSize:13, color:C.cream }}>${p.price}</span>
            </div>
            {coupon.applied && (
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:13, color:C.green }}>Coupon VAULT20 (20% off)</span>
                <span style={{ fontSize:13, color:C.green }}>-${p.price-final}</span>
              </div>
            )}
            <div style={{ height:1, background:C.border, margin:"8px 0" }}/>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:14, fontWeight:700, color:C.cream }}>Total</span>
              <span style={{ ...GT, fontSize:17, fontWeight:900 }}>${final}</span>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={lbl}>Full Name</label>
              <input style={inp("name")} placeholder="John Smith" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
              {errors.name && <div style={{ fontSize:10, color:C.red, marginTop:3 }}>{errors.name}</div>}
            </div>
            <div>
              <label style={lbl}>Email Address</label>
              <input style={inp("email")} placeholder="john@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
              {errors.email && <div style={{ fontSize:10, color:C.red, marginTop:3 }}>{errors.email}</div>}
            </div>
            <div>
              <label style={lbl}>Card Number</label>
              <input style={inp("card")} placeholder="4242 4242 4242 4242" value={form.card} onChange={e=>setForm({...form,card:fmtCard(e.target.value)})}/>
              {errors.card && <div style={{ fontSize:10, color:C.red, marginTop:3 }}>{errors.card}</div>}
            </div>
            <div style={{ display:"flex", gap:12 }}>
              <div style={{ flex:1 }}>
                <label style={lbl}>Expiry</label>
                <input style={inp("exp")} placeholder="MM/YY" value={form.exp} onChange={e=>setForm({...form,exp:fmtExp(e.target.value)})}/>
                {errors.exp && <div style={{ fontSize:10, color:C.red, marginTop:3 }}>{errors.exp}</div>}
              </div>
              <div style={{ flex:1 }}>
                <label style={lbl}>CVV</label>
                <input style={inp("cvv")} placeholder="123" value={form.cvv} onChange={e=>setForm({...form,cvv:e.target.value.replace(/\D/g,"").slice(0,4)})}/>
                {errors.cvv && <div style={{ fontSize:10, color:C.red, marginTop:3 }}>{errors.cvv}</div>}
              </div>
            </div>
            <div>
              <label style={lbl}>Coupon Code</label>
              <div style={{ display:"flex", gap:8 }}>
                <input style={{ ...inp("coupon"), flex:1 }} placeholder="Try VAULT20" value={form.coupon} onChange={e=>setForm({...form,coupon:e.target.value})} disabled={coupon.applied}/>
                <Btn onClick={()=>{ if(form.coupon.toUpperCase()==="VAULT20"){ setCoupon({applied:true,error:""}); } else { setCoupon({applied:false,error:"Invalid code"}); } }} variant="secondary" style={{ padding:"12px 14px", fontSize:10 }} disabled={coupon.applied}>
                  {coupon.applied?"Applied ✓":"Apply"}
                </Btn>
              </div>
              {coupon.error && <div style={{ fontSize:10, color:C.red, marginTop:3 }}>{coupon.error}</div>}
              {coupon.applied && <div style={{ fontSize:10, color:C.green, marginTop:3 }}>20% discount applied!</div>}
            </div>
          </div>

          <Btn onClick={submit} style={{ width:"100%", padding:"17px", fontSize:13, marginTop:22 }}>
            Complete Purchase — ${final}
          </Btn>
          <div style={{ textAlign:"center", marginTop:12, display:"flex", justifyContent:"center", gap:16, flexWrap:"wrap" }}>
            {["🔒 SSL Secure","⚡ Instant Delivery","↩️ 30-Day Guarantee"].map((t,i)=>(
              <span key={i} style={{ fontSize:10, color:C.dim }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ────────────────────────────────────────────────────
export default function HustleVaultLostIncome() {
  const [checkout, setCheckout] = useState(null);
  const [preview, setPreview] = useState(null);
  const [filter, setFilter] = useState("All");
  const [scrolled, setScrolled] = useState(false);
  const [ticker, setTicker] = useState(0);
  const [urgIdx, setUrgIdx] = useState(0);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  },[]);

  useEffect(() => {
    const t = setInterval(() => setTicker(x => x+1), 4000);
    return () => clearInterval(t);
  },[]);

  useEffect(() => {
    const t = setInterval(() => setUrgIdx(x => (x+1) % URGENCY_ITEMS.length), 3500);
    return () => clearInterval(t);
  },[]);

  const cats = ["All", ...Array.from(new Set(PRODUCTS.map(p=>p.cat)))];
  const filtered = filter==="All" ? PRODUCTS : PRODUCTS.filter(p=>p.cat===filter);

  // Recent purchase notifications
  const notifications = [
    "Marcus from Houston just got Unit Gold",
    "Tamara from Atlanta just got the Hustle Bundle",
    "Derrick from Newark just got Unit Gold",
    "Keisha from Detroit just got NEMT Blueprint",
    "James from Phoenix just got Dealer License",
    "Tanya from Dallas just got the Hustle Bundle",
  ];

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.cream, fontFamily:"Georgia,serif", overflowX:"hidden" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:rgba(201,168,76,0.3);color:#F5F0E8;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:#05050A;}
        ::-webkit-scrollbar-thumb{background:#282840;border-radius:3px;}
        input{outline:none;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
        @keyframes ticker{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        .fu{animation:fadeUp 0.7s ease both;}
        .fu2{animation:fadeUp 0.7s 0.15s ease both;}
        .fu3{animation:fadeUp 0.7s 0.3s ease both;}
        .fu4{animation:fadeUp 0.7s 0.45s ease both;}
      `}</style>

      {/* ── ALERT BAR ── */}
      <div style={{ background:`linear-gradient(90deg, #1A0A00, #2A1200, #1A0A00)`, borderBottom:`1px solid ${C.gold}40`, padding:"10px 0", overflow:"hidden" }}>
        <div style={{ display:"flex", animation:"ticker 20s linear infinite", width:"200%" }}>
          {[...URGENCY_ITEMS,...URGENCY_ITEMS].map((item,i)=>(
            <span key={i} style={{ fontSize:11, color:C.gold, letterSpacing:2, whiteSpace:"nowrap", padding:"0 48px" }}>
              ◆ {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── NAV ── */}
      <nav style={{ position:"sticky", top:0, zIndex:100, background:scrolled?`${C.surface}F2`:"transparent", backdropFilter:scrolled?"blur(16px)":"none", borderBottom:scrolled?`1px solid ${C.border}`:"none", transition:"all 0.3s", padding:"0 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", height:62, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
            <VaultIcon size={26}/>
            <div>
              <div style={{ ...GT, fontSize:15, fontWeight:900, letterSpacing:4, textTransform:"uppercase", lineHeight:1 }}>Hustle</div>
              <div style={{ fontSize:8, letterSpacing:7, color:C.muted, textTransform:"uppercase" }}>Vault</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ fontSize:10, color:C.dim, letterSpacing:2, display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:C.green, display:"inline-block", animation:"pulse 2s infinite" }}/>
              OPEN
            </div>
            <Btn onClick={()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"})} variant="secondary" style={{ padding:"8px 18px", fontSize:10 }}>
              Get a Blueprint
            </Btn>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position:"relative", padding:"90px 32px 72px", textAlign:"center", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"20%", left:"50%", transform:"translate(-50%,-50%)", width:700, height:500, background:`radial-gradient(ellipse, ${C.gold}12 0%, transparent 65%)`, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:0, opacity:0.025, backgroundImage:`linear-gradient(${C.gold} 1px, transparent 1px), linear-gradient(90deg, ${C.gold} 1px, transparent 1px)`, backgroundSize:"56px 56px", pointerEvents:"none" }}/>

        <div style={{ position:"relative", maxWidth:800, margin:"0 auto" }}>

          {/* Crisis badge */}
          <div className="fu" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(231,76,60,0.12)", border:"1px solid rgba(231,76,60,0.4)", borderRadius:100, padding:"7px 20px", marginBottom:32 }}>
            <span style={{ fontSize:14 }}>⚡</span>
            <span style={{ fontSize:11, color:"#E74C3C", letterSpacing:2, textTransform:"uppercase" }}>For People Who Need Income Now</span>
          </div>

          <h1 className="fu2" style={{ margin:"0 0 24px", lineHeight:1.05 }}>
            <span style={{ fontSize:"clamp(14px,2.5vw,18px)", color:C.muted, letterSpacing:4, textTransform:"uppercase", display:"block", marginBottom:12 }}>
              You Lost Your Income.
            </span>
            <span style={{ ...GT, fontSize:"clamp(42px,7.5vw,76px)", fontWeight:900, letterSpacing:4, textTransform:"uppercase", display:"block" }}>
              Here's How
            </span>
            <span style={{ fontSize:"clamp(42px,7.5vw,76px)", fontWeight:900, letterSpacing:4, textTransform:"uppercase", display:"block", color:C.cream }}>
              You Get It Back.
            </span>
          </h1>

          <p className="fu3" style={{ fontSize:"clamp(14px,2vw,17px)", color:C.muted, lineHeight:1.9, maxWidth:580, margin:"0 auto 20px", fontStyle:"italic" }}>
            Real income streams. Real blueprints. Step-by-step systems built for people starting from zero — not theory from someone who has never done it.
          </p>

          {/* Social proof inline */}
          <div className="fu3" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:40 }}>
            <div style={{ display:"flex" }}>
              {["D","T","M","K","J"].map((l,i)=>(
                <div key={i} style={{ width:32, height:32, borderRadius:"50%", background:GG, border:`2px solid ${C.bg}`, marginLeft:i?-10:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:900, color:"#000" }}>{l}</div>
              ))}
            </div>
            <div style={{ fontSize:12, color:C.muted }}>
              <strong style={{ color:C.cream }}>2,400+ people</strong> rebuilt their income with these blueprints
            </div>
          </div>

          <div className="fu4" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Btn onClick={()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"})} style={{ padding:"16px 36px", fontSize:12 }}>
              Find My Blueprint
            </Btn>
            <Btn onClick={()=>setCheckout(PRODUCTS[2])} variant="secondary" style={{ padding:"16px 36px", fontSize:12 }}>
              Get The Bundle — $87
            </Btn>
          </div>
        </div>
      </section>

      {/* ── CRISIS SECTION ── */}
      <section style={{ padding:"0 32px 72px", maxWidth:1000, margin:"0 auto" }}>
        <div style={{ background:`linear-gradient(135deg, ${C.panel}, #110A00, ${C.panel})`, border:`1px solid rgba(231,76,60,0.25)`, borderRadius:8, padding:"44px 48px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg, transparent, #E74C3C, transparent)" }}/>
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div style={{ fontSize:11, color:"#E74C3C", letterSpacing:5, textTransform:"uppercase", marginBottom:12 }}>The Reality</div>
            <h2 style={{ fontSize:"clamp(22px,3.5vw,32px)", fontWeight:900, color:C.cream, letterSpacing:2, marginBottom:16 }}>
              Losing Your Income Doesn't Mean<br/>
              <span style={{ ...GT }}>Losing Your Future</span>
            </h2>
            <p style={{ fontSize:14, color:C.muted, lineHeight:1.85, maxWidth:620, margin:"0 auto" }}>
              Every person who has ever built a second income started from exactly where you are right now — staring at the gap between what's coming in and what needs to go out. The difference between people who rebuild fast and people who stay stuck is one thing: they got a system and they moved.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:20 }}>
            {[
              { icon:"⏱", title:"Fast to Start", body:"Most blueprints can generate first income within 1-4 weeks" },
              { icon:"💵", title:"Low to No Startup", body:"Most require under $300 to get started — some require zero" },
              { icon:"📍", title:"Work From Your Area", body:"These are local and national income streams — not remote gigs" },
              { icon:"🔁", title:"Repeatable Income", body:"Not a one-time thing — systems you can run again and again" },
            ].map((item,i)=>(
              <div key={i} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:4, padding:"20px 20px" }}>
                <div style={{ fontSize:28, marginBottom:10 }}>{item.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:C.cream, marginBottom:6 }}>{item.title}</div>
                <div style={{ fontSize:12, color:C.muted, lineHeight:1.65 }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INCOME TIMELINE ── */}
      <section style={{ padding:"0 32px 72px", maxWidth:1000, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:10, color:C.gold, letterSpacing:6, textTransform:"uppercase", marginBottom:10 }}>Time to First Income</div>
          <h2 style={{ fontSize:"clamp(22px,3vw,30px)", fontWeight:900, color:C.cream, letterSpacing:2 }}>How Fast Can You Start Earning?</h2>
          <div style={{ width:60, height:2, background:GG, margin:"14px auto 0" }}/>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            { days:"7 Days",    product:"Unit Gold",      income:"$200-$600",   how:"Win your first storage auction and sort/sell the contents" },
            { days:"2 Weeks",   product:"Repo Blueprint", income:"$400-$800",   how:"Get licensed and recover your first vehicle" },
            { days:"3-4 Weeks", product:"Dealer License", income:"$500-$3,000", how:"Get your dealer license and flip your first car" },
            { days:"30-45 Days",product:"NEMT Blueprint", income:"$800-$2,000", how:"Get licensed, enroll with Medicaid, start first routes" },
            { days:"30-60 Days",product:"Land Flip",      income:"$1,000-$5,000","how":"Find and sell your first land deal online" },
          ].map((row,i)=>(
            <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:4, padding:"16px 24px", display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ ...GT, fontSize:16, fontWeight:900, letterSpacing:1, minWidth:90, flexShrink:0 }}>{row.days}</div>
              <div style={{ fontSize:11, color:C.muted, letterSpacing:2, textTransform:"uppercase", minWidth:140, flexShrink:0 }}>{row.product}</div>
              <div style={{ fontSize:13, color:C.green, fontWeight:700, minWidth:110, flexShrink:0 }}>{row.income}</div>
              <div style={{ fontSize:12, color:"#C0B8A8", lineHeight:1.5, flex:1 }}>{row.how}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section id="products" style={{ padding:"0 32px 80px", maxWidth:1200, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:10, color:C.gold, letterSpacing:6, textTransform:"uppercase", marginBottom:10 }}>Choose Your Path</div>
          <h2 style={{ fontSize:"clamp(26px,4vw,40px)", fontWeight:900, color:C.cream, letterSpacing:2, marginBottom:14 }}>The Vault</h2>
          <div style={{ width:60, height:2, background:GG, margin:"0 auto 28px" }}/>
          <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
            {cats.map(cat=>(
              <button key={cat} onClick={()=>setFilter(cat)} style={{ background:filter===cat?GG:"transparent", color:filter===cat?"#000":C.muted, border:`1px solid ${filter===cat?C.goldBri:C.border}`, padding:"7px 18px", fontSize:10, letterSpacing:2, textTransform:"uppercase", cursor:"pointer", borderRadius:2, fontFamily:"Georgia,serif", transition:"all 0.2s" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:22 }}>
          {filtered.map(p=>(
            <ProductCard key={p.id} p={p} onBuy={setCheckout} onView={setPreview}/>
          ))}
        </div>
      </section>

      {/* ── REAL STORIES ── */}
      <section style={{ padding:"0 32px 80px", maxWidth:1200, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:10, color:C.gold, letterSpacing:6, textTransform:"uppercase", marginBottom:10 }}>Proof</div>
          <h2 style={{ fontSize:"clamp(22px,3.5vw,34px)", fontWeight:900, color:C.cream, letterSpacing:2 }}>People Who Were Right Where You Are</h2>
          <div style={{ width:60, height:2, background:GG, margin:"14px auto 0" }}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:20 }}>
          {STORIES.map((s,i)=>(
            <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"24px 26px", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:GG }}/>
              {/* Before */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <span style={{ fontSize:10, color:C.red, letterSpacing:1, textTransform:"uppercase", background:"rgba(231,76,60,0.12)", border:"1px solid rgba(231,76,60,0.3)", padding:"2px 8px", borderRadius:2 }}>Before</span>
                <span style={{ fontSize:11, color:C.muted }}>{s.lost}</span>
              </div>
              {/* After */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <span style={{ fontSize:10, color:C.green, letterSpacing:1, textTransform:"uppercase", background:"rgba(46,204,113,0.12)", border:"1px solid rgba(46,204,113,0.3)", padding:"2px 8px", borderRadius:2 }}>After</span>
                <span style={{ fontSize:13, color:C.green, fontWeight:700 }}>{s.income}</span>
              </div>
              <p style={{ fontSize:12, color:"#C0B8A8", lineHeight:1.7, margin:"0 0 16px", fontStyle:"italic" }}>
                "{s.how}"
              </p>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:GG, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:"#000" }}>
                    {s.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:C.cream }}>{s.name}</div>
                    <div style={{ fontSize:10, color:C.dim }}>{s.city}</div>
                  </div>
                </div>
                <div style={{ fontSize:10, color:C.gold, letterSpacing:1 }}>Week {s.weeks}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BUNDLE CTA ── */}
      <section style={{ padding:"0 32px 80px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ background:`linear-gradient(135deg, ${C.panel} 0%, #0F0D00 50%, ${C.panel} 100%)`, border:`1px solid ${C.gold}40`, borderRadius:8, padding:"44px 48px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:32, flexWrap:"wrap", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:GG }}/>
          <div style={{ position:"absolute", right:-40, top:-40, width:220, height:220, background:`radial-gradient(ellipse, ${C.gold}0C, transparent 70%)`, pointerEvents:"none" }}/>
          <div style={{ flex:1, minWidth:260 }}>
            <Badge color={C.green}>Best Value</Badge>
            <h3 style={{ fontSize:"clamp(20px,3vw,28px)", fontWeight:900, color:C.cream, margin:"14px 0 10px", letterSpacing:2 }}>
              Two Income Streams.<br/>
              One Decision. <span style={{ ...GT }}>$87.</span>
            </h3>
            <p style={{ fontSize:14, color:C.muted, lineHeight:1.75, marginBottom:0 }}>
              Unit Gold gets you cash within 7 days. The Dealer License gives you long-term income. The bundle is the fastest path out of the gap.
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12, alignItems:"flex-start", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
              <span style={{ ...GT, fontSize:44, fontWeight:900 }}>$87</span>
              <span style={{ fontSize:16, color:C.dim, textDecoration:"line-through" }}>$156</span>
            </div>
            <Btn onClick={()=>setCheckout(PRODUCTS[2])} style={{ padding:"17px 40px", fontSize:12 }}>
              Get The Bundle Now
            </Btn>
            <div style={{ fontSize:11, color:C.dim }}>🛡️ 30-day money-back guarantee</div>
          </div>
        </div>
      </section>

      {/* ── GUARANTEE ── */}
      <section style={{ padding:"0 32px 80px", maxWidth:680, margin:"0 auto", textAlign:"center" }}>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"44px 40px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", bottom:-40, left:"50%", transform:"translateX(-50%)", width:280, height:180, background:`radial-gradient(ellipse, ${C.gold}08, transparent 70%)`, pointerEvents:"none" }}/>
          <div style={{ fontSize:52, marginBottom:18 }}>🛡️</div>
          <div style={{ ...GT, fontSize:20, fontWeight:900, letterSpacing:3, textTransform:"uppercase", marginBottom:14 }}>30-Day Guarantee</div>
          <p style={{ fontSize:14, color:C.muted, lineHeight:1.85 }}>
            You are already dealing with enough uncertainty. Every product in the Vault comes with a full 30-day money-back guarantee. Read it. Apply it. If you don't feel it was worth every dollar, we refund you completely. No questions, no hassle, no forms to fill out.
          </p>
        </div>
      </section>

      {/* ── NOTIFICATION TOAST ── */}
      <div style={{ position:"fixed", bottom:24, left:24, zIndex:500, display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", maxWidth:280, animation:"fadeIn 0.4s ease" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:C.green, flexShrink:0, animation:"pulse 2s infinite" }}/>
          <span style={{ fontSize:11, color:C.muted }}>{notifications[ticker % notifications.length]}</span>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background:C.surface, borderTop:`1px solid ${C.border}`, padding:"36px 32px", textAlign:"center" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:14 }}>
          <VaultIcon size={18}/>
          <span style={{ ...GT, fontSize:13, fontWeight:900, letterSpacing:4, textTransform:"uppercase" }}>Hustle Vault</span>
        </div>
        <p style={{ fontSize:11, color:C.dim, marginBottom:12 }}>hustlevault.com · Premium Digital Products</p>
        <div style={{ display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap", marginBottom:16 }}>
          {["Privacy Policy","Terms of Service","Refund Policy","Contact"].map((t,i)=>(
            <span key={i} style={{ fontSize:10, color:C.dim, cursor:"pointer", textDecoration:"underline", textUnderlineOffset:3 }}>{t}</span>
          ))}
        </div>
        <div style={{ fontSize:10, color:"#222230" }}>
          © 2026 Hustle Vault. Results vary. Individual outcomes depend on effort, market conditions, and execution.
        </div>
      </footer>

      {/* ── MODALS ── */}
      {preview && <PreviewModal p={preview} onClose={()=>setPreview(null)} onBuy={p=>{ setPreview(null); setCheckout(p); }}/>}
      {checkout && <CheckoutModal p={checkout} onClose={()=>setCheckout(null)}/>}
    </div>
  );
}

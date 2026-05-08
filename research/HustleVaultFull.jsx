import { useState, useEffect, useRef } from "react";

// ── BRAND ─────────────────────────────────────────────────────
const C = {
  bg:"#05050A", surface:"#09090F", panel:"#0E0E18",
  border:"#18182A", borderH:"#2A2A42",
  gold:"#C9A84C", goldBri:"#F0C040", goldDim:"#7A5A18",
  cream:"#F5F0E8", muted:"#9A8A6A", dim:"#4A4A5A",
  green:"#2ECC71", red:"#E74C3C", blue:"#3498DB",
};
const GG = `linear-gradient(135deg,#7A5A18 0%,${C.gold} 30%,${C.goldBri} 55%,${C.gold} 80%,#7A5A18 100%)`;
const GT = {background:GG,WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",display:"inline-block"};

// ── INITIAL PRODUCTS ──────────────────────────────────────────
const INIT_PRODUCTS = [
  { id:1, emoji:"🔐", title:"UNIT GOLD", sub:"Storage Auction Blueprint", price:57, orig:97, accent:"#C9A84C", cat:"Quick Cash", tag:"BEST SELLER", tagC:"#F0C040", downloadUrl:"", fileName:"", uploaded:false },
  { id:2, emoji:"🚗", title:"DEALER LICENSE", sub:"Car Dealer License Guide", price:47, orig:79, accent:"#C0392B", cat:"Business", tag:"HIGH INCOME", tagC:"#E74C3C", downloadUrl:"", fileName:"", uploaded:false },
  { id:3, emoji:"🔑", title:"REPO BLUEPRINT", sub:"Vehicle Repossession Business", price:37, orig:67, accent:"#2471A3", cat:"Quick Cash", tag:"NEW", tagC:"#3498DB", downloadUrl:"", fileName:"", uploaded:false },
  { id:4, emoji:"📦", title:"LAND FLIP FORMULA", sub:"Buy Cheap Land Sell for 3X", price:47, orig:89, accent:"#27AE60", cat:"Business", tag:"PASSIVE", tagC:"#2ECC71", downloadUrl:"", fileName:"", uploaded:false },
  { id:5, emoji:"🏥", title:"NEMT BLUEPRINT", sub:"Medical Transport Business", price:47, orig:89, accent:"#16A085", cat:"Business", tag:"RECURRING", tagC:"#1ABC9C", downloadUrl:"", fileName:"", uploaded:false },
  { id:6, emoji:"💰", title:"HUSTLE BUNDLE", sub:"All 5 Guides — Best Value", price:147, orig:340, accent:"#F0C040", cat:"Bundle", tag:"SAVE $193", tagC:"#2ECC71", downloadUrl:"", fileName:"", uploaded:false, featured:true },
];

// ── UTILS ─────────────────────────────────────────────────────
function fmtSize(bytes) {
  if(bytes<1024) return bytes+"B";
  if(bytes<1048576) return (bytes/1024).toFixed(1)+"KB";
  return (bytes/1048576).toFixed(1)+"MB";
}

// ── VAULT ICON ────────────────────────────────────────────────
function VaultIcon({size=26}) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="vig2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7A5A18"/>
          <stop offset="50%" stopColor={C.goldBri}/>
          <stop offset="100%" stopColor="#7A5A18"/>
        </linearGradient>
      </defs>
      <rect x="8" y="10" width="64" height="56" rx="4" fill={C.surface} stroke="url(#vig2)" strokeWidth="2"/>
      <rect x="14" y="16" width="52" height="44" rx="3" fill="none" stroke={C.border} strokeWidth="1"/>
      <circle cx="40" cy="38" r="13" fill="none" stroke="url(#vig2)" strokeWidth="2"/>
      <circle cx="40" cy="38" r="8" fill={C.bg}/>
      <circle cx="40" cy="38" r="2.5" fill="url(#vig2)"/>
      <line x1="40" y1="26" x2="40" y2="30" stroke={C.goldBri} strokeWidth="2" strokeLinecap="round"/>
      <line x1="40" y1="46" x2="40" y2="50" stroke={C.goldBri} strokeWidth="2" strokeLinecap="round"/>
      <line x1="28" y1="38" x2="32" y2="38" stroke={C.goldBri} strokeWidth="2" strokeLinecap="round"/>
      <line x1="48" y1="38" x2="52" y2="38" stroke={C.goldBri} strokeWidth="2" strokeLinecap="round"/>
      <rect x="56" y="34" width="5" height="8" rx="2.5" fill="url(#vig2)"/>
      <rect x="14" y="22" width="4" height="5" rx="1" fill={C.border}/>
      <rect x="14" y="41" width="4" height="5" rx="1" fill={C.border}/>
    </svg>
  );
}

function Btn({children,onClick,variant="primary",style={},disabled=false,small=false}) {
  const [h,setH]=useState(false);
  const base={padding:small?"8px 16px":"13px 24px",fontSize:small?10:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",fontFamily:"Georgia,serif",border:"none",cursor:disabled?"not-allowed":"pointer",transition:"all 0.2s",borderRadius:2,opacity:disabled?0.5:1};
  const v={
    primary:{background:GG,color:"#000",transform:h?"translateY(-1px)":"none",boxShadow:h?`0 8px 24px rgba(201,168,76,0.35)`:`0 3px 12px rgba(201,168,76,0.2)`},
    secondary:{background:"transparent",color:C.gold,border:`1px solid ${C.gold}`,transform:h?"translateY(-1px)":"none"},
    ghost:{background:h?C.panel:"transparent",color:C.muted,border:`1px solid ${C.border}`},
    danger:{background:h?"#A93226":C.red,color:"#fff",transform:h?"translateY(-1px)":"none"},
    success:{background:h?"#1E8449":C.green,color:"#fff",transform:h?"translateY(-1px)":"none"},
  };
  return <button onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} onClick={onClick} disabled={disabled} style={{...base,...v[variant],...style}}>{children}</button>;
}

function Badge({children,color=C.gold}) {
  return <span style={{background:color,color:"#000",fontSize:9,fontWeight:700,letterSpacing:2,padding:"3px 10px",textTransform:"uppercase",clipPath:"polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%)",fontFamily:"Georgia,serif"}}>{children}</span>;
}

// ── UPLOAD MODAL ──────────────────────────────────────────────
function UploadModal({product, onClose, onSave}) {
  const [url, setUrl] = useState(product.downloadUrl || "");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState(product.downloadUrl ? "url" : "upload");
  const fileRef = useRef();

  const handleFile = (f) => {
    if(!f) return;
    const objectUrl = URL.createObjectURL(f);
    setFile({name:f.name, size:f.size, url:objectUrl, type:f.type});
    setMode("upload");
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSave = () => {
    if(mode==="upload" && file) {
      onSave({ downloadUrl: file.url, fileName: file.name, uploaded: true });
    } else if(mode==="url" && url.trim()) {
      onSave({ downloadUrl: url.trim(), fileName: url.trim().split("/").pop() || "download", uploaded: true });
    }
    onClose();
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(10px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.borderH}`,borderRadius:8,maxWidth:520,width:"100%",boxShadow:"0 40px 100px rgba(0,0,0,0.9)"}}>
        <div style={{height:4,background:`linear-gradient(90deg,transparent,${product.accent},${C.goldBri},${product.accent},transparent)`}}/>
        <div style={{padding:"28px 32px"}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
            <div>
              <div style={{fontSize:10,color:C.muted,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Upload Asset</div>
              <div style={{...GT,fontSize:18,fontWeight:900,letterSpacing:2}}>{product.title}</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:C.dim,fontSize:22,cursor:"pointer"}}>×</button>
          </div>

          {/* Mode toggle */}
          <div style={{display:"flex",gap:8,marginBottom:24}}>
            {["upload","url"].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"10px",fontSize:10,letterSpacing:2,textTransform:"uppercase",fontFamily:"Georgia,serif",cursor:"pointer",borderRadius:2,transition:"all 0.2s",background:mode===m?GG:"transparent",color:mode===m?"#000":C.muted,border:`1px solid ${mode===m?C.goldBri:C.border}`}}>
                {m==="upload"?"📁 Upload File":"🔗 Paste URL"}
              </button>
            ))}
          </div>

          {/* Upload zone */}
          {mode==="upload" && (
            <div
              onDragOver={e=>{e.preventDefault();setDragging(true)}}
              onDragLeave={()=>setDragging(false)}
              onDrop={handleDrop}
              onClick={()=>fileRef.current?.click()}
              style={{
                border:`2px dashed ${dragging?C.goldBri:file?C.green:C.border}`,
                borderRadius:6, padding:"40px 24px", textAlign:"center",
                cursor:"pointer", transition:"all 0.2s",
                background:dragging?`${C.goldBri}08`:file?`${C.green}08`:C.bg,
                marginBottom:20,
              }}
            >
              <input ref={fileRef} type="file" style={{display:"none"}} accept=".pdf,.docx,.zip,.epub,.mp4,.mp3" onChange={e=>handleFile(e.target.files[0])}/>
              {file ? (
                <div>
                  <div style={{fontSize:36,marginBottom:12}}>✅</div>
                  <div style={{fontSize:14,color:C.cream,fontWeight:700,marginBottom:4}}>{file.name}</div>
                  <div style={{fontSize:12,color:C.green}}>{fmtSize(file.size)} · Ready to save</div>
                </div>
              ) : (
                <div>
                  <div style={{fontSize:36,marginBottom:12}}>📁</div>
                  <div style={{fontSize:14,color:C.muted,marginBottom:6}}>Drop your file here or click to browse</div>
                  <div style={{fontSize:11,color:C.dim}}>PDF, DOCX, ZIP, EPUB, MP4, MP3 supported</div>
                </div>
              )}
            </div>
          )}

          {/* URL input */}
          {mode==="url" && (
            <div style={{marginBottom:20}}>
              <label style={{fontSize:10,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:6,display:"block"}}>Download URL</label>
              <input
                value={url}
                onChange={e=>setUrl(e.target.value)}
                placeholder="https://your-storage.com/your-file.pdf"
                style={{width:"100%",padding:"13px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:3,color:C.cream,fontSize:13,fontFamily:"Georgia,serif",outline:"none",boxSizing:"border-box"}}
              />
              <div style={{fontSize:11,color:C.dim,marginTop:6}}>Paste a direct link to your file — Dropbox, Google Drive, AWS S3, or any CDN URL</div>
            </div>
          )}

          {/* Current asset status */}
          {product.uploaded && (
            <div style={{background:C.bg,border:`1px solid ${C.green}40`,borderRadius:4,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <span style={{fontSize:16}}>✅</span>
              <div>
                <div style={{fontSize:12,color:C.green,fontWeight:700}}>Asset Currently Linked</div>
                <div style={{fontSize:11,color:C.dim,wordBreak:"break-all"}}>{product.fileName}</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={handleSave} style={{flex:1,padding:"14px"}} disabled={mode==="upload"?!file:!url.trim()}>
              💾 Save Asset
            </Btn>
            {product.uploaded && (
              <Btn onClick={()=>{onSave({downloadUrl:"",fileName:"",uploaded:false});onClose();}} variant="danger" style={{padding:"14px 16px"}} small>
                🗑
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PRODUCT CARD ──────────────────────────────────────────────
function ProductCard({p, onUpload, onBuy, onView, isAdmin}) {
  const [h,setH]=useState(false);
  const save = p.orig - p.price;

  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{background:C.surface,border:`1px solid ${h?C.borderH:C.border}`,borderRadius:6,overflow:"hidden",transition:"all 0.3s",transform:h?"translateY(-4px)":"none",boxShadow:h?`0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px ${C.borderH}`:"0 4px 16px rgba(0,0,0,0.3)",display:"flex",flexDirection:"column",position:"relative"}}>
      {/* Top accent */}
      <div style={{height:3,background:`linear-gradient(90deg,transparent,${p.accent},transparent)`}}/>

      {/* Asset status indicator */}
      {isAdmin && (
        <div style={{position:"absolute",top:10,right:10,zIndex:10}}>
          <div style={{fontSize:9,letterSpacing:1,padding:"3px 8px",borderRadius:100,background:p.uploaded?`${C.green}22`:`${C.red}22`,border:`1px solid ${p.uploaded?C.green+"50":C.red+"50"}`,color:p.uploaded?C.green:C.red,textTransform:"uppercase"}}>
            {p.uploaded?"✓ Asset Linked":"⚠ No Asset"}
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{background:`radial-gradient(ellipse at 25% 50%,${p.accent}18 0%,transparent 65%),${C.panel}`,padding:"28px 22px 18px",position:"relative"}}>
        {p.featured && <div style={{position:"absolute",top:0,right:0,background:GG,color:"#000",fontSize:8,fontWeight:700,letterSpacing:2,padding:"4px 14px",textTransform:"uppercase",fontFamily:"Georgia,serif"}}>Most Popular</div>}
        <div style={{fontSize:40,marginBottom:10,lineHeight:1}}>{p.emoji}</div>
        <Badge color={p.tagC}>{p.tag}</Badge>
        <div style={{marginTop:10}}>
          <div style={{...GT,fontSize:18,fontWeight:900,letterSpacing:3,textTransform:"uppercase"}}>{p.title}</div>
          <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginTop:3,textTransform:"uppercase"}}>{p.sub}</div>
        </div>
      </div>

      {/* Price */}
      <div style={{padding:"16px 22px 0",display:"flex",alignItems:"baseline",gap:8}}>
        <span style={{...GT,fontSize:28,fontWeight:900}}>${p.price}</span>
        <span style={{fontSize:12,color:C.dim,textDecoration:"line-through"}}>${p.orig}</span>
        <span style={{fontSize:10,color:C.green,fontWeight:700}}>Save ${save}</span>
      </div>

      {/* Download URL display */}
      {p.uploaded && p.downloadUrl && (
        <div style={{padding:"12px 22px 0"}}>
          <div style={{background:C.bg,border:`1px solid ${C.green}30`,borderRadius:4,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12}}>🔗</span>
            <a href={p.downloadUrl} target="_blank" rel="noreferrer" style={{fontSize:11,color:C.green,textDecoration:"none",wordBreak:"break-all",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>
              {p.fileName || p.downloadUrl}
            </a>
            <button onClick={()=>navigator.clipboard?.writeText(p.downloadUrl)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:11,padding:"0 4px",flexShrink:0}} title="Copy URL">📋</button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{padding:"14px 22px 22px",display:"flex",gap:8,marginTop:"auto"}}>
        {isAdmin ? (
          <>
            <Btn onClick={()=>onUpload(p)} variant={p.uploaded?"secondary":"primary"} style={{flex:1,padding:"11px"}}>
              {p.uploaded?"✏️ Update Asset":"📁 Upload Asset"}
            </Btn>
            {p.uploaded && (
              <a href={p.downloadUrl} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
                <Btn variant="success" style={{padding:"11px 14px"}} small>⬇</Btn>
              </a>
            )}
          </>
        ) : (
          <>
            <Btn onClick={()=>onBuy(p)} style={{flex:1,padding:"11px"}}>
              {p.uploaded?"Get Instant Access":"Coming Soon"}
            </Btn>
            <Btn onClick={()=>onView(p)} variant="ghost" style={{padding:"11px 12px"}}>Info</Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ── CHECKOUT MODAL ────────────────────────────────────────────
function CheckoutModal({p, onClose}) {
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({name:"",email:"",card:"",exp:"",cvv:"",coupon:""});
  const [coupon,setCoupon]=useState({applied:false,error:""});
  const [errors,setErrors]=useState({});
  const final = coupon.applied ? Math.round(p.price*0.8) : p.price;

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

  const submit=()=>{
    if(!validate())return;
    setStep(2);
    setTimeout(()=>setStep(3),2200);
  };

  const fmtCard=v=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp=v=>{const d=v.replace(/\D/g,"").slice(0,4);return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d;};
  const inp=f=>({width:"100%",padding:"12px 14px",background:C.bg,border:`1px solid ${errors[f]?C.red:C.border}`,borderRadius:3,color:C.cream,fontSize:13,fontFamily:"Georgia,serif",outline:"none",boxSizing:"border-box"});
  const lbl={fontSize:10,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:5,display:"block"};

  if(step===3) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(10px)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.surface,border:`1px solid ${C.borderH}`,borderRadius:8,maxWidth:420,width:"100%",padding:"48px 40px",textAlign:"center"}}>
        <div style={{fontSize:60,marginBottom:18}}>🎉</div>
        <div style={{...GT,fontSize:24,fontWeight:900,letterSpacing:2,marginBottom:12}}>Access Granted!</div>
        <p style={{fontSize:13,color:C.muted,lineHeight:1.8,marginBottom:24}}>
          Your download link was sent to <strong style={{color:C.cream}}>{form.email}</strong>
        </p>
        {p.downloadUrl && (
          <div style={{background:C.bg,border:`1px solid ${C.green}40`,borderRadius:4,padding:"14px 18px",marginBottom:24}}>
            <div style={{fontSize:11,color:C.green,fontWeight:700,marginBottom:6}}>⬇ Direct Download Link</div>
            <a href={p.downloadUrl} target="_blank" rel="noreferrer" style={{fontSize:12,color:C.goldBri,textDecoration:"underline",wordBreak:"break-all"}}>
              Click here to download your product
            </a>
          </div>
        )}
        <Btn onClick={onClose} style={{width:"100%"}}>Back to Store</Btn>
      </div>
    </div>
  );

  if(step===2) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(10px)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:48,height:48,border:`3px solid ${C.border}`,borderTopColor:C.gold,borderRadius:"50%",margin:"0 auto 20px",animation:"spin 0.8s linear infinite"}}/>
        <div style={{...GT,fontSize:13,letterSpacing:4,textTransform:"uppercase"}}>Processing Payment</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(10px)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.borderH}`,borderRadius:8,maxWidth:460,width:"100%",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{height:4,background:GG}}/>
        <div style={{padding:"24px 30px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
            <div>
              <div style={{fontSize:9,color:C.muted,letterSpacing:3,textTransform:"uppercase",marginBottom:3}}>Secure Checkout</div>
              <div style={{...GT,fontSize:17,fontWeight:900,letterSpacing:2}}>{p.title}</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:C.dim,fontSize:20,cursor:"pointer"}}>×</button>
          </div>

          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,padding:"12px 16px",marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:C.muted}}>{p.sub}</span>
              <span style={{fontSize:12,color:C.cream}}>${p.price}</span>
            </div>
            {coupon.applied&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:C.green}}>Coupon VAULT20 (20% off)</span><span style={{fontSize:12,color:C.green}}>-${p.price-final}</span></div>}
            <div style={{height:1,background:C.border,margin:"8px 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:13,fontWeight:700,color:C.cream}}>Total</span>
              <span style={{...GT,fontSize:16,fontWeight:900}}>${final}</span>
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            <div><label style={lbl}>Full Name</label><input style={inp("name")} placeholder="John Smith" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>{errors.name&&<div style={{fontSize:10,color:C.red,marginTop:3}}>{errors.name}</div>}</div>
            <div><label style={lbl}>Email</label><input style={inp("email")} placeholder="john@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>{errors.email&&<div style={{fontSize:10,color:C.red,marginTop:3}}>{errors.email}</div>}</div>
            <div><label style={lbl}>Card Number</label><input style={inp("card")} placeholder="4242 4242 4242 4242" value={form.card} onChange={e=>setForm({...form,card:fmtCard(e.target.value)})}/>{errors.card&&<div style={{fontSize:10,color:C.red,marginTop:3}}>{errors.card}</div>}</div>
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1}}><label style={lbl}>Expiry</label><input style={inp("exp")} placeholder="MM/YY" value={form.exp} onChange={e=>setForm({...form,exp:fmtExp(e.target.value)})}/>{errors.exp&&<div style={{fontSize:10,color:C.red,marginTop:3}}>{errors.exp}</div>}</div>
              <div style={{flex:1}}><label style={lbl}>CVV</label><input style={inp("cvv")} placeholder="123" value={form.cvv} onChange={e=>setForm({...form,cvv:e.target.value.replace(/\D/g,"").slice(0,4)})}/>{errors.cvv&&<div style={{fontSize:10,color:C.red,marginTop:3}}>{errors.cvv}</div>}</div>
            </div>
            <div>
              <label style={lbl}>Coupon Code</label>
              <div style={{display:"flex",gap:8}}>
                <input style={{...inp("coupon"),flex:1}} placeholder="Try VAULT20" value={form.coupon} onChange={e=>setForm({...form,coupon:e.target.value})} disabled={coupon.applied}/>
                <Btn onClick={()=>{if(form.coupon.toUpperCase()==="VAULT20")setCoupon({applied:true,error:""});else setCoupon({applied:false,error:"Invalid code"});}} variant="secondary" style={{padding:"11px 13px",fontSize:9}} disabled={coupon.applied}>{coupon.applied?"✓":"Apply"}</Btn>
              </div>
              {coupon.error&&<div style={{fontSize:10,color:C.red,marginTop:3}}>{coupon.error}</div>}
              {coupon.applied&&<div style={{fontSize:10,color:C.green,marginTop:3}}>20% off applied!</div>}
            </div>
          </div>

          <Btn onClick={submit} style={{width:"100%",padding:"16px",fontSize:12,marginTop:20}}>Complete Purchase — ${final}</Btn>
          <div style={{textAlign:"center",marginTop:10,display:"flex",justifyContent:"center",gap:14,flexWrap:"wrap"}}>
            {["🔒 SSL Secure","⚡ Instant Delivery","↩️ 30-Day Guarantee"].map((t,i)=><span key={i} style={{fontSize:10,color:C.dim}}>{t}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PREVIEW MODAL ─────────────────────────────────────────────
function PreviewModal({p, onClose, onBuy}) {
  useEffect(()=>{
    const h=e=>e.key==="Escape"&&onClose();
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[onClose]);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(10px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.borderH}`,borderRadius:8,maxWidth:500,width:"100%",maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{height:4,background:`linear-gradient(90deg,transparent,${p.accent},${C.goldBri},${p.accent},transparent)`}}/>
        <div style={{background:`radial-gradient(ellipse at 30% 50%,${p.accent}22 0%,transparent 60%),${C.panel}`,padding:"28px 32px 20px",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:12,right:16,background:"none",border:"none",color:C.dim,fontSize:20,cursor:"pointer"}}>×</button>
          <div style={{fontSize:48,marginBottom:8}}>{p.emoji}</div>
          <Badge color={p.tagC}>{p.tag}</Badge>
          <div style={{...GT,fontSize:24,fontWeight:900,letterSpacing:3,textTransform:"uppercase",marginTop:10}}>{p.title}</div>
          <div style={{fontSize:10,color:C.muted,letterSpacing:3,textTransform:"uppercase",marginTop:3}}>{p.sub}</div>
        </div>
        <div style={{padding:"24px 32px"}}>
          {p.uploaded && p.downloadUrl && (
            <div style={{background:`${C.green}10`,border:`1px solid ${C.green}40`,borderRadius:4,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:20}}>⬇️</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:C.green,fontWeight:700,marginBottom:4}}>Download Link Ready</div>
                <a href={p.downloadUrl} target="_blank" rel="noreferrer" style={{fontSize:11,color:C.goldBri,wordBreak:"break-all",textDecoration:"underline"}}>{p.fileName||p.downloadUrl}</a>
              </div>
              <button onClick={()=>navigator.clipboard?.writeText(p.downloadUrl)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:3,padding:"6px 10px",color:C.muted,cursor:"pointer",fontSize:11,fontFamily:"Georgia,serif"}}>Copy</button>
            </div>
          )}
          <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:20}}>
            <span style={{...GT,fontSize:36,fontWeight:900}}>${p.price}</span>
            <span style={{fontSize:13,color:C.dim,textDecoration:"line-through"}}>${p.orig}</span>
            <span style={{fontSize:11,color:C.green}}>Save ${p.orig-p.price}</span>
          </div>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,padding:"14px 18px",marginBottom:20,display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:20}}>🛡️</span>
            <div><div style={{fontSize:12,fontWeight:700,color:C.cream,marginBottom:3}}>30-Day Money-Back Guarantee</div><div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>Full refund if you're not satisfied. No questions asked.</div></div>
          </div>
          <Btn onClick={()=>{onClose();onBuy(p);}} style={{width:"100%",padding:"16px",fontSize:12}} disabled={!p.uploaded}>
            {p.uploaded?"Get Instant Access — $"+p.price:"Coming Soon"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────
export default function HustleVaultFull() {
  const [view, setView]         = useState("store"); // store | admin
  const [products, setProducts] = useState(INIT_PRODUCTS);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [preview, setPreview]   = useState(null);
  const [filter, setFilter]     = useState("All");
  const [scrolled, setScrolled] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [copied, setCopied]     = useState("");
  const [ticker, setTicker]     = useState(0);

  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>60);
    window.addEventListener("scroll",h);
    return ()=>window.removeEventListener("scroll",h);
  },[]);

  useEffect(()=>{
    const t=setInterval(()=>setTicker(x=>x+1),4000);
    return ()=>clearInterval(t);
  },[]);

  const updateProduct = (id, updates) => {
    setProducts(ps=>ps.map(p=>p.id===id?{...p,...updates}:p));
  };

  const handleCopy = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(()=>setCopied(""),1500);
  };

  const cats = ["All",...Array.from(new Set(products.map(p=>p.cat)))];
  const filtered = filter==="All"?products:products.filter(p=>p.cat===filter);

  const notifications = ["Marcus from Houston just bought Unit Gold","Tamara from Atlanta got the Hustle Bundle","Derrick from Newark just got Unit Gold","Keisha from Detroit got NEMT Blueprint"];

  // ── ADMIN GATE ──
  if(view==="admin" && !adminUnlocked) return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif"}}>
      <div style={{background:C.surface,border:`1px solid ${C.borderH}`,borderRadius:8,padding:"48px 40px",maxWidth:380,width:"100%",textAlign:"center"}}>
        <div style={{height:3,background:GG,marginBottom:32,marginLeft:-40,marginRight:-40,marginTop:-48,borderRadius:"8px 8px 0 0"}}/>
        <VaultIcon size={40}/>
        <div style={{...GT,fontSize:22,fontWeight:900,letterSpacing:3,textTransform:"uppercase",marginTop:16,marginBottom:6}}>Admin Access</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:28}}>Enter your admin password to continue</div>
        <input
          type="password"
          placeholder="Password"
          value={adminPass}
          onChange={e=>setAdminPass(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"){if(adminPass==="hustle2026"){setAdminUnlocked(true);setAdminError("");}else setAdminError("Incorrect password");}}}
          style={{width:"100%",padding:"13px 14px",background:C.bg,border:`1px solid ${adminError?C.red:C.border}`,borderRadius:3,color:C.cream,fontSize:14,fontFamily:"Georgia,serif",outline:"none",boxSizing:"border-box",marginBottom:8,textAlign:"center",letterSpacing:4}}
        />
        {adminError&&<div style={{fontSize:11,color:C.red,marginBottom:12}}>{adminError}</div>}
        <Btn onClick={()=>{if(adminPass==="hustle2026"){setAdminUnlocked(true);setAdminError("");}else setAdminError("Incorrect password");}} style={{width:"100%",padding:"14px",marginTop:8}}>Unlock Admin</Btn>
        <button onClick={()=>setView("store")} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:11,marginTop:16,fontFamily:"Georgia,serif",letterSpacing:1}}>← Back to Store</button>
        <div style={{fontSize:10,color:C.dim,marginTop:16}}>Demo password: hustle2026</div>
      </div>
    </div>
  );

  // ── ADMIN PANEL ──
  if(view==="admin" && adminUnlocked) return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.cream,fontFamily:"Georgia,serif"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}input{outline:none;}::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:#05050A;}::-webkit-scrollbar-thumb{background:#282840;border-radius:3px;}`}</style>

      {/* Admin Nav */}
      <nav style={{background:`${C.surface}F5`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.border}`,padding:"0 32px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1200,margin:"0 auto",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <VaultIcon size={22}/>
            <div style={{...GT,fontSize:14,fontWeight:900,letterSpacing:4,textTransform:"uppercase"}}>Hustle Vault</div>
            <div style={{fontSize:9,color:C.red,background:`${C.red}18`,border:`1px solid ${C.red}40`,borderRadius:100,padding:"2px 10px",letterSpacing:2,textTransform:"uppercase",marginLeft:8}}>Admin</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>setView("store")} variant="ghost" small>View Store</Btn>
            <Btn onClick={()=>{setAdminUnlocked(false);setAdminPass("");setView("store");}} variant="danger" small>Logout</Btn>
          </div>
        </div>
      </nav>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"40px 32px"}}>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:40}}>
          {[
            {label:"Total Products", value:products.length, icon:"📦"},
            {label:"Assets Linked", value:products.filter(p=>p.uploaded).length+"/"+products.length, icon:"✅"},
            {label:"Total Value", value:"$"+products.reduce((a,p)=>a+p.price,0), icon:"💰"},
            {label:"Potential Revenue", value:"$"+products.reduce((a,p)=>a+p.orig,0), icon:"📈"},
          ].map((s,i)=>(
            <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"20px 22px"}}>
              <div style={{fontSize:24,marginBottom:8}}>{s.icon}</div>
              <div style={{...GT,fontSize:26,fontWeight:900}}>{s.value}</div>
              <div style={{fontSize:10,color:C.dim,letterSpacing:2,textTransform:"uppercase",marginTop:4}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Product Manager */}
        <div style={{fontSize:10,color:C.gold,letterSpacing:5,textTransform:"uppercase",marginBottom:16}}>Product Asset Manager</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {products.map(p=>(
            <div key={p.id} style={{background:C.surface,border:`1px solid ${p.uploaded?C.green+"30":C.border}`,borderRadius:6,padding:"18px 24px",display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
              {/* Product info */}
              <div style={{display:"flex",alignItems:"center",gap:14,flex:1,minWidth:200}}>
                <div style={{fontSize:32}}>{p.emoji}</div>
                <div>
                  <div style={{...GT,fontSize:14,fontWeight:900,letterSpacing:2}}>{p.title}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>{p.sub}</div>
                </div>
              </div>

              {/* Price */}
              <div style={{textAlign:"center",minWidth:80}}>
                <div style={{...GT,fontSize:20,fontWeight:900}}>${p.price}</div>
                <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:1}}>Price</div>
              </div>

              {/* Asset status + URL */}
              <div style={{flex:2,minWidth:240}}>
                {p.uploaded && p.downloadUrl ? (
                  <div style={{background:C.bg,border:`1px solid ${C.green}40`,borderRadius:4,padding:"10px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:10,color:C.green,letterSpacing:1,textTransform:"uppercase",fontWeight:700}}>✓ Asset Linked</span>
                      <span style={{fontSize:10,color:C.dim}}>{p.fileName}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <a href={p.downloadUrl} target="_blank" rel="noreferrer" style={{fontSize:11,color:C.goldBri,textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>
                        {p.downloadUrl.length>50?p.downloadUrl.slice(0,50)+"...":p.downloadUrl}
                      </a>
                      <button
                        onClick={()=>handleCopy(p.downloadUrl,p.id+"url")}
                        style={{background:"none",border:`1px solid ${C.border}`,borderRadius:2,padding:"3px 8px",color:copied===p.id+"url"?C.green:C.muted,cursor:"pointer",fontSize:10,fontFamily:"Georgia,serif",flexShrink:0}}
                      >
                        {copied===p.id+"url"?"Copied!":"Copy URL"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{background:C.bg,border:`1px solid ${C.red}30`,borderRadius:4,padding:"10px 14px"}}>
                    <div style={{fontSize:10,color:C.red,letterSpacing:1,textTransform:"uppercase"}}>⚠ No asset linked — upload to enable purchases</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{display:"flex",gap:8,flexShrink:0}}>
                <Btn onClick={()=>setUploadTarget(p)} variant={p.uploaded?"secondary":"primary"} small>
                  {p.uploaded?"✏️ Update":"📁 Upload"}
                </Btn>
                {p.uploaded && (
                  <a href={p.downloadUrl} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
                    <Btn variant="success" small>⬇ Test</Btn>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div style={{marginTop:40,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"28px 32px"}}>
          <div style={{...GT,fontSize:14,fontWeight:900,letterSpacing:3,textTransform:"uppercase",marginBottom:16}}>How Asset Linking Works</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
            {[
              {icon:"📁",title:"Upload File",body:"Click Upload on any product and drag your PDF or file into the upload zone. A temporary download URL is generated instantly."},
              {icon:"🔗",title:"Paste URL",body:"If your file is already hosted on Dropbox, Google Drive, S3, or any CDN — switch to URL mode and paste the direct link."},
              {icon:"⬇",title:"Test Download",body:"Click the Test button to verify your download link works before making the product live for customers."},
              {icon:"🔒",title:"Production Note",body:"In production, connect AWS S3 or Supabase Storage for permanent, secure download URLs with expiry protection."},
            ].map((item,i)=>(
              <div key={i} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,padding:"16px 18px"}}>
                <div style={{fontSize:24,marginBottom:8}}>{item.icon}</div>
                <div style={{fontSize:12,fontWeight:700,color:C.cream,marginBottom:6}}>{item.title}</div>
                <div style={{fontSize:11,color:C.muted,lineHeight:1.65}}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {uploadTarget && <UploadModal product={uploadTarget} onClose={()=>setUploadTarget(null)} onSave={updates=>{updateProduct(uploadTarget.id,updates);setUploadTarget(null);}}/>}
    </div>
  );

  // ── STOREFRONT ──
  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.cream,fontFamily:"Georgia,serif",overflowX:"hidden"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:rgba(201,168,76,0.3);color:#F5F0E8;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:#05050A;}::-webkit-scrollbar-thumb{background:#282840;border-radius:3px;}
        input{outline:none;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
        @keyframes ticker{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        .fu{animation:fadeUp 0.7s ease both;}.fu2{animation:fadeUp 0.7s 0.15s ease both;}.fu3{animation:fadeUp 0.7s 0.3s ease both;}
      `}</style>

      {/* Ticker */}
      <div style={{background:`linear-gradient(90deg,#1A0A00,#2A1200,#1A0A00)`,borderBottom:`1px solid ${C.gold}40`,padding:"9px 0",overflow:"hidden"}}>
        <div style={{display:"flex",animation:"ticker 22s linear infinite",width:"200%"}}>
          {["Real blueprints for real income","No experience needed — just follow the system","Bills don't pause — neither should your income","2400+ customers already inside the vault","Get access instantly after purchase"].flatMap(x=>[x,x]).map((item,i)=>(
            <span key={i} style={{fontSize:10,color:C.gold,letterSpacing:2,whiteSpace:"nowrap",padding:"0 44px"}}>◆ {item}</span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:scrolled?`${C.surface}F2`:"transparent",backdropFilter:scrolled?"blur(16px)":"none",borderBottom:scrolled?`1px solid ${C.border}`:"none",transition:"all 0.3s",padding:"0 32px"}}>
        <div style={{maxWidth:1200,margin:"0 auto",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <VaultIcon size={24}/>
            <div><div style={{...GT,fontSize:14,fontWeight:900,letterSpacing:4,textTransform:"uppercase",lineHeight:1}}>Hustle</div><div style={{fontSize:8,letterSpacing:7,color:C.muted,textTransform:"uppercase"}}>Vault</div></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:9,color:C.dim,letterSpacing:2,display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:C.green,display:"inline-block",animation:"pulse 2s infinite"}}/>OPEN
            </div>
            <Btn onClick={()=>setView("admin")} variant="ghost" small>⚙ Admin</Btn>
            <Btn onClick={()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"})} variant="secondary" small>Browse Products</Btn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{position:"relative",padding:"88px 32px 64px",textAlign:"center",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"25%",left:"50%",transform:"translate(-50%,-50%)",width:640,height:460,background:`radial-gradient(ellipse,${C.gold}12 0%,transparent 65%)`,pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:0,opacity:0.022,backgroundImage:`linear-gradient(${C.gold} 1px,transparent 1px),linear-gradient(90deg,${C.gold} 1px,transparent 1px)`,backgroundSize:"54px 54px",pointerEvents:"none"}}/>
        <div style={{position:"relative",maxWidth:760,margin:"0 auto"}}>
          <div className="fu" style={{display:"inline-flex",alignItems:"center",gap:8,background:`${C.gold}18`,border:`1px solid ${C.gold}40`,borderRadius:100,padding:"6px 18px",marginBottom:28}}>
            <VaultIcon size={13}/><span style={{fontSize:10,color:C.gold,letterSpacing:3,textTransform:"uppercase"}}>Premium Digital Products</span>
          </div>
          <h1 className="fu2" style={{margin:"0 0 20px",lineHeight:1.05}}>
            <span style={{...GT,fontSize:"clamp(42px,7.5vw,74px)",fontWeight:900,letterSpacing:4,textTransform:"uppercase",display:"block"}}>Hustle</span>
            <span style={{fontSize:"clamp(42px,7.5vw,74px)",fontWeight:900,letterSpacing:4,textTransform:"uppercase",color:C.cream,display:"block"}}>Vault</span>
          </h1>
          <p className="fu3" style={{fontSize:"clamp(13px,1.8vw,16px)",color:C.muted,lineHeight:1.85,maxWidth:540,margin:"0 auto 36px",fontStyle:"italic"}}>
            Real blueprints for people who need income now. No fluff — just step-by-step systems that work.
          </p>
          <div className="fu3" style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <Btn onClick={()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"})} style={{padding:"15px 32px",fontSize:11}}>Browse All Products</Btn>
            <Btn onClick={()=>setCheckout(products.find(p=>p.id===6))} variant="secondary" style={{padding:"15px 32px",fontSize:11}}>Get The Bundle — $147</Btn>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{background:C.surface,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"24px 32px"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:20}}>
          {[["2,400+","Customers"],["$1.2M","Customer Earnings"],["4.9★","Average Rating"],["5","Products Ready"]].map((s,i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <div style={{...GT,fontSize:26,fontWeight:900,letterSpacing:2}}>{s[0]}</div>
              <div style={{fontSize:9,color:C.dim,letterSpacing:3,textTransform:"uppercase",marginTop:3}}>{s[1]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" style={{padding:"72px 32px",maxWidth:1200,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:9,color:C.gold,letterSpacing:6,textTransform:"uppercase",marginBottom:10}}>The Vault</div>
          <h2 style={{fontSize:"clamp(24px,4vw,38px)",fontWeight:900,color:C.cream,letterSpacing:2,marginBottom:14}}>Choose Your Blueprint</h2>
          <div style={{width:60,height:2,background:GG,margin:"0 auto 24px"}}/>
          <div style={{display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap"}}>
            {cats.map(cat=>(
              <button key={cat} onClick={()=>setFilter(cat)} style={{background:filter===cat?GG:"transparent",color:filter===cat?"#000":C.muted,border:`1px solid ${filter===cat?C.goldBri:C.border}`,padding:"7px 16px",fontSize:9,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",borderRadius:2,fontFamily:"Georgia,serif",transition:"all 0.2s"}}>{cat}</button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:20}}>
          {filtered.map(p=>(
            <ProductCard key={p.id} p={p} onUpload={setUploadTarget} onBuy={setCheckout} onView={setPreview} isAdmin={false}/>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{background:C.surface,borderTop:`1px solid ${C.border}`,padding:"32px",textAlign:"center"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:12}}>
          <VaultIcon size={16}/>
          <span style={{...GT,fontSize:12,fontWeight:900,letterSpacing:4,textTransform:"uppercase"}}>Hustle Vault</span>
        </div>
        <p style={{fontSize:10,color:C.dim,marginBottom:10}}>hustlevault.com · Premium Digital Products</p>
        <div style={{display:"flex",gap:18,justifyContent:"center",flexWrap:"wrap",marginBottom:14}}>
          {["Privacy Policy","Terms of Service","Refund Policy","Contact"].map((t,i)=>(
            <span key={i} style={{fontSize:10,color:C.dim,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>{t}</span>
          ))}
        </div>
        <button onClick={()=>setView("admin")} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:2,padding:"6px 14px",color:C.dim,cursor:"pointer",fontSize:9,fontFamily:"Georgia,serif",letterSpacing:2,textTransform:"uppercase"}}>
          ⚙ Admin Panel
        </button>
        <div style={{marginTop:14,fontSize:9,color:"#1A1A28"}}>© 2026 Hustle Vault. All rights reserved.</div>
      </footer>

      {/* Live notification */}
      <div style={{position:"fixed",bottom:20,left:20,zIndex:500}}>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 14px",display:"flex",alignItems:"center",gap:8,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",maxWidth:260}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:C.green,flexShrink:0,animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:10,color:C.muted}}>{notifications[ticker%notifications.length]}</span>
        </div>
      </div>

      {/* Modals */}
      {uploadTarget && <UploadModal product={uploadTarget} onClose={()=>setUploadTarget(null)} onSave={updates=>{updateProduct(uploadTarget.id,updates);setUploadTarget(null);}}/>}
      {preview && <PreviewModal p={preview} onClose={()=>setPreview(null)} onBuy={p=>{setPreview(null);setCheckout(p);}}/>}
      {checkout && <CheckoutModal p={checkout} onClose={()=>setCheckout(null)}/>}
    </div>
  );
}

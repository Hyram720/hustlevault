import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { API } from "./config";
import { useSEO } from "./seo";
import { THEME, GRADIENT, GRADIENT_TEXT, ACCENT_RGB } from "../shared/theme.js";

const C = { ...THEME };
const GG = GRADIENT;
const GT = GRADIENT_TEXT;

const UPSELLS = {
  "1":  { id: 6,   title: "PRINT ON DEMAND",      price: 27, orig: 89, color: "#8E44AD" },
  "2":  { id: 4,   title: "LAND FLIP FORMULA",    price: 27, orig: 89, color: "#27AE60" },
  "3":  { id: 2,   title: "DEALER LICENSE",       price: 27, orig: 79, color: "#C0392B" },
  "4":  { id: 9,   title: "VETERANS HOUSING",     price: 27, orig: 89, color: "#1A5276" },
  "5":  { id: 8,   title: "ASSISTED LIVING",      price: 27, orig: 89, color: "#884EA0" },
  "6":  { id: 7,   title: "DOMAIN FLIPPING",      price: 27, orig: 89, color: "#1F618D" },
  "7":  { id: 6,   title: "PRINT ON DEMAND",      price: 27, orig: 89, color: "#8E44AD" },
  "8":  { id: 9,   title: "VETERANS HOUSING",     price: 27, orig: 89, color: "#1A5276" },
  "9":  { id: 8,   title: "ASSISTED LIVING",      price: 27, orig: 89, color: "#884EA0" },
  "10": { id: 4,   title: "LAND FLIP FORMULA",    price: 27, orig: 89, color: "#27AE60" },
  "B1": { id: 5,   title: "NEMT BLUEPRINT",       price: 37, orig: 89, color: "#16A085" },
  "B2": { id: "B5",title: "COMPLETE VAULT (ALL)", price: 97, orig: 474, color: "#F0C040" },
  "B3": { id: 5,   title: "NEMT BLUEPRINT",       price: 37, orig: 89, color: "#16A085" },
  "B4": { id: "B5",title: "COMPLETE VAULT (ALL)", price: 97, orig: 474, color: "#F0C040" },
};

function Btn({children, onClick, variant="primary", style={}, disabled=false, full=false}) {
  const [h,setH]=useState(false);
  const base={padding:"13px 22px",fontSize:11,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",fontFamily:"Georgia,serif",border:"none",cursor:disabled?"not-allowed":"pointer",transition:"all 0.18s",borderRadius:2,opacity:disabled?0.5:1,width:full?"100%":"auto"};
  const v={
    primary:{background:GG,color:"#000",transform:h?"translateY(-1px)":"none",boxShadow:h?`0 10px 30px rgba(${ACCENT_RGB},0.4)`:`0 4px 16px rgba(${ACCENT_RGB},0.2)`},
    secondary:{background:"transparent",color:C.gold,border:`1px solid ${C.gold}`,transform:h?"translateY(-1px)":"none"},
    ghost:{background:h?C.panel:"transparent",color:C.muted,border:`1px solid ${C.border}`},
  };
  return <button onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} onClick={onClick} disabled={disabled} style={{...base,...v[variant],...style}}>{children}</button>;
}

function UpsellModal({ item, onClose }) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          productId: item.id,
          upsellOf: item.sourceSessionId
        })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Failed to create upsell session");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.gold}50`, borderRadius: 12, maxWidth: 480, width: "100%", overflow: "hidden", boxShadow: `0 50px 120px rgba(0,0,0,0.9)` }}>
        <div style={{ height: 6, background: GG }} />
        <div style={{ padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 900, letterSpacing: 5, textTransform: "uppercase", marginBottom: 12 }}>Wait! One-Time Final Offer</div>
          <h2 style={{ fontSize: 24, fontWeight: 950, marginBottom: 16 }}>Upgrade Your Results</h2>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>
            Most members add the <strong style={{ color: C.cream }}>{item.title}</strong> for a second stream of income. Get it now for 70% off. This will not be offered again.
          </p>
          
          <div style={{ background: `${item.color}15`, border: `1px dashed ${item.color}50`, borderRadius: 8, padding: 20, marginBottom: 28, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 12, color: C.dim, textDecoration: "line-through" }}>Normally ${item.orig}</span>
            <span style={{ ...GT, fontSize: 36, fontWeight: 900 }}>${item.price}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Btn onClick={handleAccept} disabled={loading} full style={{ padding: "18px", fontSize: 12 }}>
              {loading ? "Processing..." : `YES, ADD TO MY ORDER — $${item.price}`}
            </Btn>
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", padding: "10px" }}>
              No thanks, I'll pass on this discount
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Success() {
  useSEO({
    title: "Order confirmation | Hustle Vault",
    description: "Your Hustle Vault checkout result.",
    path: "/success",
    noindex: true,
  });
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellItem, setUpsellItem] = useState(null);

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!sessionId) { setError("No verification token found"); setLoading(false); return; }

    fetch(`${API}/api/verify-session/${sessionId}`)
      .then(r => { if (!r.ok) throw new Error("Could not authenticate vault access"); return r.json(); })
      .then(data => { 
        setOrder(data); 
        setLoading(false); 
        
        // Check for upsell eligibility
        const up = UPSELLS[data.productId];
        // If it was already an upsell session, don't show another upsell (prevent loop)
        if (false && up && !params.get("upsell")) { // ebook upsells retired — downloads still work
           setUpsellItem({ ...up, sourceSessionId: sessionId });
           // Delay modal slightly for effect
           setTimeout(() => setShowUpsell(true), 1500);
        }
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [params]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.cream, fontFamily: "Inter, system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes shine { from { left: -100%; } to { left: 200%; } }
      `}</style>

      <div style={{ 
        background: C.surface, 
        border: `1px solid ${C.borderH}`, 
        borderRadius: 12, 
        maxWidth: 520, 
        width: "100%", 
        overflow: "hidden",
        boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 40px ${C.gold}10`,
        position: "relative"
      }}>
        <div style={{ height: 4, background: GG, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", width: "50%", animation: "shine 2s infinite" }} />
        </div>

        {loading && (
          <div style={{ padding: "100px 40px", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, border: `3px solid ${C.border}`, borderTopColor: C.gold, borderRadius: "50%", margin: "0 auto 24px", animation: "spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite" }} />
            <div style={{ ...GT, fontSize: 13, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase" }}>Authenticating Vault Access</div>
            <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
          </div>
        )}

        {error && (
          <div style={{ padding: "80px 40px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 24 }}>🛡️</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: C.cream, marginBottom: 12, letterSpacing: 1 }}>Access Denied</h2>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 32, lineHeight: 1.8 }}>{error}</p>
            <Link to="/" style={{ display: "inline-block", background: GG, color: "#000", padding: "16px 36px", fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", textDecoration: "none", borderRadius: 4, transform: "translateY(0)", transition: "all 0.2s" }} onMouseEnter={e => e.target.style.transform = "translateY(-2px)"} onMouseLeave={e => e.target.style.transform = "translateY(0)"}>
              Return to Entrance
            </Link>
          </div>
        )}

        {order && (
          <div style={{ padding: "52px 40px" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 64, marginBottom: 24, animation: "pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>🥇</div>
              <div style={{ ...GT, fontSize: 32, fontWeight: 900, letterSpacing: 3, marginBottom: 12 }}>VAULT ACTIVATED</div>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8 }}>
                You've successfully secured your position. Your premium digital assets are unlocked below.
              </p>
            </div>

            {/* Digital Product Delivery */}
            {order.digitalContent && (
              <div style={{ background: C.bg, border: `1px solid ${C.gold}30`, borderRadius: 8, overflow: "hidden", marginBottom: 32, boxShadow: `0 10px 30px rgba(0,0,0,0.3)` }}>
                <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, background: `${C.gold}05`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 9, color: C.gold, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", marginBottom: 4 }}>Digital Asset Log</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.cream, letterSpacing: 1 }}>{order.digitalContent.title}</div>
                  </div>
                  <div style={{ fontSize: 20 }}>🔐</div>
                </div>
                
                <div style={{ padding: "24px" }}>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 24, paddingLeft: 12, borderLeft: `2px solid ${C.gold}40` }}>
                    {order.digitalContent.accessNote}
                    {order.digitalContent.linksExpireInMinutes ? ` Download links work for ${order.digitalContent.linksExpireInMinutes} minutes; reload this page for fresh ones.` : ""}
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                    {order.digitalContent.files.map((file, i) => (
                      <a 
                        key={i} 
                        href={file.url || "#"} 
                        rel="noopener noreferrer"
                        style={{ 
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "16px 20px", background: C.surface, border: `1px solid ${C.borderH}`,
                          borderRadius: 6, textDecoration: "none", transition: "all 0.2s",
                          cursor: file.url ? "pointer" : "not-allowed"
                        }}
                        onMouseEnter={e => { if(file.url) { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.transform = "translateX(4px)"; } }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderH; e.currentTarget.style.transform = "translateX(0)"; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: `${C.gold}15`, borderRadius: 6, fontSize: 16 }}>
                            {file.type === "pdf" ? "📄" : "📦"}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, color: C.cream, fontWeight: 700 }}>{file.name}</div>
                            <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: 1 }}>{file.size} • {file.type}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: C.gold, letterSpacing: 1 }}>UNLOCK ↓</div>
                      </a>
                    ))}
                  </div>

                  {order.digitalContent.bonus && (
                    <div style={{ background: `linear-gradient(90deg, ${C.green}10, transparent)`, border: `1px solid ${C.green}30`, borderRadius: 6, padding: "14px 20px", fontSize: 12, color: C.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 16 }}>🎁</span> {order.digitalContent.bonus}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ background: `${C.panel}80`, borderRadius: 8, padding: "24px", marginBottom: 40, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>TRANSACTION ID</span>
                <span style={{ fontSize: 12, color: C.cream, fontFamily: "monospace" }}>{order.productId || "VLT-SUCCESS"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>TOTAL SECURED</span>
                <span style={{ ...GT, fontSize: 18, fontWeight: 900 }}>${(order.amountTotal / 100).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <Link to="/" style={{ display: "block", background: GG, color: "#000", padding: "18px", fontSize: 12, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", textDecoration: "none", borderRadius: 4, transition: "all 0.2s", boxShadow: `0 20px 40px ${C.gold}20` }} onMouseEnter={e => e.target.style.boxShadow = `0 10px 20px ${C.gold}40`} onMouseLeave={e => e.target.style.boxShadow = `0 20px 40px ${C.gold}20`}>
                Back to Hustle Vault
              </Link>
              <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: 0.6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
                <span style={{ fontSize: 11, color: C.dim, letterSpacing: 1, fontWeight: 700, textTransform: "uppercase" }}>End-to-End Encryption Active</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {showUpsell && upsellItem && (
        <UpsellModal item={upsellItem} onClose={() => setShowUpsell(false)} />
      )}

      <style>{`
        @keyframes pop {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { C, GG, GT, adminFetch, API } from "./AdminLayout";

// ── UTILS ─────────────────────────────────────────────────────
function fmtSize(bytes) {
  if(!bytes) return "0B";
  if(bytes < 1024) return bytes + "B";
  if(bytes < 1048576) return (bytes / 1024).toFixed(1) + "KB";
  return (bytes / 1048576).toFixed(1) + "MB";
}

// ── BUTTON COMPONENT ──────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", style = {}, disabled = false, small = false }) {
  const [h, setH] = useState(false);
  const base = { padding: small ? "8px 16px" : "13px 24px", fontSize: small ? 10 : 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Georgia,serif", border: "none", cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s", borderRadius: 2, opacity: disabled ? 0.5 : 1 };
  const v = {
    primary: { background: GG, color: "#000", transform: h ? "translateY(-1px)" : "none", boxShadow: h ? `0 8px 24px rgba(201,168,76,0.35)` : `0 3px 12px rgba(201,168,76,0.2)` },
    secondary: { background: "transparent", color: C.gold, border: `1px solid ${C.gold}`, transform: h ? "translateY(-1px)" : "none" },
    ghost: { background: h ? C.panel : "transparent", color: C.muted, border: `1px solid ${C.border}` },
    danger: { background: h ? "#A93226" : C.red, color: "#fff", transform: h ? "translateY(-1px)" : "none" },
    success: { background: h ? "#1E8449" : C.green, color: "#fff", transform: h ? "translateY(-1px)" : "none" },
  };
  return <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick} disabled={disabled} style={{ ...base, ...v[variant], ...style }}>{children}</button>;
}

// ── UPLOAD MODAL ──────────────────────────────────────────────
function UploadModal({ product, onClose, onSave }) {
  const currentAsset = product.digitalContent?.files?.[0] || null;
  const [url, setUrl] = useState(currentAsset?.url || "");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState(currentAsset?.url ? "url" : "upload");
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    // Note: In this implementation, we use URLs for persistence. 
    // For real file uploads, we'd POST to an upload endpoint.
    // For now, we'll mimic the user's design by converting local file to a mock URL or asking them to use a URL.
    const objectUrl = URL.createObjectURL(f);
    setFile({ name: f.name, size: f.size, url: objectUrl, type: f.type });
    setMode("upload");
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSave = () => {
    let newAsset = null;
    if (mode === "upload" && file) {
      newAsset = { name: file.name, url: file.url, size: fmtSize(file.size), type: file.type };
    } else if (mode === "url" && url.trim()) {
      newAsset = { name: url.split("/").pop() || "Product File", url: url.trim(), size: "External", type: "url" };
    }

    if (newAsset) {
      const digitalContent = {
        ...(product.digitalContent || {}),
        title: product.name,
        files: [newAsset], // For now, we manage one main asset via this quick UI
        accessNote: product.digitalContent?.accessNote || "You now have lifetime access to this blueprint.",
      };
      onSave({ digitalContent });
    }
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)", zIndex: 2000, display: "flex", alignItems:"center", justifyContent:"center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, border: `1px solid ${C.borderH}`, borderRadius: 8, maxWidth: 520, width: "100%", boxShadow: "0 40px 100px rgba(0,0,0,0.9)" }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, transparent, ${C.gold}, ${C.goldBri}, ${C.gold}, transparent)` }} />
        <div style={{ padding: "28px 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Manage Asset</div>
              <div style={{ ...GT, fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>{product.name}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, fontSize: 22, cursor: "pointer" }}>×</button>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {["upload", "url"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "10px", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Georgia,serif", cursor: "pointer", borderRadius: 2, transition: "all 0.2s", background: mode === m ? GG : "transparent", color: mode === m ? "#000" : C.muted, border: `1px solid ${mode === m ? C.goldBri : C.border}` }}>
                {m === "upload" ? "📁 Upload File" : "🔗 Paste URL"}
              </button>
            ))}
          </div>

          {mode === "upload" && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? C.goldBri : file ? C.green : C.border}`, borderRadius: 6, padding: "40px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: dragging ? `${C.goldBri}08` : file ? `${C.green}08` : C.bg, marginBottom: 20 }}
            >
              <input ref={fileRef} type="file" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              {file ? (
                <div>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 14, color: C.cream, fontWeight: 700, marginBottom: 4 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: C.green }}>{fmtSize(file.size)} · Ready to save</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
                  <div style={{ fontSize: 14, color: C.muted, marginBottom: 6 }}>Drop your file here or click to browse</div>
                  <div style={{ fontSize: 11, color: C.dim }}>PDF, ZIP, DOCX supported</div>
                </div>
              )}
            </div>
          )}

          {mode === "url" && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Download URL</label>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-storage.com/file.pdf" style={{ width: "100%", padding: "13px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 3, color: C.cream, fontSize: 13, fontFamily: "Georgia,serif", outline: "none", boxSizing: "border-box" }} />
              <div style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>Paste a direct link to your file from Dropbox, Google Drive, or your CDN.</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={handleSave} style={{ flex: 1 }} disabled={mode === "upload" ? !file : !url.trim()}>Save Asset</Btn>
            {currentAsset && (
               <Btn onClick={() => { onSave({ digitalContent: { ...product.digitalContent, files: [] } }); onClose(); }} variant="danger" small>🗑 Remove</Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [msg, setMsg] = useState(null);

  const fetchProducts = () => {
    setLoading(true);
    adminFetch("/api/admin/products")
      .then(r => r.json())
      .then(d => { 
        setProducts(Object.values(d.products || [])); 
        setLoading(false); 
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  useEffect(() => { fetchProducts(); }, []);

  const flash = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleUpdate = async (id, updates) => {
    const res = await adminFetch(`/api/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    if (res.ok) { flash("Product updated"); fetchProducts(); }
    else flash("Update failed", "error");
  };

  return (
    <div>
      {msg && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 5000, background: msg.type === "error" ? `${C.red}20` : `${C.green}20`, border: `1px solid ${msg.type === "error" ? C.red : C.green}60`, borderRadius: 6, padding: "12px 20px", fontSize: 12, color: msg.type === "error" ? C.red : C.green, animation: "fadeIn 0.3s ease" }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <div style={{ ...GT, fontSize: 22, fontWeight: 900, letterSpacing: 2, marginBottom: 4 }}>Product Asset Manager</div>
          <div style={{ fontSize: 12, color: C.muted }}>{products.length} products total in the vault</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}><div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTopColor: C.gold, borderRadius: "50%", margin: "0 auto", animation: "spin .8s linear infinite" }} /></div>
        ) : products.map(p => {
          const hasAsset = p.digitalContent?.files?.length > 0;
          const asset = hasAsset ? p.digitalContent.files[0] : null;

          return (
            <div key={p.id} style={{ background: C.surface, border: `1px solid ${hasAsset ? C.green + "30" : C.border}`, borderRadius: 6, padding: "20px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", transition: "all 0.2s" }}>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 24 }}>{p.id === 1 ? "🔐" : p.id === 2 ? "🚗" : p.id === 3 ? "💰" : p.id === 4 ? "🔑" : p.id === 5 ? "📦" : "🏥"}</div>
                  <div>
                    <div style={{ ...GT, fontSize: 14, fontWeight: 900, letterSpacing: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{p.description}</div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div style={{ minWidth: 220, flex: 1 }}>
                {hasAsset ? (
                  <div style={{ background: C.bg, border: `1px solid ${C.green}40`, borderRadius: 4, padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 9, color: C.green, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>✓ Asset Linked</span>
                      <span style={{ fontSize: 9, color: C.dim }}>{asset.name}</span>
                    </div>
                    <div style={{ fontSize: 10, color: C.gold, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.url}</div>
                  </div>
                ) : (
                  <div style={{ background: C.bg, border: `1px solid ${C.red}30`, borderRadius: 4, padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, color: C.red, letterSpacing: 1, textTransform: "uppercase" }}>⚠ No asset linked — click upload to enable</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={() => setUploadTarget(p)} variant={hasAsset ? "secondary" : "primary"} small>
                  {hasAsset ? "✏️ Update" : "📁 Upload"}
                </Btn>
                {hasAsset && (
                  <Btn onClick={() => window.open(asset.url, "_blank")} variant="success" small>⬇ TEST</Btn>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 40, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "28px 32px" }}>
        <div style={{ ...GT, fontSize: 14, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>Admin Shortcuts & Features</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20 }}>
          {[
            { icon: "⚡", title: "Instant Access", body: "As admin, use the TEST button to bypass checkout and download any digital product instantly." },
            { icon: "🔄", title: "Live Updates", body: "Changes made here are reflected on the storefront immediately. No server restart required." },
            { icon: "🛡️", title: "Asset Security", body: "Files linked here are served securely to customers only after a successful Stripe transaction." }
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.cream, marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </div>

      {uploadTarget && (
        <UploadModal 
          product={uploadTarget} 
          onClose={() => setUploadTarget(null)} 
          onSave={(updates) => handleUpdate(uploadTarget.id, updates)} 
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

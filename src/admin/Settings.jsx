import { useState, useEffect } from "react";
import { C, GG, GT, adminFetch } from "./AdminLayout";

// ── BUTTON COMPONENT ──────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", style = {}, disabled = false, small = false, loading = false }) {
  const [h, setH] = useState(false);
  const base = { padding: small ? "10px 18px" : "14px 28px", fontSize: small ? 10 : 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter, sans-serif", border: "none", cursor: (disabled || loading) ? "not-allowed" : "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", borderRadius: 4, opacity: (disabled || loading) ? 0.6 : 1, position: "relative", overflow: "hidden" };
  const v = {
    primary: { background: GG, color: "#000", boxShadow: h ? `0 12px 32px ${C.gold}40` : `0 4px 12px ${C.gold}20`, transform: h ? "translateY(-1px)" : "none" },
    secondary: { background: "transparent", color: C.goldBri, border: `1px solid ${C.gold}60`, transform: h ? "translateY(-1px)" : "none" },
    ghost: { background: h ? `${C.panel}` : "transparent", color: C.muted, border: `1px solid ${C.border}` },
  };
  return (
    <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick} disabled={disabled || loading} style={{ ...base, ...v[variant], ...style }}>
      {loading ? "Processing..." : children}
    </button>
  );
}

export default function Settings() {
  const [passForm, setPassForm] = useState({ current: "", new: "", confirm: "" });
  const [passMsg, setPassMsg] = useState(null);
  const [passLoading, setPassLoading] = useState(false);

  // Stripe state
  const [stripeStatus, setStripeStatus] = useState(null);
  const [stripeForm, setStripeForm] = useState({ secretKey: "", publishableKey: "", webhookSecret: "" });
  const [stripeMsg, setStripeMsg] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    adminFetch("/api/admin/settings/stripe")
      .then((r) => r.json())
      .then((d) => setStripeStatus(d))
      .catch(() => {});
  }, []);

  const handlePasswordChange = async () => {
    if (passForm.new !== passForm.confirm) {
      setPassMsg({ text: "New passwords don't match", type: "error" });
      return;
    }
    setPassLoading(true);
    try {
      const res = await adminFetch("/api/admin/settings/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: passForm.current, newPassword: passForm.new }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPassMsg({ text: "Password updated successfully", type: "success" });
      setPassForm({ current: "", new: "", confirm: "" });
    } catch (err) {
      setPassMsg({ text: err.message, type: "error" });
    } finally {
      setPassLoading(false);
    }
  };

  const handleStripeSave = async () => {
    if (!stripeForm.secretKey) {
      setStripeMsg({ text: "Secret key is required for integration", type: "error" });
      return;
    }
    setStripeLoading(true);
    try {
      const res = await adminFetch("/api/admin/settings/stripe", {
        method: "PUT",
        body: JSON.stringify(stripeForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStripeMsg({ text: "Stripe configuration synchronized", type: "success" });
      setStripeForm({ secretKey: "", publishableKey: "", webhookSecret: "" });
      setShowKeys(false);
      const statusRes = await adminFetch("/api/admin/settings/stripe");
      setStripeStatus(await statusRes.json());
    } catch (err) {
      setStripeMsg({ text: err.message, type: "error" });
    } finally {
      setStripeLoading(false);
    }
  };

  const inp = {
    width: "100%", padding: "14px 16px", background: C.bg,
    border: `1px solid ${C.border}`, borderRadius: 4, color: C.cream,
    fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };
  const lbl = { fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 8, display: "block" };

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <div style={{ ...GT, fontSize: 26, fontWeight: 900, letterSpacing: 3, marginBottom: 8 }}>System Config</div>
        <div style={{ fontSize: 13, color: C.muted }}>Manage payment gateways and security protocols</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>

        {/* Stripe Integration */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", gridColumn: "1 / -1" }}>
          <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.panel }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>💳</span>
              <div style={{ fontSize: 13, fontWeight: 900, color: C.cream, letterSpacing: 2, textTransform: "uppercase" }}>Stripe Secure Gateway</div>
            </div>
            {stripeStatus && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 20px", borderRadius: 100, fontSize: 10, fontWeight: 900, letterSpacing: 2,
                background: stripeStatus.active ? `${C.green}15` : `${C.red}15`,
                color: stripeStatus.active ? C.green : C.red,
                border: `1px solid ${stripeStatus.active ? C.green : C.red}40`,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: stripeStatus.active ? C.green : C.red, boxShadow: `0 0 10px ${stripeStatus.active ? C.green : C.red}` }} />
                {stripeStatus.active ? `${stripeStatus.mode?.toUpperCase()} MODE ACTIVE` : "CONNECTION OFFLINE"}
              </div>
            )}
          </div>
          <div style={{ padding: "32px" }}>
            {stripeMsg && (
              <div style={{ background: stripeMsg.type === "error" ? `${C.red}15` : `${C.green}15`, border: `1px solid ${stripeMsg.type === "error" ? C.red : C.green}40`, borderRadius: 4, padding: "16px 20px", marginBottom: 24, fontSize: 13, color: stripeMsg.type === "error" ? C.red : C.green }}>
                {stripeMsg.text}
              </div>
            )}

            {!showKeys ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {stripeStatus?.active && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    {[
                      { label: "Publishable Key", value: stripeStatus.publishableKey },
                      { label: "Secret Key", value: "••••••••••••••••" },
                      { label: "Endpoint Secret", value: stripeStatus.webhookSecret || "Not Configured" }
                    ].map((k, i) => (
                      <div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px 20px" }}>
                        <div style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{k.label}</div>
                        <div style={{ fontSize: 12, color: C.goldBri, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                <Btn onClick={() => setShowKeys(true)} variant={stripeStatus?.active ? "ghost" : "primary"}>
                  {stripeStatus?.active ? "Modify Parameters" : "Synchronize Stripe Account"}
                </Btn>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={lbl}>Secret Key (Live or Test)</label>
                  <input style={inp} type="password" placeholder="sk_..." value={stripeForm.secretKey} onChange={e => setStripeForm({...stripeForm, secretKey: e.target.value})} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div>
                    <label style={lbl}>Publishable Key</label>
                    <input style={inp} placeholder="pk_..." value={stripeForm.publishableKey} onChange={e => setStripeForm({...stripeForm, publishableKey: e.target.value})} />
                  </div>
                  <div>
                    <label style={lbl}>Webhook Secret (Optional)</label>
                    <input style={inp} placeholder="whsec_..." value={stripeForm.webhookSecret} onChange={e => setStripeForm({...stripeForm, webhookSecret: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                  <Btn onClick={handleStripeSave} loading={stripeLoading}>Confirm Activation</Btn>
                  <Btn onClick={() => setShowKeys(false)} variant="ghost">Cancel</Btn>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security / Password */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, background: C.panel }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: C.gold, letterSpacing: 2, textTransform: "uppercase" }}>🔐 Terminal Security</div>
          </div>
          <div style={{ padding: "32px" }}>
            {passMsg && (
              <div style={{ background: passMsg.type === "error" ? `${C.red}15` : `${C.green}15`, border: `1px solid ${passMsg.type === "error" ? C.red : C.green}40`, borderRadius: 4, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: passMsg.type === "error" ? C.red : C.green }}>
                {passMsg.text}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={lbl}>Access Token (Current)</label>
                <input style={inp} type="password" value={passForm.current} onChange={e => setPassForm({...passForm, current: e.target.value})} />
              </div>
              <div>
                <label style={lbl}>New Credentials</label>
                <input style={inp} type="password" placeholder="Min 6 characters" value={passForm.new} onChange={e => setPassForm({...passForm, new: e.target.value})} />
              </div>
              <div>
                <label style={lbl}>Confirm Credentials</label>
                <input style={inp} type="password" value={passForm.confirm} onChange={e => setPassForm({...passForm, confirm: e.target.value})} />
              </div>
              <Btn onClick={handlePasswordChange} loading={passLoading} style={{ marginTop: 8 }}>Update Authorization</Btn>
            </div>
          </div>
        </div>

        {/* Usage Tier */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, background: C.panel }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: C.gold, letterSpacing: 2, textTransform: "uppercase" }}>💠 Usage Parameters</div>
          </div>
          <div style={{ padding: "32px", textAlign: "center" }}>
            <div style={{ ...GT, fontSize: 40, fontWeight: 900, letterSpacing: 6, marginBottom: 12 }}>∞</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: C.goldBri, letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>Unlimited Forever Tier</div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.8, marginBottom: 24 }}>
              Your Hustle Vault terminal is provisioned with unrestricted bandwidth and storage capacity. Deploy unlimited assets and manage global sales with zero latency or platform fees.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {["No Fees", "Global Delivery", "Infinite Bandwidth", "Full Ownership"].map((x, i) => (
                <div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, padding: "10px", borderRadius: 4, fontSize: 10, color: C.dim, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{x}</div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

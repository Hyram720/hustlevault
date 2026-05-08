import { useState } from "react";
import { C, GG, GT } from "./AdminLayout";

export default function LivePreview() {
  const [device, setDevice] = useState("desktop");
  const [refreshKey, setRefreshKey] = useState(0);
  const siteUrl = "/";

  const devices = {
    desktop: { width: "100%", height: "100%" },
    tablet: { width: 768, height: "100%" },
    mobile: { width: 390, height: "100%" },
  };

  const d = devices[device];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 104px)" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
      }}>
        <div>
          <div style={{ ...GT, fontSize: 22, fontWeight: 900, letterSpacing: 2, marginBottom: 4 }}>Live Preview</div>
          <div style={{ fontSize: 12, color: C.muted }}>Interact with your site without leaving admin</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Device toggles */}
          {[
            { key: "desktop", icon: "🖥️", label: "Desktop" },
            { key: "tablet", icon: "📱", label: "Tablet" },
            { key: "mobile", icon: "📲", label: "Mobile" },
          ].map((d) => (
            <button
              key={d.key}
              onClick={() => setDevice(d.key)}
              style={{
                background: device === d.key ? `${C.gold}20` : "transparent",
                border: `1px solid ${device === d.key ? C.gold : C.border}`,
                borderRadius: 4, padding: "7px 14px", cursor: "pointer",
                fontSize: 11, color: device === d.key ? C.gold : C.muted,
                fontFamily: "Georgia,serif", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span>{d.icon}</span> {d.label}
            </button>
          ))}

          {/* Refresh */}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            style={{
              background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4,
              padding: "7px 14px", cursor: "pointer", fontSize: 11, color: C.muted,
              fontFamily: "Georgia,serif", marginLeft: 8,
            }}
          >
            🔄 Refresh
          </button>

          {/* Open in new tab */}
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: GG, border: "none", borderRadius: 4, padding: "8px 16px",
              color: "#000", fontSize: 11, fontWeight: 700, letterSpacing: 2,
              textTransform: "uppercase", fontFamily: "Georgia,serif", textDecoration: "none",
            }}
          >
            Open Full ↗
          </a>
        </div>
      </div>

      {/* Preview Frame */}
      <div style={{
        flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
        overflow: "hidden", display: "flex", justifyContent: "center",
      }}>
        <div style={{
          width: typeof d.width === "number" ? d.width : "100%",
          height: "100%",
          transition: "width 0.3s ease",
          borderLeft: device !== "desktop" ? `1px solid ${C.border}` : "none",
          borderRight: device !== "desktop" ? `1px solid ${C.border}` : "none",
        }}>
          <iframe
            key={refreshKey}
            src={siteUrl}
            style={{
              width: "100%", height: "100%", border: "none",
              background: C.bg, borderRadius: device !== "desktop" ? 0 : 8,
            }}
            title="Hustle Vault Live Preview"
          />
        </div>
      </div>
    </div>
  );
}

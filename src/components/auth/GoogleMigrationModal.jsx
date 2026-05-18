import React from "react";
import { useNavigate } from "react-router-dom";

export default function GoogleMigrationModal({ onDismiss }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem"
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "2.5rem",
          maxWidth: "460px",
          width: "100%",
          boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
          position: "relative"
        }}
      >
        {/* Icon */}
        <div style={{
          width: 56, height: 56,
          background: "#FFF3CD",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.6rem",
          marginBottom: "1.5rem"
        }}>
          ⚠️
        </div>

        <h2 style={{
          fontSize: "1.25rem", fontWeight: 800,
          color: "#0D0F1A", marginBottom: "0.75rem",
          lineHeight: 1.3
        }}>
          Ação necessária: Crie sua senha
        </h2>

        <p style={{
          color: "#6B7280", fontSize: "0.9rem",
          lineHeight: 1.75, marginBottom: "2rem"
        }}>
          Em breve o login com Google será desativado. Para não perder o acesso à sua conta, crie uma senha agora.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button
            onClick={() => navigate("/criar-senha")}
            style={{
              background: "#191970", color: "#fff",
              border: "none", borderRadius: "10px",
              padding: "0.875rem 1.5rem",
              fontWeight: 700, fontSize: "0.95rem",
              cursor: "pointer", width: "100%",
              transition: "background 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#111150"}
            onMouseLeave={e => e.currentTarget.style.background = "#191970"}
          >
            Criar senha agora →
          </button>

          <button
            onClick={onDismiss}
            style={{
              background: "transparent", color: "#6B7280",
              border: "1.5px solid #E5E7EB", borderRadius: "10px",
              padding: "0.875rem 1.5rem",
              fontWeight: 600, fontSize: "0.9rem",
              cursor: "pointer", width: "100%",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#9CA3AF"; e.currentTarget.style.color = "#374151"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.color = "#6B7280"; }}
          >
            Lembrar depois
          </button>
        </div>

        <p style={{
          fontSize: "0.75rem", color: "#9CA3AF",
          textAlign: "center", marginTop: "1.25rem"
        }}>
          Este aviso será exibido novamente no próximo acesso.
        </p>
      </div>
    </div>
  );
}
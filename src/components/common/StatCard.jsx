import React from "react";
import { Link } from "react-router-dom";

/**
 * StatCard — Componente reutilizável de KPI
 * Padrão editorial Juris.IA: sem border-radius, tipografia Playfair, barra colorida inferior
 *
 * Props:
 *   title        string   — Label da métrica (uppercase)
 *   value        number|string — Valor principal
 *   sub          string   — Subtexto abaixo do valor
 *   icon         LucideIcon — Ícone (opcional, não renderizado por padrão no estilo editorial)
 *   accentColor  "ink"|"ok"|"warn"|"danger"|"neutral" — Cor da barra inferior
 *   status       { label: string, ok?: bool, warn?: bool, danger?: bool } | null
 *   link         string   — Rota de navegação (wraps in Link)
 *   loading      boolean  — Skeleton state
 */
export default function StatCard({
  title,
  value,
  sub,
  accentColor = "ink",
  status = null,
  link = null,
  loading = false,
}) {
  const accent = {
    ink:     "var(--ink)",
    ok:      "var(--ok)",
    warn:    "var(--warn)",
    danger:  "var(--danger)",
    neutral: "var(--ink-5)",
  }[accentColor] || "var(--ink)";

  const inner = (
    <div
      style={{
        background: "var(--white)",
        padding: "20px 22px 18px",
        transition: "background var(--duration)",
        cursor: link ? "pointer" : "default",
        borderBottom: `2px solid ${accent}`,
        height: "100%",
      }}
      onMouseEnter={e => { if (link) e.currentTarget.style.background = "var(--ink-7)"; }}
      onMouseLeave={e => { if (link) e.currentTarget.style.background = "var(--white)"; }}
    >
      <p style={{
        fontSize: 9, fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.12em", color: "var(--ink-4)",
        margin: "0 0 12px", fontFamily: "var(--font-sans)",
      }}>
        {title}
      </p>

      {loading ? (
        <>
          <div className="skeleton" style={{ height: 36, width: "60%", marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 12, width: "80%" }} />
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 36, fontWeight: 600, lineHeight: 1,
              color: "var(--ink)", letterSpacing: "-0.04em",
            }}>
              {value ?? "—"}
            </span>
            {sub && (
              <span style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 400 }}>
                {sub}
              </span>
            )}
          </div>
          {status && (
            <p style={{
              fontSize: 10, fontWeight: 500, margin: 0,
              color: status.danger ? "var(--danger)"
                   : status.warn   ? "var(--warn)"
                   : status.ok     ? "var(--ok)"
                   : "var(--ink-4)",
            }}>
              {status.label}
            </p>
          )}
        </>
      )}
    </div>
  );

  if (link) {
    return (
      <Link to={link} style={{ textDecoration: "none", display: "block", height: "100%" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}
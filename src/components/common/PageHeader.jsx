import React from "react";

/**
 * PageHeader — Cabeçalho editorial padrão Juris.IA
 *
 * Props:
 *   title    string   — Título principal (Playfair Display)
 *   sub      string   — Subtítulo/descrição
 *   actions  ReactNode — Botões ou controles à direita
 */
export default function PageHeader({ title, sub, actions }) {
  return (
    <div style={{
      background: "var(--white)",
      borderBottom: "1px solid var(--ink-6)",
      padding: "24px 28px 20px",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap",
    }}>
      <div>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 600, fontSize: 26,
          color: "var(--ink)", letterSpacing: "-0.02em",
          lineHeight: 1.2, margin: 0,
        }}>
          {title}
        </h1>
        {sub && (
          <p style={{
            marginTop: 4, fontSize: 11,
            color: "var(--ink-4)", fontFamily: "var(--font-sans)",
          }}>
            {sub}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
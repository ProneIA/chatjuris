/**
 * SectionHeader — cabeçalho de seção dentro de um card ou página.
 */
export default function SectionHeader({ title, subtitle, actions, border = true }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: border ? "1px solid var(--border)" : "none",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div>
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              margin: "2px 0 0",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
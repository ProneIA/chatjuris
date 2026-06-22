/**
 * PageHeader — cabeçalho padrão de todas as páginas.
 */
export default function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div style={{
      background: "#FFFFFF",
      borderBottom: "1px solid var(--border)",
      padding: "20px 28px",
    }}>
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {Icon && (
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: "#F1F5F9", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon size={17} style={{ color: "#2563EB", strokeWidth: 1.75 }} />
            </div>
          )}
          <div>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: 18, fontWeight: 600,
              color: "#0F172A", letterSpacing: "-0.02em",
              lineHeight: 1.2, margin: 0,
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: 12, color: "var(--text-2)", margin: "3px 0 0", letterSpacing: "0" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
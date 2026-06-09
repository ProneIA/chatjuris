/**
 * PageHeader — cabeçalho padrão de todas as páginas.
 */
export default function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div style={{
      background: "var(--card)",
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
              width: 38, height: 38, borderRadius: "var(--r-md)",
              background: "var(--accent-light)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon size={19} style={{ color: "var(--accent)", strokeWidth: 1.75 }} />
            </div>
          )}
          <div>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: 20, fontWeight: 700,
              color: "var(--text-1)", letterSpacing: "-0.02em",
              lineHeight: 1.2, margin: 0,
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: 13, color: "var(--text-2)", margin: "3px 0 0" }}>
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
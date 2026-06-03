/**
 * PageHeader — cabeçalho padrão de todas as páginas.
 * Substitui todos os cabeçalhos customizados.
 */
export default function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div
      style={{
        background: "var(--card)",
        borderBottom: "1px solid var(--border)",
        padding: "24px 32px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {Icon && (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "var(--accent-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon
                style={{
                  width: 20,
                  height: 20,
                  color: "var(--accent)",
                  strokeWidth: 1.75,
                }}
              />
            </div>
          )}
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
                margin: 0,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  margin: "3px 0 0",
                  letterSpacing: "-0.01em",
                }}
              >
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
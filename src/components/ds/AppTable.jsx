/**
 * AppTable — tabela padrão do Design System.
 * Substitui todos os <table> inline das páginas.
 *
 * columns: [{ key, label, render?, width?, align? }]
 * rows: array de objetos
 */
export default function AppTable({ columns = [], rows = [], emptyMessage = "Nenhum registro encontrado" }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid var(--border)", background: "var(--card)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--bg)" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: "12px 16px",
                  textAlign: col.align || "left",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid var(--border)",
                  whiteSpace: "nowrap",
                  width: col.width,
                  fontFamily: "var(--font-body)",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: "48px 16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.id || i}
                style={{ transition: "background 0.12s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      color: "var(--text-primary)",
                      borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                      textAlign: col.align || "left",
                      fontFamily: "var(--font-body)",
                      whiteSpace: col.wrap ? "normal" : "nowrap",
                    }}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
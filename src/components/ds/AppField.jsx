/**
 * AppField — campo de formulário padrão do Design System.
 * Garante label + input + erro com espaçamento consistente.
 * Uso: <AppField label="Nome" required error="Campo obrigatório"><input .../></AppField>
 */
export default function AppField({
  label,
  error,
  required  = false,
  hint,
  children,
  style     = {},
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && (
        <label style={{
          fontSize:    12,
          fontWeight:  600,
          color:       "var(--text-2)",
          fontFamily:  "var(--font-body)",
          letterSpacing: "0.01em",
          lineHeight:  1.4,
          display:     "flex",
          alignItems:  "center",
          gap:         4,
        }}>
          {label}
          {required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0, lineHeight: 1.5 }}>{hint}</p>
      )}
      {error && (
        <p style={{ fontSize: 12, color: "#991b1b", margin: 0, lineHeight: 1.5 }}>{error}</p>
      )}
    </div>
  );
}
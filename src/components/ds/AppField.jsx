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
          fontSize:    13,
          fontWeight:  500,
          color:       "var(--text-primary)",
          fontFamily:  "var(--font-body)",
          lineHeight:  1.4,
        }}>
          {label}
          {required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{hint}</p>
      )}
      {error && (
        <p style={{ fontSize: 12, color: "var(--danger-text)", margin: 0, lineHeight: 1.5 }}>{error}</p>
      )}
    </div>
  );
}
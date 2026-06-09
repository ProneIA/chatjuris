/**
 * AppBadge — badge padrão do sistema.
 * variants: default | success | warning | danger | info | neutral
 */
const VARIANTS = {
  default: { background: "var(--blue-bg)",   color: "#1e40af",       border: "1px solid var(--blue-bd)" },
  info:    { background: "var(--blue-bg)",   color: "#1e40af",       border: "1px solid var(--blue-bd)" },
  success: { background: "var(--green-bg)",  color: "#166534",       border: "1px solid var(--green-bd)" },
  warning: { background: "var(--yellow-bg)", color: "#854d0e",       border: "1px solid var(--yellow-bd)" },
  danger:  { background: "var(--red-bg)",    color: "#991b1b",       border: "1px solid var(--red-bd)" },
  neutral: { background: "var(--surface)",   color: "var(--text-2)", border: "1px solid var(--border)" },
};

export default function AppBadge({ children, variant = "neutral", style = {} }) {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 9px", borderRadius: "var(--r-full)",
      fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap",
      letterSpacing: "0.01em",
      ...v, ...style,
    }}>
      {children}
    </span>
  );
}
/**
 * AppBadge — badge padrão do sistema.
 * variants: default | success | warning | danger | info | neutral
 */
const VARIANTS = {
  default: { background: "#EFF6FF",  color: "#1D4ED8", border: "1px solid #BFDBFE" },
  info:    { background: "#EFF6FF",  color: "#1D4ED8", border: "1px solid #BFDBFE" },
  success: { background: "#F0FDF4",  color: "#166534", border: "1px solid #86EFAC" },
  warning: { background: "#FEFCE8",  color: "#854d0e", border: "1px solid #FDE047" },
  danger:  { background: "#FEF2F2",  color: "#991b1b", border: "1px solid #FECACA" },
  neutral: { background: "#F8FAFC",  color: "#64748B", border: "1px solid #E2E8F0" },
};

export default function AppBadge({ children, variant = "neutral", style = {} }) {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 9999,
      fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
      letterSpacing: "0.01em",
      ...v, ...style,
    }}>
      {children}
    </span>
  );
}
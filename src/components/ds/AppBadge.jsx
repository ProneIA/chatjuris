/**
 * AppBadge — badge padrão do sistema.
 * variants: default | success | warning | danger | info | neutral
 */
const VARIANTS = {
  default: {
    background: "var(--info-bg)",
    color: "var(--info-text)",
    border: "1px solid var(--info-border)",
  },
  info: {
    background: "var(--info-bg)",
    color: "var(--info-text)",
    border: "1px solid var(--info-border)",
  },
  success: {
    background: "var(--success-bg)",
    color: "var(--success-text)",
    border: "1px solid var(--success-border)",
  },
  warning: {
    background: "var(--warning-bg)",
    color: "var(--warning-text)",
    border: "1px solid var(--warning-border)",
  },
  danger: {
    background: "var(--danger-bg)",
    color: "var(--danger-text)",
    border: "1px solid var(--danger-border)",
  },
  neutral: {
    background: "var(--bg)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
  },
};

export default function AppBadge({ children, variant = "neutral", style = {} }) {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
        ...v,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
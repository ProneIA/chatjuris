import { Loader2 } from "lucide-react";

/**
 * AppButton — botão padrão do Design System.
 * variant: primary | secondary | ghost | danger
 * size: sm | md | lg
 */
const VARIANTS = {
  primary: {
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    "--hover-bg": "var(--accent-hover)",
  },
  secondary: {
    background: "var(--card)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
    "--hover-bg": "var(--bg)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "none",
    "--hover-bg": "var(--bg)",
  },
  danger: {
    background: "var(--danger-bg)",
    color: "var(--danger-text)",
    border: "1px solid var(--danger-border)",
    "--hover-bg": "var(--danger-bg)",
  },
};

const SIZES = {
  sm: { padding: "6px 12px", fontSize: 12, height: 32 },
  md: { padding: "8px 16px", fontSize: 13, height: 38 },
  lg: { padding: "10px 20px", fontSize: 14, height: 44 },
};

export default function AppButton({
  children,
  variant   = "secondary",
  size      = "md",
  loading   = false,
  icon: Icon,
  onClick,
  disabled,
  type      = "button",
  className = "",
  style     = {},
}) {
  const v = VARIANTS[variant] || VARIANTS.secondary;
  const s = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            6,
        borderRadius:   "var(--radius-btn)",
        fontFamily:     "var(--font-body)",
        fontWeight:     500,
        letterSpacing:  "-0.01em",
        whiteSpace:     "nowrap",
        cursor:         disabled || loading ? "not-allowed" : "pointer",
        opacity:        disabled || loading ? 0.55 : 1,
        transition:     "background 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        boxShadow:      "none",
        outline:        "none",
        ...v,
        ...s,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {loading
        ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
        : Icon && <Icon style={{ width: 14, height: 14 }} />
      }
      {children}
    </button>
  );
}
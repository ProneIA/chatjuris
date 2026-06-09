import { Loader2 } from "lucide-react";

/**
 * AppButton — botão padrão do Design System.
 * variant: primary | secondary | ghost | danger
 * size: sm | md | lg
 */
const VARIANTS = {
  primary:   { background: "var(--accent)",   color: "#fff",           border: "none",                         boxShadow: "0 1px 2px rgba(0,0,0,.12)" },
  secondary: { background: "var(--card)",     color: "var(--text-1)",  border: "1px solid var(--border-2)",    boxShadow: "var(--sh-xs)" },
  ghost:     { background: "transparent",     color: "var(--text-2)",  border: "none",                         boxShadow: "none" },
  danger:    { background: "var(--red-bg)",   color: "#991b1b",        border: "1px solid var(--red-bd)",      boxShadow: "none" },
};

const HOVER = {
  primary:   { background: "var(--accent-hover)", boxShadow: "var(--sh-md)", transform: "translateY(-1px)" },
  secondary: { background: "var(--surface)",      boxShadow: "var(--sh-sm)", transform: "none" },
  ghost:     { background: "var(--surface)",      boxShadow: "none",         transform: "none" },
  danger:    { background: "#fee2e2",             boxShadow: "none",         transform: "none" },
};

const SIZES = {
  sm: { padding: "6px 12px", fontSize: 12, minHeight: 30 },
  md: { padding: "8px 16px", fontSize: 13, minHeight: 36 },
  lg: { padding: "10px 20px",fontSize: 14, minHeight: 42 },
};

export default function AppButton({ children, variant = "secondary", size = "md", loading = false, icon: Icon, onClick, disabled, type = "button", className = "", style = {} }) {
  const v = VARIANTS[variant] || VARIANTS.secondary;
  const h = HOVER[variant]    || HOVER.secondary;
  const s = SIZES[size]       || SIZES.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        gap: 6, borderRadius: "var(--r-md)",
        fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.55 : 1,
        transition: "all .15s var(--ease)",
        outline: "none",
        ...v, ...s, ...style,
      }}
      onMouseEnter={e => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, h);
        }
      }}
      onMouseLeave={e => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = v.background;
          e.currentTarget.style.boxShadow  = v.boxShadow || "none";
          e.currentTarget.style.transform  = "none";
        }
      }}
    >
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : Icon && <Icon size={14} />
      }
      {children}
    </button>
  );
}
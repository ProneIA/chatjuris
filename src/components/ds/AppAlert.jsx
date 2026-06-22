import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

/**
 * AppAlert — banner de alerta padrão do Design System.
 * variants: info | success | warning | danger
 */
const CONFIG = {
  info:    { bg: "#EFF6FF",  border: "#BFDBFE", accent: "#2563EB", icon: Info },
  success: { bg: "#F0FDF4",  border: "#86EFAC", accent: "#15803D", icon: CheckCircle2 },
  warning: { bg: "#FEFCE8",  border: "#FDE047", accent: "#CA8A04", icon: AlertTriangle },
  danger:  { bg: "#FEF2F2",  border: "#FECACA", accent: "#B91C1C", icon: AlertCircle },
};

export default function AppAlert({ variant = "info", message, children }) {
  const c = CONFIG[variant] || CONFIG.info;
  const Icon = c.icon;
  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.accent}`,
        borderRadius: 8,
        padding: "11px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <Icon style={{ width: 15, height: 15, color: c.accent, flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontSize: 12.5, color: "#0F172A", lineHeight: 1.6, flex: 1 }}>
        {message || children}
      </div>
    </div>
  );
}
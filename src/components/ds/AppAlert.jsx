import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

/**
 * AppAlert — banner de alerta padrão do Design System.
 * variants: info | success | warning | danger
 */
const CONFIG = {
  info:    { bg: "var(--info-bg)",    border: "var(--info-border)",    accent: "var(--info)",    icon: Info },
  success: { bg: "var(--success-bg)", border: "var(--success-border)", accent: "var(--success)", icon: CheckCircle2 },
  warning: { bg: "var(--warning-bg)", border: "var(--warning-border)", accent: "var(--warning)", icon: AlertTriangle },
  danger:  { bg: "var(--danger-bg)",  border: "var(--danger-border)",  accent: "var(--danger)",  icon: AlertCircle },
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
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <Icon style={{ width: 16, height: 16, color: c.accent, flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, flex: 1 }}>
        {message || children}
      </div>
    </div>
  );
}
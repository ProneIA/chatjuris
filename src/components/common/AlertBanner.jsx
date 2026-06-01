import React from "react";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

/**
 * AlertBanner — Banner de alerta reutilizável Juris.IA
 * Props:
 *   variant  "warn" | "danger" | "ok" | "info"
 *   message  string
 *   onClose  () => void (opcional)
 */
export default function AlertBanner({ variant = "warn", message, onClose }) {
  const styles = {
    warn:   { bg: "var(--warn-bg)",   border: "var(--warn-border)",   accent: "var(--warn)",   textColor: "var(--ink-2)", Icon: AlertCircle },
    danger: { bg: "var(--danger-bg)", border: "var(--danger-border)", accent: "var(--danger)", textColor: "var(--ink-2)", Icon: XCircle },
    ok:     { bg: "var(--ok-bg)",     border: "var(--ok-border)",     accent: "var(--ok)",     textColor: "var(--ink-2)", Icon: CheckCircle },
    info:   { bg: "var(--ink-7)",     border: "var(--ink-5)",         accent: "var(--ink-3)",  textColor: "var(--ink-2)", Icon: Info },
  }[variant] || {};

  const { bg, border, accent, textColor, Icon } = styles;

  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderLeft: `3px solid ${accent}`,
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      borderRadius: 0,
    }}>
      <Icon style={{ width: 14, height: 14, color: accent, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: textColor, fontWeight: 600, fontFamily: "var(--font-sans)", flex: 1 }}>
        {message}
      </span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: accent, padding: 0, lineHeight: 1 }}
        >
          <XCircle style={{ width: 13, height: 13 }} />
        </button>
      )}
    </div>
  );
}
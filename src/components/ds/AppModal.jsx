import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/**
 * AppModal — modal padrão do Design System.
 * Subcomponentes: AppModal.Header, AppModal.Body, AppModal.Footer
 * size: sm(480) | md(600) | lg(760) | xl(960)
 */
const SIZES = { sm: 480, md: 600, lg: 760, xl: 960 };

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div style={{
      display:         "flex",
      alignItems:      "flex-start",
      justifyContent:  "space-between",
      padding:         "24px 24px 16px",
      borderBottom:    "1px solid var(--border)",
      gap:             12,
    }}>
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>{subtitle}</p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 6,
            borderRadius: 8, color: "var(--text-muted)", flexShrink: 0,
            transition: "background 0.12s ease, color 0.12s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
      )}
    </div>
  );
}

function ModalBody({ children, noPad = false }) {
  return (
    <div style={{ padding: noPad ? 0 : "20px 24px", overflowY: "auto" }}>
      {children}
    </div>
  );
}

function ModalFooter({ children }) {
  return (
    <div style={{
      display:        "flex",
      alignItems:     "center",
      justifyContent: "flex-end",
      gap:            8,
      padding:        "16px 24px",
      borderTop:      "1px solid var(--border)",
    }}>
      {children}
    </div>
  );
}

export default function AppModal({ open, onOpenChange, size = "md", children }) {
  const maxW = SIZES[size] || SIZES.md;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          maxWidth:     maxW,
          width:        "90vw",
          borderRadius: "var(--radius-modal)",
          padding:      0,
          border:       "1px solid var(--border)",
          background:   "var(--card)",
          boxShadow:    "0 24px 48px rgba(0,0,0,0.12)",
          overflow:     "hidden",
          gap:          0,
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

AppModal.Header = ModalHeader;
AppModal.Body   = ModalBody;
AppModal.Footer = ModalFooter;
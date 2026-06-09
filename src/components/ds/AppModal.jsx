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
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", gap: 12,
    }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: 0, letterSpacing: "-0.02em" }}>
          {title}
        </h2>
        {subtitle && <p style={{ fontSize: 13, color: "var(--text-2)", margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "var(--text-3)", flexShrink: 0, transition: "background .12s, color .12s", minHeight: "unset", minWidth: "unset" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg)"; e.currentTarget.style.color = "var(--text-1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-3)"; }}
        >
          <X size={16} />
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

export default function AppModal({ open, onOpenChange, size = "md", children }) {
  const maxW = SIZES[size] || SIZES.md;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{
        maxWidth: maxW, width: "90vw",
        borderRadius: "var(--r-lg)", padding: 0,
        border: "1px solid var(--border)",
        background: "var(--card)",
        boxShadow: "var(--sh-xl)",
        overflow: "hidden", gap: 0,
      }}>
        {children}
      </DialogContent>
    </Dialog>
  );
}

AppModal.Header = ModalHeader;
AppModal.Body   = ModalBody;
AppModal.Footer = ModalFooter;
/**
 * EmptyState — estado vazio padrão do sistema.
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="anim-scale-in" style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "56px 24px", textAlign: "center",
    }}>
      {Icon && (
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "var(--accent-light)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16,
        }}>
          <Icon size={26} style={{ color: "var(--accent)", strokeWidth: 1.5 }} />
        </div>
      )}
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: 13.5, color: "var(--text-2)", margin: "0 0 20px", maxWidth: 280, lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
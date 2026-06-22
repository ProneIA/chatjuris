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
          width: 44, height: 44, borderRadius: 8,
          background: "#F8FAFC", border: "1px solid #E2E8F0",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 14,
        }}>
          <Icon size={20} style={{ color: "#94A3B8", strokeWidth: 1.75 }} />
        </div>
      )}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px", maxWidth: 280, lineHeight: 1.55 }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
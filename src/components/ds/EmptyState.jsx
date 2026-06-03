/**
 * EmptyState — estado vazio padrão do sistema.
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      {Icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Icon
            style={{
              width: 24,
              height: 24,
              color: "var(--text-muted)",
              strokeWidth: 1.5,
            }}
          />
        </div>
      )}
      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--text-primary)",
          margin: "0 0 6px",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </p>
      {description && (
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            margin: "0 0 20px",
            maxWidth: 320,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * StatCard — cartão de KPI.
 * Padrão único para todos os dashboards do sistema.
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "var(--accent)",
  link,
  loading = false,
}) {
  const content = (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "0 1px 2px rgba(0,0,0,.04)",
        transition: "box-shadow 0.15s ease, border-color 0.15s ease",
        cursor: link ? "pointer" : "default",
        height: "100%",
      }}
      onMouseEnter={
        link
          ? (e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.08)";
              e.currentTarget.style.borderColor = "var(--border-strong)";
            }
          : undefined
      }
      onMouseLeave={
        link
          ? (e) => {
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04)";
              e.currentTarget.style.borderColor = "var(--border)";
            }
          : undefined
      }
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        {Icon ? (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${color}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon
              style={{ width: 18, height: 18, color, strokeWidth: 1.75 }}
            />
          </div>
        ) : (
          <div />
        )}
        {link && (
          <ArrowRight
            style={{
              width: 14,
              height: 14,
              color: "var(--text-muted)",
              strokeWidth: 1.5,
            }}
          />
        )}
      </div>
      {loading ? (
        <div
          className="skeleton"
          style={{ height: 32, width: 64, marginBottom: 8, borderRadius: 8 }}
        />
      ) : (
        <p
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            lineHeight: 1,
            margin: "0 0 6px",
          }}
        >
          {value ?? "—"}
        </p>
      )}
      <p
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text-primary)",
          margin: "0 0 2px",
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </p>
      {sub && (
        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
          {sub}
        </p>
      )}
    </div>
  );

  if (link) {
    return (
      <Link to={link} style={{ textDecoration: "none", display: "block" }}>
        {content}
      </Link>
    );
  }
  return content;
}
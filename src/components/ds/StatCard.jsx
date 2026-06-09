import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * StatCard — cartão de KPI. Padrão único para todos os dashboards.
 */
export default function StatCard({ icon: Icon, label, value, sub, color = "var(--accent)", link, loading = false }) {
  const content = (
    <div
      style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", padding: "18px 20px",
        boxShadow: "var(--sh-xs)",
        transition: "box-shadow .15s, border-color .15s, transform .15s",
        cursor: link ? "pointer" : "default", height: "100%",
      }}
      onMouseEnter={link ? e => {
        e.currentTarget.style.boxShadow = "var(--sh-md)";
        e.currentTarget.style.borderColor = "var(--border-2)";
        e.currentTarget.style.transform = "translateY(-2px)";
      } : undefined}
      onMouseLeave={link ? e => {
        e.currentTarget.style.boxShadow = "var(--sh-xs)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
      } : undefined}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        {Icon ? (
          <div style={{
            width: 34, height: 34, borderRadius: "var(--r-md)",
            background: `${color}18`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon size={17} style={{ color, strokeWidth: 1.75 }} />
          </div>
        ) : <div />}
        {link && <ArrowRight size={13} style={{ color: "var(--text-3)", strokeWidth: 1.5 }} />}
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: 30, width: 64, marginBottom: 8, borderRadius: 8 }} />
      ) : (
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: 28, fontWeight: 700, color: "var(--text-1)",
          letterSpacing: "-0.03em", lineHeight: 1, margin: "0 0 5px",
        }}>
          {value ?? "—"}
        </p>
      )}
      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", margin: "0 0 2px", letterSpacing: "-0.01em" }}>
        {label}
      </p>
      {sub && <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>{sub}</p>}
    </div>
  );

  if (link) return <Link to={link} style={{ textDecoration: "none", display: "block" }}>{content}</Link>;
  return content;
}
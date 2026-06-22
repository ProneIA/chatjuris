import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * StatCard — cartão de KPI corporativo.
 */
export default function StatCard({ icon: Icon, label, value, sub, color = "#2563EB", link, loading = false }) {
  const content = (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "20px 20px 18px",
        boxShadow: "0 1px 2px rgba(15,23,42,.04)",
        transition: "box-shadow .14s ease, border-color .14s ease",
        cursor: link ? "pointer" : "default",
        height: "100%",
      }}
      onMouseEnter={link ? e => {
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(15,23,42,.07)";
        e.currentTarget.style.borderColor = "#CBD5E1";
      } : undefined}
      onMouseLeave={link ? e => {
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,.04)";
        e.currentTarget.style.borderColor = "var(--border)";
      } : undefined}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        {Icon ? (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#F8FAFC", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon size={15} style={{ color: "#64748B", strokeWidth: 1.75 }} />
          </div>
        ) : <div />}
        {link && <ArrowRight size={13} style={{ color: "var(--text-3)", strokeWidth: 1.5 }} />}
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: 28, width: 64, marginBottom: 8, borderRadius: 6 }} />
      ) : (
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: 26, fontWeight: 700, color: "#0F172A",
          letterSpacing: "-0.03em", lineHeight: 1, margin: "0 0 5px",
        }}>
          {value ?? "—"}
        </p>
      )}
      <p style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", margin: "0 0 2px", letterSpacing: "-0.01em" }}>
        {label}
      </p>
      {sub && <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>{sub}</p>}
    </div>
  );

  if (link) return <Link to={link} style={{ textDecoration: "none", display: "block" }}>{content}</Link>;
  return content;
}
import { Loader2 } from "lucide-react";

/**
 * LoadingState — estado de carregamento padrão do sistema.
 */
export function LoadingSpinner({ size = 24, style = {} }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px", ...style }}>
      <div style={{
        width: size, height: size,
        border: "2.5px solid var(--border)",
        borderTopColor: "var(--accent)",
        borderRadius: "50%",
        animation: "spin .7s linear infinite",
      }} />
    </div>
  );
}

export function SkeletonRows({ rows = 4, height = 52 }) {
  return (
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div className="skeleton" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: "50%" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ height: 13, width: `${60 + i * 8}%` }} />
            <div className="skeleton" style={{ height: 11, width: "40%" }} />
          </div>
          <div className="skeleton" style={{ height: 22, width: 60, borderRadius: 99 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ cols = 4, rows = 1, height = 120 }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 16, padding: "24px 28px",
    }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height, borderRadius: "var(--r-lg)" }} />
      ))}
    </div>
  );
}
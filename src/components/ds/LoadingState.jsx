import { Loader2 } from "lucide-react";

/**
 * LoadingState — estado de carregamento padrão.
 * variants: spinner | skeleton
 */
export function LoadingSpinner({ size = 24, style = {} }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        ...style,
      }}
    >
      <Loader2
        style={{
          width: size,
          height: size,
          color: "var(--text-muted)",
          animation: "spin 1s linear infinite",
        }}
      />
    </div>
  );
}

export function SkeletonRows({ rows = 4, height = 52 }) {
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height, borderRadius: 10 }}
        />
      ))}
    </div>
  );
}

export function SkeletonGrid({ cols = 4, rows = 1, height = 120 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 16,
        padding: "24px 32px",
      }}
    >
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height, borderRadius: 16 }}
        />
      ))}
    </div>
  );
}
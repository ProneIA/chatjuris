/**
 * KPIGrid — grade de KPI cards padrão para todas as páginas.
 * Envolve StatCards em grid responsivo consistente.
 */
export default function KPIGrid({ children, cols = 4 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 16,
        padding: "24px 32px 0",
      }}
      className={`lg:grid-cols-${cols} md:grid-cols-2 grid-cols-1`}
    >
      {children}
    </div>
  );
}
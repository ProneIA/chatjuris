/**
 * KPIGrid — grade de KPI cards padrão para todas as páginas.
 */
export default function KPIGrid({ children, cols = 4 }) {
  return (
    <div
      className={`stagger lg:grid-cols-${cols} md:grid-cols-2 grid-cols-1`}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 16,
        padding: "20px 28px 0",
      }}
    >
      {children}
    </div>
  );
}
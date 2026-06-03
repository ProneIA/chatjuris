/**
 * AppPage — wrapper raiz de todas as páginas do sistema.
 * Garante bg, padding e fonte consistentes.
 */
export default function AppPage({ children, className = "" }) {
  return (
    <div
      className={className}
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </div>
  );
}
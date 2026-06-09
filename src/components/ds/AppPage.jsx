/**
 * AppPage — wrapper raiz de todas as páginas do sistema.
 */
export default function AppPage({ children, className = "" }) {
  return (
    <div
      className={`anim-fade-up ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        minHeight: "100%",
        background: "var(--bg)",
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </div>
  );
}
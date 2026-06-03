/**
 * AppContent — wrapper de conteúdo interno de página.
 * Uso: <AppContent>, <AppContent narrow>, <AppContent noPad>
 * Sempre abaixo do PageHeader.
 */
export default function AppContent({
  children,
  narrow = false,
  noPad  = false,
  style  = {},
  className = "",
}) {
  return (
    <div
      className={className}
      style={{
        padding:   noPad ? 0 : "24px 32px",
        maxWidth:  narrow ? "680px" : "1400px",
        width:     "100%",
        margin:    "0 auto",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
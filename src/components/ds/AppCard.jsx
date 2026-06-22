/**
 * AppCard — card padrão do sistema.
 */
export default function AppCard({ children, className = "", style = {}, hover = false, noPad = false, onClick }) {
  const baseStyle = {
    background: "#FFFFFF",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: noPad ? 0 : 24,
    boxShadow: "0 1px 2px rgba(15,23,42,.04)",
    transition: "box-shadow .14s ease, border-color .14s ease",
    overflow: "hidden",
    ...style,
  };

  const hoverHandlers = hover || onClick ? {
    onMouseEnter: e => {
      e.currentTarget.style.boxShadow = "0 4px 8px rgba(15,23,42,.07)";
      e.currentTarget.style.borderColor = "#CBD5E1";
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,.04)";
      e.currentTarget.style.borderColor = "var(--border)";
    },
  } : {};

  return (
    <div
      className={className}
      style={{ ...baseStyle, cursor: onClick ? "pointer" : undefined }}
      onClick={onClick}
      {...hoverHandlers}
    >
      {children}
    </div>
  );
}
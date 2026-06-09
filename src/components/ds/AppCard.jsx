/**
 * AppCard — card padrão do sistema.
 */
export default function AppCard({ children, className = "", style = {}, hover = false, noPad = false, onClick }) {
  const baseStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    padding: noPad ? 0 : 24,
    boxShadow: "var(--sh-xs)",
    transition: "box-shadow .15s, border-color .15s, transform .15s",
    overflow: "hidden",
    ...style,
  };

  const hoverHandlers = hover || onClick ? {
    onMouseEnter: e => {
      e.currentTarget.style.boxShadow = "var(--sh-md)";
      e.currentTarget.style.borderColor = "var(--border-2)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = "var(--sh-xs)";
      e.currentTarget.style.borderColor = "var(--border)";
    },
  } : {};

  return (
    <div className={className} style={{ ...baseStyle, cursor: onClick ? "pointer" : undefined }} onClick={onClick} {...hoverHandlers}>
      {children}
    </div>
  );
}
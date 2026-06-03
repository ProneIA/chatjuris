/**
 * AppCard — card padrão do sistema.
 * Fundo branco, borda #E2E8F0, radius 16px, padding 24px,
 * sombra 0 1px 2px rgba(0,0,0,.04).
 */
export default function AppCard({
  children,
  className = "",
  style = {},
  hover = false,
  noPad = false,
  onClick,
}) {
  const baseStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: noPad ? 0 : 24,
    boxShadow: "0 1px 2px rgba(0,0,0,.04)",
    transition: "box-shadow 0.15s ease, border-color 0.15s ease",
    overflow: "hidden",
    ...style,
  };

  const hoverHandlers =
    hover || onClick
      ? {
          onMouseEnter: (e) => {
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.08)";
            e.currentTarget.style.borderColor = "var(--border-strong)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04)";
            e.currentTarget.style.borderColor = "var(--border)";
          },
        }
      : {};

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
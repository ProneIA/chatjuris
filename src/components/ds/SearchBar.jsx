import { Search } from "lucide-react";

/**
 * SearchBar — barra de busca padrão do sistema.
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = "Buscar...",
  maxWidth = 440,
  style = {},
}) {
  return (
    <div style={{ position: "relative", maxWidth, width: "100%", ...style }}>
      <Search
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          width: 15,
          height: 15,
          color: "var(--text-muted)",
          pointerEvents: "none",
        }}
      />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          paddingLeft: 36,
          paddingRight: 12,
          paddingTop: 9,
          paddingBottom: 9,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          fontSize: 13,
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
          outline: "none",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--accent)";
          e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--border)";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
}
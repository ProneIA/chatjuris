import { Search, X } from "lucide-react";

/**
 * FilterBar — barra de filtros padronizada.
 * Uso: <FilterBar search={s} onSearch={fn} placeholder="...">
 *        <select>...</select>
 *      </FilterBar>
 * Props: search, onSearch, placeholder, children (selects/filters), onClear
 */
export default function FilterBar({
  search      = "",
  onSearch,
  placeholder = "Buscar...",
  children,
  onClear,
  style = {},
}) {
  const hasActiveFilters = Boolean(search || onClear);

  return (
    <div style={{
      display:       "flex",
      alignItems:    "center",
      gap:           8,
      flexWrap:      "wrap",
      background:    "var(--card)",
      border:        "1px solid var(--border)",
      borderRadius:  "var(--radius-card)",
      padding:       "12px 16px",
      ...style,
    }}>
      {/* Search */}
      <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
        <Search style={{
          position:  "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          width: 14, height: 14, color: "var(--text-muted)", pointerEvents: "none",
        }} />
        <input
          value={search}
          onChange={e => onSearch?.(e.target.value)}
          placeholder={placeholder}
          style={{
            width:        "100%",
            padding:      "9px 10px 9px 32px",
            border:       "1px solid var(--border)",
            borderRadius: "var(--radius-input)",
            fontSize:     13,
            fontFamily:   "var(--font-body)",
            color:        "var(--text-primary)",
            background:   "var(--bg)",
            outline:      "none",
            transition:   "border-color 0.15s ease, box-shadow 0.15s ease",
          }}
          onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,.12)"; }}
          onBlur={e  => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
        />
      </div>

      {/* Extra filters (selects etc) */}
      {children}

      {/* Clear button — only visible when there are filters */}
      {hasActiveFilters && onClear && (
        <button
          onClick={onClear}
          style={{
            display:     "inline-flex", alignItems: "center", gap: 4,
            padding:     "7px 12px", borderRadius: "var(--radius-btn)",
            border:      "none", background: "none", cursor: "pointer",
            fontSize:    12, fontWeight: 500, color: "var(--text-secondary)",
            fontFamily:  "var(--font-body)", transition: "background 0.12s ease, color 0.12s ease",
            whiteSpace:  "nowrap",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          <X style={{ width: 13, height: 13 }} /> Limpar
        </button>
      )}
    </div>
  );
}
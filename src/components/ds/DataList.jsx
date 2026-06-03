/**
 * DataList — lista de pares label/valor para telas de detalhe.
 * Substitui tabelas de detalhe inline.
 * Uso:
 *   <DataList>
 *     <DataList.Item label="OAB" value="SP-12345" />
 *     <DataList.Item label="Status" value={<AppBadge>Ativo</AppBadge>} />
 *   </DataList>
 */
function DataListItem({ label, value }) {
  return (
    <div style={{
      display:       "grid",
      gridTemplateColumns: "160px 1fr",
      gap:           16,
      padding:       "12px 0",
      borderBottom:  "1px solid var(--border)",
      alignItems:    "center",
    }}>
      <span style={{
        fontSize:    12,
        fontWeight:  500,
        color:       "var(--text-secondary)",
        letterSpacing: "0.01em",
        lineHeight:  1.5,
      }}>
        {label}
      </span>
      <span style={{
        fontSize:    13,
        color:       "var(--text-primary)",
        fontFamily:  "var(--font-body)",
        lineHeight:  1.5,
      }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function DataList({ children, style = {} }) {
  return (
    <div style={{ width: "100%", ...style }}>
      {children}
    </div>
  );
}

DataList.Item = DataListItem;
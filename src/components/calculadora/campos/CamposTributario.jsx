import React from "react";

const Field = ({ label, name, type = "text", value, onChange, placeholder }) => (
  <div style={{ marginBottom: "1rem" }}>
    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.3rem" }}>{label}</label>
    <input type={type} value={value || ""} onChange={e => onChange(name, e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "0.6rem 0.75rem", border: "1px solid #d1d5db", fontSize: "0.875rem", boxSizing: "border-box" }}
      onFocus={e => e.target.style.borderColor = "#185FA5"} onBlur={e => e.target.style.borderColor = "#d1d5db"} />
  </div>
);

const Select = ({ label, name, value, onChange, options }) => (
  <div style={{ marginBottom: "1rem" }}>
    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.3rem" }}>{label}</label>
    <select value={value || ""} onChange={e => onChange(name, e.target.value)}
      style={{ width: "100%", padding: "0.6rem 0.75rem", border: "1px solid #d1d5db", fontSize: "0.875rem", boxSizing: "border-box", background: "#fff" }}>
      <option value="">Selecione...</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

export default function CamposTributario({ dados, onChange }) {
  return (
    <>
      <Select label="Tipo de Tributo" name="tipoTributo" value={dados.tipoTributo} onChange={onChange} options={[
        { value: "iptu", label: "IPTU" },
        { value: "ipva", label: "IPVA" },
        { value: "iss", label: "ISS" },
        { value: "icms", label: "ICMS" },
        { value: "ir", label: "Imposto de Renda (IR)" },
        { value: "csll", label: "CSLL" },
        { value: "cofins", label: "COFINS/PIS" },
        { value: "inss", label: "Contribuições INSS" },
      ]} />
      <Field label="Valor Principal do Débito (R$)" name="valorPrincipal" type="number" value={dados.valorPrincipal} onChange={onChange} placeholder="Ex: 2000.00" />
      <Field label="Data de Vencimento" name="dataVencimento" type="date" value={dados.dataVencimento} onChange={onChange} />
      <Field label="Data de Referência do Cálculo" name="dataReferencia" type="date" value={dados.dataReferencia} onChange={onChange} />
      <div style={{ padding: "0.75rem", background: "#fef3c7", border: "1px solid #f59e0b", marginBottom: "1rem", fontSize: "0.8rem", color: "#92400e" }}>
        💡 Multa: 0,33%/dia até máx. 20% (art. 61 Lei 9.430/96) · Juros: SELIC acumulada
      </div>
    </>
  );
}
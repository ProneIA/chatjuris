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

export default function CamposImobiliario({ dados, onChange }) {
  return (
    <>
      <Select label="Tipo de Cálculo" name="tipoCalculo" value={dados.tipoCalculo} onChange={onChange} options={[
        { value: "atrasoAluguel", label: "Atraso de Aluguel" },
        { value: "rescisaoAntecipada", label: "Rescisão Antecipada" },
        { value: "revisional", label: "Revisional de Aluguel" },
        { value: "despejo", label: "Cálculo para Ação de Despejo" },
      ]} />
      <Field label="Valor do Aluguel Mensal (R$)" name="valorAluguel" type="number" value={dados.valorAluguel} onChange={onChange} placeholder="Ex: 1500.00" />
      <Field label="Data de Início do Contrato" name="dataInicioContrato" type="date" value={dados.dataInicioContrato} onChange={onChange} />
      <Field label="Meses em Atraso" name="mesesAtraso" type="number" value={dados.mesesAtraso} onChange={onChange} placeholder="Ex: 3" />
      <Select label="Índice de Reajuste" name="indiceReajuste" value={dados.indiceReajuste} onChange={onChange} options={[
        { value: "igpm", label: "IGP-M (FGV)" },
        { value: "ipca", label: "IPCA (IBGE)" },
        { value: "inpc", label: "INPC (IBGE)" },
      ]} />
      <Field label="Multa por Rescisão (n° de meses)" name="multaRescisao" type="number" value={dados.multaRescisao} onChange={onChange} placeholder="Ex: 3" />
      <Field label="Data de Referência do Cálculo" name="dataReferencia" type="date" value={dados.dataReferencia} onChange={onChange} />
    </>
  );
}
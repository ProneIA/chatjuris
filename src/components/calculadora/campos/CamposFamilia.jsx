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

export default function CamposFamilia({ dados, onChange }) {
  return (
    <>
      <Select label="Tipo de Cálculo" name="tipoCalculo" value={dados.tipoCalculo} onChange={onChange} options={[
        { value: "alimentosAtraso", label: "Alimentos em Atraso" },
        { value: "pensaoInicial", label: "Pensão Alimentícia Inicial" },
        { value: "revisional", label: "Revisional de Alimentos" },
        { value: "partilha", label: "Partilha de Bens" },
      ]} />
      <Field label="Renda Bruta do Alimentante (R$)" name="rendaAlimentante" type="number" value={dados.rendaAlimentante} onChange={onChange} placeholder="Ex: 5000.00" />
      <Field label="Percentual Acordado/Determinado (%)" name="percentualAlimentos" type="number" value={dados.percentualAlimentos} onChange={onChange} placeholder="Ex: 25" />
      <Field label="Data de Início dos Alimentos" name="dataInicio" type="date" value={dados.dataInicio} onChange={onChange} />
      <Field label="Meses em Atraso" name="mesesAtraso" type="number" value={dados.mesesAtraso} onChange={onChange} placeholder="Ex: 6" />
      <Field label="Valor Mensal da Pensão (R$)" name="valorMensalPensao" type="number" value={dados.valorMensalPensao} onChange={onChange} placeholder="Se já fixada em valor" />
      <Field label="Data de Referência do Cálculo" name="dataReferencia" type="date" value={dados.dataReferencia} onChange={onChange} />
    </>
  );
}
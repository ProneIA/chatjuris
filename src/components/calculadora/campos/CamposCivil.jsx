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

export default function CamposCivil({ dados, onChange }) {
  return (
    <>
      <Select label="Tipo de Dano" name="tipoDano" value={dados.tipoDano} onChange={onChange} options={[
        { value: "morais", label: "Danos Morais" },
        { value: "materiais", label: "Danos Materiais" },
        { value: "esteticos", label: "Danos Estéticos" },
        { value: "lucrosCessantes", label: "Lucros Cessantes" },
        { value: "perdasDanos", label: "Perdas e Danos" },
        { value: "multiplos", label: "Múltiplos (morais + materiais)" },
      ]} />
      <Field label="Valor Principal do Dano (R$)" name="valorPrincipal" type="number" value={dados.valorPrincipal} onChange={onChange} placeholder="Ex: 10000.00" />
      <Field label="Data do Evento/Fato" name="dataFato" type="date" value={dados.dataFato} onChange={onChange} />
      <Field label="Data de Referência do Cálculo" name="dataReferencia" type="date" value={dados.dataReferencia} onChange={onChange} />
      <Select label="Índice de Correção" name="indiceCorrecao" value={dados.indiceCorrecao} onChange={onChange} options={[
        { value: "ipca", label: "IPCA (padrão STJ)" },
        { value: "inpc", label: "INPC" },
        { value: "selic", label: "SELIC" },
        { value: "tr", label: "TR" },
      ]} />
      <Select label="Natureza dos Juros" name="naturezaJuros" value={dados.naturezaJuros} onChange={onChange} options={[
        { value: "atoIlicito", label: "Ato ilícito — desde o evento (Súm. 54 STJ)" },
        { value: "inadimplemento", label: "Inadimplemento contratual — desde a citação" },
      ]} />
      <Field label="Valor dos Danos Materiais Comprovados (R$)" name="danosMateriais" type="number" value={dados.danosMateriais} onChange={onChange} placeholder="Opcional" />
    </>
  );
}
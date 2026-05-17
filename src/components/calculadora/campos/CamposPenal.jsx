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

export default function CamposPenal({ dados, onChange }) {
  return (
    <>
      <Select label="Tipo de Cálculo" name="tipoCalculo" value={dados.tipoCalculo} onChange={onChange} options={[
        { value: "remicaoTrabalho", label: "Remição por Trabalho (art. 126 LEP)" },
        { value: "remicaoEstudo", label: "Remição por Estudo (art. 126 §1º LEP)" },
        { value: "progressaoRegime", label: "Progressão de Regime" },
        { value: "livramentoCondicional", label: "Livramento Condicional" },
        { value: "detracaoPena", label: "Detração da Pena (art. 42 CP)" },
      ]} />
      <Select label="Reincidência" name="reincidencia" value={dados.reincidencia} onChange={onChange} options={[
        { value: "primario", label: "Primário" },
        { value: "reincidente", label: "Reincidente" },
      ]} />
      <Select label="Crime Hediondo" name="hediondo" value={dados.hediondo} onChange={onChange} options={[
        { value: "nao", label: "Não" },
        { value: "sim", label: "Sim (Lei 8.072/90)" },
      ]} />
      <Field label="Data do Fato" name="dataFato" type="date" value={dados.dataFato} onChange={onChange} />
      <Field label="Data de Início da Pena / Prisão" name="dataInicioPena" type="date" value={dados.dataInicioPena} onChange={onChange} />
      <Field label="Pena Aplicada (meses)" name="penaMeses" type="number" value={dados.penaMeses} onChange={onChange} placeholder="Ex: 48" />
      <Field label="Dias Trabalhados (remição)" name="diasTrabalhados" type="number" value={dados.diasTrabalhados} onChange={onChange} placeholder="Dias efetivos de trabalho" />
      <Field label="Horas de Estudo (remição)" name="horasEstudo" type="number" value={dados.horasEstudo} onChange={onChange} placeholder="Total de horas estudadas" />
    </>
  );
}
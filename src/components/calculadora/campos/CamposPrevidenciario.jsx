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

export default function CamposPrevidenciario({ dados, onChange }) {
  return (
    <>
      <Field label="Data de Nascimento" name="dataNascimento" type="date" value={dados.dataNascimento} onChange={onChange} />
      <Select label="Sexo" name="sexo" value={dados.sexo} onChange={onChange} options={[
        { value: "masculino", label: "Masculino" },
        { value: "feminino", label: "Feminino" },
      ]} />
      <Select label="Tipo de Benefício" name="tipoBeneficio" value={dados.tipoBeneficio} onChange={onChange} options={[
        { value: "aposentadoriaIdade", label: "Aposentadoria por Idade" },
        { value: "aposentadoriaTempoContrib", label: "Aposentadoria por Tempo de Contribuição" },
        { value: "incapacidade", label: "Aposentadoria por Incapacidade" },
        { value: "bpc", label: "BPC/LOAS" },
        { value: "pensaoMorte", label: "Pensão por Morte" },
        { value: "revisao", label: "Revisão de Benefício" },
      ]} />
      <Field label="Data do Requerimento (DIB)" name="dataRequerimento" type="date" value={dados.dataRequerimento} onChange={onChange} />
      <Field label="Média dos Salários de Contribuição (R$)" name="mediaSalarios" type="number" value={dados.mediaSalarios} onChange={onChange} placeholder="Média dos 80% maiores" />
      <Field label="Tempo de Contribuição (meses)" name="tempoContribuicao" type="number" value={dados.tempoContribuicao} onChange={onChange} placeholder="Ex: 420" />
      <Field label="Competências em Atraso (meses)" name="competenciasAtraso" type="number" value={dados.competenciasAtraso} onChange={onChange} placeholder="Ex: 24" />
      <Field label="Benefício Atual em Revisão (R$)" name="beneficioAtual" type="number" value={dados.beneficioAtual} onChange={onChange} placeholder="Apenas se for revisão" />
    </>
  );
}
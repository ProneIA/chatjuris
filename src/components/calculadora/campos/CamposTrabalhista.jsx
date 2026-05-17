import React from "react";

const Field = ({ label, name, type = "text", value, onChange, placeholder, required, children }) => (
  <div style={{ marginBottom: "1rem" }}>
    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.3rem" }}>
      {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
    </label>
    {children || (
      <input
        type={type}
        value={value || ""}
        onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "0.6rem 0.75rem", border: "1px solid #d1d5db", fontSize: "0.875rem", boxSizing: "border-box" }}
        onFocus={e => e.target.style.borderColor = "#185FA5"}
        onBlur={e => e.target.style.borderColor = "#d1d5db"}
      />
    )}
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

export default function CamposTrabalhista({ dados, onChange }) {
  return (
    <>
      <Field label="Data de Admissão" name="dataAdmissao" type="date" value={dados.dataAdmissao} onChange={onChange} required />
      <Field label="Data de Demissão" name="dataDemissao" type="date" value={dados.dataDemissao} onChange={onChange} required />
      <Field label="Último Salário Bruto (R$)" name="salarioBase" type="number" value={dados.salarioBase} onChange={onChange} placeholder="Ex: 3500.00" required />
      <Select label="Tipo de Rescisão" name="tipoDemissao" value={dados.tipoDemissao} onChange={onChange} options={[
        { value: "semJustaCausa", label: "Sem justa causa (dispensa)" },
        { value: "comJustaCausa", label: "Com justa causa" },
        { value: "pedidoDemissao", label: "Pedido de demissão" },
        { value: "rescisaoIndireta", label: "Rescisão indireta" },
        { value: "acordoMutuo", label: "Acordo mútuo (§6º art. 484-A CLT)" },
      ]} />
      <Select label="Aviso Prévio" name="avisoPrevio" value={dados.avisoPrevio} onChange={onChange} options={[
        { value: "cumprido", label: "Cumprido pelo empregado" },
        { value: "indenizado", label: "Indenizado pelo empregador" },
        { value: "naoConcedido", label: "Não concedido/descumprido" },
      ]} />
      <Field label="Média Horas Extras por Mês" name="horasExtras" type="number" value={dados.horasExtras} onChange={onChange} placeholder="Ex: 20" />
      <Select label="Adicional Noturno" name="adicionalNoturno" value={dados.adicionalNoturno} onChange={onChange} options={[
        { value: "nao", label: "Não" },
        { value: "sim", label: "Sim (trabalho entre 22h e 5h)" },
      ]} />
      <Select label="Insalubridade/Periculosidade" name="adicionalRisco" value={dados.adicionalRisco} onChange={onChange} options={[
        { value: "nenhum", label: "Nenhum" },
        { value: "insalubridadeMax", label: "Insalubridade Grau Máximo (40%)" },
        { value: "insalubridadeMedio", label: "Insalubridade Grau Médio (20%)" },
        { value: "insalubridadeMin", label: "Insalubridade Grau Mínimo (10%)" },
        { value: "periculosidade", label: "Periculosidade (30%)" },
      ]} />
      <Field label="Saldo FGTS Depositado (R$)" name="fgtsDepositado" type="number" value={dados.fgtsDepositado} onChange={onChange} placeholder="Ex: 8000.00" />
      <Field label="Férias Vencidas (períodos)" name="feriasVencidas" type="number" value={dados.feriasVencidas} onChange={onChange} placeholder="Ex: 1" />
    </>
  );
}
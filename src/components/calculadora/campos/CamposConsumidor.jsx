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

export default function CamposConsumidor({ dados, onChange }) {
  return (
    <>
      <Field label="Valor do Contrato/Produto (R$)" name="valorContrato" type="number" value={dados.valorContrato} onChange={onChange} placeholder="Ex: 5000.00" />
      <Field label="Valor Efetivamente Pago (R$)" name="valorPago" type="number" value={dados.valorPago} onChange={onChange} placeholder="Ex: 3000.00" />
      <Field label="Data da Contratação" name="dataContratacao" type="date" value={dados.dataContratacao} onChange={onChange} />
      <Field label="Data de Referência" name="dataReferencia" type="date" value={dados.dataReferencia} onChange={onChange} />
      <Select label="Tipo de Violação CDC" name="tipoViolacao" value={dados.tipoViolacao} onChange={onChange} options={[
        { value: "vicioProduto", label: "Vício do produto" },
        { value: "vicioServico", label: "Vício do serviço" },
        { value: "cobrancaIndevida", label: "Cobrança indevida (repetição em dobro)" },
        { value: "publicidadeEnganosa", label: "Publicidade enganosa" },
        { value: "clausulaAbusiva", label: "Cláusula abusiva em contrato de adesão" },
        { value: "negativaCobertura", label: "Negativa de cobertura (plano de saúde)" },
      ]} />
      <Field label="Multa Contratual (%)" name="multaContratual" type="number" value={dados.multaContratual} onChange={onChange} placeholder="Máx. 2% (art. 52 §1º CDC)" />
      <Field label="Valor de Danos Morais Pleiteados (R$)" name="danosMorais" type="number" value={dados.danosMorais} onChange={onChange} placeholder="Opcional" />
    </>
  );
}
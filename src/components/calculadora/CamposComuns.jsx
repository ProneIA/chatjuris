import React from "react";

const Field = ({ label, name, type = "text", value, onChange, placeholder, required }) => (
  <div style={{ marginBottom: "1rem" }}>
    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.3rem" }}>
      {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={e => onChange(name, e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "0.6rem 0.75rem",
        border: "1px solid #d1d5db", fontSize: "0.875rem",
        color: "#111827", outline: "none", boxSizing: "border-box"
      }}
      onFocus={e => e.target.style.borderColor = "#185FA5"}
      onBlur={e => e.target.style.borderColor = "#d1d5db"}
    />
  </div>
);

export default function CamposComuns({ dados, onChange }) {
  return (
    <>
      <Field label="Nome da Parte Autora/Requerente" name="parteAutora" value={dados.parteAutora} onChange={onChange} placeholder="Ex: João da Silva" required />
      <Field label="CPF/CNPJ da Parte Autora" name="cpfAutora" value={dados.cpfAutora} onChange={onChange} placeholder="000.000.000-00" />
      <Field label="Nome da Parte Ré/Requerida" name="parteRe" value={dados.parteRe} onChange={onChange} placeholder="Ex: Empresa XYZ Ltda" />
      <Field label="CPF/CNPJ da Parte Ré" name="cpfRe" value={dados.cpfRe} onChange={onChange} placeholder="00.000.000/0001-00" />
      <Field label="Advogado e OAB (opcional)" name="advogado" value={dados.advogado} onChange={onChange} placeholder="Ex: Dr. Paulo Souza — OAB/SP 123456" />
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.3rem" }}>
          Observações Livres
        </label>
        <textarea
          value={dados.observacoes || ""}
          onChange={e => onChange("observacoes", e.target.value)}
          placeholder="Informações adicionais relevantes..."
          rows={3}
          style={{
            width: "100%", padding: "0.6rem 0.75rem",
            border: "1px solid #d1d5db", fontSize: "0.875rem",
            resize: "vertical", boxSizing: "border-box"
          }}
          onFocus={e => e.target.style.borderColor = "#185FA5"}
          onBlur={e => e.target.style.borderColor = "#d1d5db"}
        />
      </div>
    </>
  );
}
import React, { useState } from "react";
import { calcular, validar } from "@/utils/calculadoraJuridica";
import CamposComuns from "./CamposComuns";
import CamposTrabalhista from "./campos/CamposTrabalhista";
import CamposPrevidenciario from "./campos/CamposPrevidenciario";
import CamposCivil from "./campos/CamposCivil";
import CamposConsumidor from "./campos/CamposConsumidor";
import CamposFamilia from "./campos/CamposFamilia";
import CamposTributario from "./campos/CamposTributario";
import CamposPenal from "./campos/CamposPenal";
import CamposImobiliario from "./campos/CamposImobiliario";

export default function FormularioDados({ area, onResultado, onVoltar }) {
  const [dados, setDados] = useState({});
  const [erros, setErros] = useState([]);

  const handleChange = (campo, valor) => {
    setDados(prev => ({ ...prev, [campo]: valor }));
    if (erros.length > 0) setErros([]);
  };

  const handleCalcular = () => {
    const errosValidacao = validar(area.id, dados);
    if (errosValidacao.length > 0) {
      setErros(errosValidacao);
      return;
    }

    const hoje = new Date().toISOString().split("T")[0];
    const hora = new Date().toLocaleTimeString("pt-BR");
    const numeroCalculo = String(Date.now()).slice(-8);

    const resultado = calcular(area.id, dados);

    onResultado({
      ...resultado,
      dataCalculo: hoje,
      horaCalculo: hora,
      numeroCalculo,
    });
  };

  const renderCamposEspecificos = () => {
    const props = { dados, onChange: handleChange };
    switch (area.id) {
      case "trabalhista":    return <CamposTrabalhista {...props} />;
      case "previdenciario": return <CamposPrevidenciario {...props} />;
      case "civil":          return <CamposCivil {...props} />;
      case "consumidor":     return <CamposConsumidor {...props} />;
      case "familia":        return <CamposFamilia {...props} />;
      case "tributario":     return <CamposTributario {...props} />;
      case "penal":          return <CamposPenal {...props} />;
      case "imobiliario":    return <CamposImobiliario {...props} />;
      default:               return null;
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <button onClick={onVoltar} style={{ background: "none", border: "none", cursor: "pointer", color: "#185FA5", fontSize: "0.85rem" }}>
          ← Voltar
        </button>
        <span style={{ color: "#999" }}>|</span>
        <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{area.label}</span>
        <span style={{ marginLeft: "auto", fontSize: "0.75rem", background: "#e8f5e9", color: "#1b5e20", padding: "0.2rem 0.75rem", fontWeight: 600 }}>
          ⚡ Cálculo Instantâneo — 100% Local
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Identificação */}
        <div style={{ background: "#fff", padding: "1.5rem", border: "1px solid #e0e0e0" }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", color: "#1a1a2e", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #185FA5" }}>
            Identificação das Partes
          </h3>
          <CamposComuns dados={dados} onChange={handleChange} />
        </div>

        {/* Campos específicos */}
        <div style={{ background: "#fff", padding: "1.5rem", border: "1px solid #e0e0e0" }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", color: "#1a1a2e", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #185FA5" }}>
            Dados Específicos — {area.label}
          </h3>
          {renderCamposEspecificos()}
        </div>
      </div>

      {/* Erros */}
      {erros.length > 0 && (
        <div style={{ background: "#fee2e2", border: "1px solid #f87171", color: "#b91c1c", padding: "1rem", marginTop: "1.5rem", fontSize: "0.85rem" }}>
          <strong>⚠️ Corrija os erros antes de calcular:</strong>
          <ul style={{ margin: "0.5rem 0 0 1rem" }}>
            {erros.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Botão calcular */}
      <div style={{ marginTop: "1.5rem" }}>
        <button
          onClick={handleCalcular}
          style={{
            background: "#185FA5", color: "#fff", border: "none",
            padding: "1rem 2.5rem", fontSize: "1rem", fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center",
            gap: "0.75rem", width: "100%", justifyContent: "center"
          }}
        >
          ⚖️ Calcular Agora
        </button>
        <p style={{ textAlign: "center", color: "#666", fontSize: "0.75rem", marginTop: "0.5rem" }}>
          Cálculo instantâneo baseado na legislação brasileira 2025/2026 · Sem IA · Sem custo
        </p>
      </div>
    </div>
  );
}
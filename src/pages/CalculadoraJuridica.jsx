import React, { useState } from "react";
import SelecaoArea from "@/components/calculadora/SelecaoArea";
import FormularioDados from "@/components/calculadora/FormularioDados";
import ResultadoCalculo from "@/components/calculadora/ResultadoCalculo";

export default function CalculadoraJuridica() {
  const [etapa, setEtapa] = useState(1); // 1=area, 2=dados, 3=resultado
  const [areaSelecionada, setAreaSelecionada] = useState(null);
  const [resultado, setResultado] = useState(null);

  const handleAreaSelecionada = (area) => {
    setAreaSelecionada(area);
    setEtapa(2);
  };

  const handleResultado = (res) => {
    setResultado(res);
    setEtapa(3);
  };

  const handleNovoCalculo = () => {
    setEtapa(1);
    setAreaSelecionada(null);
    setResultado(null);
  };

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f5", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#1a1a2e", color: "#fff", padding: "1rem 2rem" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>
              ⚖️ Calculadora Jurídica Brasileira
            </h1>
            <p style={{ fontSize: "0.75rem", opacity: 0.7, margin: "0.2rem 0 0" }}>
              Cálculos precisos com IA · Legislação 2025/2026
            </p>
          </div>
          {etapa > 1 && (
            <button
              onClick={handleNovoCalculo}
              style={{
                background: "transparent", border: "1px solid rgba(255,255,255,0.4)",
                color: "#fff", padding: "0.4rem 1rem", cursor: "pointer", fontSize: "0.8rem"
              }}
            >
              + Novo Cálculo
            </button>
          )}
        </div>
      </header>

      {/* Steps */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0" }}>
        <div className="max-w-6xl mx-auto" style={{ padding: "0.75rem 2rem" }}>
          <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            {[
              { n: 1, label: "Área do Direito" },
              { n: 2, label: "Dados" },
              { n: 3, label: "Resultado" },
            ].map((s, i) => (
              <React.Fragment key={s.n}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: etapa >= s.n ? "#185FA5" : "#e0e0e0",
                    color: etapa >= s.n ? "#fff" : "#999",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.8rem", fontWeight: 700, flexShrink: 0
                  }}>{s.n}</div>
                  <span style={{ fontSize: "0.8rem", color: etapa >= s.n ? "#185FA5" : "#999", fontWeight: etapa === s.n ? 700 : 400 }}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 1, background: etapa > s.n ? "#185FA5" : "#e0e0e0" }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto" style={{ padding: "2rem" }}>
        {etapa === 1 && <SelecaoArea onSelect={handleAreaSelecionada} />}
        {etapa === 2 && (
          <FormularioDados
            area={areaSelecionada}
            onResultado={handleResultado}
            onVoltar={() => setEtapa(1)}
          />
        )}
        {etapa === 3 && (
          <ResultadoCalculo
            resultado={resultado}
            area={areaSelecionada}
            onNovoCalculo={handleNovoCalculo}
          />
        )}
      </div>
    </div>
  );
}
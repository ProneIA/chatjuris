import React, { useState } from "react";
import SelecaoArea from "@/components/calculadora/SelecaoArea";
import FormularioDados from "@/components/calculadora/FormularioDados";
import ResultadoCalculo from "@/components/calculadora/ResultadoCalculo";

const S = {
  bg: "#f5f5f4",
  card: "#ffffff",
  border: "#e7e5e4",
  textPrimary: "#1c1917",
  textSecondary: "#78716c",
  accent: "#1a1a1a",
  accentHover: "#333333",
  radius: 6,
};

export default function CalculadoraJuridica() {
  const [etapa, setEtapa] = useState(1);
  const [areaSelecionada, setAreaSelecionada] = useState(null);
  const [resultado, setResultado] = useState(null);

  const handleAreaSelecionada = (area) => { setAreaSelecionada(area); setEtapa(2); };
  const handleResultado = (res) => { setResultado(res); setEtapa(3); };
  const handleNovoCalculo = () => { setEtapa(1); setAreaSelecionada(null); setResultado(null); };

  return (
    <div style={{ minHeight: "100vh", background: S.bg, fontFamily: "var(--font-sans)" }}>

      {/* Page Header — padrão global */}
      <div style={{ background: S.bg, borderBottom: `1px solid ${S.border}`, padding: "20px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: S.textPrimary, margin: 0 }}>Calculadora Jurídica</h1>
            <p style={{ fontSize: "0.875rem", color: S.textSecondary, marginTop: 4 }}>Cálculos precisos com IA · Legislação 2025/2026</p>
          </div>
          {etapa > 1 && (
            <button
              onClick={handleNovoCalculo}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: S.accent, color: "#fff", border: "none",
                borderRadius: S.radius, padding: "9px 16px",
                fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
                transition: "background 0.15s", fontFamily: "var(--font-sans)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = S.accentHover}
              onMouseLeave={e => e.currentTarget.style.background = S.accent}
            >
              + Novo Cálculo
            </button>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div style={{ background: S.card, borderBottom: `1px solid ${S.border}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "12px 32px" }}>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {[
              { n: 1, label: "Área do Direito" },
              { n: 2, label: "Dados" },
              { n: 3, label: "Resultado" },
            ].map((s, i) => (
              <React.Fragment key={s.n}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: S.radius,
                    background: etapa >= s.n ? S.accent : S.border,
                    color: etapa >= s.n ? "#fff" : S.textSecondary,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
                  }}>{s.n}</div>
                  <span style={{
                    fontSize: "0.8rem",
                    color: etapa >= s.n ? S.textPrimary : S.textSecondary,
                    fontWeight: etapa === s.n ? 600 : 400,
                  }}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 1, background: etapa > s.n ? S.accent : S.border }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px" }}>
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
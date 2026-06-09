import React, { useState } from "react";
import SelecaoArea from "@/components/calculadora/SelecaoArea";
import FormularioDados from "@/components/calculadora/FormularioDados";
import ResultadoCalculo from "@/components/calculadora/ResultadoCalculo";
import { Calculator } from "lucide-react";
import { AppPage, PageHeader, AppContent, AppButton } from "@/components/ds";

export default function CalculadoraJuridica() {
  const [etapa, setEtapa] = useState(1);
  const [areaSelecionada, setAreaSelecionada] = useState(null);
  const [resultado, setResultado] = useState(null);

  const handleAreaSelecionada = (area) => { setAreaSelecionada(area); setEtapa(2); };
  const handleResultado = (res) => { setResultado(res); setEtapa(3); };
  const handleNovoCalculo = () => { setEtapa(1); setAreaSelecionada(null); setResultado(null); };

  const steps = [
    { n: 1, label: "Área do Direito" },
    { n: 2, label: "Dados" },
    { n: 3, label: "Resultado" },
  ];

  return (
    <AppPage>
      <PageHeader
        title="Calculadora Jurídica"
        subtitle="Cálculos precisos com IA · Legislação 2025/2026"
        icon={Calculator}
        actions={
          etapa > 1 ? (
            <AppButton variant="secondary" onClick={handleNovoCalculo}>
              + Novo Cálculo
            </AppButton>
          ) : null
        }
      />

      {/* Stepper */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "12px 28px" }}>
        <div style={{ display: "flex", gap: 32, alignItems: "center", maxWidth: 900 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "var(--r-md)",
                  background: etapa >= s.n ? "var(--accent)" : "var(--border)",
                  color: etapa >= s.n ? "#fff" : "var(--text-3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>{s.n}</div>
                <span style={{
                  fontSize: 13,
                  color: etapa >= s.n ? "var(--text-1)" : "var(--text-3)",
                  fontWeight: etapa === s.n ? 600 : 400,
                }}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div style={{ flex: 1, height: 1, background: etapa > s.n ? "var(--accent)" : "var(--border)" }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <AppContent>
        <div style={{ maxWidth: 900 }}>
          {etapa === 1 && <SelecaoArea onSelect={handleAreaSelecionada} />}
          {etapa === 2 && (
            <FormularioDados area={areaSelecionada} onResultado={handleResultado} onVoltar={() => setEtapa(1)} />
          )}
          {etapa === 3 && (
            <ResultadoCalculo resultado={resultado} area={areaSelecionada} onNovoCalculo={handleNovoCalculo} />
          )}
        </div>
      </AppContent>
    </AppPage>
  );
}
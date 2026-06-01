import React from "react";
import { Briefcase, Shield, Scale, Receipt, Users, Building2, Gavel, Home } from "lucide-react";

const AREAS = [
  { id: "trabalhista", label: "Trabalhista", desc: "CLT, rescisão, verbas rescisórias, horas extras", icon: Briefcase },
  { id: "previdenciario", label: "Previdenciário / INSS", desc: "Aposentadoria, benefícios, revisões, RMI", icon: Shield },
  { id: "civil", label: "Civil / Responsabilidade", desc: "Danos morais, materiais, lucros cessantes", icon: Scale },
  { id: "consumidor", label: "Consumidor (CDC)", desc: "Vícios, repetição de indébito, multas", icon: Receipt },
  { id: "familia", label: "Família e Alimentos", desc: "Alimentos em atraso, pensão, partilha", icon: Users },
  { id: "tributario", label: "Tributário / Fiscal", desc: "IPTU, IPVA, débitos fiscais, multas Receita", icon: Building2 },
  { id: "penal", label: "Penal / Execução", desc: "Remição, progressão de regime, livramento", icon: Gavel },
  { id: "imobiliario", label: "Imobiliário / Locação", desc: "Aluguel em atraso, rescisão, reajuste", icon: Home },
];

const S = {
  bg: "#f5f5f4",
  card: "#ffffff",
  border: "#e7e5e4",
  textPrimary: "#1c1917",
  textSecondary: "#78716c",
  accent: "#1a1a1a",
  radius: 6,
};

export default function SelecaoArea({ onSelect }) {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: S.textPrimary, margin: "0 0 6px" }}>
          Selecione a Área do Direito
        </h2>
        <p style={{ color: S.textSecondary, fontSize: "0.875rem", margin: 0 }}>
          Escolha a área para acessar o formulário específico de cálculo
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 12,
      }}>
        {AREAS.map((area) => {
          const Icon = area.icon;
          return (
            <button
              key={area.id}
              onClick={() => onSelect(area)}
              style={{
                background: S.card,
                border: `1px solid ${S.border}`,
                borderRadius: S.radius,
                padding: "20px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                fontFamily: "var(--font-sans)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = S.accent;
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.10)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = S.border;
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
              }}
            >
              <div style={{
                width: 40, height: 40,
                background: S.bg, border: `1px solid ${S.border}`,
                borderRadius: S.radius,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon style={{ color: S.textSecondary, width: 20, height: 20 }} strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: S.textPrimary, fontSize: "0.9rem", marginBottom: 4 }}>
                  {area.label}
                </div>
                <div style={{ fontSize: "0.8rem", color: S.textSecondary, lineHeight: 1.5 }}>
                  {area.desc}
                </div>
              </div>
              <div style={{ fontSize: "0.75rem", color: S.accent, fontWeight: 600, marginTop: "auto" }}>
                Calcular →
              </div>
            </button>
          );
        })}
      </div>

      {/* Aviso legal */}
      <div style={{
        marginTop: "2rem", padding: "12px 16px",
        background: S.card, border: `1px solid ${S.border}`,
        borderRadius: S.radius,
        fontSize: "0.8rem", color: S.textSecondary, lineHeight: 1.6,
      }}>
        ⚠️ <strong style={{ color: S.textPrimary }}>Aviso Legal:</strong> Esta calculadora tem caráter informativo e educacional.
        Os cálculos são gerados por IA com base na legislação brasileira vigente (2025/2026).
        Sempre recomendamos revisão por advogado habilitado para casos concretos.
      </div>
    </div>
  );
}
import React from "react";
import { Briefcase, Shield, Scale, Receipt, Users, Building2, Gavel, Home } from "lucide-react";

const AREAS = [
  { id: "trabalhista", label: "Trabalhista", desc: "CLT, rescisão, verbas rescisórias, horas extras", icon: Briefcase, color: "#185FA5" },
  { id: "previdenciario", label: "Previdenciário / INSS", desc: "Aposentadoria, benefícios, revisões, RMI", icon: Shield, color: "#6b21a8" },
  { id: "civil", label: "Civil / Responsabilidade", desc: "Danos morais, materiais, lucros cessantes", icon: Scale, color: "#0f766e" },
  { id: "consumidor", label: "Consumidor (CDC)", desc: "Vícios, repetição de indébito, multas", icon: Receipt, color: "#b45309" },
  { id: "familia", label: "Família e Alimentos", desc: "Alimentos em atraso, pensão, partilha", icon: Users, color: "#be185d" },
  { id: "tributario", label: "Tributário / Fiscal", desc: "IPTU, IPVA, débitos fiscais, multas Receita", icon: Building2, color: "#1e40af" },
  { id: "penal", label: "Penal / Execução", desc: "Remição, progressão de regime, livramento", icon: Gavel, color: "#991b1b" },
  { id: "imobiliario", label: "Imobiliário / Locação", desc: "Aluguel em atraso, rescisão, reajuste", icon: Home, color: "#065f46" },
];

export default function SelecaoArea({ onSelect }) {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", color: "#1a1a2e", marginBottom: "0.5rem" }}>
          Selecione a Área do Direito
        </h2>
        <p style={{ color: "#666", fontSize: "0.9rem" }}>
          Escolha a área para acessar o formulário específico de cálculo
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1rem"
      }}>
        {AREAS.map((area) => {
          const Icon = area.icon;
          return (
            <button
              key={area.id}
              onClick={() => onSelect(area)}
              style={{
                background: "#fff",
                border: `2px solid #e0e0e0`,
                borderRadius: 0,
                padding: "1.5rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = area.color;
                e.currentTarget.style.background = `${area.color}08`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#e0e0e0";
                e.currentTarget.style.background = "#fff";
              }}
            >
              <div style={{
                width: 48, height: 48,
                background: `${area.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Icon style={{ color: area.color, width: 24, height: 24 }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                  {area.label}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#666", lineHeight: 1.4 }}>
                  {area.desc}
                </div>
              </div>
              <div style={{ fontSize: "0.75rem", color: area.color, fontWeight: 600, marginTop: "auto" }}>
                Calcular →
              </div>
            </button>
          );
        })}
      </div>

      {/* Aviso legal */}
      <div style={{
        marginTop: "2rem", padding: "1rem",
        background: "#fff8e1", border: "1px solid #f59e0b",
        fontSize: "0.8rem", color: "#92400e", lineHeight: 1.6
      }}>
        ⚠️ <strong>Aviso Legal:</strong> Esta calculadora tem caráter informativo e educacional.
        Os cálculos são gerados por IA com base na legislação brasileira vigente (2025/2026).
        Sempre recomendamos revisão por advogado habilitado para casos concretos.
      </div>
    </div>
  );
}
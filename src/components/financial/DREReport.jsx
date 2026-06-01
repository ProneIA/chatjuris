import React from "react";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const CAT_LABELS = {
  aluguel: "Aluguel", funcionarios: "Funcionários", tecnologia: "Tecnologia",
  marketing: "Marketing", despachante: "Despachante", custas_processuais: "Custas Processuais",
  fornecedores: "Fornecedores", impostos: "Impostos", outros: "Outros",
};

export default function DREReport({ receitas, despesas, despesasDetalhadas = [] }) {
  const despesasPorCategoria = despesasDetalhadas.reduce((acc, d) => {
    if (!acc[d.categoria]) acc[d.categoria] = 0;
    acc[d.categoria] += d.valor;
    return acc;
  }, {});

  const lucroOperacional = receitas - despesas;
  const margemLucro = receitas > 0 ? ((lucroOperacional / receitas) * 100).toFixed(1) : 0;

  const exportPDF = () => {
    const doc = new jsPDF();
    const hoje = new Date().toLocaleDateString("pt-BR");
    doc.setFontSize(18);
    doc.text("DRE - Demonstração do Resultado do Exercício", 20, 20);
    doc.setFontSize(10);
    doc.text(`Data: ${hoje}`, 20, 30);
    doc.setFontSize(12);
    let y = 45;
    doc.text("RECEITAS", 20, y); y += 8;
    doc.text(`Honorários Advocatícios: ${fmt(receitas)}`, 25, y); y += 10;
    doc.text("(-) DESPESAS OPERACIONAIS", 20, y); y += 8;
    Object.entries(despesasPorCategoria).forEach(([cat, valor]) => {
      doc.text(`${CAT_LABELS[cat] || cat}: ${fmt(valor)}`, 25, y); y += 6;
    });
    y += 4;
    doc.text(`Total Despesas: ${fmt(despesas)}`, 25, y); y += 12;
    doc.setFontSize(14);
    doc.text(`LUCRO OPERACIONAL: ${fmt(lucroOperacional)}`, 20, y); y += 8;
    doc.setFontSize(12);
    doc.text(`Margem de Lucro: ${margemLucro}%`, 20, y);
    doc.save("DRE.pdf");
    toast.success("DRE exportado com sucesso!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--ink-6)" }}>
        <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
          DRE — Demonstração do Resultado do Exercício
        </h2>
        <button className="btn-secondary" onClick={exportPDF}>
          <Download size={13} /> Exportar PDF
        </button>
      </div>

      {/* Resumo */}
      <div style={{ background: "var(--white)", border: "1px solid var(--ink-6)" }}>
        {/* Receitas */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ink-6)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-4)" }}>Receitas</span>
            <TrendingUp size={13} style={{ color: "var(--ok)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 12, borderLeft: "2px solid var(--ok)" }}>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Honorários Advocatícios</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{fmt(receitas)}</span>
          </div>
        </div>

        {/* Despesas */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ink-6)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-4)" }}>(-) Despesas Operacionais</span>
            <TrendingDown size={13} style={{ color: "var(--danger)" }} />
          </div>
          <div style={{ paddingLeft: 12, borderLeft: "2px solid var(--danger)", display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(despesasPorCategoria).map(([cat, valor]) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{CAT_LABELS[cat] || cat}</span>
                <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{fmt(valor)}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--ink-6)", paddingTop: 8, marginTop: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>Total Despesas</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{fmt(despesas)}</span>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div style={{
          padding: "18px 20px",
          background: lucroOperacional >= 0 ? "var(--ok-bg)" : "var(--danger-bg)",
          borderLeft: `3px solid ${lucroOperacional >= 0 ? "var(--ok)" : "var(--danger)"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-4)" }}>Lucro Operacional</span>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 600, color: lucroOperacional >= 0 ? "var(--ok)" : "var(--danger)", letterSpacing: "-0.03em" }}>
              {fmt(lucroOperacional)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Margem de Lucro</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: lucroOperacional >= 0 ? "var(--ok)" : "var(--danger)" }}>
              {margemLucro}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
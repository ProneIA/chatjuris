import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import StatCard from "@/components/common/StatCard";

const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function FluxoCaixaReport({ parcelas = [], despesas = [] }) {
  const [periodo, setPeriodo] = useState("30");

  const hoje = new Date();
  const dataLimite = new Date(hoje);
  dataLimite.setDate(dataLimite.getDate() + parseInt(periodo));

  const parcelasFuturas = parcelas.filter((p) => {
    const venc = new Date(p.data_vencimento);
    return venc >= hoje && venc <= dataLimite && p.status !== "pago";
  });
  const despesasFuturas = despesas.filter((d) => {
    const venc = new Date(d.data_vencimento);
    return venc >= hoje && venc <= dataLimite && d.status !== "pago";
  });

  const entradas = parcelasFuturas.reduce((s, p) => s + (p.valor || 0), 0);
  const saidas = despesasFuturas.reduce((s, d) => s + (d.valor || 0), 0);
  const saldoProjetado = entradas - saidas;

  const consolidado = {};
  parcelasFuturas.forEach((p) => {
    const d = p.data_vencimento;
    if (!consolidado[d]) consolidado[d] = { entradas: 0, saidas: 0 };
    consolidado[d].entradas += p.valor;
  });
  despesasFuturas.forEach((d) => {
    const dt = d.data_vencimento;
    if (!consolidado[dt]) consolidado[dt] = { entradas: 0, saidas: 0 };
    consolidado[dt].saidas += d.valor;
  });

  const fluxoOrdenado = Object.entries(consolidado)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([data, vals]) => ({ data, ...vals, saldo: vals.entradas - vals.saidas }));

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Fluxo de Caixa Projetado", 20, 20);
    doc.setFontSize(10);
    doc.text(`Período: Próximos ${periodo} dias`, 20, 30);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 20, 36);
    doc.setFontSize(12);
    let y = 50;
    doc.text(`Total Entradas: ${fmt(entradas)}`, 20, y); y += 8;
    doc.text(`Total Saídas: ${fmt(saidas)}`, 20, y); y += 8;
    doc.text(`Saldo Projetado: ${fmt(saldoProjetado)}`, 20, y); y += 15;
    doc.text("DETALHAMENTO POR DATA", 20, y); y += 10;
    fluxoOrdenado.forEach((item) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.text(new Date(item.data).toLocaleDateString("pt-BR"), 20, y);
      doc.text(`Entradas: ${fmt(item.entradas)}`, 60, y);
      doc.text(`Saídas: ${fmt(item.saidas)}`, 110, y);
      doc.text(`Saldo: ${fmt(item.saldo)}`, 160, y);
      y += 6;
    });
    doc.save("fluxo-caixa.pdf");
    toast.success("Fluxo de Caixa exportado!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--ink-6)" }}>
        <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
          Fluxo de Caixa Projetado
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger style={{ width: 160, borderRadius: 0 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Próximos 7 dias</SelectItem>
              <SelectItem value="15">Próximos 15 dias</SelectItem>
              <SelectItem value="30">Próximos 30 dias</SelectItem>
              <SelectItem value="60">Próximos 60 dias</SelectItem>
              <SelectItem value="90">Próximos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <button className="btn-secondary" onClick={exportPDF}>
            <Download size={13} /> Exportar
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", background: "var(--ink-6)", gap: 1 }}>
        <StatCard title="Entradas Previstas" value={fmt(entradas)} sub={`${parcelasFuturas.length} parcela(s)`} accentColor="ok" />
        <StatCard title="Saídas Previstas" value={fmt(saidas)} sub={`${despesasFuturas.length} despesa(s)`} accentColor="danger" />
        <StatCard title="Saldo Projetado" value={fmt(saldoProjetado)} sub={`Próximos ${periodo} dias`} accentColor={saldoProjetado >= 0 ? "ok" : "danger"} />
      </div>

      {/* Detalhamento */}
      <div style={{ background: "var(--white)", border: "1px solid var(--ink-6)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ink-6)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-4)", margin: 0 }}>
            Detalhamento por Data
          </p>
          <span style={{ fontSize: 10, color: "var(--ink-4)" }}>{fluxoOrdenado.length} datas</span>
        </div>
        {fluxoOrdenado.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", fontSize: 12, color: "var(--ink-4)" }}>
            Nenhuma movimentação prevista para o período selecionado
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {fluxoOrdenado.map((item, idx) => (
              <div key={idx} style={{
                padding: "12px 16px",
                borderBottom: idx < fluxoOrdenado.length - 1 ? "1px solid var(--ink-7)" : "none",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "background var(--duration)",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--ink-7)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Calendar size={13} style={{ color: "var(--ink-4)" }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>
                    {new Date(item.data).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 9, color: "var(--ink-4)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Entradas</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ok)", margin: 0 }}>+{fmt(item.entradas)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 9, color: "var(--ink-4)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Saídas</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--danger)", margin: 0 }}>-{fmt(item.saidas)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 9, color: "var(--ink-4)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Saldo</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: item.saldo >= 0 ? "var(--ok)" : "var(--danger)", margin: 0 }}>{fmt(item.saldo)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
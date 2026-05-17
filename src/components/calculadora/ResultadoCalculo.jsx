import React from "react";
import { Printer, Download, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";

import { brl, fmtData, PARAMS } from "@/utils/calculadoraJuridica";

const fmtPct = (v) => (v && Number(v) !== 0) ? `${Number(v).toFixed(2)}%` : "—";

export default function ResultadoCalculo({ resultado, area, onNovoCalculo }) {
  if (!resultado) return null;

  const r = resultado;
  const calcNum = r.numeroCalculo || String(Date.now()).slice(-8);
  const idPartes = r.identificacao || {};
  const pb = r.periodoBase || {};
  const verbas = r.verbas || [];
  const cm = r.correcaoMonetaria || {};
  const ju = r.juros || {};
  const ho = r.honorarios || {};
  const isPenal = r.unidade === "meses/dias";
  const hoje = r.dataCalculo ? new Date(r.dataCalculo + "T12:00:00").toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR");

  const handleImprimir = () => window.print();

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const hora = r.horaCalculo || new Date().toLocaleTimeString("pt-BR");
    let y = 15;

    const checkPage = (needed = 10) => {
      if (y + needed > H - 15) { doc.addPage(); y = 15; }
    };

    const linha = (label, valor, indent = 14) => {
      checkPage(6);
      doc.setFont("helvetica", "bold"); doc.setFontSize(8);
      doc.text(label + ":", indent, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(valor || "—"), indent + 45, y);
      y += 5;
    };

    // Cabeçalho
    doc.setFont("helvetica", "bold"); doc.setFontSize(15);
    doc.text("MEMÓRIA DE CÁLCULO JURÍDICO", W / 2, y, { align: "center" }); y += 7;
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text(r.area || area.label, W / 2, y, { align: "center" }); y += 5;
    doc.setFontSize(8);
    doc.text(`Data: ${hoje}  ·  Hora: ${hora}  ·  Nº ${calcNum}`, W / 2, y, { align: "center" }); y += 4;
    doc.setDrawColor(26, 26, 46); doc.setLineWidth(0.5);
    doc.line(14, y, W - 14, y); y += 6;

    // I — Identificação
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("I — IDENTIFICAÇÃO DAS PARTES", 14, y); y += 5;
    linha("Parte Autora", idPartes.parteAutora);
    linha("CPF/CNPJ Autora", idPartes.cpfAutora);
    linha("Parte Ré", idPartes.parteRe);
    linha("Advogado/OAB", idPartes.advogado);
    y += 3;

    // II — Período
    checkPage(20);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("II — PERÍODO DE REFERÊNCIA", 14, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Início: ${fmtData(pb.dataInicio)}   Fim: ${fmtData(pb.dataFim)}   Dias: ${pb.diasTotais ?? "—"}   Meses: ${pb.mesesTotais ?? "—"}`, 14, y); y += 8;

    // III — Verbas
    checkPage(15);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("III — DETALHAMENTO DAS VERBAS CALCULADAS", 14, y); y += 5;

    // Cabeçalho da tabela de verbas
    doc.setFillColor(26, 26, 46);
    doc.rect(14, y - 1, W - 28, 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("Verba", 16, y + 3);
    doc.text("Fórmula / Critério", 60, y + 3);
    doc.text("Base Legal", 125, y + 3);
    doc.text(isPenal ? "Dias/Meses" : "Valor (R$)", W - 14, y + 3, { align: "right" });
    doc.setTextColor(0, 0, 0); y += 7;

    verbas.forEach((v, i) => {
      checkPage(7);
      if (i % 2 === 0) { doc.setFillColor(245, 245, 245); doc.rect(14, y - 1, W - 28, 6, "F"); }
      doc.setFont("helvetica", "bold"); doc.setFontSize(7);
      doc.text(String(v.nome || "").substring(0, 26), 16, y + 3);
      doc.setFont("helvetica", "normal");
      doc.text(String(v.formula || "").substring(0, 38), 60, y + 3);
      doc.text(String(v.legal || "").substring(0, 28), 125, y + 3);
      doc.setFont("helvetica", "bold");
      doc.text(isPenal ? String(v.valor) : brl(v.valor), W - 14, y + 3, { align: "right" });
      y += 6;
    });
    y += 5;

    // IV — Encargos
    checkPage(40);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("IV — ATUALIZAÇÃO MONETÁRIA E ENCARGOS", 14, y); y += 5;

    const encargos = [
      ["Subtotal das Verbas", "—", isPenal ? String(r.subtotal) : brl(r.subtotal)],
      ["Correção Monetária", `${cm.indice || "—"} — ${cm.meses || 0} meses`, isPenal ? "—" : brl(cm.valor)],
      ["Juros de Mora", `${ju.tipo || "—"} — ${ju.meses || 0} meses`, isPenal ? "—" : brl(ju.valor)],
      ["Honorários Advocatícios", `${ho.percentual || 0}% — ${ho.legal || "—"}`, isPenal ? "—" : brl(ho.valor)],
    ];
    encargos.forEach(([item, crit, val], i) => {
      if (i % 2 === 0) { doc.setFillColor(245, 245, 245); doc.rect(14, y - 1, W - 28, 6, "F"); }
      doc.setFont("helvetica", "normal"); doc.setFontSize(8);
      doc.text(item, 16, y + 3);
      doc.text(crit, 75, y + 3);
      doc.setFont("helvetica", "bold");
      doc.text(val, W - 14, y + 3, { align: "right" });
      y += 6;
    });

    // Total geral
    checkPage(10);
    doc.setFillColor(26, 26, 46);
    doc.rect(14, y, W - 28, 9, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text("TOTAL GERAL APURADO", 16, y + 6);
    doc.text(isPenal ? String(r.totalGeral) + " meses" : brl(r.totalGeral), W - 14, y + 6, { align: "right" });
    doc.setTextColor(0, 0, 0); y += 13;

    // V — Observações
    if (r.observacoes) {
      checkPage(15);
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text("V — OBSERVAÇÕES E RESSALVAS LEGAIS", 14, y); y += 5;
      doc.setFont("helvetica", "italic"); doc.setFontSize(8);
      const lines = doc.splitTextToSize(r.observacoes, W - 28);
      lines.forEach(l => { checkPage(5); doc.text(l, 14, y); y += 4; });
    }

    // Rodapé
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "italic"); doc.setFontSize(7); doc.setTextColor(120);
      doc.text(`Calculadora Jurídica Brasileira · SM: R$ 1.412,00 · SELIC: ${(PARAMS.selicMensal * 100).toFixed(2)}% a.m. · Gerado em ${hoje} · Pág. ${i}/${totalPages}`, W / 2, H - 8, { align: "center" });
      doc.text("Este documento tem caráter informativo. Recomenda-se revisão por advogado habilitado.", W / 2, H - 4, { align: "center" });
    }
    doc.setTextColor(0);

    doc.save(`calculo-juridico-${(r.area || area.label).toLowerCase().replace(/[\s/]+/g, "-")}-${calcNum}.pdf`);
  };

  return (
    <div>
      {/* Botões */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button onClick={handlePDF} style={{ background: "#1a6e3c", color: "#fff", border: "none", padding: "0.75rem 1.5rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
          <Download style={{ width: 16, height: 16 }} /> Baixar PDF
        </button>
        <button onClick={handleImprimir} style={{ background: "#185FA5", color: "#fff", border: "none", padding: "0.75rem 1.5rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
          <Printer style={{ width: 16, height: 16 }} /> Imprimir
        </button>
        <button onClick={onNovoCalculo} style={{ background: "#fff", color: "#185FA5", border: "2px solid #185FA5", padding: "0.75rem 1.5rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
          <RefreshCw style={{ width: 16, height: 16 }} /> Novo Cálculo
        </button>
      </div>

      {/* Documento */}
      <div style={{ background: "#fff", border: "1px solid #e0e0e0", padding: "2rem" }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem", borderBottom: "3px solid #1a1a2e", paddingBottom: "1rem" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", color: "#1a1a2e", margin: 0 }}>MEMÓRIA DE CÁLCULO JURÍDICO</h1>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", color: "#185FA5", margin: "0.25rem 0 0", fontWeight: 400 }}>{r.area || area.label}</h2>
          <p style={{ fontSize: "0.8rem", color: "#666", margin: "0.5rem 0 0" }}>
            Data: <strong>{hoje}</strong> · Hora: <strong>{r.horaCalculo}</strong> · N° <strong>{calcNum}</strong>
          </p>
        </div>

        {/* I — Identificação */}
        <Section title="I — IDENTIFICAÇÃO DAS PARTES">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <tbody>
              {[["Parte Autora", idPartes.parteAutora], ["CPF/Autora", idPartes.cpfAutora], ["Parte Ré", idPartes.parteRe], ["CPF/Ré", idPartes.cpfRe], ["Advogado/OAB", idPartes.advogado]].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.4rem 0.75rem", fontWeight: 600, color: "#374151", width: "35%" }}>{k}</td>
                  <td style={{ padding: "0.4rem 0.75rem", color: "#111" }}>{v || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* II — Período */}
        <Section title="II — PERÍODO DE REFERÊNCIA">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", fontSize: "0.85rem" }}>
            {[["Início", fmtData(pb.dataInicio)], ["Fim", fmtData(pb.dataFim)], ["Dias Totais", pb.diasTotais ?? "—"], ["Meses Totais", pb.mesesTotais ?? "—"]].map(([k, v]) => (
              <div key={k} style={{ padding: "0.75rem", background: "#f8f9fa", textAlign: "center" }}>
                <div style={{ fontSize: "0.72rem", color: "#666", marginBottom: "0.25rem" }}>{k}</div>
                <div style={{ fontWeight: 700, color: "#1a1a2e" }}>{v}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* III — Verbas */}
        <Section title="III — DETALHAMENTO DAS VERBAS CALCULADAS">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ background: "#1a1a2e", color: "#fff" }}>
                <th style={{ padding: "0.6rem 0.75rem", textAlign: "left" }}>Verba</th>
                <th style={{ padding: "0.6rem 0.75rem", textAlign: "left" }}>Fórmula / Critério</th>
                <th style={{ padding: "0.6rem 0.75rem", textAlign: "left" }}>Base Legal</th>
                <th style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>{isPenal ? "Dias/Meses" : "Valor (R$)"}</th>
              </tr>
            </thead>
            <tbody>
              {verbas.map((v, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#f9fafb" : "#fff", borderBottom: "1px solid #e0e0e0" }}>
                  <td style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }}>{v.nome}</td>
                  <td style={{ padding: "0.6rem 0.75rem", color: "#374151" }}>{v.formula}</td>
                  <td style={{ padding: "0.6rem 0.75rem", color: "#6b7280", fontStyle: "italic" }}>{v.legal}</td>
                  <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontFamily: "Courier New, monospace", fontWeight: 600 }}>
                    {isPenal ? v.valor : brl(v.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* IV — Encargos */}
        <Section title="IV — ATUALIZAÇÃO MONETÁRIA E ENCARGOS">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "#f0f0f5" }}>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left" }}>Item</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left" }}>Critério</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>{isPenal ? "Resultado" : "Valor (R$)"}</th>
              </tr>
            </thead>
            <tbody>
              <ResumoRow label="Subtotal das Verbas" criterio="—" valor={isPenal ? String(r.subtotal) + " meses" : brl(r.subtotal)} />
              {!isPenal && <ResumoRow label="Correção Monetária" criterio={`${cm.indice || "—"} — ${cm.meses || 0} meses`} valor={brl(cm.valor)} />}
              {!isPenal && <ResumoRow label="Juros de Mora" criterio={`${ju.tipo || "—"} — ${ju.meses || 0} meses`} valor={brl(ju.valor)} />}
              {!isPenal && ho.valor > 0 && <ResumoRow label="Honorários Advocatícios" criterio={`${ho.percentual}% — ${ho.legal}`} valor={brl(ho.valor)} />}
            </tbody>
            <tfoot>
              <tr style={{ background: "#1a1a2e", color: "#fff" }}>
                <td colSpan={2} style={{ padding: "0.75rem", fontWeight: 700, fontSize: "1rem" }}>TOTAL GERAL</td>
                <td style={{ padding: "0.75rem", textAlign: "right", fontFamily: "Courier New, monospace", fontWeight: 700, fontSize: "1.1rem" }}>
                  {isPenal ? `${r.totalGeral} meses` : brl(r.totalGeral)}
                </td>
              </tr>
            </tfoot>
          </table>
        </Section>

        {/* V — Observações */}
        {r.observacoes && (
          <Section title="V — OBSERVAÇÕES E RESSALVAS LEGAIS">
            <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.6 }}>{r.observacoes}</p>
            <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", padding: "0.75rem", fontSize: "0.8rem", color: "#92400e", marginTop: "0.75rem" }}>
              ⚠️ Este documento tem caráter informativo e educacional. Recomenda-se revisão por profissional habilitado.
            </div>
          </Section>
        )}

        {/* Rodapé */}
        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #e0e0e0", fontSize: "0.75rem", color: "#9ca3af", textAlign: "center" }}>
          <p>Calculadora Jurídica Brasileira · SM: R$ 1.412,00 · SELIC: 1,07% a.m. · IPCA: 0,48% a.m. · INPC: 0,45% a.m. · IGP-M: 0,52% a.m.</p>
          <p style={{ marginTop: "0.25rem" }}>Cálculo realizado com base na legislação brasileira vigente 2025/2026 — 100% local, sem IA, sem custo adicional.</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3 style={{ fontFamily: "Georgia, serif", fontSize: "0.9rem", color: "#1a1a2e", fontWeight: 700, padding: "0.5rem 0.75rem", background: "#f0f0f5", borderLeft: "4px solid #185FA5", margin: "0 0 0.75rem" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ResumoRow({ label, criterio, valor }) {
  return (
    <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
      <td style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>{label}</td>
      <td style={{ padding: "0.5rem 0.75rem", color: "#6b7280" }}>{criterio}</td>
      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "Courier New, monospace" }}>{valor}</td>
    </tr>
  );
}
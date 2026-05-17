import React, { useRef } from "react";
import { Printer, Download, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";

const fmt = (v) => {
  if (v === null || v === undefined) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const fmtPct = (v) => v ? `${Number(v).toFixed(2)}%` : "—";

export default function ResultadoCalculo({ resultado, area, onNovoCalculo }) {
  const printRef = useRef();

  if (!resultado) return null;

  const r = resultado;
  const calcNum = Date.now().toString().slice(-6);

  const handleImprimir = () => {
    window.print();
  };

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    let y = 15;

    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("MEMÓRIA DE CÁLCULO JURÍDICO", W / 2, y, { align: "center" });
    y += 7;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(r.areaDireito || area.label, W / 2, y, { align: "center" });
    y += 5;
    doc.setDrawColor(24, 95, 165);
    doc.setLineWidth(0.5);
    doc.line(14, y, W - 14, y);
    y += 5;

    // Metadados
    doc.setFontSize(9);
    doc.text(`Data: ${r.dataCalculo || "—"}  |  Hora: ${r.horaCalculo || "—"}  |  Cálculo N° ${calcNum}`, 14, y);
    y += 8;

    // Identificação
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("I — IDENTIFICAÇÃO DAS PARTES", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const id = r.identificacao || {};
    const partes = [
      ["Parte Autora", id.parteAutora || "—"],
      ["CPF/Autora", id.cpfAutora || "—"],
      ["Parte Ré", id.parteRe || "—"],
      ["CPF/Ré", id.cpfRe || "—"],
      ["Advogado", id.advogado || "—"],
    ];
    partes.forEach(([k, v]) => {
      doc.text(`${k}: ${v}`, 14, y);
      y += 5;
    });
    y += 3;

    // Período
    const pb = r.periodoBase || {};
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("II — PERÍODO DE REFERÊNCIA", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Início: ${pb.dataInicio || "—"}   Fim: ${pb.dataFim || "—"}   Dias: ${pb.diasTotais || "—"}   Meses: ${pb.mesesTotais || "—"}`, 14, y);
    y += 8;

    // Verbas
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("III — DETALHAMENTO DAS VERBAS", 14, y);
    y += 5;

    const verbas = r.verbas || [];
    doc.setFontSize(8);
    // Cabeçalho tabela
    doc.setFont("helvetica", "bold");
    doc.setFillColor(26, 26, 46);
    doc.rect(14, y, W - 28, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("Verba", 16, y + 4);
    doc.text("Fórmula / Critério", 60, y + 4);
    doc.text("Base Legal", 130, y + 4);
    doc.text("Valor (R$)", 175, y + 4, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y += 7;

    verbas.forEach((v, i) => {
      if (y > 270) { doc.addPage(); y = 15; }
      if (i % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y - 1, W - 28, 6, "F");
      }
      doc.setFont("helvetica", "bold");
      doc.text(String(v.nome || "").substring(0, 22), 16, y + 3);
      doc.setFont("helvetica", "normal");
      doc.text(String(v.formula || "").substring(0, 38), 60, y + 3);
      doc.text(String(v.fundamentoLegal || "").substring(0, 30), 130, y + 3);
      doc.text(fmt(v.valor), W - 14, y + 3, { align: "right" });
      y += 6;
    });

    y += 5;
    if (y > 250) { doc.addPage(); y = 15; }

    // Resumo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("IV — ATUALIZAÇÃO MONETÁRIA E ENCARGOS", 14, y);
    y += 5;

    const rs = r.resumo || {};
    const cm = r.correcaoMonetaria || {};
    const ju = r.juros || {};
    const ho = r.honorarios || {};

    const resumoLinhas = [
      ["Subtotal das Verbas", "—", fmt(rs.subtotalVerbas)],
      ["Correção Monetária", `${cm.indice || "IPCA"} — ${fmtPct(cm.percentualTotal)}`, fmt(rs.correcaoMonetaria)],
      ["Juros de Mora", `${ju.tipo || "SELIC"} — ${ju.meses || "—"} meses`, fmt(rs.juros)],
      ["Honorários Advocatícios", `Art. 85 CPC — ${fmtPct(ho.percentual)}`, fmt(rs.honorarios)],
    ];

    doc.setFontSize(9);
    resumoLinhas.forEach(([item, crit, val], i) => {
      if (i % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y - 1, W - 28, 6, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.text(item, 16, y + 3);
      doc.text(crit, 70, y + 3);
      doc.setFont("helvetica", "bold");
      doc.text(val, W - 14, y + 3, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += 6;
    });

    // Total geral
    doc.setFillColor(26, 26, 46);
    doc.rect(14, y, W - 28, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL GERAL", 16, y + 5.5);
    doc.text(fmt(rs.totalGeral), W - 14, y + 5.5, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y += 12;

    // Observações
    if (r.observacoesLegais || r.ressalvas) {
      if (y > 250) { doc.addPage(); y = 15; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("V — OBSERVAÇÕES E RESSALVAS", 14, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      if (r.observacoesLegais) {
        const obs = doc.splitTextToSize(r.observacoesLegais, W - 28);
        obs.forEach(line => {
          if (y > 270) { doc.addPage(); y = 15; }
          doc.text(line, 14, y);
          y += 4;
        });
      }
      if (r.ressalvas) {
        y += 3;
        const res = doc.splitTextToSize(`Ressalvas: ${r.ressalvas}`, W - 28);
        res.forEach(line => {
          if (y > 270) { doc.addPage(); y = 15; }
          doc.text(line, 14, y);
          y += 4;
        });
      }
    }

    // Rodapé
    y += 10;
    if (y > 265) { doc.addPage(); y = 15; }
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, W - 14, y);
    y += 4;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Calculado com base na legislação brasileira vigente · SM: R$ 1.412,00 · SELIC: 1,07% a.m. · IPCA: 0,48% a.m.", 14, y);
    y += 4;
    doc.text("Este documento tem caráter informativo. Recomenda-se revisão por profissional habilitado.", 14, y);

    doc.save(`calculo-juridico-${calcNum}.pdf`);
  };

  const idPartes = r.identificacao || {};
  const pb = r.periodoBase || {};
  const rs = r.resumo || {};
  const cm = r.correcaoMonetaria || {};
  const ju = r.juros || {};
  const ho = r.honorarios || {};
  const verbas = r.verbas || [];

  return (
    <div>
      {/* Botões de ação */}
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

      {/* Memória de Cálculo */}
      <div ref={printRef} style={{ background: "#fff", border: "1px solid #e0e0e0", padding: "2rem" }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem", borderBottom: "3px solid #1a1a2e", paddingBottom: "1rem" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", color: "#1a1a2e", margin: 0 }}>
            MEMÓRIA DE CÁLCULO JURÍDICO
          </h1>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", color: "#185FA5", margin: "0.25rem 0 0", fontWeight: 400 }}>
            {r.areaDireito || area.label}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#666", margin: "0.5rem 0 0" }}>
            Data: <strong>{r.dataCalculo}</strong> · Hora: <strong>{r.horaCalculo}</strong> · N° <strong>{calcNum}</strong>
          </p>
        </div>

        {/* Seção I — Identificação */}
        <Section title="I — IDENTIFICAÇÃO DAS PARTES">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <tbody>
              {[
                ["Parte Autora", idPartes.parteAutora], ["CPF/Autora", idPartes.cpfAutora],
                ["Parte Ré", idPartes.parteRe], ["CPF/Ré", idPartes.cpfRe], ["Advogado/OAB", idPartes.advogado],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.4rem 0.75rem", fontWeight: 600, color: "#374151", width: "35%" }}>{k}</td>
                  <td style={{ padding: "0.4rem 0.75rem", color: "#111" }}>{v || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Seção II — Período */}
        <Section title="II — PERÍODO DE REFERÊNCIA">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", fontSize: "0.85rem" }}>
            {[
              ["Início", pb.dataInicio], ["Fim", pb.dataFim],
              ["Dias Totais", pb.diasTotais], ["Meses Totais", pb.mesesTotais],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: "0.75rem", background: "#f8f9fa", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>{k}</div>
                <div style={{ fontWeight: 700, color: "#1a1a2e" }}>{v || "—"}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Seção III — Verbas */}
        <Section title="III — DETALHAMENTO DAS VERBAS CALCULADAS">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ background: "#1a1a2e", color: "#fff" }}>
                <th style={{ padding: "0.6rem 0.75rem", textAlign: "left" }}>Verba</th>
                <th style={{ padding: "0.6rem 0.75rem", textAlign: "left" }}>Fórmula / Critério</th>
                <th style={{ padding: "0.6rem 0.75rem", textAlign: "left" }}>Base Legal</th>
                <th style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              {verbas.map((v, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#f9fafb" : "#fff", borderBottom: "1px solid #e0e0e0" }}>
                  <td style={{ padding: "0.6rem 0.75rem", fontWeight: 600 }}>{v.nome}</td>
                  <td style={{ padding: "0.6rem 0.75rem", color: "#374151" }}>{v.formula}</td>
                  <td style={{ padding: "0.6rem 0.75rem", color: "#6b7280", fontStyle: "italic" }}>{v.fundamentoLegal}</td>
                  <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontFamily: "Courier New, monospace", fontWeight: 600 }}>
                    {fmt(v.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Seção IV — Resumo */}
        <Section title="IV — ATUALIZAÇÃO MONETÁRIA E ENCARGOS">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "#f0f0f5" }}>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left" }}>Item</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left" }}>Critério</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              <ResumoRow label="Subtotal das Verbas" criterio="—" valor={rs.subtotalVerbas} />
              <ResumoRow label="Correção Monetária" criterio={`${cm.indice || "IPCA"} — ${fmtPct(cm.percentualTotal)}`} valor={rs.correcaoMonetaria} />
              <ResumoRow label="Juros de Mora" criterio={`${ju.tipo || "SELIC"} — ${ju.meses || "—"} meses`} valor={rs.juros} />
              <ResumoRow label="Honorários Advocatícios" criterio={`Art. 85 CPC — ${fmtPct(ho.percentual)}`} valor={rs.honorarios} />
            </tbody>
            <tfoot>
              <tr style={{ background: "#1a1a2e", color: "#fff" }}>
                <td colSpan={2} style={{ padding: "0.75rem", fontWeight: 700, fontSize: "1rem" }}>TOTAL GERAL</td>
                <td style={{ padding: "0.75rem", textAlign: "right", fontFamily: "Courier New, monospace", fontWeight: 700, fontSize: "1.1rem" }}>
                  {fmt(rs.totalGeral)}
                </td>
              </tr>
            </tfoot>
          </table>
        </Section>

        {/* Seção V — Observações */}
        {(r.observacoesLegais || r.ressalvas) && (
          <Section title="V — OBSERVAÇÕES E RESSALVAS LEGAIS">
            {r.observacoesLegais && <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.6, marginBottom: "0.75rem" }}>{r.observacoesLegais}</p>}
            {r.ressalvas && (
              <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", padding: "0.75rem", fontSize: "0.8rem", color: "#92400e" }}>
                ⚠️ <strong>Ressalvas:</strong> {r.ressalvas}
              </div>
            )}
          </Section>
        )}

        {/* Rodapé */}
        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #e0e0e0", fontSize: "0.75rem", color: "#9ca3af", textAlign: "center" }}>
          <p>Calculado com base na legislação brasileira vigente · SM: R$ 1.412,00 · SELIC: 1,07% a.m. · IPCA: 0,48% a.m. · INPC: 0,45% a.m.</p>
          <p style={{ marginTop: "0.25rem" }}>⚠️ Este documento tem caráter informativo e educacional. Recomenda-se revisão por profissional habilitado.</p>
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
      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "Courier New, monospace" }}>{fmt(valor)}</td>
    </tr>
  );
}
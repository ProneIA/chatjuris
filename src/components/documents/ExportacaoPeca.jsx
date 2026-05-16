import React, { useState } from "react";
import { gerarDOCX, gerarPDF } from "@/utils/documentFormatter";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Printer, Copy, Check, FileDown, Loader2, CheckCircle2, Scale } from "lucide-react";

export default function ExportacaoPeca({ textoDocumento, tipoDocumento, areaJuridica, nomeArquivo }) {
  const [baixandoDOCX, setBaixandoDOCX] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [sucesso, setSucesso] = useState(null);

  const metadados = { tipoLabel: tipoDocumento, areaLabel: areaJuridica };

  async function handleDOCX() {
    setBaixandoDOCX(true);
    try {
      await gerarDOCX(textoDocumento, nomeArquivo, metadados);
      setSucesso("docx");
      setTimeout(() => setSucesso(null), 3000);
    } catch {
      alert("Erro ao gerar DOCX. Tente novamente.");
    } finally {
      setBaixandoDOCX(false);
    }
  }

  function handlePDF() {
    gerarPDF(textoDocumento, nomeArquivo, metadados);
    setSucesso("pdf");
    setTimeout(() => setSucesso(null), 4000);
  }

  function handleCopiar() {
    navigator.clipboard.writeText(textoDocumento);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--surface)" }} className="overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: "var(--primary)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm" style={{ fontFamily: "'Oswald',sans-serif", textTransform: "uppercase", letterSpacing: ".04em" }}>
              {tipoDocumento}
            </div>
            <div className="text-white/60 text-xs">{areaJuridica}</div>
          </div>
        </div>
        <span className="text-xs px-3 py-1 text-white/80" style={{ background: "rgba(255,255,255,0.15)", fontFamily: "'Oswald',sans-serif", letterSpacing: ".06em" }}>
          ✓ DOCUMENTO GERADO
        </span>
      </div>

      {/* Botões */}
      <div className="px-6 py-5">
        <p className="text-xs mb-4 font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "'Oswald',sans-serif" }}>
          Exportar e protocolar
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* DOCX */}
          <button
            onClick={handleDOCX}
            disabled={baixandoDOCX}
            className="group relative flex flex-col items-center gap-3 p-5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ border: "2px solid #dbeafe", background: "var(--surface)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#eff6ff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#dbeafe"; e.currentTarget.style.background = "var(--surface)"; }}
          >
            {sucesso === "docx" && (
              <div className="absolute inset-0 bg-green-50 border-2 border-green-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            )}
            <div className="w-12 h-12 flex items-center justify-center" style={{ background: "#2563eb" }}>
              {baixandoDOCX ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <FileText className="w-6 h-6 text-white" />}
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm" style={{ color: "var(--text)", fontFamily: "'Oswald',sans-serif", textTransform: "uppercase" }}>Word (.docx)</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Editável • ABNT</div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-blue-600">
              <Download className="w-3.5 h-3.5" /> Baixar Word
            </div>
          </button>

          {/* PDF */}
          <button
            onClick={handlePDF}
            className="group relative flex flex-col items-center gap-3 p-5 transition-all"
            style={{ border: "2px solid #fee2e2", background: "var(--surface)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#fee2e2"; e.currentTarget.style.background = "var(--surface)"; }}
          >
            {sucesso === "pdf" && (
              <div className="absolute inset-0 bg-green-50 border-2 border-green-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            )}
            <div className="w-12 h-12 flex items-center justify-center" style={{ background: "#dc2626" }}>
              <FileDown className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm" style={{ color: "var(--text)", fontFamily: "'Oswald',sans-serif", textTransform: "uppercase" }}>PDF</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Pronto para protocolo</div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-red-600">
              <Printer className="w-3.5 h-3.5" /> Salvar PDF
            </div>
          </button>

          {/* Copiar */}
          <button
            onClick={handleCopiar}
            className="group flex flex-col items-center gap-3 p-5 transition-all"
            style={{ border: "2px solid var(--border)", background: "var(--surface)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--text-muted)"; e.currentTarget.style.background = "var(--surface-2)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface)"; }}
          >
            <div className="w-12 h-12 flex items-center justify-center" style={{ background: "#374151" }}>
              {copiado ? <Check className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6 text-white" />}
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm" style={{ color: "var(--text)", fontFamily: "'Oswald',sans-serif", textTransform: "uppercase" }}>
                {copiado ? "Copiado!" : "Copiar texto"}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Colar em qualquer editor</div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              <Copy className="w-3.5 h-3.5" />
              {copiado ? "✓ Copiado" : "Copiar"}
            </div>
          </button>
        </div>

        {/* Info protocolo */}
        <div className="mt-4 p-3" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-bold">⚖️ Para protocolo no PJe/e-SAJ/PROJUDI:</span>{" "}
            Baixe o PDF e faça upload diretamente no sistema do tribunal.
            O Word pode ser necessário para assinatura digital com certificado A1/A3.
          </p>
        </div>
      </div>
    </div>
  );
}
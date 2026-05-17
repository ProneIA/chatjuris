import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileImage, CheckCircle } from "lucide-react";

export default function UploadDocumento({ onDadosExtraidos }) {
  const [dragging, setDragging] = useState(false);
  const [imagem, setImagem] = useState(null);
  const [imagemUrl, setImagemUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [extraido, setExtraido] = useState(false);
  const inputRef = useRef();

  const processarArquivo = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagem(file);
      setImagemUrl(e.target.result);
      setExtraido(false);
      setErro(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    processarArquivo(file);
  };

  const handleAnalisar = async () => {
    if (!imagemUrl) return;
    setLoading(true);
    setErro(null);

    try {
      // Upload da imagem para o servidor
      const blob = await fetch(imagemUrl).then(r => r.blob());
      const file = new File([blob], imagem.name, { type: imagem.type });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extração dos dados com IA
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente jurídico especializado no Direito Brasileiro. Analise esta imagem (pode ser contracheque, CNIS, petição, contrato, sentença, decisão judicial, ou outro documento jurídico) e extraia TODOS os dados relevantes para cálculos jurídicos.

Retorne APENAS um JSON válido com os campos disponíveis:
{
  "parteAutora": "Nome completo da parte autora/reclamante/segurado",
  "cpfAutora": "CPF",
  "parteRe": "Nome da parte ré/reclamada/INSS/empresa",
  "cnpjRe": "CNPJ",
  "advogado": "Nome e OAB se visível",
  "salarioBase": null,
  "dataAdmissao": "AAAA-MM-DD ou null",
  "dataDemissao": "AAAA-MM-DD ou null",
  "dataNascimento": "AAAA-MM-DD ou null",
  "dataFato": "AAAA-MM-DD ou null",
  "valorPrincipal": null,
  "tipoDemissao": "",
  "horasExtras": null,
  "fgtsDepositado": null,
  "tempoContribuicao": null,
  "mediaSalarios": null,
  "valorAluguel": null,
  "mesesAtraso": null,
  "percentualAlimentos": null,
  "observacoes": "Outras informações relevantes identificadas no documento"
}`,
        file_urls: [file_url],
        model: "claude_sonnet_4_6",
        response_json_schema: {
          type: "object",
          properties: {
            parteAutora: { type: "string" },
            cpfAutora: { type: "string" },
            parteRe: { type: "string" },
            cnpjRe: { type: "string" },
            advogado: { type: "string" },
            salarioBase: { type: "number" },
            dataAdmissao: { type: "string" },
            dataDemissao: { type: "string" },
            dataNascimento: { type: "string" },
            dataFato: { type: "string" },
            valorPrincipal: { type: "number" },
            tipoDemissao: { type: "string" },
            horasExtras: { type: "number" },
            fgtsDepositado: { type: "number" },
            tempoContribuicao: { type: "number" },
            mediaSalarios: { type: "number" },
            valorAluguel: { type: "number" },
            mesesAtraso: { type: "number" },
            percentualAlimentos: { type: "number" },
            observacoes: { type: "string" }
          }
        }
      });

      setExtraido(true);
      // Limpar nulos antes de passar
      const limpo = Object.fromEntries(
        Object.entries(resultado).filter(([_, v]) => v !== null && v !== undefined && v !== "")
      );
      onDadosExtraidos(limpo);
    } catch (err) {
      setErro("Erro ao analisar o documento. Verifique se é uma imagem válida e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "1rem", color: "#374151", fontSize: "0.9rem" }}>
        <strong>🤖 Raio-X de Documento com IA</strong> — Envie uma imagem de contracheque, CNIS, contrato, petição ou decisão judicial.
        A IA extrairá os dados automaticamente para preencher o formulário.
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#185FA5" : "#d1d5db"}`,
          background: dragging ? "#eff6ff" : "#f9fafb",
          padding: "3rem 2rem", textAlign: "center",
          cursor: "pointer", transition: "all 0.2s", marginBottom: "1rem"
        }}
      >
        <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display: "none" }}
          onChange={e => processarArquivo(e.target.files[0])} />
        <Upload style={{ width: 40, height: 40, color: "#9ca3af", margin: "0 auto 1rem" }} />
        <p style={{ color: "#374151", fontWeight: 600, marginBottom: "0.25rem" }}>Arraste a imagem aqui ou clique para selecionar</p>
        <p style={{ color: "#9ca3af", fontSize: "0.8rem" }}>JPG, PNG, PDF — até 10MB</p>
      </div>

      {/* Preview */}
      {imagemUrl && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <FileImage style={{ width: 16, height: 16, color: "#185FA5" }} />
            <span style={{ fontSize: "0.85rem", color: "#374151" }}>{imagem?.name}</span>
          </div>
          <img src={imagemUrl} alt="Preview" style={{ maxWidth: "100%", maxHeight: 300, objectFit: "contain", border: "1px solid #e0e0e0" }} />
        </div>
      )}

      {erro && (
        <div style={{ background: "#fee2e2", border: "1px solid #f87171", color: "#b91c1c", padding: "1rem", marginBottom: "1rem", fontSize: "0.85rem" }}>
          ⚠️ {erro}
        </div>
      )}

      {extraido && (
        <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", padding: "1rem", marginBottom: "1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle style={{ width: 16, height: 16 }} />
          Dados extraídos com sucesso! Revise o formulário Manual antes de calcular.
        </div>
      )}

      <button
        onClick={handleAnalisar}
        disabled={!imagemUrl || loading}
        style={{
          background: !imagemUrl || loading ? "#9ca3af" : "#185FA5",
          color: "#fff", border: "none", padding: "0.9rem 2rem",
          fontSize: "0.95rem", fontWeight: 700, cursor: !imagemUrl || loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", justifyContent: "center"
        }}
      >
        {loading ? (
          <>
            <span style={{ display: "inline-block", width: 18, height: 18, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            Analisando com IA...
          </>
        ) : "🔍 Analisar Documento com IA"}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AppCard from "@/components/ds/AppCard";
import AppBadge from "@/components/ds/AppBadge";
import { Loader2, Copy, Check, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

const TEMAS_FALLBACK = [
  { id: "f1", titulo: "Revisão de contratos bancários abusivos", area_juridica: "consumidor" },
  { id: "f2", titulo: "Demissão por justa causa — quando é ilegal", area_juridica: "trabalhista" },
  { id: "f3", titulo: "Benefício por incapacidade temporária — como comprovar", area_juridica: "previdenciario" },
  { id: "f4", titulo: "Guarda compartilhada — mitos e verdades", area_juridica: "familia" },
  { id: "f5", titulo: "FGTS: quando o trabalhador tem direito a sacar", area_juridica: "trabalhista" },
  { id: "f6", titulo: "Plano de saúde negando cobertura — o que fazer", area_juridica: "saude" },
  { id: "f7", titulo: "Herança digital — o que acontece com suas contas após a morte", area_juridica: "familia" },
  { id: "f8", titulo: "Rescisão indireta — quando o empregado pode 'demitir' a empresa", area_juridica: "trabalhista" },
];

export default function Direcionar({ temaPre, onVerReferencias }) {
  const [temaSelecionado, setTemaSelecionado] = useState(null);
  const [perfil, setPerfil] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [copied, setCopied] = useState(false);

  const { data: temasDB = [] } = useQuery({
    queryKey: ["temas-marketing-dir"],
    queryFn: () => base44.entities.TemaMarketing.filter({ ativo: true }, "titulo", 50),
  });

  const temas = temasDB.length > 0 ? temasDB : TEMAS_FALLBACK;

  // Pré-seleciona tema vindo da aba Temas
  useEffect(() => {
    if (temaPre) {
      setTemaSelecionado(temaPre);
      setResultado(null);
    }
  }, [temaPre]);

  const handleGerar = async () => {
    if (!temaSelecionado) return;
    setLoading(true);
    setResultado(null);
    try {
      const response = await base44.functions.invoke("gerarAngulosIA", {
        tema: temaSelecionado.titulo,
        area_juridica: temaSelecionado.area_juridica,
        perfil_advogado: perfil.trim() || undefined,
      });
      setResultado(response.data);
    } catch (e) {
      toast.error("Erro ao gerar direcionamento: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopiar = () => {
    if (!resultado) return;
    const texto = [
      `📌 TEMA: ${temaSelecionado?.titulo}`,
      "",
      "🎯 ÂNGULOS DE ABORDAGEM:",
      ...(resultado.angulos || []).map((a, i) => `${i + 1}. ${a}`),
      "",
      `💥 GANCHO DE ABERTURA:\n"${resultado.gancho_abertura}"`,
      "",
      `📱 Formato indicado: ${resultado.formato_indicado}`,
      `🎭 Tom recomendado: ${resultado.tom_recomendado}`,
      `👥 Público-alvo: ${resultado.publico_alvo}`,
    ].join("\n");
    navigator.clipboard.writeText(texto).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copiado para a área de transferência!");
    });
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Seletor de tema */}
      <AppCard>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          <Sparkles size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle", color: "var(--accent)" }} />
          Gerar Direcionamento com IA
        </h3>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)", display: "block", marginBottom: 6 }}>
              Tema *
            </label>
            <select
              value={temaSelecionado?.id || ""}
              onChange={e => {
                const t = temas.find(t => t.id === e.target.value);
                setTemaSelecionado(t || null);
                setResultado(null);
              }}
              style={{ width: "100%" }}
            >
              <option value="">Selecione um tema...</option>
              {temas.map(t => (
                <option key={t.id} value={t.id}>{t.titulo}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)", display: "block", marginBottom: 6 }}>
              Seu perfil ou especialidade (opcional)
            </label>
            <textarea
              value={perfil}
              onChange={e => setPerfil(e.target.value)}
              placeholder="Ex: advogado trabalhista em Teresina/PI, foco em trabalhadores da construção civil"
              rows={2}
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          <button
            onClick={handleGerar}
            disabled={!temaSelecionado || loading}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            {loading ? (
              <><Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} /> Gerando direcionamento...</>
            ) : (
              <><Sparkles size={15} /> Gerar Direcionamento</>
            )}
          </button>
        </div>
      </AppCard>

      {/* Resultado */}
      {resultado && (
        <AppCard>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>
              Resultado — {temaSelecionado?.titulo}
            </h3>
            <button
              onClick={handleCopiar}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: "6px 12px" }}
            >
              {copied ? <><Check size={13} /> Copiado!</> : <><Copy size={13} /> Copiar tudo</>}
            </button>
          </div>

          {/* Ângulos */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)", margin: "0 0 8px" }}>
              🎯 Ângulos de Abordagem
            </p>
            <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
              {(resultado.angulos || []).map((a, i) => (
                <li key={i} style={{ fontSize: 13, color: "var(--text-1)", lineHeight: 1.55 }}>{a}</li>
              ))}
            </ol>
          </div>

          {/* Gancho */}
          {resultado.gancho_abertura && (
            <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--accent-light)", borderRadius: "var(--r-md)", borderLeft: "3px solid var(--accent)" }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--accent)", margin: "0 0 6px" }}>
                💥 Gancho de Abertura
              </p>
              <p style={{ fontSize: 13, color: "var(--text-1)", margin: 0, fontStyle: "italic", lineHeight: 1.6 }}>
                "{resultado.gancho_abertura}"
              </p>
            </div>
          )}

          {/* Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {resultado.formato_indicado && (
              <AppBadge variant="info">📱 {resultado.formato_indicado}</AppBadge>
            )}
            {resultado.tom_recomendado && (
              <AppBadge variant="neutral">🎭 {resultado.tom_recomendado}</AppBadge>
            )}
            {resultado.publico_alvo && (
              <AppBadge variant="neutral">👥 {resultado.publico_alvo}</AppBadge>
            )}
          </div>

          {/* Link para referências */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <button
              onClick={onVerReferencias}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: "var(--accent)", display: "flex", alignItems: "center", gap: 4,
                padding: 0, fontFamily: "var(--font-body)", fontWeight: 500
              }}
            >
              Ver exemplos de como outros comunicam esse tema <ArrowRight size={12} />
            </button>
          </div>
        </AppCard>
      )}
    </div>
  );
}
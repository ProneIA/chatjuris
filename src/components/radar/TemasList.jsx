import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AppCard from "@/components/ds/AppCard";
import AppBadge from "@/components/ds/AppBadge";
import { Flame, Zap, ArrowRight } from "lucide-react";

const TEMAS_FALLBACK = [
  { id: "f1", titulo: "Revisão de contratos bancários abusivos", area_juridica: "consumidor", relevancia: "alta", por_que_relevante: "Alta procura por renegociação pós-pandemia e aumento da inadimplência em 2025", dificuldade_conteudo: "facil", formatos_indicados: ["carrossel", "reel_curto"] },
  { id: "f2", titulo: "Demissão por justa causa — quando é ilegal", area_juridica: "trabalhista", relevancia: "alta", por_que_relevante: "Dúvida frequente de trabalhadores demitidos; alto engajamento em redes sociais", dificuldade_conteudo: "facil", formatos_indicados: ["carrossel", "thread"] },
  { id: "f3", titulo: "Benefício por incapacidade temporária — como comprovar", area_juridica: "previdenciario", relevancia: "alta", por_que_relevante: "Muitos segurados têm benefício negado por falta de documentação adequada", dificuldade_conteudo: "medio", formatos_indicados: ["artigo_linkedin", "reel_curto"] },
  { id: "f4", titulo: "Guarda compartilhada — mitos e verdades", area_juridica: "familia", relevancia: "media", por_que_relevante: "Tema de alto impacto emocional com grande alcance orgânico em redes", dificuldade_conteudo: "facil", formatos_indicados: ["carrossel", "reel_longo"] },
  { id: "f5", titulo: "FGTS: quando o trabalhador tem direito a sacar", area_juridica: "trabalhista", relevancia: "alta", por_que_relevante: "Dúvida recorrente; conteúdo perene com buscas constantes", dificuldade_conteudo: "facil", formatos_indicados: ["carrossel", "stories"] },
  { id: "f6", titulo: "Plano de saúde negando cobertura — o que fazer", area_juridica: "saude", relevancia: "alta", por_que_relevante: "Crescimento de ações contra operadoras; tema viral em grupos de WhatsApp", dificuldade_conteudo: "facil", formatos_indicados: ["reel_curto", "carrossel"] },
  { id: "f7", titulo: "Herança digital — o que acontece com suas contas após a morte", area_juridica: "familia", relevancia: "media", por_que_relevante: "Tema novo gerando curiosidade; diferencial para advogados que tratam o assunto", dificuldade_conteudo: "medio", formatos_indicados: ["artigo_linkedin", "reel_curto"] },
  { id: "f8", titulo: "Rescisão indireta — quando o empregado pode 'demitir' a empresa", area_juridica: "trabalhista", relevancia: "alta", por_que_relevante: "Muito desconhecido pelo trabalhador; alto potencial de viralização", dificuldade_conteudo: "facil", formatos_indicados: ["carrossel", "reel_curto"] },
];

const RELEVANCIA_CONFIG = {
  alta:  { variant: "danger",  label: "Alta" },
  media: { variant: "warning", label: "Média" },
  baixa: { variant: "neutral", label: "Baixa" },
};

const DIFICULDADE_CONFIG = {
  facil:  { variant: "success", label: "Fácil" },
  medio:  { variant: "warning", label: "Médio" },
  dificil:{ variant: "danger",  label: "Difícil" },
};

const AREA_LABELS = {
  consumidor: "Consumidor", trabalhista: "Trabalhista", previdenciario: "Previdenciário",
  familia: "Família", empresarial: "Empresarial", tributario: "Tributário",
  saude: "Saúde", imobiliario: "Imobiliário",
};

export default function TemasList({ selectedArea, onDirecionar }) {
  const { data: temasDB = [], isLoading } = useQuery({
    queryKey: ["temas-marketing"],
    queryFn: () => base44.entities.TemaMarketing.filter({ ativo: true }, "-relevancia", 50),
  });

  const temas = temasDB.length > 0 ? temasDB : TEMAS_FALLBACK;

  const filtered = selectedArea && selectedArea !== "all"
    ? temas.filter(t => t.area_juridica === selectedArea)
    : temas;

  const sorted = [...filtered].sort((a, b) => {
    const order = { alta: 0, media: 1, baixa: 2 };
    return (order[a.relevancia] ?? 1) - (order[b.relevancia] ?? 1);
  });

  if (isLoading) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        {[1,2,3].map(i => (
          <div key={i} className="skeleton" style={{ height: 100, borderRadius: "var(--r-lg)" }} />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <AppCard>
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: 13 }}>
          Nenhum tema disponível para esta área.
        </div>
      </AppCard>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {sorted.map((tema, i) => {
        const relCfg = RELEVANCIA_CONFIG[tema.relevancia] || RELEVANCIA_CONFIG.media;
        const difCfg = DIFICULDADE_CONFIG[tema.dificuldade_conteudo] || DIFICULDADE_CONFIG.medio;
        return (
          <AppCard key={tema.id || i} hover>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8, alignItems: "center" }}>
                  <AppBadge variant={relCfg.variant}>
                    <Flame size={10} /> {relCfg.label}
                  </AppBadge>
                  <AppBadge variant="info">
                    {AREA_LABELS[tema.area_juridica] || tema.area_juridica}
                  </AppBadge>
                  <AppBadge variant={difCfg.variant}>
                    <Zap size={10} /> {difCfg.label}
                  </AppBadge>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
                  {tema.titulo}
                </h3>

                {tema.por_que_relevante && (
                  <p style={{ fontSize: 12, color: "var(--text-2)", margin: "0 0 10px", lineHeight: 1.5 }}>
                    {tema.por_que_relevante}
                  </p>
                )}

                {tema.formatos_indicados?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {tema.formatos_indicados.map(f => (
                      <span key={f} style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: "var(--r-sm)",
                        background: "var(--accent-light)", color: "var(--accent)",
                        fontWeight: 500, letterSpacing: "0.02em"
                      }}>
                        {f.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => onDirecionar(tema)}
                style={{
                  display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                  padding: "7px 12px", borderRadius: "var(--r-md)", border: "1px solid var(--accent)",
                  background: "var(--accent-light)", color: "var(--accent)",
                  fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--accent-light)"; e.currentTarget.style.color = "var(--accent)"; }}
              >
                Ver Direcionamento <ArrowRight size={12} />
              </button>
            </div>
          </AppCard>
        );
      })}
    </div>
  );
}
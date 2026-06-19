import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AppCard from "@/components/ds/AppCard";
import AppBadge from "@/components/ds/AppBadge";
import { ExternalLink, Youtube, Instagram } from "lucide-react";

const REFERENCIAS_FALLBACK = [
  {
    id: "r1", titulo: "Direito do Consumidor", area_juridica: "consumidor",
    links: [
      { tipo: "instagram", url: "https://www.instagram.com/procon_sp/", descricao: "PROCON-SP — referência em comunicação sobre direitos do consumidor" },
      { tipo: "youtube", url: "https://www.youtube.com/@oabsp", descricao: "Canal OAB-SP — vídeos explicativos sobre direitos e carreira" },
      { tipo: "artigo", url: "https://www.conjur.com.br", descricao: "Consultor Jurídico — artigos técnicos de referência" },
    ]
  },
  {
    id: "r2", titulo: "Direito Trabalhista", area_juridica: "trabalhista",
    links: [
      { tipo: "instagram", url: "https://www.instagram.com/tst.jus.br/", descricao: "TST — Tribunal Superior do Trabalho no Instagram" },
      { tipo: "youtube", url: "https://www.youtube.com/@TSTchannel", descricao: "Canal TST no YouTube com jurisprudência em vídeo" },
      { tipo: "artigo", url: "https://www.tst.jus.br/noticias", descricao: "Notícias do TST — atualizações sobre direito do trabalho" },
    ]
  },
  {
    id: "r3", titulo: "Direito Previdenciário", area_juridica: "previdenciario",
    links: [
      { tipo: "youtube", url: "https://www.youtube.com/@previdenciarista", descricao: "Previdenciarista — referência em conteúdo sobre benefícios do INSS" },
      { tipo: "artigo", url: "https://www.jusbrasil.com.br/artigos/direito-previdenciario", descricao: "JusBrasil — artigos sobre previdência social" },
    ]
  },
];

function TipoIcon({ tipo }) {
  if (tipo === "instagram") return <Instagram size={12} />;
  if (tipo === "youtube") return <Youtube size={12} />;
  return <ExternalLink size={12} />;
}

const TIPO_VARIANT = { instagram: "danger", youtube: "danger", artigo: "info" };
const TIPO_LABEL = { instagram: "Instagram", youtube: "YouTube", artigo: "Artigo" };

export default function ReferenciasConteudo({ selectedArea }) {
  const { data: temasDB = [] } = useQuery({
    queryKey: ["temas-marketing-refs"],
    queryFn: () => base44.entities.TemaMarketing.filter({ ativo: true }, "titulo", 50),
  });

  // Constrói lista de referências: do banco se tiver links, senão fallback
  const temasComLinks = temasDB.filter(t => t.links_referencia?.length > 0).map(t => ({
    id: t.id, titulo: t.titulo, area_juridica: t.area_juridica, links: t.links_referencia
  }));

  const referencias = temasComLinks.length > 0 ? temasComLinks : REFERENCIAS_FALLBACK;

  const filtered = selectedArea && selectedArea !== "all"
    ? referencias.filter(r => r.area_juridica === selectedArea)
    : referencias;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {filtered.map((ref, i) => (
        <AppCard key={ref.id || i}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
            {ref.titulo}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ref.links.map((link, j) => (
              <a
                key={j}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: "var(--r-md)",
                  border: "1px solid var(--border)", background: "var(--surface)",
                  textDecoration: "none", transition: "all 0.15s"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-light)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface)"; }}
              >
                <AppBadge variant={TIPO_VARIANT[link.tipo] || "neutral"}>
                  <TipoIcon tipo={link.tipo} /> {TIPO_LABEL[link.tipo] || link.tipo}
                </AppBadge>
                <span style={{ fontSize: 12, color: "var(--text-2)", flex: 1 }}>{link.descricao}</span>
                <ExternalLink size={12} style={{ color: "var(--text-3)", flexShrink: 0 }} />
              </a>
            ))}
          </div>
        </AppCard>
      ))}

      <div style={{
        padding: "12px 16px", borderRadius: "var(--r-md)",
        border: "1px solid var(--border-2)", background: "var(--surface)",
        fontSize: 12, color: "var(--text-3)", fontStyle: "italic", lineHeight: 1.55
      }}>
        Esses exemplos são referências de como outros profissionais e instituições comunicam esses temas. Use como inspiração para desenvolver seu próprio estilo.
      </div>
    </div>
  );
}
// ============================================================
// searchService.js — Pesquisa de jurisprudência via IA + Web
// Usa InvokeLLM com web_search para acessar jurisprudências
// reais dos tribunais brasileiros sem bloqueios de CORS
// ============================================================

import { base44 } from "@/api/base44Client";

export async function searchJurisprudence({ query, court = "todos", area = "geral", page = 1, pageSize = 10 }) {
  if (!query?.trim()) throw new Error("Informe um termo de busca.");

  const tribunalFoco = (court === "todos" || court === "all")
    ? "STF, STJ e TST"
    : court;

  const areaFoco = (area && area !== "geral") ? `na área de ${area}` : "";

  const prompt = `Você é um pesquisador jurídico especializado em jurisprudência brasileira.

Pesquise jurisprudências reais sobre: "${query}" ${areaFoco}, priorizando decisões do ${tribunalFoco}.

Use sua base de conhecimento e busca na web para encontrar até ${pageSize} acórdãos ou decisões relevantes.

Retorne APENAS um JSON válido (sem markdown, sem texto antes ou depois) com este formato exato:
{
  "results": [
    {
      "title": "Ementa resumida da decisão (máx 250 chars)",
      "court": "STF|STJ|TST|TRF1|TJSP etc",
      "case_number": "número do processo ou recurso",
      "decision_date": "YYYY-MM-DD ou null",
      "summary": "Resumo da ementa com os principais fundamentos jurídicos",
      "full_text": "Texto mais completo da ementa ou fundamentos",
      "tags": ["tag1", "tag2"],
      "source_url": "URL oficial do tribunal se souber, ou null",
      "relevance_score": 85
    }
  ],
  "total": 5
}

Inclua apenas decisões reais que você conhece ou encontrou. Não invente processos. Se não encontrar resultados reais, retorne {"results": [], "total": 0}.`;

  try {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          results: { type: "array" },
          total: { type: "number" }
        }
      }
    });

    let parsed;
    try {
      parsed = typeof response === "string" ? JSON.parse(response) : response;
    } catch {
      const match = response?.match?.(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { results: [], total: 0 };
    }

    const results = Array.isArray(parsed?.results) ? parsed.results : [];

    const normalized = results.map(r => ({
      title: r.title || "Sem título",
      court: r.court || tribunalFoco,
      case_number: r.case_number || "",
      decision_date: r.decision_date || null,
      summary: r.summary || "",
      full_text: r.full_text || r.summary || "",
      tags: Array.isArray(r.tags) ? r.tags : [],
      source_url: r.source_url || null,
      relevance_score: Number(r.relevance_score) || 50,
      is_favorite: false,
    }));

    const ranked = rankResults(normalized, query);
    const summary = generateLocalSummary(ranked, query, area);

    return {
      results: ranked,
      summary,
      total: ranked.length,
      errors: null,
      sources_queried: [tribunalFoco],
    };

  } catch (error) {
    throw new Error("Erro ao pesquisar jurisprudência: " + error.message);
  }
}

// ─── RANKING LOCAL ────────────────────────────────────────────────────────────
function rankResults(results, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const anoAtual = new Date().getFullYear();

  return results
    .map(r => {
      const text = `${r.title} ${r.summary}`.toLowerCase();
      let score = r.relevance_score || 0;
      terms.forEach(term => {
        const count = (text.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
        score += count * 5;
      });
      if (r.decision_date) {
        const ano = new Date(r.decision_date).getFullYear();
        if (ano >= anoAtual - 5) score += 10;
      }
      return { ...r, relevance_score: Math.min(100, score) };
    })
    .sort((a, b) => b.relevance_score - a.relevance_score);
}

// ─── RESUMO LOCAL ─────────────────────────────────────────────────────────────
export function generateLocalSummary(results, query, area) {
  if (!results?.length) {
    return `Nenhum resultado encontrado para "${query}"${area && area !== "geral" ? ` na área de ${area}` : ""}. Tente termos mais específicos ou verifique a grafia.`;
  }

  const total = results.length;
  const tribunais = [...new Set(results.map(r => r.court))].join(", ");

  const comData = results.filter(r => r.decision_date);
  const maisRecente = [...comData].sort((a, b) => new Date(b.decision_date) - new Date(a.decision_date))[0];
  const maisAntigo = [...comData].sort((a, b) => new Date(a.decision_date) - new Date(b.decision_date))[0];

  const ementas = results.map(r => (r.summary || r.title || "").toLowerCase()).join(" ");

  let tendencia = "";
  if (ementas.includes("impossibilidade") || ementas.includes("improcedente") || ementas.includes("não cabe")) {
    tendencia = "A jurisprudência pesquisada tende a ser restritiva sobre o tema consultado.";
  } else if (ementas.includes("possibilidade") || ementas.includes("procedente") || ementas.includes("cabível") || ementas.includes("devido")) {
    tendencia = "A jurisprudência encontrada é majoritariamente favorável ao reconhecimento do direito pesquisado.";
  } else if (ementas.includes("divergência") || ementas.includes("controvérsia")) {
    tendencia = "Há divergência jurisprudencial sobre o tema — recomenda-se análise caso a caso.";
  }

  const periodoInfo = (maisRecente && maisAntigo && maisRecente !== maisAntigo)
    ? `Período abrangido: ${formatDate(maisAntigo.decision_date)} a ${formatDate(maisRecente.decision_date)}.`
    : maisRecente ? `Decisão mais recente: ${formatDate(maisRecente.decision_date)}.` : "";

  const top = results[0];

  return [
    `${total} resultado(s) encontrado(s) para "${query}"${area && area !== "geral" ? ` — área: ${area}` : ""}. Tribunais consultados: ${tribunais}.`,
    periodoInfo,
    tendencia,
    top ? `Mais relevante: "${top.title?.slice(0, 100)}..." (${top.court}${top.decision_date ? ", " + formatDate(top.decision_date) : ""}).` : "",
    "Dados obtidos via pesquisa inteligente com IA e busca na web.",
  ].filter(Boolean).join(" ");
}

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function formatDate(str) {
  if (!str) return "data desconhecida";
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}
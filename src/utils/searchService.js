// ============================================================
// searchService.js — Pesquisa de jurisprudência SEM IA
// Usa APIs públicas gratuitas dos tribunais brasileiros
// Zero tokens · Zero créditos · Resultados oficiais
// ============================================================

const CORS_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url=",
];

async function fetchWithCORS(url, options = {}) {
  // Tenta direto primeiro
  try {
    const res = await fetch(url, { ...options, mode: "cors", signal: AbortSignal.timeout(8000) });
    if (res.ok) return res;
  } catch {}

  // Tenta cada proxy
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(`${proxy}${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) return res;
    } catch {}
  }

  throw new Error(`Não foi possível acessar: ${url}`);
}

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────
export async function searchJurisprudence({ query, court = "todos", area = "geral", page = 1, pageSize = 10 }) {
  if (!query?.trim()) throw new Error("Informe um termo de busca.");

  const results = [];
  const errors = [];
  const apis = resolveAPIs(court);

  const responses = await Promise.allSettled(
    apis.map(api => api.fn(query, area, page, pageSize))
  );

  responses.forEach((res, i) => {
    if (res.status === "fulfilled") {
      results.push(...(res.value || []));
    } else {
      const msg = res.reason?.message || "Erro desconhecido";
      errors.push(`${apis[i].tribunal}: ${msg}`);
    }
  });

  const ranked = rankResults(results, query);
  const summary = generateLocalSummary(ranked, query, area);

  return {
    results: ranked,
    summary,
    total: ranked.length,
    errors: errors.length > 0 ? errors : null,
    sources_queried: apis.map(a => a.tribunal),
  };
}

// ─── RESOLVE APIs POR TRIBUNAL ────────────────────────────────────────────────
function resolveAPIs(court) {
  const allAPIs = [
    { tribunal: "STF", fn: searchSTF },
    { tribunal: "STJ", fn: searchSTJ },
    { tribunal: "TST", fn: searchTST },
  ];

  if (court === "todos" || court === "all") return allAPIs;

  const map = {
    STF: ["STF"],
    STJ: ["STJ"],
    TST: ["TST"],
    TRT: ["TST"],
    TRF: ["STJ"],
    TJ:  ["STF", "STJ"],
    TSE: ["STF"],
    STM: ["STF"],
  };

  const selected = map[court] || ["STF", "STJ", "TST"];
  return allAPIs.filter(a => selected.includes(a.tribunal));
}

// ─── STF ──────────────────────────────────────────────────────────────────────
async function searchSTF(query, area, page = 1, pageSize = 10) {
  const url = `https://jurisprudencia.stf.jus.br/api/search/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`;

  const res = await fetchWithCORS(url, { headers: { Accept: "application/json" } });
  const data = await res.json();

  return (data.hits?.hits || []).map(hit => {
    const src = hit._source || {};
    return {
      title: (src.ementa || src.titulo || "Sem título").slice(0, 250),
      court: "STF",
      case_number: src.numeroProcesso || hit._id || "",
      decision_date: src.dataJulgamento?.split("T")[0] || null,
      summary: src.ementa || "",
      full_text: src.acordao || src.ementa || "",
      tags: extractTags((src.ementa || "") + " " + area, area),
      source_url: `https://redir.stf.jus.br/paginadorpub/paginador.jsp?docTP=AC&docID=${hit._id}`,
      relevance_score: Math.round((hit._score || 0) * 10),
      is_favorite: false,
    };
  });
}

// ─── STJ ──────────────────────────────────────────────────────────────────────
async function searchSTJ(query, area, page = 1, pageSize = 10) {
  // Endpoint JSON oficial STJ
  const url = `https://scon.stj.jus.br/SCON/SearchBRS?b=ACOR&livre=${encodeURIComponent(query)}&i=${(page - 1) * pageSize + 1}&l=${pageSize}&operador=E&tipo_visualizacao=RESUMO&formato=JSON`;

  try {
    const res = await fetchWithCORS(url);
    const text = await res.text();

    // Tenta JSON primeiro
    try {
      const data = JSON.parse(text);
      return (data.items || data.results || []).map(item => ({
        title: (item.ementa || item.titulo || "Sem título").slice(0, 250),
        court: "STJ",
        case_number: item.numero || item.processo || "",
        decision_date: parseBRDate(item.data || ""),
        summary: item.ementa || item.resumo || "",
        full_text: item.ementa || "",
        tags: extractTags(item.ementa || "", area),
        source_url: item.url || `https://scon.stj.jus.br`,
        relevance_score: item.score || scoreLocal(item.ementa || "", query),
        is_favorite: false,
      }));
    } catch {}

    // Fallback: parse HTML
    return parseSTJHTML(text, query, area);
  } catch (e) {
    throw new Error(`STJ: ${e.message}`);
  }
}

function parseSTJHTML(html, query, area) {
  if (!html || typeof DOMParser === "undefined") return [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const items = doc.querySelectorAll(".documento, .resultadoItem, [class*='resultado']");
    const results = [];
    items.forEach(item => {
      const ementa = item.querySelector(".ementa, .texto, p")?.textContent?.trim() || "";
      const numero = item.querySelector(".numero, .processo, [class*='numero']")?.textContent?.trim() || "";
      const data = item.querySelector(".data, [class*='data']")?.textContent?.trim() || "";
      if (ementa) {
        results.push({
          title: ementa.slice(0, 250),
          court: "STJ",
          case_number: numero,
          decision_date: parseBRDate(data),
          summary: ementa,
          full_text: ementa,
          tags: extractTags(ementa, area),
          source_url: `https://scon.stj.jus.br`,
          relevance_score: scoreLocal(ementa, query),
          is_favorite: false,
        });
      }
    });
    return results;
  } catch {
    return [];
  }
}

// ─── TST ──────────────────────────────────────────────────────────────────────
async function searchTST(query, area, page = 1, pageSize = 10) {
  const url = `https://jurisprudencia.tst.jus.br/api/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}&tribunal=TST`;

  const res = await fetchWithCORS(url, { headers: { Accept: "application/json" } });
  const data = await res.json();

  return (data.hits?.hits || data.results || []).map(hit => {
    const src = hit._source || hit;
    return {
      title: (src.ementa || src.titulo || "Sem título").slice(0, 250),
      court: "TST",
      case_number: src.numeroProcesso || src.numero || hit._id || "",
      decision_date: src.dataJulgamento?.split("T")[0] || null,
      summary: src.ementa || "",
      full_text: src.acordao || src.ementa || "",
      tags: extractTags(src.ementa || "", area),
      source_url: `https://jurisprudencia.tst.jus.br/#${hit._id || ""}`,
      relevance_score: Math.min(100, Math.round((hit._score || 0.5) * 100)),
      is_favorite: false,
    };
  });
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

function scoreLocal(text, query) {
  if (!text || !query) return 0;
  const terms = query.toLowerCase().split(/\s+/);
  const lower = text.toLowerCase();
  let score = 0;
  terms.forEach(t => { if (t.length > 2 && lower.includes(t)) score += 15; });
  return Math.min(100, score);
}

// ─── TAGS AUTOMÁTICAS ────────────────────────────────────────────────────────
const TAG_MAP = {
  trabalhista: ["clt", "rescisão", "fgts", "aviso prévio", "horas extras", "salário", "empregado", "trt", "tst"],
  civil: ["dano moral", "responsabilidade civil", "indenização", "contrato", "prescrição", "usucapião"],
  consumidor: ["cdc", "fornecedor", "produto", "serviço", "vício", "defeito", "cobrança indevida"],
  familia: ["alimentos", "divórcio", "guarda", "pensão", "partilha", "união estável"],
  tributario: ["imposto", "tributo", "icms", "iss", "isenção", "lançamento", "contribuição"],
  previdenciario: ["inss", "aposentadoria", "benefício", "segurado", "bpc"],
  criminal: ["crime", "pena", "prisão", "habeas corpus", "delito", "absolvição"],
  constitucional: ["direito fundamental", "constituição", "mandado", "adpf", "repercussão geral"],
};

function extractTags(text, area) {
  if (!text) return [area].filter(Boolean);
  const lower = text.toLowerCase();
  const tags = new Set();
  if (area && area !== "geral") tags.add(area);
  Object.entries(TAG_MAP).forEach(([cat, kws]) => {
    kws.forEach(kw => { if (lower.includes(kw)) tags.add(kw.split(" ")[0]); });
  });
  return Array.from(tags).slice(0, 8);
}

// ─── RESUMO LOCAL (substitui IA) ──────────────────────────────────────────────
export function generateLocalSummary(results, query, area) {
  if (!results?.length) {
    return `Nenhum resultado encontrado para "${query}"${area && area !== "geral" ? ` na área de ${area}` : ""}. Tente termos mais específicos ou verifique a grafia.`;
  }

  const total = results.length;
  const tribunais = [...new Set(results.map(r => r.court))].join(", ");

  const comData = results.filter(r => r.decision_date);
  const maisRecente = comData.sort((a, b) => new Date(b.decision_date) - new Date(a.decision_date))[0];
  const maisAntigo = comData.sort((a, b) => new Date(a.decision_date) - new Date(b.decision_date))[0];

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
    "Dados obtidos diretamente das bases oficiais dos tribunais brasileiros — sem IA.",
  ].filter(Boolean).join(" ");
}

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function parseBRDate(str) {
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

function formatDate(str) {
  if (!str) return "data desconhecida";
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}
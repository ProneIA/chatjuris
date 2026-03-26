/**
 * datajudOABSearch — Busca processos por OAB em paralelo em todos os tribunais
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DATAJUD_API_KEY = "APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

const TRIBUNAIS = [
  { nome: "TST",   url: "https://api-publica.datajud.cnj.jus.br/api_publica_tst/_search" },
  { nome: "TSE",   url: "https://api-publica.datajud.cnj.jus.br/api_publica_tse/_search" },
  { nome: "STJ",   url: "https://api-publica.datajud.cnj.jus.br/api_publica_stj/_search" },
  { nome: "STM",   url: "https://api-publica.datajud.cnj.jus.br/api_publica_stm/_search" },
  { nome: "TRF1",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_trf1/_search" },
  { nome: "TRF2",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_trf2/_search" },
  { nome: "TRF3",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_trf3/_search" },
  { nome: "TRF4",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_trf4/_search" },
  { nome: "TRF5",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_trf5/_search" },
  { nome: "TRF6",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_trf6/_search" },
  { nome: "TJAC",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjac/_search" },
  { nome: "TJAL",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjal/_search" },
  { nome: "TJAM",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjam/_search" },
  { nome: "TJAP",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjap/_search" },
  { nome: "TJBA",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjba/_search" },
  { nome: "TJCE",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjce/_search" },
  { nome: "TJDFT", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjdft/_search" },
  { nome: "TJES",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjes/_search" },
  { nome: "TJGO",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjgo/_search" },
  { nome: "TJMA",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjma/_search" },
  { nome: "TJMG",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjmg/_search" },
  { nome: "TJMS",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjms/_search" },
  { nome: "TJMT",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjmt/_search" },
  { nome: "TJPA",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjpa/_search" },
  { nome: "TJPB",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjpb/_search" },
  { nome: "TJPE",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjpe/_search" },
  { nome: "TJPI",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjpi/_search" },
  { nome: "TJPR",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjpr/_search" },
  { nome: "TJRJ",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjrj/_search" },
  { nome: "TJRN",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjrn/_search" },
  { nome: "TJRO",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjro/_search" },
  { nome: "TJRR",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjrr/_search" },
  { nome: "TJRS",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjrs/_search" },
  { nome: "TJSC",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjsc/_search" },
  { nome: "TJSE",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjse/_search" },
  { nome: "TJSP",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search" },
  { nome: "TJTO",  url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjto/_search" },
];

async function buscarEmTribunal(numeroOAB, seccional, tribunal) {
  const body = JSON.stringify({
    size: 100,
    query: {
      bool: {
        must: [
          {
            nested: {
              path: "advocacia",
              query: {
                bool: {
                  must: [
                    { match: { "advocacia.numeroOAB": numeroOAB } },
                    { match: { "advocacia.ufOAB": seccional } }
                  ]
                }
              }
            }
          }
        ]
      }
    },
    sort: [{ "dataAjuizamento": { order: "desc" } }]
  });

  const res = await fetch(tribunal.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": DATAJUD_API_KEY },
    body,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) return { tribunal: tribunal.nome, processos: [], error: res.status };
  const data = await res.json();
  const hits = data.hits?.hits || [];
  return {
    tribunal: tribunal.nome,
    tribunalUrl: tribunal.url,
    processos: hits.map(h => {
      const s = h._source || {};
      const movimentos = s.movimentos || [];
      const ultimo = movimentos[movimentos.length - 1];
      return {
        numeroProcesso: s.numeroProcesso || "",
        tribunal: tribunal.nome,
        tribunalUrl: tribunal.url,
        classeProcessual: s.classe?.nome || "",
        orgaoJulgador: s.orgaoJulgador?.nome || s.orgaoJulgador || "",
        dataDistribuicao: s.dataAjuizamento || "",
        ultimoMovimento: ultimo?.nome || ultimo?.descricao || "",
        dataUltimoMovimento: ultimo?.dataHora?.split("T")[0] || "",
        movimentos: movimentos.map(m => ({ dataHora: m.dataHora || "", descricao: m.nome || m.descricao || "" })),
        status: "Ativo",
        dadosApiRaw: JSON.stringify(s).slice(0, 4000),
      };
    }),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const { numeroOAB, seccional } = await req.json();
    if (!numeroOAB || !seccional) {
      return Response.json({ error: 'numeroOAB e seccional são obrigatórios' }, { status: 400 });
    }

    const results = await Promise.allSettled(
      TRIBUNAIS.map(t => buscarEmTribunal(numeroOAB, seccional, t))
    );

    const tribunaisComResultado = [];
    const todosProcessos = [];

    for (const r of results) {
      if (r.status === "fulfilled" && r.value.processos.length > 0) {
        tribunaisComResultado.push(r.value.tribunal);
        todosProcessos.push(...r.value.processos);
      }
    }

    return Response.json({
      totalProcessos: todosProcessos.length,
      totalTribunais: tribunaisComResultado.length,
      tribunais: tribunaisComResultado,
      processos: todosProcessos,
    });

  } catch (error) {
    console.error("datajudOABSearch error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
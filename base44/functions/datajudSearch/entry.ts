/**
 * datajudSearch — Proxy para a API pública DataJud (CNJ)
 * Evita CORS no frontend fazendo a chamada pelo backend.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DATAJUD_API_KEY = Deno.env.get("DATAJUD_API_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const { numeroProcesso, nomeParte, tribunalUrl } = await req.json();

    if (!tribunalUrl) {
      return Response.json({ error: 'Parâmetro obrigatório: tribunalUrl' }, { status: 400 });
    }
    if (!numeroProcesso && !nomeParte) {
      return Response.json({ error: 'Informe numeroProcesso ou nomeParte' }, { status: 400 });
    }

    // Monta a query ES conforme o tipo de busca
    let esQuery;
    if (nomeParte) {
      esQuery = { query: { match: { "partes.nome": nomeParte } }, size: 10 };
    } else {
      esQuery = { query: { match: { numeroProcesso } } };
    }

    const mpRes = await fetch(tribunalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": DATAJUD_API_KEY,
      },
      body: JSON.stringify(esQuery),
    });

    if (!mpRes.ok) {
      const txt = await mpRes.text();
      return Response.json({ error: `API DataJud retornou ${mpRes.status}`, detail: txt }, { status: 502 });
    }

    const data = await mpRes.json();
    const hits = data.hits?.hits || [];

    return Response.json({ hits, total: data.hits?.total?.value || 0 });
  } catch (error) {
    console.error("datajudSearch error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
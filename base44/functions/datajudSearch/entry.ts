/**
 * datajudSearch — Proxy para a API pública DataJud (CNJ)
 * Evita CORS no frontend fazendo a chamada pelo backend.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DATAJUD_API_KEY = "APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const { numeroProcesso, tribunalUrl } = await req.json();

    if (!numeroProcesso || !tribunalUrl) {
      return Response.json({ error: 'Parâmetros obrigatórios: numeroProcesso, tribunalUrl' }, { status: 400 });
    }

    const mpRes = await fetch(tribunalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": DATAJUD_API_KEY,
      },
      body: JSON.stringify({
        query: { match: { numeroProcesso } }
      }),
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
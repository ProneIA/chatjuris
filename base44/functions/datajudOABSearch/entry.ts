/**
 * datajudOABSearch — DEPRECATED: A API DataJud não suporta busca por OAB.
 * Redireciona para busca por nome. Mantido por compatibilidade.
 * Para busca por OAB real, use a integração Judit na página de Configurações.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    return Response.json({
      error: 'A API pública do DataJud não suporta busca por número de OAB. Use a busca por nome do advogado ou configure a API Judit.',
      totalProcessos: 0,
      totalTribunais: 0,
      tribunais: [],
      processos: [],
    }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
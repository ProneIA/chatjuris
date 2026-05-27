import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { field, apiKey } = body ?? {};

  if (!field || !apiKey || apiKey.length < 10) {
    return Response.json({ valid: false, error: 'Parâmetros inválidos' }, { status: 400 });
  }

  try {
    if (field === 'juditApiKey') {
      const res = await fetch("https://requests.judit.io/api/oab?oab_number=12345&uf=SP", {
        headers: { "api-key": apiKey },
        signal: AbortSignal.timeout(8000),
      });
      return Response.json({ valid: res.status !== 401 && res.status !== 403 });
    }
    if (field === 'escavadorApiKey') {
      const res = await fetch("https://api.escavador.com/api/v2/advogados/oab/SP/12345", {
        headers: { "Authorization": `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8000),
      });
      return Response.json({ valid: res.status !== 401 && res.status !== 403 });
    }
    return Response.json({ error: 'Campo não suportado' }, { status: 400 });
  } catch {
    return Response.json({ valid: false, error: 'Timeout ou erro de conexão' });
  }
});
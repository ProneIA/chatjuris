/**
 * GET /api/functions/getMercadoPagoPublicKey
 * Retorna a chave pública do MP para o frontend (sem expor access token)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const publicKey = Deno.env.get('MP_PUBLIC_KEY');
    if (!publicKey) {
      return Response.json({ error: 'Chave pública não configurada' }, { status: 500 });
    }

    return Response.json({ public_key: publicKey });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
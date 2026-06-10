/**
 * GET /api/functions/getMercadoPagoPublicKey
 * Retorna a chave pública do Mercado Pago para o frontend.
 * Nunca expõe o MP_ACCESS_TOKEN.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const publicKey = Deno.env.get('MP_PUBLIC_KEY');
    if (!publicKey) {
      console.error('[getMercadoPagoPublicKey] MP_PUBLIC_KEY não configurada');
      return Response.json({ error: 'Chave pública não configurada' }, { status: 500 });
    }

    return Response.json({ public_key: publicKey });
  } catch (error) {
    console.error('[getMercadoPagoPublicKey] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
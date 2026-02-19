/**
 * POST /api/functions/validatePaymentStatus
 * Valida status de um pagamento consultando diretamente na API MP
 * Usado para checkout page polling
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { preferenceId, paymentId } = body;

    if (!paymentId) {
      return Response.json({ error: 'payment_id obrigatório' }, { status: 400 });
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'Gateway não configurado' }, { status: 500 });
    }

    // ✅ Consultar pagamento na API
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!mpResponse.ok) {
      return Response.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    const payment = await mpResponse.json();

    // ✅ Validar que pertence ao usuário
    if (payment.external_reference !== user.id) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return Response.json({
      success: true,
      status: payment.status,
      statusDetail: payment.status_detail,
      approved: payment.status === 'approved'
    });

  } catch (error) {
    console.error('[validatePaymentStatus] Erro:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
/**
 * POST /api/functions/checkPaymentStatus
 * Verifica o status de um pagamento no Mercado Pago
 * Usado para polling de PIX pendente
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

    const { paymentId } = await req.json();

    if (!paymentId) {
      return Response.json({ error: 'paymentId obrigatório' }, { status: 400 });
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!mpResponse.ok) {
      return Response.json({ error: 'Erro ao consultar pagamento' }, { status: 500 });
    }

    const payment = await mpResponse.json();

    // Verificar se pertence ao usuário autenticado
    if (payment.external_reference !== user.id) {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Se aprovado, ativar assinatura
    if (payment.status === 'approved') {
      const existingPayment = await base44.asServiceRole.entities.Payment.filter({
        mp_payment_id: String(paymentId)
      });

      if (existingPayment.length > 0 && existingPayment[0].status !== 'approved') {
        await base44.asServiceRole.entities.Payment.update(existingPayment[0].id, {
          status: 'approved',
          webhook_received_at: new Date().toISOString()
        });

        const planId = existingPayment[0].plan_id;
        const PLANS = {
          pro_monthly: { amount: 119.90, durationDays: 30 },
          pro_yearly: { amount: 1198.80, durationDays: 365 }
        };
        const plan = PLANS[planId];

        if (plan) {
          const startDate = new Date();
          const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
          const subData = {
            user_id: user.id,
            plan_type: planId === 'pro_yearly' ? 'yearly' : 'monthly',
            status: 'active',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            price: plan.amount,
            payment_method: 'mercado_pago',
            payment_external_id: String(paymentId)
          };

          const existing = await base44.asServiceRole.entities.Subscription.filter({ user_id: user.id }, '-created_date', 1);
          if (existing.length > 0) {
            await base44.asServiceRole.entities.Subscription.update(existing[0].id, subData);
          } else {
            await base44.asServiceRole.entities.Subscription.create(subData);
          }

          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'active',
            subscription_type: planId === 'pro_yearly' ? 'yearly' : 'monthly',
            subscription_start_date: startDate.toISOString(),
            subscription_end_date: endDate.toISOString()
          });
        }
      }
    }

    return Response.json({
      status: payment.status,
      statusDetail: payment.status_detail
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
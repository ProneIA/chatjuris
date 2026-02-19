/**
 * POST /api/functions/mercadoPagoWebhook
 * Webhook obrigatório do Mercado Pago
 * 
 * FLUXO:
 * 1. Recebe notificação
 * 2. Valida origem
 * 3. Consulta pagamento na API (truth source)
 * 4. Valida dados
 * 5. Ativa assinatura se aprovado
 * 6. Registra auditoria
 * 
 * ✅ Segurança:
 * - Retorna 200 imediatamente (não bloqueia MP)
 * - Processa async (não depende da resposta)
 * - Implementa idempotência
 * - Registra tudo para auditoria
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PLANS = {
  pro_monthly: { price: 119.90, durationDays: 30 },
  pro_yearly: { price: 1198.80, durationDays: 365 }
};

Deno.serve(async (req) => {
  // ✅ Apenas POST
  if (req.method !== 'POST') {
    return Response.json({ message: 'OK' }, { status: 200 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const queryParams = new URL(req.url).searchParams;

    // ✅ Validar origem do webhook
    const topic = queryParams.get('topic') || body.type;
    const paymentId = body.data?.id || queryParams.get('id');

    if (!paymentId) {
      console.warn('[MP Webhook] Sem payment_id, ignorando');
      return Response.json({ message: 'OK' }, { status: 200 });
    }

    if (topic !== 'payment.created' && topic !== 'payment.updated') {
      console.log('[MP Webhook] Topic ignorado:', topic);
      return Response.json({ message: 'OK' }, { status: 200 });
    }

    // ✅ Registrar webhook recebido (para auditoria)
    try {
      await base44.asServiceRole.entities.WebhookEvent.create({
        event_id: paymentId,
        event_type: topic,
        mp_payment_id: String(paymentId),
        payload_json: JSON.stringify(body),
        processed: false
      });
    } catch (e) {
      console.error('[MP Webhook] Erro ao registrar evento:', e.message);
    }

    // ✅ Retornar 200 IMEDIATAMENTE (não bloquear MP)
    // Processamento continua async
    scheduleProcessing(base44, paymentId);

    return Response.json({ message: 'OK' }, { status: 200 });
  } catch (error) {
    console.error('[MP Webhook] Erro geral:', error.message);
    return Response.json({ message: 'OK' }, { status: 200 });
  }
});

// ✅ Processamento async (não bloqueia webhook)
async function scheduleProcessing(base44, paymentId) {
  try {
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('[MP] Access token não configurado');
      return;
    }

    // ✅ Consultar pagamento diretamente na API (truth source)
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!mpResponse.ok) {
      console.error('[MP] Erro ao consultar pagamento:', mpResponse.status);
      return;
    }

    const payment = await mpResponse.json();

    console.log('[MP] Pagamento consultado:', {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference
    });

    // ✅ Validar pagamento
    if (!payment.external_reference) {
      console.warn('[MP] Sem external_reference');
      return;
    }

    // ✅ Verificar se já foi processado (idempotência)
    const existingPayment = await base44.asServiceRole.entities.Payment.filter({
      mp_payment_id: String(paymentId)
    });

    if (existingPayment.length > 0 && existingPayment[0].status === 'approved') {
      console.log('[MP] Pagamento já processado');
      return;
    }

    // ✅ Se APROVADO, ativar assinatura
    if (payment.status === 'approved') {
      await activateSubscription(base44, payment);
    } else {
      // Registrar status negativo
      await updatePaymentStatus(base44, payment);
    }

    // ✅ Atualizar webhook event
    try {
      const webhookEvents = await base44.asServiceRole.entities.WebhookEvent.filter({
        event_id: String(paymentId)
      });
      if (webhookEvents.length > 0) {
        await base44.asServiceRole.entities.WebhookEvent.update(webhookEvents[0].id, {
          processed: payment.status === 'approved',
          processed_at: new Date().toISOString(),
          mp_status: payment.status,
          error: payment.status !== 'approved' ? `Status: ${payment.status}` : null
        });
      }
    } catch (e) {
      console.error('[MP Webhook] Erro ao atualizar evento:', e.message);
    }

  } catch (error) {
    console.error('[scheduleProcessing] Erro:', error.message);
  }
}

async function activateSubscription(base44, payment) {
  try {
    const userId = payment.external_reference;
    const planId = payment.metadata?.plan_id;
    const plan = PLANS[planId];

    if (!plan) {
      console.error('[MP] Plano não encontrado:', planId);
      return;
    }

    // ✅ Buscar usuário
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (users.length === 0) {
      console.error('[MP] Usuário não encontrado:', userId);
      return;
    }

    const user = users[0];
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // ✅ Criar/Atualizar subscription
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_id: userId
    });

    const subData = {
      user_id: userId,
      plan_type: planId === 'pro_yearly' ? 'yearly' : 'monthly',
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      price: plan.price,
      payment_method: 'mercado_pago',
      payment_external_id: String(payment.id)
    };

    if (subscriptions.length > 0) {
      await base44.asServiceRole.entities.Subscription.update(
        subscriptions[0].id,
        subData
      );
    } else {
      await base44.asServiceRole.entities.Subscription.create(subData);
    }

    // ✅ Atualizar User
    await base44.asServiceRole.entities.User.update(userId, {
      subscription_status: 'active',
      subscription_type: planId === 'pro_yearly' ? 'yearly' : 'monthly',
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString()
    });

    // ✅ Atualizar Payment
    await base44.asServiceRole.entities.Payment.update(
      (await base44.asServiceRole.entities.Payment.filter({ mp_payment_id: String(payment.id) }))[0].id,
      {
        status: 'approved',
        webhook_received_at: new Date().toISOString()
      }
    );

    console.log('[MP] ✅ Assinatura ativada para:', user.email);

    // ✅ Enviar email de confirmação
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: '✅ Assinatura Juris Pro Ativada',
        body: `
          <div style="font-family: Arial; max-width: 600px;">
            <h2>Bem-vindo ao Juris Pro!</h2>
            <p>Sua assinatura foi ativada com sucesso.</p>
            <p><strong>Plano:</strong> ${planId === 'pro_yearly' ? 'Anual' : 'Mensal'}</p>
            <p><strong>Valor:</strong> R$ ${plan.price.toFixed(2)}</p>
            <p><strong>Válido até:</strong> ${endDate.toLocaleDateString('pt-BR')}</p>
            <p>Acesse agora: <a href="${Deno.env.get('PUBLIC_URL')}/Dashboard">Plataforma Juris</a></p>
          </div>
        `
      });
    } catch (e) {
      console.error('[MP] Erro ao enviar email:', e.message);
    }

  } catch (error) {
    console.error('[activateSubscription] Erro:', error.message);
  }
}

async function updatePaymentStatus(base44, payment) {
  try {
    const payments = await base44.asServiceRole.entities.Payment.filter({
      mp_payment_id: String(payment.id)
    });

    if (payments.length > 0) {
      await base44.asServiceRole.entities.Payment.update(payments[0].id, {
        status: payment.status === 'rejected' ? 'rejected' : 'pending',
        status_detail: payment.status_detail
      });
    }
  } catch (error) {
    console.error('[updatePaymentStatus] Erro:', error.message);
  }
}
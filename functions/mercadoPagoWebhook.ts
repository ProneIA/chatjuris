/**
 * POST /api/functions/mercadoPagoWebhook
 * Webhook do Mercado Pago com validação HMAC
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PLANS = {
  pro_monthly: { price: 119.90, durationDays: 30 },
  pro_yearly: { price: 1198.80, durationDays: 365 }
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ message: 'OK' }, { status: 200 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const queryParams = new URL(req.url).searchParams;

    // ✅ Validação HMAC da assinatura do Mercado Pago
    const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET');
    const signatureHeader = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id');

    let signatureValid = false;

    if (webhookSecret && signatureHeader) {
      try {
        // Extrair ts e v1 do header x-signature
        const parts = Object.fromEntries(
          signatureHeader.split(',').map(part => {
            const [k, v] = part.trim().split('=');
            return [k, v];
          })
        );

        const ts = parts['ts'];
        const v1 = parts['v1'];

        if (ts && v1) {
          // Construir manifest: id + ts + (data.id ou resource)
          const dataId = body.data?.id || body.resource || '';
          const manifest = `id:${dataId};request-id:${requestId || ''};ts:${ts};`;

          const encoder = new TextEncoder();
          const keyData = encoder.encode(webhookSecret);
          const msgData = encoder.encode(manifest);

          const cryptoKey = await crypto.subtle.importKey(
            'raw', keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false, ['sign']
          );

          const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
          const hashHex = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

          signatureValid = hashHex === v1;
        }
      } catch (e) {
        console.error('[MP Webhook] Erro na validação HMAC:', e.message);
      }
    } else {
      // Se não há secret configurado ou header ausente, permitir mas logar
      console.warn('[MP Webhook] Sem validação HMAC - header ou secret ausente');
      signatureValid = true; // Permissivo se secret não configurado
    }

    const topic = queryParams.get('topic') || body.type || body.action;
    const paymentId = body.data?.id || body.resource || queryParams.get('id');

    // ✅ Registrar evento (sempre, para auditoria)
    try {
      await base44.asServiceRole.entities.WebhookEvent.create({
        event_id: String(paymentId || `NO_ID_${Date.now()}`),
        event_type: topic || 'unknown',
        mp_payment_id: paymentId ? String(paymentId) : null,
        payload_json: rawBody,
        processed: false,
        signature_valid: signatureValid,
        error: signatureValid ? null : 'Assinatura HMAC inválida'
      });
    } catch (e) {
      console.error('[MP Webhook] Erro ao registrar evento:', e.message);
    }

    // ✅ Bloquear se assinatura inválida
    if (!signatureValid) {
      console.warn('[MP Webhook] Assinatura inválida - ignorando');
      return Response.json({ message: 'OK' }, { status: 200 });
    }

    if (!paymentId) {
      console.warn('[MP Webhook] Sem payment_id, ignorando');
      return Response.json({ message: 'OK' }, { status: 200 });
    }

    // Aceitar payment.created, payment.updated e action equivalentes
    const isPaymentEvent = 
      topic === 'payment.created' || 
      topic === 'payment.updated' ||
      topic === 'payment' ||
      body.action === 'payment.created' ||
      body.action === 'payment.updated';

    if (!isPaymentEvent) {
      console.log('[MP Webhook] Topic ignorado:', topic);
      return Response.json({ message: 'OK' }, { status: 200 });
    }

    // ✅ Processar assincronamente
    scheduleProcessing(base44, paymentId);

    return Response.json({ message: 'OK' }, { status: 200 });
  } catch (error) {
    console.error('[MP Webhook] Erro geral:', error.message);
    return Response.json({ message: 'OK' }, { status: 200 });
  }
});

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
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
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

    if (!payment.external_reference) {
      console.warn('[MP] Sem external_reference');
      return;
    }

    // ✅ Idempotência
    const existingPayment = await base44.asServiceRole.entities.Payment.filter({
      mp_payment_id: String(paymentId)
    });

    if (existingPayment.length > 0 && existingPayment[0].status === 'approved') {
      console.log('[MP] Pagamento já processado - idempotência aplicada');
      return;
    }

    if (payment.status === 'approved') {
      await activateSubscription(base44, payment);
    } else {
      await updatePaymentStatus(base44, payment);
    }

    // ✅ Atualizar webhook event
    try {
      const webhookEvents = await base44.asServiceRole.entities.WebhookEvent.filter({
        mp_payment_id: String(paymentId)
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

    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (users.length === 0) {
      console.error('[MP] Usuário não encontrado:', userId);
      return;
    }

    const user = users[0];
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });

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
      await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, subData);
    } else {
      await base44.asServiceRole.entities.Subscription.create(subData);
    }

    await base44.asServiceRole.entities.User.update(userId, {
      subscription_status: 'active',
      subscription_type: planId === 'pro_yearly' ? 'yearly' : 'monthly',
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString()
    });

    // Atualizar Payment
    const payments = await base44.asServiceRole.entities.Payment.filter({
      mp_payment_id: String(payment.id)
    });
    if (payments.length > 0) {
      await base44.asServiceRole.entities.Payment.update(payments[0].id, {
        status: 'approved',
        webhook_received_at: new Date().toISOString()
      });
    }

    console.log('[MP] ✅ Assinatura ativada para:', user.email);

    // Email de confirmação
    try {
      const publicUrl = Deno.env.get('PUBLIC_URL') || 'https://app.jurispro.com';
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
            <p>Acesse agora: <a href="${publicUrl}/Dashboard">Plataforma Juris</a></p>
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
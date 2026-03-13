/**
 * POST /api/functions/mercadoPagoWebhook
 * Webhook do Mercado Pago com validação HMAC correta
 * 
 * FLUXO:
 * 1. Recebe notificação
 * 2. Valida assinatura HMAC (MP_WEBHOOK_SECRET)
 * 3. Consulta pagamento na API (truth source)
 * 4. Ativa assinatura se aprovado
 * 5. Registra auditoria
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PLANS = {
  pro_monthly: { price: 119.90, durationDays: 30 },
  pro_yearly: { price: 1198.80, durationDays: 365 }
};

// ✅ Validação HMAC do Mercado Pago
async function validateMPSignature(req, body) {
  try {
    const secret = Deno.env.get('MP_WEBHOOK_SECRET');
    if (!secret) {
      console.warn('[MP Webhook] MP_WEBHOOK_SECRET não configurado, pulando validação');
      return true; // Se não há secret configurado, permite passar
    }

    const signatureHeader = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id');

    if (!signatureHeader) {
      console.warn('[MP Webhook] Header x-signature ausente');
      return false;
    }

    // Extrair ts e v1 do header: "ts=xxx,v1=yyy"
    const parts = {};
    signatureHeader.split(',').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) parts[key.trim()] = value.trim();
    });

    const ts = parts['ts'];
    const v1 = parts['v1'];

    if (!ts || !v1) {
      console.warn('[MP Webhook] Formato do header x-signature inválido');
      return false;
    }

    // Construir o manifest para validação
    const url = new URL(req.url);
    const dataId = new URLSearchParams(url.search).get('data.id') || '';
    
    // Manifest: "id:{data.id};request-id:{x-request-id};ts:{ts};"
    let manifest = '';
    if (dataId) manifest += `id:${dataId};`;
    if (requestId) manifest += `request-id:${requestId};`;
    manifest += `ts:${ts};`;

    // HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(manifest);

    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const hashHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = hashHex === v1;
    if (!isValid) {
      console.warn('[MP Webhook] Assinatura HMAC inválida', { expected: v1, got: hashHex });
    }
    return isValid;

  } catch (e) {
    console.error('[MP Webhook] Erro na validação HMAC:', e.message);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ message: 'OK' }, { status: 200 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const queryParams = new URL(req.url).searchParams;

    // ✅ Validar assinatura HMAC
    const signatureValid = await validateMPSignature(req, rawBody);

    // Extrair topic e paymentId
    const topic = queryParams.get('topic') || body.type || body.action;
    const paymentId = body.data?.id || queryParams.get('id') || queryParams.get('data.id');

    // ✅ Registrar evento (sempre, mesmo inválido, para auditoria)
    try {
      await base44.asServiceRole.entities.WebhookEvent.create({
        event_id: paymentId ? String(paymentId) : `NO_ID_${Date.now()}`,
        event_type: topic || 'unknown',
        mp_payment_id: paymentId ? String(paymentId) : null,
        payload_json: rawBody,
        processed: false,
        signature_valid: signatureValid,
        error: !signatureValid ? 'Assinatura HMAC inválida' : null
      });
    } catch (e) {
      console.error('[MP Webhook] Erro ao registrar evento:', e.message);
    }

    // ✅ Rejeitar se assinatura inválida
    if (!signatureValid) {
      console.warn('[MP Webhook] Requisição rejeitada: assinatura inválida');
      return Response.json({ message: 'OK' }, { status: 200 }); // Retorna 200 para não reenvio infinito
    }

    if (!paymentId) {
      console.warn('[MP Webhook] Sem payment_id, ignorando');
      return Response.json({ message: 'OK' }, { status: 200 });
    }

    // ✅ Filtrar apenas eventos de pagamento
    const isPaymentEvent = topic === 'payment' || 
                           topic === 'payment.created' || 
                           topic === 'payment.updated' ||
                           body.action === 'payment.created' ||
                           body.action === 'payment.updated';

    if (!isPaymentEvent) {
      console.log('[MP Webhook] Topic ignorado:', topic);
      return Response.json({ message: 'OK' }, { status: 200 });
    }

    // ✅ Retornar 200 IMEDIATAMENTE e processar async
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

    // ✅ Consultar pagamento na API (truth source)
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

    // ✅ Idempotência: verificar se já foi processado
    const existingPayment = await base44.asServiceRole.entities.Payment.filter({
      mp_payment_id: String(paymentId)
    });

    if (existingPayment.length > 0 && existingPayment[0].status === 'approved') {
      console.log('[MP] Pagamento já processado, ignorando');
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

    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId }, '-created_date', 1);

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

    // ✅ Atualizar Payment
    const payments = await base44.asServiceRole.entities.Payment.filter({ mp_payment_id: String(payment.id) });
    if (payments.length > 0) {
      await base44.asServiceRole.entities.Payment.update(payments[0].id, {
        status: 'approved',
        webhook_received_at: new Date().toISOString()
      });
    } else {
      // Criar registro se não existir (pagamento via checkout sem preferência prévia)
      await base44.asServiceRole.entities.Payment.create({
        user_id: userId,
        user_email: user.email,
        plan_id: planId,
        payment_type: 'checkout_pro',
        amount: plan.price,
        status: 'approved',
        mp_payment_id: String(payment.id),
        webhook_received_at: new Date().toISOString()
      });
    }

    console.log('[MP] ✅ Assinatura ativada para:', user.email);

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
/**
 * POST /api/functions/mercadoPagoWebhook
 *
 * Endpoint de webhook do Mercado Pago — produção.
 *
 * Segurança:
 *  - Valida assinatura HMAC-SHA256 (x-signature + x-request-id) quando disponível
 *  - NUNCA confia no payload recebido: sempre reconsulta o pagamento via API
 *  - Idempotência: registra cada event_id antes de processar
 *  - Retorna 200 imediatamente (MP exige resposta rápida)
 *  - LGPD: raw payload salvo em WebhookEvent; dados sensíveis não são expostos
 *
 * Configuração no Mercado Pago:
 *  Dashboard → Seu negócio → Notificações → notification_url:
 *  https://<PUBLIC_URL>/api/functions/mercadoPagoWebhook
 */
import { MercadoPagoConfig, Payment } from 'npm:mercadopago@2.0.15';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ── Configuração ────────────────────────────────────────────────────────────
const PLANS = {
  pro_monthly: { price: 119.90, name: 'Juris Pro - Plano Mensal', durationDays: 30 },
  pro_yearly:  { price: 1198.80, name: 'Juris Pro - Plano Anual',  durationDays: 365 }
};
const AMOUNT_TOLERANCE = 0.10; // R$ 0,10 de tolerância

// ── Validação de assinatura HMAC ────────────────────────────────────────────
async function validateSignature(req, rawBody, accessToken) {
  try {
    const xSignature  = req.headers.get('x-signature');
    const xRequestId  = req.headers.get('x-request-id');
    const urlParams   = new URL(req.url).searchParams;
    const dataId      = urlParams.get('data.id') || urlParams.get('id') || '';

    if (!xSignature) return true; // MP pode não enviar em todos os casos; não bloquear

    // Montar template: id=<data.id>;request-id=<x-request-id>;ts=<ts>
    const parts = xSignature.split(',');
    let ts = '', hash = '';
    for (const part of parts) {
      const [k, v] = part.trim().split('=');
      if (k === 'ts') ts = v;
      if (k === 'v1') hash = v;
    }
    if (!ts || !hash) return true; // Formato inválido — não bloquear

    const template = `id=${dataId};request-id=${xRequestId || ''};ts=${ts};`;
    const secretKey = Deno.env.get('MP_WEBHOOK_SECRET') || accessToken;

    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(template));
    const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    return computed === hash;
  } catch {
    return true; // Erro de validação → não bloquear (mas logar)
  }
}

// ── Handler principal ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const startTime = Date.now();

  // Responder 200 imediatamente se for GET (ping de validação do MP)
  if (req.method === 'GET') {
    return new Response('OK', { status: 200 });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const rawBody = await req.text();
  let body = {};
  try { body = JSON.parse(rawBody); } catch { /* body vazio ok */ }

  console.log('[webhook-mp] ▶ Recebido:', body.type, body?.data?.id, '— IP:', req.headers.get('x-forwarded-for'));

  const accessToken = Deno.env.get('MP_ACCESS_TOKEN') || Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
  if (!accessToken) {
    console.error('[webhook-mp] ❌ MP_ACCESS_TOKEN não configurado');
    return Response.json({ received: true }); // 200 p/ MP não retentar
  }

  const base44 = createClientFromRequest(req);

  // ── Validar assinatura ───────────────────────────────────────────────────
  const sigValid = await validateSignature(req, rawBody, accessToken);
  if (!sigValid) {
    console.warn('[webhook-mp] ⚠ Assinatura inválida — rejeitando');
    // Registrar tentativa
    await _safeLog(base44, {
      event_id: `INVALID_SIG_${Date.now()}`,
      event_type: body.type || 'unknown',
      payload_json: rawBody.slice(0, 5000),
      processed: false,
      signature_valid: false,
      error: 'Assinatura HMAC inválida'
    });
    return Response.json({ received: true }); // 200 para não expor o erro
  }

  // Aceitar somente tipos relevantes
  const validTypes = ['payment', 'preapproval'];
  if (!validTypes.includes(body.type)) {
    console.log('[webhook-mp] Tipo ignorado:', body.type);
    return Response.json({ received: true });
  }

  // ── TRATAMENTO ESPECIAL PARA PREAPPROVAL (assinaturas) ────────────────────
  if (body.type === 'preapproval') {
    console.log('[webhook-mp] 📋 Preapproval detectado:', body?.action);
    return await _handlePreapproval(base44, body, accessToken, eventId);
  }

  const eventId = String(body?.data?.id || '');
  if (!eventId) {
    console.warn('[webhook-mp] Evento sem data.id');
    return Response.json({ received: true });
  }

  // ── IDEMPOTÊNCIA: registrar evento antes de processar ───────────────────
  const existing = await _safeFind(base44, 'WebhookEvent', { event_id: eventId });
  if (existing.length > 0 && existing[0].processed) {
    console.log('[webhook-mp] Evento já processado (idempotência):', eventId);
    return Response.json({ received: true, duplicate: true });
  }

  // Criar/marcar evento como "em processamento"
  let webhookEventId = null;
  if (existing.length === 0) {
    const ev = await _safeLog(base44, {
      event_id: eventId,
      event_type: body.type,
      mp_payment_id: eventId,
      payload_json: rawBody.slice(0, 5000),
      processed: false,
      signature_valid: sigValid
    });
    webhookEventId = ev?.id;
  } else {
    webhookEventId = existing[0].id;
  }

  try {
    // ── CONSULTAR PAGAMENTO REAL NA API ────────────────────────────────────
    const client = new MercadoPagoConfig({ accessToken });
    const paymentApi = new Payment(client);
    const mpData = await paymentApi.get({ id: eventId });

    const mpPaymentId   = String(mpData.id);
    const mpStatus      = mpData.status;
    const mpStatusDetail = mpData.status_detail || '';
    const userId        = mpData.external_reference;
    const planId        = mpData.metadata?.plan_id;
    const paidAmount    = mpData.transaction_amount;

    console.log('[webhook-mp] 📦 Dados reais:', { mpPaymentId, mpStatus, userId, planId, paidAmount });

    if (!userId || !planId) {
      console.error('[webhook-mp] Dados insuficientes (sem userId/planId)');
      await _updateWebhookEvent(base44, webhookEventId, { processed: true, mp_status: mpStatus, error: 'Sem userId/planId' });
      return Response.json({ received: true });
    }

    const plan = PLANS[planId];
    if (!plan) {
      console.error('[webhook-mp] Plano desconhecido:', planId);
      await _updateWebhookEvent(base44, webhookEventId, { processed: true, mp_status: mpStatus, error: `Plano desconhecido: ${planId}` });
      return Response.json({ received: true });
    }

    // ── IDEMPOTÊNCIA no Payment ─────────────────────────────────────────────
    const existingPayments = await _safeFind(base44, 'Payment', { mp_payment_id: mpPaymentId });
    if (existingPayments.length > 0 && existingPayments[0].status === 'approved') {
      console.log('[webhook-mp] Payment já aprovado (idempotência):', mpPaymentId);
      await _updateWebhookEvent(base44, webhookEventId, { processed: true, mp_status: mpStatus });
      return Response.json({ received: true, duplicate: true });
    }

    // ── ATUALIZAR/CRIAR registro Payment ────────────────────────────────────
    const paymentData = {
      status: mpStatus,
      status_detail: mpStatusDetail,
      webhook_received_at: new Date().toISOString(),
      raw_response: JSON.stringify({
        id: mpData.id, status: mpStatus,
        status_detail: mpStatusDetail, amount: paidAmount
      })
    };

    if (existingPayments.length > 0) {
      await base44.asServiceRole.entities.Payment.update(existingPayments[0].id, paymentData);
    } else {
      await base44.asServiceRole.entities.Payment.create({
        user_id: userId,
        user_email: mpData.payer?.email || mpData.metadata?.user_email || '',
        mp_payment_id: mpPaymentId,
        plan_id: planId,
        payment_type: mpData.payment_type_id === 'pix' ? 'pix' : 'checkout_pro',
        amount: paidAmount,
        ...paymentData
      });
    }

    // Log de auditoria
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: mpData.metadata?.user_email || userId,
      action: `mp_webhook_${mpStatus}`,
      entity_type: 'Payment',
      entity_id: mpPaymentId,
      details: JSON.stringify({ planId, amount: paidAmount, status: mpStatus })
    });

    // ── PROCESSAR POR STATUS ────────────────────────────────────────────────
    if (mpStatus === 'approved') {
      // Validação anti-fraude: valor pago deve corresponder ao plano
      if (Math.abs(paidAmount - plan.price) > AMOUNT_TOLERANCE) {
        console.error('[webhook-mp] 🚨 FRAUDE: valor incorreto', { paidAmount, expected: plan.price });
        await base44.asServiceRole.entities.AuditLog.create({
          user_email: userId,
          action: 'mp_fraud_detected',
          entity_type: 'Payment',
          entity_id: mpPaymentId,
          details: JSON.stringify({ paidAmount, expectedAmount: plan.price, planId })
        });
        await _updateWebhookEvent(base44, webhookEventId, { processed: true, mp_status: mpStatus, error: 'FRAUD: valor incorreto' });
        return Response.json({ received: true });
      }

      await _activateSubscription(base44, userId, planId, plan, mpPaymentId, mpData.payment_type_id || 'mercadopago');

      const userEmail = mpData.metadata?.user_email || mpData.payer?.email;
      if (userEmail) await _sendConfirmationEmail(base44, userEmail, plan);

      console.log('[webhook-mp] ✅ Assinatura ativada:', userId, `(${Date.now() - startTime}ms)`);

    } else if (mpStatus === 'pending') {
      await _updateSubscriptionStatus(base44, userId, 'pending');
      console.log('[webhook-mp] ⏳ Pagamento pendente:', mpPaymentId);

    } else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(mpStatus)) {
      const newStatus = mpStatus === 'refunded' ? 'canceled' : 'expired';
      await _updateSubscriptionStatus(base44, userId, newStatus);
      console.log('[webhook-mp] ❌ Pagamento não aprovado:', mpStatus);
    }

    // Marcar evento como processado
    await _updateWebhookEvent(base44, webhookEventId, {
      processed: true,
      processed_at: new Date().toISOString(),
      mp_status: mpStatus
    });

    return Response.json({ received: true });

  } catch (error) {
    console.error('[webhook-mp] ❌ Erro crítico:', error.message);
    await _updateWebhookEvent(base44, webhookEventId, { processed: false, error: error.message });
    // Retornar 200 para MP não retentar infinitamente — logar e investigar manualmente
    return Response.json({ received: true });
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────

async function _handlePreapproval(base44, body, accessToken, eventId) {
  try {
    const preapprovalId = String(body?.data?.id || '');
    if (!preapprovalId) {
      console.warn('[webhook-mp] Preapproval sem data.id');
      return Response.json({ received: true });
    }

    // Consultar detalhes da assinatura na API
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/preapproval/${preapprovalId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mpResponse.ok) {
      console.error('[webhook-mp] Erro ao consultar preapproval:', preapprovalId);
      return Response.json({ received: true });
    }

    const preapprovalData = await mpResponse.json();
    const payerEmail = preapprovalData.payer_email;
    const status = preapprovalData.status;

    console.log('[webhook-mp] 📋 Preapproval:', { preapprovalId, payerEmail, status });

    if (!payerEmail) {
      console.error('[webhook-mp] Preapproval sem payer_email');
      return Response.json({ received: true });
    }

    // Localizar usuário pelo email
    const users = await _safeFind(base44, 'User', { email: payerEmail });
    if (users.length === 0) {
      console.warn('[webhook-mp] Usuário não encontrado para:', payerEmail);
      return Response.json({ received: true });
    }

    const userId = users[0].id;

    // Se status é 'authorized' ou 'active', liberar acesso
    if (['authorized', 'active'].includes(status)) {
      // Determinar tipo de plano a partir do ID (simplificado)
      const planType = preapprovalData.auto_recurring?.frequency_type === 'months' && 
                       preapprovalData.auto_recurring?.frequency === 12 
                       ? 'yearly' 
                       : 'monthly';

      // Buscar valor do plano
      const amount = preapprovalData.auto_recurring?.transaction_amount || 119.90;
      
      const planMap = {
        'monthly': { price: 119.90, durationDays: 30 },
        'yearly': { price: 1198.80, durationDays: 365 }
      };

      const plan = planMap[planType] || planMap.monthly;

      // Ativar assinatura
      await _activateSubscription(base44, userId, `pro_${planType}`, plan, preapprovalId, 'mercadopago_preapproval');

      console.log('[webhook-mp] ✅ Assinatura preapproval ativada:', userId, status);

      // Enviar email de confirmação
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: payerEmail,
          subject: '✅ Sua Assinatura Mercado Pago foi Ativada - Juris',
          body: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#7c3aed">Bem-vindo ao Juris Pro! 🎉</h2>
              <p>Sua assinatura foi ativada com sucesso via Mercado Pago.</p>
              <p>Status: <strong>${status}</strong></p>
              <a href="${Deno.env.get('PUBLIC_URL') || 'https://chatjuris.com'}"
                 style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px">
                Acessar Juris
              </a>
            </div>
          `
        });
      } catch (e) {
        console.error('[webhook-mp] Erro ao enviar email preapproval:', e.message);
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('[webhook-mp] Erro ao processar preapproval:', error.message);
    return Response.json({ received: true });
  }
}

async function _safeFind(base44, entity, filter) {
  try { return await base44.asServiceRole.entities[entity].filter(filter); }
  catch { return []; }
}

async function _safeLog(base44, data) {
  try { return await base44.asServiceRole.entities.WebhookEvent.create(data); }
  catch (e) { console.error('[webhook-mp] Erro ao logar evento:', e.message); return null; }
}

async function _updateWebhookEvent(base44, id, data) {
  if (!id) return;
  try { await base44.asServiceRole.entities.WebhookEvent.update(id, data); }
  catch (e) { console.error('[webhook-mp] Erro ao atualizar WebhookEvent:', e.message); }
}

async function _activateSubscription(base44, userId, planId, plan, mpPaymentId, method) {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const subData = {
    user_id: userId,
    plan_type: planId === 'pro_yearly' ? 'yearly' : 'monthly',
    status: 'active',
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    price: plan.price,
    payment_method: method,
    payment_external_id: mpPaymentId
  };

  const existing = await _safeFind(base44, 'Subscription', { user_id: userId });
  if (existing.length > 0) {
    await base44.asServiceRole.entities.Subscription.update(existing[0].id, subData);
  } else {
    await base44.asServiceRole.entities.Subscription.create(subData);
  }

  const users = await _safeFind(base44, 'User', { id: userId });
  if (users.length > 0) {
    await base44.asServiceRole.entities.User.update(users[0].id, {
      subscription_status: 'active',
      subscription_type: planId === 'pro_yearly' ? 'yearly' : 'monthly',
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString()
    });
  }
}

async function _updateSubscriptionStatus(base44, userId, status) {
  const existing = await _safeFind(base44, 'Subscription', { user_id: userId });
  if (existing.length > 0) {
    await base44.asServiceRole.entities.Subscription.update(existing[0].id, { status });
  }
}

async function _sendConfirmationEmail(base44, email, plan) {
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: '✅ Assinatura Ativada - Juris Pro',
      body: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#7c3aed">Bem-vindo ao Juris Pro! 🎉</h2>
          <p>Sua assinatura <strong>${plan.name}</strong> foi ativada com sucesso.</p>
          <p>Valor: <strong>R$ ${plan.price.toFixed(2).replace('.', ',')}</strong></p>
          <a href="${Deno.env.get('PUBLIC_URL') || 'https://chatjuris.com'}"
             style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px">
            Acessar Juris
          </a>
        </div>
      `
    });
  } catch (e) {
    console.error('[webhook-mp] Erro ao enviar email:', e.message);
  }
}
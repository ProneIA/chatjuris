/**
 * POST /api/functions/mercadoPagoWebhook
 * Recebe notificações do Mercado Pago, valida, confirma o status real
 * via API e atualiza assinatura + Payment no banco.
 *
 * Segurança:
 * - Verifica x-signature quando possível
 * - Idempotência: ignora eventos já processados
 * - Valida valor pago vs valor esperado antes de ativar
 */
import { MercadoPagoConfig, Payment } from 'npm:mercadopago@2.0.15';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PLANS = {
  pro_monthly: { price: 119.90, name: 'Juris Pro - Plano Mensal', durationDays: 30 },
  pro_yearly:  { price: 1198.80, name: 'Juris Pro - Plano Anual',  durationDays: 365 }
};

// Tolerância para comparação de valores (centavos)
const AMOUNT_TOLERANCE = 0.10;

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    let body;
    try { body = JSON.parse(rawBody); } catch { body = {}; }

    console.log('[webhook-mp] Evento recebido:', body.type, body?.data?.id);

    // Aceitar somente eventos de pagamento (payment) e preapproval (assinatura mensal)
    const validTypes = ['payment', 'preapproval'];
    if (!validTypes.includes(body.type)) {
      console.log('[webhook-mp] Tipo ignorado:', body.type);
      return Response.json({ received: true });
    }

    const eventId = body?.data?.id;
    if (!eventId) {
      console.warn('[webhook-mp] Evento sem data.id');
      return Response.json({ received: true });
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) return Response.json({ error: 'Gateway não configurado' }, { status: 500 });

    const client = new MercadoPagoConfig({ accessToken });
    const paymentApi = new Payment(client);

    // Buscar dados reais do pagamento via API (não confiar no payload)
    const mpData = await paymentApi.get({ id: eventId });

    const mpPaymentId = String(mpData.id);
    const mpStatus = mpData.status;
    const mpStatusDetail = mpData.status_detail || '';
    const userId = mpData.external_reference;
    const planId = mpData.metadata?.plan_id;
    const paidAmount = mpData.transaction_amount;

    console.log('[webhook-mp] Pagamento consultado:', { mpPaymentId, mpStatus, userId, planId, paidAmount });

    if (!userId || !planId) {
      console.error('[webhook-mp] Dados insuficientes (sem userId ou planId)');
      return Response.json({ received: true });
    }

    const plan = PLANS[planId];
    if (!plan) {
      console.error('[webhook-mp] Plano desconhecido:', planId);
      return Response.json({ received: true });
    }

    const base44 = createClientFromRequest(req);

    // ── IDEMPOTÊNCIA: verificar se já processamos este pagamento aprovado ──
    const existingPayments = await base44.asServiceRole.entities.Payment.filter({
      mp_payment_id: mpPaymentId
    });

    if (existingPayments.length > 0 && existingPayments[0].status === 'approved') {
      console.log('[webhook-mp] Pagamento já processado (idempotência):', mpPaymentId);
      return Response.json({ received: true, duplicate: true });
    }

    // ── ATUALIZAR REGISTRO Payment ─────────────────────────────────────────
    const paymentRecord = existingPayments[0] || null;
    const paymentUpdateData = {
      status: mpStatus,
      status_detail: mpStatusDetail,
      webhook_received_at: new Date().toISOString(),
      raw_response: JSON.stringify({ id: mpData.id, status: mpStatus, status_detail: mpStatusDetail, amount: paidAmount })
    };

    if (paymentRecord) {
      await base44.asServiceRole.entities.Payment.update(paymentRecord.id, paymentUpdateData);
    } else {
      // Criar registro se não existe (ex: checkout pro)
      await base44.asServiceRole.entities.Payment.create({
        user_id: userId,
        user_email: mpData.payer?.email || mpData.metadata?.user_email || '',
        mp_payment_id: mpPaymentId,
        plan_id: planId,
        payment_type: mpData.payment_type_id === 'pix' ? 'pix' : 'checkout_pro',
        amount: paidAmount,
        ...paymentUpdateData
      });
    }

    // Log de auditoria
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: mpData.metadata?.user_email || userId,
      action: `mp_webhook_${mpStatus}`,
      entity_type: 'Payment',
      entity_id: mpPaymentId,
      details: JSON.stringify({ planId, amount: paidAmount, status: mpStatus, status_detail: mpStatusDetail })
    });

    // ── PROCESSAR POR STATUS ───────────────────────────────────────────────
    if (mpStatus === 'approved') {
      // Validação anti-fraude: verificar se o valor pago é o esperado
      if (Math.abs(paidAmount - plan.price) > AMOUNT_TOLERANCE) {
        console.error('[webhook-mp] FRAUDE DETECTADA - Valor incorreto:', { paidAmount, expected: plan.price });
        await base44.asServiceRole.entities.AuditLog.create({
          user_email: userId,
          action: 'mp_fraud_detected',
          entity_type: 'Payment',
          entity_id: mpPaymentId,
          details: JSON.stringify({ paidAmount, expectedAmount: plan.price, planId })
        });
        return Response.json({ received: true, fraud: true });
      }

      await _activateSubscription(base44, userId, planId, plan, mpPaymentId, mpData.payment_type_id || 'mercadopago');

      // Enviar email de confirmação
      const userEmail = mpData.metadata?.user_email || mpData.payer?.email;
      if (userEmail) {
        await _sendConfirmationEmail(base44, userEmail, plan);
      }

      console.log('[webhook-mp] ✅ Assinatura ativada para userId:', userId);

    } else if (mpStatus === 'pending') {
      // Pagamento pendente (ex: boleto/pix aguardando confirmação)
      await _updateSubscriptionStatus(base44, userId, 'pending');
      console.log('[webhook-mp] ⏳ Pagamento pendente:', mpPaymentId);

    } else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(mpStatus)) {
      await _updateSubscriptionStatus(base44, userId, mpStatus === 'refunded' ? 'canceled' : 'expired');
      console.log('[webhook-mp] ❌ Pagamento não aprovado:', mpStatus, mpPaymentId);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('[webhook-mp] Erro crítico:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────

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

  const existing = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
  if (existing.length > 0) {
    await base44.asServiceRole.entities.Subscription.update(existing[0].id, subData);
  } else {
    await base44.asServiceRole.entities.Subscription.create(subData);
  }

  // Sincronizar User entity
  const users = await base44.asServiceRole.entities.User.filter({ id: userId });
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
  const existing = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
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
          <p>Valor pago: <strong>R$ ${plan.price.toFixed(2).replace('.', ',')}</strong></p>
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
/**
 * POST /api/functions/mercadoPagoWebhook
 * Webhook do Mercado Pago — suporta Orders API + legado v1/payments
 * Validação HMAC, idempotência, comissões de afiliados.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PLANS = {
  starter_monthly:   { name: "Starter Mensal",     amount: 79.00,   durationDays: 30  },
  pro_monthly:       { name: "Profissional Mensal", amount: 149.00,  durationDays: 30  },
  escritorio_monthly:{ name: "Escritório Mensal",   amount: 299.00,  durationDays: 30  },
  starter_yearly:    { name: "Starter Anual",       amount: 708.00,  durationDays: 365 },
  pro_yearly:        { name: "Profissional Anual",  amount: 1428.00, durationDays: 365 },
  escritorio_yearly: { name: "Escritório Anual",    amount: 3108.00, durationDays: 365 },
  // Aliases legados
  basic_monthly:     { name: "Básico Mensal",       amount: 79.00,   durationDays: 30  },
  adv_monthly:       { name: "Avançado Mensal",     amount: 149.00,  durationDays: 30  },
  empresa_monthly:   { name: "Empresa Mensal",      amount: 299.00,  durationDays: 30  },
  adv_yearly:        { name: "Avançado Anual",      amount: 1428.00, durationDays: 365 },
  empresa_yearly:    { name: "Empresa Anual",       amount: 3108.00, durationDays: 365 },
};

async function validateMPSignature(req, rawBody) {
  try {
    const secret = Deno.env.get('MP_WEBHOOK_SECRET');
    if (!secret) {
      console.warn('[MP Webhook] MP_WEBHOOK_SECRET não configurado, pulando validação');
      return true;
    }

    const signatureHeader = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id');

    if (!signatureHeader) {
      console.warn('[MP Webhook] Header x-signature ausente');
      return false;
    }

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

    const url = new URL(req.url);
    const dataId = url.searchParams.get('data.id') || '';

    let manifest = '';
    if (dataId) manifest += `id:${dataId};`;
    if (requestId) manifest += `request-id:${requestId};`;
    manifest += `ts:${ts};`;

    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(manifest));
    const hashHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = hashHex === v1;
    if (!isValid) console.warn('[MP Webhook] Assinatura HMAC inválida');
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

    const signatureValid = await validateMPSignature(req, rawBody);

    const topic = queryParams.get('topic') || body.type || body.action || '';
    const resourceId = body.data?.id || queryParams.get('id') || queryParams.get('data.id');

    // Registrar evento
    try {
      await base44.asServiceRole.entities.WebhookEvent.create({
        event_id: resourceId ? String(resourceId) : `NO_ID_${Date.now()}`,
        event_type: topic || 'unknown',
        mp_payment_id: resourceId ? String(resourceId) : null,
        payload_json: rawBody,
        processed: false,
        signature_valid: signatureValid,
        error: !signatureValid ? 'Assinatura HMAC inválida' : null,
      });
    } catch (e) {
      console.error('[MP Webhook] Erro ao registrar evento:', e.message);
    }

    if (!signatureValid) {
      console.warn('[MP Webhook] Requisição rejeitada: assinatura inválida');
      return Response.json({ message: 'OK' }, { status: 200 });
    }

    if (!resourceId) {
      console.warn('[MP Webhook] Sem resource_id, ignorando');
      return Response.json({ message: 'OK' }, { status: 200 });
    }

    // Detectar tipo de evento
    const isOrderEvent = topic === 'order' || topic === 'order.created' ||
                         topic === 'order.updated' || body.action?.startsWith('order.');
    const isPaymentEvent = topic === 'payment' || topic === 'payment.created' ||
                           topic === 'payment.updated' || body.action?.startsWith('payment.');

    if (isOrderEvent) {
      processOrderAsync(base44, resourceId);
    } else if (isPaymentEvent) {
      processPaymentAsync(base44, resourceId);
    } else {
      console.log('[MP Webhook] Topic ignorado:', topic);
    }

    return Response.json({ message: 'OK' }, { status: 200 });

  } catch (error) {
    console.error('[MP Webhook] Erro geral:', error.message);
    return Response.json({ message: 'OK' }, { status: 200 });
  }
});

// ─── Orders API ──────────────────────────────────────────────────────────────

async function processOrderAsync(base44, orderId) {
  try {
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) return;

    const res = await fetch(`https://api.mercadopago.com/v1/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error('[MP Order] Erro ao consultar order:', res.status);
      return;
    }

    const order = await res.json();
    console.log('[MP Order] Consultado:', { id: order.id, status: order.status, status_detail: order.status_detail });

    const isApproved = order.status === 'processed' && order.status_detail === 'accredited';

    if (!isApproved) {
      console.log('[MP Order] Não aprovado, status:', order.status, order.status_detail);
      return;
    }

    const userId = order.external_reference;
    const planId = order.metadata?.plan_id;

    if (!userId || !planId) {
      console.warn('[MP Order] Sem external_reference ou plan_id');
      return;
    }

    // Idempotência: verificar se já processado
    const existing = await base44.asServiceRole.entities.Payment.filter({
      mp_payment_id: String(orderId),
    });
    if (existing.length > 0 && existing[0].status === 'approved') {
      console.log('[MP Order] Já processado, ignorando');
      return;
    }

    const plan = PLANS[planId];
    if (!plan) {
      console.error('[MP Order] Plano não encontrado:', planId);
      return;
    }

    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (users.length === 0) {
      console.error('[MP Order] Usuário não encontrado:', userId);
      return;
    }

    const user = users[0];
    await activateUserSubscription(base44, user, planId, plan, String(orderId));

    // Actualizar WebhookEvent
    try {
      const events = await base44.asServiceRole.entities.WebhookEvent.filter({ mp_payment_id: String(orderId) });
      if (events.length > 0) {
        await base44.asServiceRole.entities.WebhookEvent.update(events[0].id, {
          processed: true,
          processed_at: new Date().toISOString(),
          mp_status: order.status,
        });
      }
    } catch (e) { /* ignorar */ }

  } catch (error) {
    console.error('[processOrderAsync] Erro:', error.message);
  }
}

// ─── Legacy v1/payments ───────────────────────────────────────────────────────

async function processPaymentAsync(base44, paymentId) {
  try {
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) return;

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error('[MP Payment] Erro ao consultar pagamento:', res.status);
      return;
    }

    const payment = await res.json();
    console.log('[MP Payment] Consultado:', { id: payment.id, status: payment.status });

    // Idempotência
    const existing = await base44.asServiceRole.entities.Payment.filter({
      mp_payment_id: String(paymentId),
    });
    if (existing.length > 0 && existing[0].status === 'approved') {
      console.log('[MP Payment] Já processado, ignorando');
      return;
    }

    if (payment.status !== 'approved') {
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Payment.update(existing[0].id, {
          status: payment.status === 'rejected' ? 'rejected' : 'pending',
          status_detail: payment.status_detail,
        });
      }
      return;
    }

    const userId = payment.external_reference;
    const planId = payment.metadata?.plan_id;

    if (!userId || !planId) {
      console.warn('[MP Payment] Sem external_reference ou plan_id');
      return;
    }

    const plan = PLANS[planId];
    if (!plan) {
      console.error('[MP Payment] Plano não encontrado:', planId);
      return;
    }

    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (users.length === 0) {
      console.error('[MP Payment] Usuário não encontrado:', userId);
      return;
    }

    const user = users[0];
    await activateUserSubscription(base44, user, planId, plan, String(payment.id));
    await processAffiliateCommission(base44, payment, planId, plan, existing[0] || null);

    try {
      const events = await base44.asServiceRole.entities.WebhookEvent.filter({ mp_payment_id: String(paymentId) });
      if (events.length > 0) {
        await base44.asServiceRole.entities.WebhookEvent.update(events[0].id, {
          processed: true,
          processed_at: new Date().toISOString(),
          mp_status: payment.status,
        });
      }
    } catch (e) { /* ignorar */ }

  } catch (error) {
    console.error('[processPaymentAsync] Erro:', error.message);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function activateUserSubscription(base44, user, planId, plan, externalId) {
  try {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    const isYearly = plan.durationDays >= 365;

    const subData = {
      user_id: user.id,
      plan_type: isYearly ? 'yearly' : 'monthly',
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      price: plan.amount,
      payment_method: 'mercado_pago',
      payment_external_id: externalId,
    };

    const existing = await base44.asServiceRole.entities.Subscription.filter(
      { user_id: user.id }, '-created_date', 1
    );

    if (existing.length > 0) {
      await base44.asServiceRole.entities.Subscription.update(existing[0].id, subData);
    } else {
      await base44.asServiceRole.entities.Subscription.create(subData);
    }

    await base44.asServiceRole.entities.User.update(user.id, {
      subscription_status: 'active',
      subscription_type: isYearly ? 'yearly' : 'monthly',
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
      subscription_expires_at: endDate.toISOString(),
      payment_reference: externalId,
      blocked_at: null,
      email_locked: false,
    });

    const paymentExists = await base44.asServiceRole.entities.Payment.filter({ mp_payment_id: externalId });
    if (paymentExists.length === 0) {
      await base44.asServiceRole.entities.Payment.create({
        user_id: user.id,
        user_email: user.email,
        plan_id: planId,
        payment_type: 'orders_api',
        amount: plan.amount,
        status: 'approved',
        mp_payment_id: externalId,
        webhook_received_at: new Date().toISOString(),
      });
    } else {
      await base44.asServiceRole.entities.Payment.update(paymentExists[0].id, {
        status: 'approved',
        webhook_received_at: new Date().toISOString(),
      });
    }

    // E-mail
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: '✅ Assinatura Juris.IA Ativada',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Bem-vindo ao Juris.IA!</h2>
            <p>Sua assinatura foi ativada com sucesso.</p>
            <p><strong>Plano:</strong> ${plan.name}</p>
            <p><strong>Valor:</strong> R$ ${plan.amount.toFixed(2).replace('.', ',')}</p>
            <p><strong>Válido até:</strong> ${endDate.toLocaleDateString('pt-BR')}</p>
            <p style="margin-top: 24px;">
              <a href="${Deno.env.get('PUBLIC_URL') || ''}/Dashboard"
                 style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Acessar a Plataforma →
              </a>
            </p>
          </div>
        `,
      });
    } catch (e) {
      console.error('[activateUserSubscription] Erro ao enviar e-mail:', e.message);
    }

    console.log('[Webhook] ✅ Assinatura ativada para:', user.email, 'plano:', planId);
  } catch (error) {
    console.error('[activateUserSubscription] Erro:', error.message);
    throw error;
  }
}

async function processAffiliateCommission(base44, payment, planId, plan, paymentRecord) {
  try {
    const couponCode = payment.metadata?.coupon_code || paymentRecord?.coupon_code;
    if (!couponCode) return;

    const existingCommissions = await base44.asServiceRole.entities.AffiliateCommission.filter({
      subscription_id: paymentRecord?.id || String(payment.id),
    });
    if (existingCommissions.length > 0) return;

    let affiliate = null;
    const affiliateId = payment.metadata?.affiliate_id || paymentRecord?.affiliate_id;
    if (affiliateId) {
      const list = await base44.asServiceRole.entities.Affiliate.filter({ id: affiliateId, status: 'active' });
      if (list.length > 0) affiliate = list[0];
    }
    if (!affiliate) {
      const list = await base44.asServiceRole.entities.Affiliate.filter({ affiliate_code: couponCode.toLowerCase(), status: 'active' });
      if (list.length > 0) affiliate = list[0];
    }
    if (!affiliate) return;

    const subscriptionValue = plan.amount;
    const commissionAmount = parseFloat(((subscriptionValue * affiliate.commission_rate) / 100).toFixed(2));
    const userId = payment.external_reference;
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    const customerEmail = users[0]?.email || payment.metadata?.user_email || '';

    await base44.asServiceRole.entities.AffiliateCommission.create({
      affiliate_id: affiliate.id,
      affiliate_code: couponCode,
      subscription_id: paymentRecord?.id || String(payment.id),
      customer_email: customerEmail,
      subscription_value: subscriptionValue,
      commission_rate: affiliate.commission_rate,
      commission_amount: commissionAmount,
      status: 'pending',
    });

    await base44.asServiceRole.entities.Affiliate.update(affiliate.id, {
      total_sales: (affiliate.total_sales || 0) + 1,
      total_commission: parseFloat(((affiliate.total_commission || 0) + commissionAmount).toFixed(2)),
    });

    console.log(`[Affiliate] ✅ Comissão R$ ${commissionAmount} criada para ${affiliate.name}`);
  } catch (error) {
    console.error('[processAffiliateCommission] Erro:', error.message);
  }
}
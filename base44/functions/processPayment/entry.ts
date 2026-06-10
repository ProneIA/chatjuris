/**
 * POST /api/functions/processPayment
 * Processa pagamento via Mercado Pago Orders API (v1/orders)
 * Apenas cartão de crédito. Valor canônico definido aqui no backend.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PLANS = {
  starter_monthly:   { name: "Starter Mensal",          amount: 79.00,   durationDays: 30,  maxInstallments: 1  },
  pro_monthly:       { name: "Profissional Mensal",      amount: 149.00,  durationDays: 30,  maxInstallments: 1  },
  escritorio_monthly:{ name: "Escritório Mensal",        amount: 299.00,  durationDays: 30,  maxInstallments: 1  },
  starter_yearly:    { name: "Starter Anual",            amount: 708.00,  durationDays: 365, maxInstallments: 12 },
  pro_yearly:        { name: "Profissional Anual",       amount: 1428.00, durationDays: 365, maxInstallments: 12 },
  escritorio_yearly: { name: "Escritório Anual",         amount: 3108.00, durationDays: 365, maxInstallments: 12 },
  // Aliases legados
  basic_monthly:     { name: "Básico Mensal",            amount: 79.00,   durationDays: 30,  maxInstallments: 1  },
  adv_monthly:       { name: "Avançado Mensal",          amount: 149.00,  durationDays: 30,  maxInstallments: 1  },
  empresa_monthly:   { name: "Empresa Mensal",           amount: 299.00,  durationDays: 30,  maxInstallments: 1  },
  adv_yearly:        { name: "Avançado Anual",           amount: 1428.00, durationDays: 365, maxInstallments: 12 },
  empresa_yearly:    { name: "Empresa Anual",            amount: 3108.00, durationDays: 365, maxInstallments: 12 },
};

const STATUS_MESSAGES = {
  cc_rejected_bad_filled_security_code: "Código de segurança (CVV) inválido. Verifique e tente novamente.",
  cc_rejected_bad_filled_date: "Data de vencimento inválida. Verifique e tente novamente.",
  cc_rejected_bad_filled_other: "Dados do cartão incorretos. Verifique e tente novamente.",
  cc_rejected_blacklist: "Cartão não autorizado. Entre em contato com seu banco.",
  cc_rejected_call_for_authorize: "Autorização necessária. Ligue para seu banco para autorizar.",
  cc_rejected_card_disabled: "Cartão desativado. Entre em contato com seu banco.",
  cc_rejected_duplicated_payment: "Pagamento duplicado detectado. Aguarde alguns minutos.",
  cc_rejected_high_risk: "Pagamento recusado por segurança. Tente outro cartão.",
  cc_rejected_insufficient_amount: "Saldo insuficiente. Verifique o limite disponível no cartão.",
  cc_rejected_invalid_installments: "Número de parcelas inválido para este cartão.",
  cc_rejected_max_attempts: "Número de tentativas excedido. Tente novamente amanhã.",
  cc_rejected_other_reason: "Pagamento recusado pelo banco. Tente outro cartão.",
  pending_review_manual: "Pagamento em análise. Você será notificado por e-mail.",
  pending_contingency: "Problema temporário. Aguarde alguns minutos e tente novamente.",
};

function getStatusMessage(statusDetail) {
  return STATUS_MESSAGES[statusDetail] || "Pagamento não aprovado. Tente novamente ou use outro cartão.";
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Método não permitido' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { token, payment_method_id, issuer_id, installments, plan_id, payer, device_id } = body;

    // Validar plano no backend (nunca usa valor do frontend)
    const plan = PLANS[plan_id];
    if (!plan) {
      return Response.json({ error: `Plano inválido: ${plan_id}` }, { status: 400 });
    }

    if (!token) {
      return Response.json({ error: 'Token do cartão ausente' }, { status: 400 });
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'Configuração de pagamento ausente' }, { status: 500 });
    }

    // Calcular parcelas seguramente
    const safeInstallments = plan.maxInstallments === 1
      ? 1
      : Math.min(Math.max(1, Number(installments) || 1), plan.maxInstallments);

    const totalAmount = plan.amount.toFixed(2);

    // Montar payload Orders API
    const orderPayload = {
      type: "online",
      processing_mode: "automatic",
      description: plan.name,
      external_reference: user.id,
      total_amount: totalAmount,
      payer: {
        email: payer?.email || user.email,
        ...(payer?.identification ? { identification: payer.identification } : {}),
      },
      transactions: {
        payments: [
          {
            amount: totalAmount,
            payment_method: {
              id: payment_method_id,
              type: "credit_card",
              token: token,
              installments: safeInstallments,
              ...(issuer_id ? { issuer_id: String(issuer_id) } : {}),
            },
          },
        ],
      },
      metadata: {
        plan_id: plan_id,
        user_id: user.id,
        user_email: user.email,
        ...(device_id ? { device_id } : {}),
      },
    };

    console.log('[processPayment] Chamando Orders API para user:', user.id, 'plano:', plan_id);

    const mpRes = await fetch('https://api.mercadopago.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${user.id}-${plan_id}-${Date.now()}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const order = await mpRes.json();

    console.log('[processPayment] Resposta MP:', {
      status: order.status,
      status_detail: order.status_detail,
      id: order.id,
    });

    if (!mpRes.ok) {
      console.error('[processPayment] Erro HTTP MP:', mpRes.status, JSON.stringify(order));
      return Response.json({
        status: 'error',
        message: order.message || 'Erro ao processar pagamento. Tente novamente.',
      }, { status: 200 }); // 200 para o frontend tratar
    }

    const isApproved = order.status === 'processed' && order.status_detail === 'accredited';

    if (isApproved) {
      // Ativar assinatura no banco
      await activateSubscription(base44, user, plan_id, plan, order.id);

      return Response.json({
        status: 'approved',
        id: order.id,
        message: 'Pagamento aprovado com sucesso!',
      });
    } else {
      const message = getStatusMessage(order.status_detail);
      console.warn('[processPayment] Pagamento não aprovado:', order.status, order.status_detail);

      // Registrar tentativa no banco
      try {
        await base44.asServiceRole.entities.Payment.create({
          user_id: user.id,
          user_email: user.email,
          plan_id: plan_id,
          payment_type: 'orders_api',
          amount: plan.amount,
          status: order.status === 'rejected' ? 'rejected' : 'pending',
          mp_payment_id: order.id ? String(order.id) : null,
          status_detail: order.status_detail || null,
        });
      } catch (e) {
        console.error('[processPayment] Erro ao registrar tentativa:', e.message);
      }

      return Response.json({
        status: order.status || 'rejected',
        status_detail: order.status_detail,
        message,
        id: order.id,
      });
    }

  } catch (error) {
    console.error('[processPayment] Erro:', error.message);
    return Response.json({
      status: 'error',
      message: 'Erro interno ao processar pagamento. Tente novamente.',
    }, { status: 500 });
  }
});

async function activateSubscription(base44, user, plan_id, plan, orderId) {
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
      payment_external_id: String(orderId),
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
      payment_reference: String(orderId),
      blocked_at: null,
      email_locked: false,
    });

    // Registrar Payment
    await base44.asServiceRole.entities.Payment.create({
      user_id: user.id,
      user_email: user.email,
      plan_id: plan_id,
      payment_type: 'orders_api',
      amount: plan.amount,
      status: 'approved',
      mp_payment_id: String(orderId),
    });

    // E-mail de confirmação
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
      console.error('[processPayment] Erro ao enviar e-mail:', e.message);
    }

    console.log('[processPayment] ✅ Assinatura ativada para:', user.email, 'plano:', plan_id);
  } catch (error) {
    console.error('[activateSubscription] Erro:', error.message);
    throw error;
  }
}
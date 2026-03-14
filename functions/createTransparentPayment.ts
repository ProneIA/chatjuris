/**
 * POST /api/functions/createTransparentPayment
 * Checkout Transparente Mercado Pago — 100% backend
 * Suporta: PIX, cartão de crédito, cartão de débito
 * Suporta: cupons fixos e cupons de afiliados
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const PLANS = {
  pro_monthly: {
    name: 'Juris Pro - Plano Mensal',
    description: 'Assinatura mensal da plataforma Juris Pro',
    amount: 119.90,
    durationDays: 30,
    maxInstallments: 1
  },
  pro_yearly: {
    name: 'Juris Pro - Plano Anual',
    description: 'Assinatura anual da plataforma Juris Pro',
    amount: 1198.80,
    durationDays: 365,
    maxInstallments: 12
  }
};

// Cupons fixos do sistema
const SYSTEM_COUPONS = {
  pro_monthly: { JURIS25: 0.25, MENSAL50OFF: 0.50 },
  pro_yearly:  { JURIS50: 0.50 }
};

function validateCPF(cpf) {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder >= 10) remainder = 0;
  if (remainder !== parseInt(clean[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder >= 10) remainder = 0;
  return remainder === parseInt(clean[10]);
}

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
    const { planId, paymentMethod, payerData, cardToken, installments, deviceId, couponCode } = body;

    const plan = PLANS[planId];
    if (!plan) {
      return Response.json({ error: 'Plano inválido' }, { status: 400 });
    }

    const allowedMethods = ['pix', 'credit_card', 'debit_card'];
    if (!allowedMethods.includes(paymentMethod)) {
      return Response.json({ error: 'Método de pagamento não permitido' }, { status: 400 });
    }

    if (!payerData?.fullName || !payerData?.cpf || !payerData?.email) {
      return Response.json({ error: 'Dados do pagador incompletos (nome, CPF, email)' }, { status: 400 });
    }

    if (!validateCPF(payerData.cpf)) {
      return Response.json({ error: 'CPF inválido' }, { status: 400 });
    }

    if ((paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && !cardToken) {
      return Response.json({ error: 'Token do cartão obrigatório' }, { status: 400 });
    }

    // ✅ Validar e aplicar cupom no backend
    let finalAmount = plan.amount;
    let discountAmount = 0;
    let appliedCouponCode = null;
    let affiliateId = null;
    let couponType = null;

    if (couponCode && couponCode.trim()) {
      const couponUpper = couponCode.trim().toUpperCase();
      const couponLower = couponCode.trim().toLowerCase();

      // Checar cupons fixos
      const planCoupons = SYSTEM_COUPONS[planId] || {};
      if (planCoupons[couponUpper]) {
        const discountRate = planCoupons[couponUpper];
        discountAmount = parseFloat((plan.amount * discountRate).toFixed(2));
        finalAmount = Math.max(parseFloat((plan.amount - discountAmount).toFixed(2)), 0.01);
        appliedCouponCode = couponUpper;
        couponType = 'system';
        console.log(`[MP] Cupom sistema ${couponCode}: ${discountRate * 100}% OFF — R$ ${finalAmount}`);
      } else {
        // Checar cupons de afiliados
        const affiliates = await base44.asServiceRole.entities.Affiliate.filter({
          affiliate_code: couponLower,
          status: 'active'
        });

        if (affiliates.length > 0) {
          const affiliate = affiliates[0];

          // 🛡️ Antifraude: afiliado não pode comprar com próprio cupom
          if (affiliate.user_email === user.email) {
            return Response.json({ error: 'Você não pode usar o seu próprio cupom de afiliado' }, { status: 400 });
          }

          const discountRate = (affiliate.commission_rate || 0) / 100;
          discountAmount = parseFloat((plan.amount * discountRate).toFixed(2));
          finalAmount = Math.max(parseFloat((plan.amount - discountAmount).toFixed(2)), 0.01);
          appliedCouponCode = couponLower;
          affiliateId = affiliate.id;
          couponType = 'affiliate';
          console.log(`[MP] Cupom afiliado ${couponCode} (${affiliate.name}): ${affiliate.commission_rate}% OFF — R$ ${finalAmount}`);
        } else {
          console.warn(`[MP] Cupom inválido ignorado: ${couponCode}`);
        }
      }
    }

    let finalInstallments = 1;
    if (paymentMethod === 'credit_card') {
      finalInstallments = Math.max(1, Math.min(parseInt(installments) || 1, plan.maxInstallments));
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'Gateway não configurado' }, { status: 500 });
    }

    const idempotencyKey = crypto.randomUUID();
    const nameParts = payerData.fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Usuario';
    const cpfClean = payerData.cpf.replace(/\D/g, '');

    const paymentPayload = {
      transaction_amount: finalAmount,
      description: plan.description,
      external_reference: user.id,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_id: planId,
        coupon_code: appliedCouponCode || null,
        affiliate_id: affiliateId || null,
        idempotency_key: idempotencyKey
      },
      payer: {
        email: payerData.email || user.email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: 'CPF',
          number: cpfClean
        }
      }
    };

    if (paymentMethod === 'pix') {
      paymentPayload.payment_method_id = 'pix';
      paymentPayload.date_of_expiration = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else if (paymentMethod === 'credit_card') {
      paymentPayload.token = cardToken;
      paymentPayload.installments = finalInstallments;
      paymentPayload.capture = true;
    } else if (paymentMethod === 'debit_card') {
      paymentPayload.token = cardToken;
      paymentPayload.installments = 1;
      paymentPayload.capture = true;
    }

    if (deviceId) {
      paymentPayload.additional_info = {
        payer: { first_name: firstName, last_name: lastName },
        device: { fingerprint: { os: 'Browser', vendor_ids: [], model: 'Macintosh', vendor_specific_attributes: {}, resolution: 'N/A', ram: 0 }, id: deviceId }
      };
    }

    // Registrar intenção de pagamento com coupon_code e affiliate_id
    const paymentRecord = await base44.asServiceRole.entities.Payment.create({
      user_id: user.id,
      user_email: user.email,
      plan_id: planId,
      payment_type: paymentMethod === 'pix' ? 'pix' : 'credit_card',
      amount: finalAmount,
      coupon_code: appliedCouponCode || null,
      affiliate_id: affiliateId || null,
      discount_amount: discountAmount || null,
      status: 'pending',
      idempotency_key: idempotencyKey
    });

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
        'X-meli-session-id': deviceId || ''
      },
      body: JSON.stringify(paymentPayload)
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('[MP] Erro ao criar pagamento:', JSON.stringify(mpData));
      await base44.asServiceRole.entities.Payment.update(paymentRecord.id, {
        status: 'rejected',
        raw_response: JSON.stringify(mpData)
      });
      return Response.json({
        error: mpData.message || 'Erro ao processar pagamento',
        cause: mpData.cause || []
      }, { status: 422 });
    }

    await base44.asServiceRole.entities.Payment.update(paymentRecord.id, {
      mp_payment_id: String(mpData.id),
      status: mpData.status === 'approved' ? 'approved' : (mpData.status === 'rejected' ? 'rejected' : 'pending'),
      status_detail: mpData.status_detail,
      raw_response: JSON.stringify({ id: mpData.id, status: mpData.status, status_detail: mpData.status_detail })
    });

    if (mpData.status === 'approved') {
      await activateSubscription(base44, user, planId, plan, String(mpData.id));
      // Processar comissão de afiliado imediatamente se aprovado
      if (affiliateId && couponType === 'affiliate' && appliedCouponCode) {
        await processAffiliateCommission(base44, paymentRecord.id, appliedCouponCode, plan.amount, user.email, affiliateId);
      }
    }

    const response = {
      success: true,
      paymentId: mpData.id,
      status: mpData.status,
      statusDetail: mpData.status_detail
    };

    if (paymentMethod === 'pix' && mpData.point_of_interaction?.transaction_data) {
      const txData = mpData.point_of_interaction.transaction_data;
      response.pix = {
        qrCode: txData.qr_code_base64,
        qrCodeText: txData.qr_code,
        expiresAt: paymentPayload.date_of_expiration
      };

      await base44.asServiceRole.entities.Payment.update(paymentRecord.id, {
        pix_qr_code: txData.qr_code_base64,
        pix_qr_code_text: txData.qr_code,
        pix_expiration: paymentPayload.date_of_expiration
      });
    }

    if (mpData.three_ds_info?.external_resource_url) {
      response.threeDsUrl = mpData.three_ds_info.external_resource_url;
    }

    return Response.json(response);

  } catch (error) {
    console.error('[createTransparentPayment] Erro:', error.message);
    return Response.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
});

async function activateSubscription(base44, user, planId, plan, mpPaymentId) {
  try {
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
      payment_external_id: mpPaymentId
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

    console.log('[MP] ✅ Assinatura ativada imediatamente para:', user.email);
  } catch (e) {
    console.error('[activateSubscription] Erro:', e.message);
  }
}

async function processAffiliateCommission(base44, paymentId, affiliateCode, subscriptionValue, customerEmail, affiliateId) {
  try {
    const affiliates = await base44.asServiceRole.entities.Affiliate.filter({
      id: affiliateId,
      status: 'active'
    });

    if (affiliates.length === 0) {
      console.log('[Affiliate] Afiliado não encontrado:', affiliateId);
      return;
    }

    const affiliate = affiliates[0];
    const commissionAmount = parseFloat(((subscriptionValue * affiliate.commission_rate) / 100).toFixed(2));

    await base44.asServiceRole.entities.AffiliateCommission.create({
      affiliate_id: affiliate.id,
      affiliate_code: affiliateCode,
      subscription_id: paymentId,
      customer_email: customerEmail,
      subscription_value: subscriptionValue,
      commission_rate: affiliate.commission_rate,
      commission_amount: commissionAmount,
      status: 'pending'
    });

    await base44.asServiceRole.entities.Affiliate.update(affiliate.id, {
      total_sales: (affiliate.total_sales || 0) + 1,
      total_commission: parseFloat(((affiliate.total_commission || 0) + commissionAmount).toFixed(2))
    });

    // Atualizar Payment com affiliate_id confirmado
    await base44.asServiceRole.entities.Payment.update(paymentId, {
      affiliate_id: affiliate.id
    });

    console.log(`[Affiliate] ✅ Comissão R$ ${commissionAmount} criada para ${affiliate.name}`);
  } catch (error) {
    console.error('[processAffiliateCommission] Erro:', error.message);
  }
}
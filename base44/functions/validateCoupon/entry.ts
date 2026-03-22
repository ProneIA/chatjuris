/**
 * POST /api/functions/validateCoupon
 * Valida cupons fixos E cupons de afiliados (buscando no banco)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const PLANS = {
  pro_monthly: { price: 119.90 },
  pro_yearly:  { price: 1198.80 }
};

// Cupons fixos do sistema (não afiliados)
const SYSTEM_COUPONS = {
  pro_monthly: { JURIS25: 0.25, MENSAL50OFF: 0.50 },
  pro_yearly:  { JURIS50: 0.50 }
};

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const { planId, couponCode } = await req.json();

    if (!planId || !couponCode) {
      return Response.json({ valid: false, message: 'Plano e cupom são obrigatórios' }, { status: 400, headers });
    }

    const plan = PLANS[planId];
    if (!plan) {
      return Response.json({ valid: false, message: 'Plano inválido' }, { status: 400, headers });
    }

    const couponUpper = couponCode.trim().toUpperCase();
    const couponLower = couponCode.trim().toLowerCase();

    // 1️⃣ Checar cupons fixos do sistema
    const planCoupons = SYSTEM_COUPONS[planId] || {};
    if (planCoupons[couponUpper]) {
      const discountRate = planCoupons[couponUpper];
      const discountAmount = parseFloat((plan.price * discountRate).toFixed(2));
      const finalPrice = parseFloat((plan.price - discountAmount).toFixed(2));

      return Response.json({
        valid: true,
        type: 'system',
        discount_percentage: discountRate * 100,
        discount_amount: discountAmount,
        original_price: plan.price,
        final_price: finalPrice,
        message: `Cupom aplicado: ${discountRate * 100}% de desconto`
      }, { headers });
    }

    // 2️⃣ Checar cupons de afiliados (busca no banco pelo affiliate_code)
    const affiliates = await base44.asServiceRole.entities.Affiliate.filter({
      affiliate_code: couponLower,
      status: 'active'
    });

    if (affiliates.length === 0) {
      return Response.json({ valid: false, message: 'Cupom inválido ou expirado' }, { status: 400, headers });
    }

    const affiliate = affiliates[0];

    // 🛡️ Antifraude: afiliado não pode usar o próprio cupom
    if (affiliate.user_email === user.email) {
      return Response.json({ valid: false, message: 'Você não pode usar o seu próprio cupom de afiliado' }, { status: 400, headers });
    }

    const discountRate = (affiliate.commission_rate || 0) / 100;
    const discountAmount = parseFloat((plan.price * discountRate).toFixed(2));
    const finalPrice = parseFloat((plan.price - discountAmount).toFixed(2));

    return Response.json({
      valid: true,
      type: 'affiliate',
      affiliate_id: affiliate.id,
      affiliate_code: affiliate.affiliate_code,
      discount_percentage: affiliate.commission_rate,
      discount_amount: discountAmount,
      original_price: plan.price,
      final_price: finalPrice,
      message: `Cupom de afiliado aplicado: ${affiliate.commission_rate}% de desconto`
    }, { headers });

  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    return Response.json({ error: error.message }, { status: 500, headers });
  }
});
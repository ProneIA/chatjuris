import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { processAffiliateCommission } from './processAffiliateCommission.js';

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      return Response.json({ 
        error: 'Mercado Pago não configurado' 
      }, { status: 500, headers });
    }

    const body = await req.json();
    const { formData, planId, userEmail, affiliateCode } = body;

    const priceMap = {
      pro_monthly: 119.9,
      pro_yearly: 1198.8
    };

    const price = priceMap[planId];
    if (!price) {
      return Response.json({ error: 'Plano inválido' }, { status: 400, headers });
    }

    // Criar pagamento com dados do CardPayment
    const paymentData = {
      transaction_amount: price,
      token: formData.token,
      installments: formData.installments,
      payment_method_id: formData.payment_method_id,
      issuer_id: formData.issuer_id,
      payer: {
        email: userEmail
      },
      metadata: {
        plan_id: planId,
        user_email: userEmail,
        affiliate_code: affiliateCode || null
      }
    };

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${user.id}-card-${Date.now()}`
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mercado Pago Error:', data);
      return Response.json({ 
        status: 'error',
        error: data.message || 'Erro ao processar pagamento',
        details: data
      }, { status: response.status, headers });
    }

    // Buscar afiliado se houver código
    let affiliateId = null;
    if (affiliateCode) {
      try {
        const affiliates = await base44.asServiceRole.entities.Affiliate.filter({ 
          affiliate_code: affiliateCode,
          status: 'active'
        });
        if (affiliates.length > 0) {
          affiliateId = affiliates[0].id;
        }
      } catch (e) {
        console.error('Erro ao buscar afiliado:', e);
      }
    }

    // Atualizar subscription
    if (data.status === 'approved') {
      try {
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id: user.id });
        
        const subscriptionData = {
          plan: planId,
          status: 'active',
          payment_status: 'paid',
          payment_method: 'credit_card',
          payment_external_id: data.id.toString(),
          price,
          daily_actions_limit: 999999,
          daily_actions_used: 0,
          affiliate_id: affiliateId,
          affiliate_code: affiliateCode,
          start_date: new Date().toISOString().split('T')[0],
          last_reset_date: new Date().toISOString().split('T')[0]
        };

        let subscriptionId;
        if (subscriptions.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, subscriptionData);
          subscriptionId = subscriptions[0].id;
        } else {
          const newSub = await base44.asServiceRole.entities.Subscription.create({
            user_id: user.id,
            ...subscriptionData
          });
          subscriptionId = newSub.id;
        }

        // Processar comissão do afiliado se houver
        if (affiliateCode) {
          await processAffiliateCommission(
            base44,
            subscriptionId,
            affiliateCode,
            price,
            userEmail
          );
        }
      } catch (dbError) {
        console.error('Database Error:', dbError);
      }
    }

    return Response.json({
      status: data.status,
      payment_id: data.id,
      has_affiliate: !!affiliateCode
    }, { headers });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      status: 'error',
      error: error.message 
    }, { status: 500, headers });
  }
});
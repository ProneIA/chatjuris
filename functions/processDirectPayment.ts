import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
        user_email: userEmail
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
    let affiliateData = null;
    if (affiliateCode) {
      try {
        const affiliates = await base44.asServiceRole.entities.Affiliate.filter({ 
          affiliate_code: affiliateCode,
          status: 'active'
        });
        if (affiliates.length > 0) {
          affiliateData = affiliates[0];
          affiliateId = affiliateData.id;
          console.log('Afiliado encontrado:', affiliateCode, affiliateId);
        }
      } catch (err) {
        console.error('Erro ao buscar afiliado:', err);
      }
    }

    // Atualizar subscription se aprovado
    if (data.status === 'approved') {
      try {
        const subscriptions = await base44.entities.Subscription.filter({ user_id: user.id });
        
        const subscriptionData = {
          plan: planId,
          status: 'active',
          payment_status: 'paid',
          payment_method: 'credit_card',
          payment_external_id: data.id.toString(),
          price,
          daily_actions_limit: 999999,
          daily_actions_used: 0,
          start_date: new Date().toISOString().split('T')[0],
          last_reset_date: new Date().toISOString().split('T')[0],
          ...(affiliateId && { affiliate_id: affiliateId, affiliate_code: affiliateCode })
        };
        
        let subscriptionId;
        if (subscriptions.length > 0) {
          await base44.entities.Subscription.update(subscriptions[0].id, subscriptionData);
          subscriptionId = subscriptions[0].id;
        } else {
          const newSub = await base44.entities.Subscription.create({
            user_id: user.id,
            ...subscriptionData
          });
          subscriptionId = newSub.id;
        }

        // Criar comissão se houver afiliado
        if (affiliateId && affiliateData) {
          const commissionAmount = price * (affiliateData.commission_rate / 100);
          
          await base44.asServiceRole.entities.AffiliateCommission.create({
            affiliate_id: affiliateId,
            affiliate_code: affiliateCode,
            subscription_id: subscriptionId,
            customer_email: userEmail,
            subscription_value: price,
            commission_rate: affiliateData.commission_rate,
            commission_amount: commissionAmount,
            status: 'pending'
          });

          // Atualizar totais do afiliado
          await base44.asServiceRole.entities.Affiliate.update(affiliateId, {
            total_sales: (affiliateData.total_sales || 0) + 1,
            total_commission: (affiliateData.total_commission || 0) + commissionAmount
          });

          console.log('Comissão criada:', commissionAmount, 'para afiliado:', affiliateCode);
        }
      } catch (dbError) {
        console.error('Database Error:', dbError);
      }
    }

    return Response.json({
      status: data.status,
      payment_id: data.id
    }, { headers });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      status: 'error',
      error: error.message 
    }, { status: 500, headers });
  }
});
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
    const { planId, userEmail, userName, affiliateCode } = body;

    const priceMap = {
      pro_monthly: 119.9,
      pro_yearly: 1198.8
    };

    const price = priceMap[planId];
    if (!price) {
      return Response.json({ error: 'Plano inválido' }, { status: 400, headers });
    }

    // Criar pagamento PIX no Mercado Pago
    const paymentData = {
      transaction_amount: price,
      description: `Assinatura ${planId === 'pro_monthly' ? 'Mensal' : 'Anual'} - Juris`,
      payment_method_id: 'pix',
      payer: {
        email: userEmail,
        first_name: userName || userEmail.split('@')[0]
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
        'X-Idempotency-Key': `${user.id}-pix-${Date.now()}`
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mercado Pago Error:', data);
      return Response.json({ 
        success: false,
        error: data.message || 'Erro ao criar pagamento PIX'
      }, { status: response.status, headers });
    }

    // Extrair QR Code
    const qrCode = data.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;

    if (!qrCode || !qrCodeBase64) {
      console.error('QR Code não gerado:', data);
      return Response.json({ 
        success: false,
        error: 'QR Code não foi gerado pelo Mercado Pago'
      }, { status: 500, headers });
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

    // Criar ou atualizar subscription com status pending
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id: user.id });
    
    const subscriptionData = {
      user_id: user.id,
      plan: planId,
      status: 'pending',
      payment_status: 'pending',
      payment_method: 'pix',
      payment_external_id: data.id.toString(),
      price,
      daily_actions_limit: 999999,
      daily_actions_used: 0,
      affiliate_id: affiliateId,
      affiliate_code: affiliateCode,
      start_date: new Date().toISOString().split('T')[0],
      last_reset_date: new Date().toISOString().split('T')[0]
    };

    if (subscriptions.length > 0) {
      await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, subscriptionData);
    } else {
      await base44.asServiceRole.entities.Subscription.create(subscriptionData);
    }

    return Response.json({
      success: true,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      payment_id: data.id,
      has_affiliate: !!affiliateCode
    }, { headers });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500, headers });
  }
});
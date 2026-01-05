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

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ 
        error: 'Mercado Pago não configurado' 
      }, { status: 500, headers });
    }

    const body = await req.json();
    const { planId, userEmail, userName } = body;

    const priceMap = {
      pro_monthly: 119.9,
      pro_yearly: 1198.8
    };

    const price = priceMap[planId];
    if (!price) {
      return Response.json({ error: 'Plano inválido' }, { status: 400, headers });
    }

    const firstName = userName?.split(' ')[0] || 'Cliente';

    const pixPayment = {
      transaction_amount: price,
      description: `Plano ${planId}`,
      payment_method_id: 'pix',
      payer: {
        email: userEmail,
        first_name: firstName
      },
      metadata: {
        plan_id: planId,
        user_email: userEmail
      }
    };

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${user.id}-pix-${planId}-${Date.now()}`
      },
      body: JSON.stringify(pixPayment)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Mercado Pago PIX Error:', data);
      return Response.json({ 
        success: false,
        error: data.message || 'Erro ao criar pagamento PIX',
        details: data
      }, { status: response.status, headers });
    }

    const pixData = data.point_of_interaction?.transaction_data;

    if (!pixData?.qr_code) {
      console.error('QR Code não retornado:', data);
      return Response.json({
        success: false,
        error: 'QR Code PIX não foi gerado. Tente novamente.'
      }, { status: 500, headers });
    }

    // Criar subscription pendente
    try {
      const subscriptions = await base44.entities.Subscription.filter({ user_id: user.id });
      
      if (subscriptions.length > 0) {
        await base44.entities.Subscription.update(subscriptions[0].id, {
          plan: planId,
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'pix',
          payment_external_id: data.id.toString(),
          price
        });
      } else {
        await base44.entities.Subscription.create({
          user_id: user.id,
          plan: planId,
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'pix',
          payment_external_id: data.id.toString(),
          price,
          daily_actions_limit: 5,
          daily_actions_used: 0
        });
      }
    } catch (dbError) {
      console.error('Database Error:', dbError);
    }

    return Response.json({
      success: true,
      payment_id: data.id,
      qr_code: pixData.qr_code,
      qr_code_base64: pixData.qr_code_base64
    }, { headers });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500, headers });
  }
});
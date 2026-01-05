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

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ 
        error: 'Mercado Pago não configurado' 
      }, { status: 500, headers });
    }

    const body = await req.json();
    const { planId, userEmail, userName } = body;

    const plans = {
      pro_monthly: {
        title: "Juris IA - Plano Profissional Mensal",
        unit_price: 119.90
      },
      pro_yearly: {
        title: "Juris IA - Plano Profissional Anual",
        unit_price: 1198.80
      }
    };

    const plan = plans[planId];
    if (!plan) {
      return Response.json({ error: 'Plano inválido' }, { status: 400, headers });
    }

    const firstName = userName?.split(' ')[0] || 'Cliente';
    const lastName = userName?.split(' ').slice(1).join(' ') || 'Juris';

    const pixPayment = {
      transaction_amount: plan.unit_price,
      description: plan.title,
      payment_method_id: 'pix',
      payer: {
        email: userEmail,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: 'CPF',
          number: '00000000000'
        }
      },
      metadata: {
        plan_id: planId,
        user_email: userEmail
      }
    };

    console.log('Criando pagamento PIX no Mercado Pago:', { planId, amount: plan.unit_price });

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

    console.log('PIX criado no Mercado Pago:', { 
      id: data.id, 
      status: data.status,
      has_qr_code: !!data.point_of_interaction?.transaction_data?.qr_code
    });

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
          price: plan.unit_price
        });
      } else {
        await base44.entities.Subscription.create({
          user_id: user.id,
          plan: planId,
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'pix',
          payment_external_id: data.id.toString(),
          price: plan.unit_price,
          daily_actions_limit: 5,
          daily_actions_used: 0
        });
      }
    } catch (dbError) {
      console.error('Database Error:', dbError);
    }

    const qrCode = data.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;

    if (!qrCode) {
      console.error('QR Code não retornado pelo Mercado Pago. Resposta completa:', JSON.stringify(data));
      return Response.json({
        success: false,
        error: 'QR Code PIX não foi gerado. Tente novamente.',
        details: data
      }, { status: 500, headers });
    }

    console.log('PIX gerado com sucesso');

    return Response.json({
      success: true,
      payment_id: data.id,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64
    }, { headers });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500, headers });
  }
});
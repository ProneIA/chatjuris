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
    const { planId, userId } = body;

    const plans = {
      pro_monthly: {
        title: "Juris IA - Plano Profissional Mensal",
        price: 119.90
      },
      pro_yearly: {
        title: "Juris IA - Plano Profissional Anual",
        price: 1198.80
      }
    };

    const plan = plans[planId];
    if (!plan) {
      return Response.json({ error: 'Plano inválido' }, { status: 400, headers });
    }

    const firstName = user.full_name?.split(' ')[0] || 'Cliente';
    const lastName = user.full_name?.split(' ').slice(1).join(' ') || 'Juris';

    const pixPayment = {
      transaction_amount: plan.price,
      description: plan.title,
      payment_method_id: 'pix',
      payer: {
        email: user.email,
        first_name: firstName,
        last_name: lastName
      }
    };

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pixPayment)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Mercado Pago PIX Error:', errorData);
      return Response.json({ 
        success: false,
        error: 'Erro ao criar pagamento PIX'
      }, { status: response.status, headers });
    }

    const data = await response.json();

    // Criar registro de subscription pendente
    try {
      const subscriptions = await base44.entities.Subscription.filter({ user_id: userId });
      
      if (subscriptions.length > 0) {
        await base44.entities.Subscription.update(subscriptions[0].id, {
          plan: planId,
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'pix',
          payment_external_id: data.id.toString(),
          price: plan.price
        });
      } else {
        await base44.entities.Subscription.create({
          user_id: userId,
          plan: planId,
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'pix',
          payment_external_id: data.id.toString(),
          price: plan.price,
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
      pix_code: data.point_of_interaction?.transaction_data?.qr_code,
      pix_qr_code: data.point_of_interaction?.transaction_data?.qr_code_base64
    }, { headers });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500, headers });
  }
});
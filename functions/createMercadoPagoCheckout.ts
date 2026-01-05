import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  // CORS Headers
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
    const { planId, paymentMethod } = body;

    // Configurações dos planos
    const plans = {
      pro_monthly: {
        title: "Juris IA - Plano Profissional Mensal",
        description: "Acesso completo à plataforma com IA ilimitada",
        unit_price: 119.90,
        frequency: 1,
        frequency_type: "months"
      },
      pro_yearly: {
        title: "Juris IA - Plano Profissional Anual",
        description: "Acesso completo por 12 meses - Economize 2 meses",
        unit_price: 1198.80,
        frequency: 12,
        frequency_type: "months"
      }
    };

    const plan = plans[planId];
    if (!plan) {
      return Response.json({ 
        error: 'Plano inválido' 
      }, { status: 400, headers });
    }

    // Criar preferência de pagamento
    const preference = {
      items: [
        {
          title: plan.title,
          description: plan.description,
          quantity: 1,
          unit_price: plan.unit_price,
          currency_id: "BRL"
        }
      ],
      payer: {
        email: user.email,
        name: user.full_name
      },
      back_urls: {
        success: `${Deno.env.get('PUBLIC_URL')}/Pricing?payment=success`,
        failure: `${Deno.env.get('PUBLIC_URL')}/Pricing?payment=failure`,
        pending: `${Deno.env.get('PUBLIC_URL')}/Pricing?payment=pending`
      },
      auto_return: "approved",
      notification_url: `${Deno.env.get('PUBLIC_URL')}/api/functions/mercadopagoWebhook`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_id: planId
      },
      payment_methods: {
        installments: 12,
        default_installments: 1
      }
    };

    // Se for PIX, criar pagamento direto
    if (paymentMethod === 'pix') {
      const firstName = user.full_name?.split(' ')[0] || 'Cliente';
      const lastName = user.full_name?.split(' ').slice(1).join(' ') || 'Juris';
      
      const pixPayment = {
        transaction_amount: plan.unit_price,
        description: plan.title,
        payment_method_id: 'pix',
        payer: {
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          identification: {
            type: 'CPF',
            number: '00000000000'
          }
        }
      };

      const pixResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pixPayment)
      });

      if (!pixResponse.ok) {
        const errorData = await pixResponse.json();
        console.error('Mercado Pago PIX Error:', errorData);
        return Response.json({ 
          success: false,
          error: 'Erro ao criar pagamento PIX',
          details: errorData
        }, { status: pixResponse.status, headers });
      }

      const pixData = await pixResponse.json();

      // Criar registro de subscription pendente
      try {
        const subscriptions = await base44.entities.Subscription.filter({ user_id: user.id });
        
        if (subscriptions.length > 0) {
          await base44.entities.Subscription.update(subscriptions[0].id, {
            plan: planId,
            status: 'pending',
            payment_status: 'pending',
            payment_method: 'pix',
            payment_external_id: pixData.id.toString(),
            price: plan.unit_price
          });
        } else {
          await base44.entities.Subscription.create({
            user_id: user.id,
            plan: planId,
            status: 'pending',
            payment_status: 'pending',
            payment_method: 'pix',
            payment_external_id: pixData.id.toString(),
            price: plan.unit_price,
            daily_actions_limit: 5,
            daily_actions_used: 0
          });
        }
      } catch (dbError) {
        console.error('Database Error:', dbError);
      }

      return Response.json({
        success: true,
        payment_id: pixData.id,
        pix_code: pixData.point_of_interaction?.transaction_data?.qr_code,
        pix_qr_code: pixData.point_of_interaction?.transaction_data?.qr_code_base64
      }, { headers });
    }

    // Para cartão, criar preference
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Mercado Pago Error:', errorData);
      return Response.json({ 
        success: false,
        error: 'Erro ao criar checkout',
        details: errorData
      }, { status: response.status, headers });
    }

    const data = await response.json();

    // Criar registro de subscription pendente
    try {
      const subscriptions = await base44.entities.Subscription.filter({ user_id: user.id });
      
      if (subscriptions.length > 0) {
        await base44.entities.Subscription.update(subscriptions[0].id, {
          plan: planId,
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'credit_card',
          payment_external_id: data.id,
          price: plan.unit_price
        });
      } else {
        await base44.entities.Subscription.create({
          user_id: user.id,
          plan: planId,
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'credit_card',
          payment_external_id: data.id,
          price: plan.unit_price,
          daily_actions_limit: 5,
          daily_actions_used: 0
        });
      }
    } catch (dbError) {
      console.error('Database Error:', dbError);
    }

    return Response.json({
      success: true,
      preference_id: data.id
    }, { headers });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500, headers });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      return Response.json({ 
        error: 'Mercado Pago access token não configurado' 
      }, { status: 500 });
    }

    const { planId } = await req.json();

    // Configurações dos planos
    const planConfigs = {
      pro_monthly: {
        reason: "Assinatura Mensal Juris - Plano Profissional",
        transaction_amount: 119.90,
        frequency: 1,
        frequency_type: "months",
        billing_day: new Date().getDate(),
        billing_day_proportional: false
      }
    };

    const config = planConfigs[planId];
    
    if (!config) {
      return Response.json({ error: 'Plano inválido' }, { status: 400 });
    }

    // Criar a assinatura no Mercado Pago
    const subscriptionData = {
      reason: config.reason,
      auto_recurring: {
        frequency: config.frequency,
        frequency_type: config.frequency_type,
        transaction_amount: config.transaction_amount,
        currency_id: "BRL"
      },
      back_url: "https://juris.base44.app/pricing",
      payer_email: user.email,
      external_reference: `${user.id}_${planId}_${Date.now()}`
    };

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return Response.json({ 
        success: false,
        error: 'Erro ao criar assinatura no Mercado Pago',
        details: errorData
      }, { status: response.status });
    }

    const subscription = await response.json();

    // Salvar referência na base de dados
    const subscriptions = await base44.entities.Subscription.filter({ user_id: user.id });
    const existingSubscription = subscriptions[0];

    if (existingSubscription) {
      await base44.entities.Subscription.update(existingSubscription.id, {
        payment_external_id: subscription.id,
        payment_external_url: subscription.init_point,
        status: "pending",
        plan: planId
      });
    } else {
      await base44.entities.Subscription.create({
        user_id: user.id,
        plan: planId,
        status: "pending",
        payment_external_id: subscription.id,
        payment_external_url: subscription.init_point,
        price: config.transaction_amount,
        daily_actions_limit: 999999,
        daily_actions_used: 0
      });
    }

    return Response.json({
      success: true,
      checkout_url: subscription.init_point,
      subscription_id: subscription.id
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
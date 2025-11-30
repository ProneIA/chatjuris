import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const MP_API_URL = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { plan_id, back_url } = body;

    // Configuração do plano Pro mensal
    const planConfig = {
      reason: "Juris Pro - Plano Profissional Mensal",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 97.00,
        currency_id: "BRL"
      },
      back_url: back_url || `${Deno.env.get("PUBLIC_URL") || "https://app.base44.com"}/PaymentSuccess`,
      payer_email: user.email,
      external_reference: user.id
    };

    // Criar preapproval (assinatura) no Mercado Pago
    const mpResponse = await fetch(`${MP_API_URL}/preapproval`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(planConfig)
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Erro MP:", mpData);
      return Response.json({ 
        error: 'Erro ao criar assinatura no Mercado Pago', 
        details: mpData 
      }, { status: 400 });
    }

    // Buscar ou criar registro de subscription no BD
    const existingSubs = await base44.entities.Subscription.filter({ 
      created_by: user.email 
    });

    const subscriptionData = {
      user_id: user.id,
      plan: "pro",
      status: "pending",
      payment_method: "mercadopago",
      payment_status: "pending",
      payment_external_id: mpData.id,
      payment_external_url: mpData.init_point,
      price: 97.00,
      daily_actions_limit: 999999,
      start_date: new Date().toISOString().split('T')[0]
    };

    if (existingSubs.length > 0) {
      await base44.entities.Subscription.update(existingSubs[0].id, subscriptionData);
    } else {
      await base44.entities.Subscription.create(subscriptionData);
    }

    return Response.json({
      success: true,
      subscription_id: mpData.id,
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point
    });

  } catch (error) {
    console.error("Erro:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
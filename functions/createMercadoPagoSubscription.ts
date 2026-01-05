import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { MercadoPagoConfig, Preference } from 'npm:mercadopago@2.0.15';

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
        title: "Juris - Plano Profissional Mensal",
        description: "Assinatura mensal com todos os recursos ilimitados",
        unit_price: 119.90,
        quantity: 1
      }
    };

    const config = planConfigs[planId];
    
    if (!config) {
      return Response.json({ error: 'Plano inválido' }, { status: 400 });
    }

    // Inicializar cliente do Mercado Pago
    const client = new MercadoPagoConfig({ 
      accessToken: accessToken,
      options: { timeout: 5000 }
    });

    const preference = new Preference(client);

    // Criar preferência de pagamento
    const preferenceData = {
      items: [
        {
          id: planId,
          title: config.title,
          description: config.description,
          quantity: config.quantity,
          unit_price: config.unit_price,
          currency_id: "BRL"
        }
      ],
      payer: {
        email: user.email,
        name: user.full_name
      },
      back_urls: {
        success: "https://juris.base44.app/payment-success",
        failure: "https://juris.base44.app/pricing",
        pending: "https://juris.base44.app/pricing"
      },
      auto_return: "approved",
      notification_url: `${Deno.env.get('PUBLIC_URL')}/functions/mercadopagoWebhook`,
      external_reference: `${user.id}_${planId}_${Date.now()}`,
      statement_descriptor: "JURIS",
      payment_methods: {
        excluded_payment_types: [],
        installments: 12
      }
    };

    const result = await preference.create({ body: preferenceData });

    // Salvar referência na base de dados
    const subscriptions = await base44.entities.Subscription.filter({ user_id: user.id });
    const existingSubscription = subscriptions[0];

    if (existingSubscription) {
      await base44.entities.Subscription.update(existingSubscription.id, {
        payment_external_id: result.id,
        payment_external_url: result.init_point,
        status: "pending",
        plan: planId,
        price: config.unit_price
      });
    } else {
      await base44.entities.Subscription.create({
        user_id: user.id,
        plan: planId,
        status: "pending",
        payment_external_id: result.id,
        payment_external_url: result.init_point,
        price: config.unit_price,
        daily_actions_limit: 999999,
        daily_actions_used: 0
      });
    }

    return Response.json({
      success: true,
      checkout_url: result.init_point,
      preference_id: result.id
    });

  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { MercadoPagoConfig, Preference } from 'npm:mercadopago@2.0.15';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, successUrl, failureUrl, pendingUrl } = await req.json();

    // Configurar Mercado Pago
    const client = new MercadoPagoConfig({ 
      accessToken: Deno.env.get('MP_ACCESS_TOKEN') 
    });
    
    const preference = new Preference(client);

    // Definir planos e preços
    const plans = {
      pro_monthly: {
        title: 'Juris - Plano Profissional Mensal',
        unit_price: 119.90,
        description: 'Assinatura mensal com IA ilimitada e todos os recursos'
      },
      pro_yearly: {
        title: 'Juris - Plano Profissional Anual',
        unit_price: 1198.80,
        description: 'Pagamento único anual com IA ilimitada e todos os recursos - Economize R$ 240'
      }
    };

    const selectedPlan = plans[planId];

    if (!selectedPlan) {
      throw new Error(`Plano inválido: ${planId}`);
    }

    // Criar preferência de pagamento
    const preferenceData = {
      items: [
        {
          id: planId,
          title: selectedPlan.title,
          description: selectedPlan.description,
          quantity: 1,
          unit_price: selectedPlan.unit_price,
          currency_id: 'BRL'
        }
      ],
      payer: {
        name: user.full_name || 'Cliente',
        email: user.email
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      auto_return: 'approved',
      external_reference: user.id,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_id: planId
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: planId === 'pro_yearly' ? 12 : 1,
        default_installments: planId === 'pro_yearly' ? 12 : 1
      },
      notification_url: `${Deno.env.get('PUBLIC_URL')}/api/functions/mercadoPagoWebhook`
    };

    console.log('Criando preferência MP:', { planId, userId: user.id });

    const result = await preference.create({ body: preferenceData });

    console.log('Preferência criada:', { id: result.id, initPoint: result.init_point });

    return Response.json({
      preferenceId: result.id,
      url: result.init_point
    });

  } catch (error) {
    console.error('Erro ao criar checkout MP:', error);
    return Response.json({ 
      error: error.message,
      details: error.cause?.message || 'Erro desconhecido'
    }, { status: 500 });
  }
});
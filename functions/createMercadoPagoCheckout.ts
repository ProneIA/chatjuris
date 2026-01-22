import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { MercadoPagoConfig, Preference, PreApproval } from 'npm:mercadopago@2.0.15';

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

    // PLANO ANUAL: Pagamento único com parcelamento
    if (planId === 'pro_yearly') {
      const preference = new Preference(client);
      
      const publicUrl = Deno.env.get('PUBLIC_URL');
      const notificationUrl = publicUrl && (publicUrl.startsWith('https://') || publicUrl.startsWith('http://')) 
        ? `${publicUrl}/api/functions/mercadoPagoWebhook` 
        : undefined;

      const preferenceData = {
        items: [
          {
            id: 'PROD-ANUAL-001',
            title: 'Plano Anual - Acesso Completo',
            description: 'Pagamento único com desconto anual',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: 1198.80
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
        auto_return: 'all',
        external_reference: user.id,
        metadata: {
          user_id: user.id,
          user_email: user.email,
          plan_id: planId
        },
        payment_methods: {
          installments: 12,
          default_installments: 1
        },
        statement_descriptor: 'Juris IA'
      };

      // Adicionar notification_url apenas se válida
      if (notificationUrl) {
        preferenceData.notification_url = notificationUrl;
      }

      console.log('Criando preferência MP (Anual):', { planId, userId: user.id });

      const result = await preference.create({ body: preferenceData });

      console.log('Preferência criada:', { id: result.id, initPoint: result.init_point });

      return Response.json({
        preferenceId: result.id,
        url: result.init_point
      });
    }

    // PLANO MENSAL: Assinatura recorrente
    if (planId === 'pro_monthly') {
      const preApproval = new PreApproval(client);

      // Data de início deve ser futura (adicionar 1 minuto)
      const startDate = new Date();
      startDate.setMinutes(startDate.getMinutes() + 1);

      const publicUrl = Deno.env.get('PUBLIC_URL');
      const notificationUrl = publicUrl && (publicUrl.startsWith('https://') || publicUrl.startsWith('http://')) 
        ? `${publicUrl}/api/functions/mercadoPagoWebhook` 
        : undefined;

      const subscriptionData = {
        reason: 'Plano Mensal - Assinatura Contínua',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 119.90,
          currency_id: 'BRL',
          start_date: startDate.toISOString()
        },
        back_url: successUrl,
        external_reference: user.id,
        payer_email: user.email,
        status: 'pending'
      };

      // Adicionar notification_url apenas se válida
      if (notificationUrl) {
        subscriptionData.notification_url = notificationUrl;
      }

      console.log('Criando assinatura MP (Mensal):', { planId, userId: user.id });

      const result = await preApproval.create({ body: subscriptionData });

      console.log('Assinatura criada:', { id: result.id, initPoint: result.init_point });

      return Response.json({
        preferenceId: result.id,
        url: result.init_point
      });
    }

    throw new Error(`Plano inválido: ${planId}`);

  } catch (error) {
    console.error('Erro ao criar checkout MP:', error);
    return Response.json({ 
      error: error.message,
      details: error.cause?.message || 'Erro desconhecido'
    }, { status: 500 });
  }
});
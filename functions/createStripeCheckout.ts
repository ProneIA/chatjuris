import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, successUrl, cancelUrl } = await req.json();

    // IDs de preços do Stripe
    const stripePrices = {
      pro_monthly: 'prod_Tp8xL74cLlKBpd', // Temporário - precisa ser o Price ID
    };

    console.log('Tentando criar checkout com:', {
      planId,
      priceId: stripePrices[planId],
      userEmail: user.email
    });

    // Se o ID fornecido for um Product ID (começa com "prod_"), buscar o price ativo
    let priceId = stripePrices[planId];
    if (priceId && priceId.startsWith('prod_')) {
      console.log('Detectado Product ID, buscando Price ativo...');
      const prices = await stripe.prices.list({
        product: priceId,
        active: true,
        limit: 1
      });
      if (prices.data.length > 0) {
        priceId = prices.data[0].id;
        console.log('Price ID encontrado:', priceId);
      } else {
        throw new Error('Nenhum preço ativo encontrado para este produto');
      }
    }

    const isYearly = planId === 'pro_yearly';
    
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: isYearly ? [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Plano Juris - Profissional Anual',
            },
            unit_amount: 119880, // R$ 1.198,80
          },
          quantity: 1,
        },
      ] : [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isYearly ? 'payment' : 'subscription',
      customer_email: user.email,
      subscription_data: !isYearly ? {
        metadata: {
          user_id: user.id,
          user_email: user.email,
          plan_id: planId,
        }
      } : undefined,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_id: planId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      locale: 'pt-BR',
    };

    // Habilitar parcelamento para plano anual (Brasil)
    if (isYearly) {
      sessionConfig.payment_method_options = {
        card: {
          installments: {
            enabled: true,
          },
        },
      };
    }



    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    console.error('Detalhes do erro:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      raw: error.raw
    });
    return Response.json({ 
      error: error.message,
      details: error.type || error.code || 'Unknown error'
    }, { status: 500 });
  }
});
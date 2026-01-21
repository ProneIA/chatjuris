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

    // Product IDs Stripe
    const stripeProducts = {
      pro_monthly: 'prod_Tp8xL74cLlKBpd', // Produto mensal (recorrente)
      pro_yearly: 'prod_TpA34NAXJfiFIn',   // Produto anual (one-time)
    };

    const isYearly = planId === 'pro_yearly';
    const productId = stripeProducts[planId];

    if (!productId) {
      throw new Error(`Produto não encontrado para plano: ${planId}`);
    }

    // Buscar o Price ID ativo do produto
    console.log(`Buscando Price ativo para produto ${planId}:`, productId);
    
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 1
    });
    
    if (prices.data.length === 0) {
      throw new Error(`Nenhum preço ativo encontrado para o produto ${planId}`);
    }
    
    const priceId = prices.data[0].id;
    console.log('Price ID encontrado:', priceId);
    
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isYearly ? 'payment' : 'subscription',
      customer_email: user.email,
      billing_address_collection: 'required',
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
        subscription_type: isYearly ? 'one_time' : 'recurring'
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      locale: 'pt-BR',
    };

    // Para pagamento único (anual), habilitar parcelamento explicitamente
    if (isYearly) {
      sessionConfig.payment_method_options = {
        card: {
          installments: {
            enabled: true,
          }
        }
      };
    }

    console.log('Criando sessão Stripe:', {
      mode: sessionConfig.mode,
      planId,
      hasInstallments: isYearly
    });

    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    console.log('Sessão criada:', {
      sessionId: session.id,
      mode: session.mode,
      paymentMethodTypes: session.payment_method_types
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    return Response.json({ 
      error: error.message,
      details: error.type || error.code || 'Unknown error'
    }, { status: 500 });
  }
});
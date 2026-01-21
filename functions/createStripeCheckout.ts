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
      pro_yearly: 'prod_YourYearlyProd',   // Produto anual (one-time) - substituir com seu ID
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

    // Para pagamento único (anual), Stripe automaticamente oferece parcelamento
    // (não precisa configurar payment_method_options, é automático para valores > R$50)

    const session = await stripe.checkout.sessions.create(sessionConfig);

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
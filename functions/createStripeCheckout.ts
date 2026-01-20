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

    // Definir preços e intervalos
    const priceData = {
      pro_monthly: {
        unit_amount: 11990, // R$ 119.90 em centavos
        recurring: { interval: 'month' }
      },
      pro_yearly: {
        unit_amount: 119880, // R$ 1.198,80 em centavos
        recurring: { interval: 'year' }
      }
    };

    const planConfig = priceData[planId];
    if (!planConfig) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: planId === 'pro_monthly' ? 'Plano Mensal' : 'Plano Anual',
              description: 'Acesso completo à plataforma Juris',
            },
            unit_amount: planConfig.unit_amount,
            recurring: planConfig.recurring,
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_id: planId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    // Verificar assinatura do webhook
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Erro na verificação do webhook:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Processar eventos do Stripe
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.user_id;
        const planId = session.metadata.plan_id;
        const userEmail = session.metadata.user_email;

        // Buscar ou criar assinatura
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
        
        const planLimits = {
          daily_actions_limit: 999999,
          daily_actions_used: 0
        };

        const subscriptionData = {
          user_id: userId,
          plan: 'pro',
          status: 'active',
          payment_method: 'credit_card',
          payment_status: 'paid',
          payment_external_id: session.subscription,
          price: planId === 'pro_monthly' ? 119.90 : 1198.80,
          start_date: new Date().toISOString().split('T')[0],
          last_reset_date: new Date().toISOString().split('T')[0],
          ...planLimits
        };

        if (subscriptions.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, subscriptionData);
        } else {
          await base44.asServiceRole.entities.Subscription.create(subscriptionData);
        }

        // Enviar email de confirmação
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: userEmail,
            subject: 'Assinatura Ativada - Juris',
            body: `
              <h2>Bem-vindo ao Juris Pro! 🎉</h2>
              <p>Sua assinatura foi ativada com sucesso.</p>
              <p><strong>Plano:</strong> ${planId === 'pro_monthly' ? 'Mensal' : 'Anual'}</p>
              <p>Acesse agora: ${Deno.env.get('PUBLIC_URL') || 'https://juris.app'}</p>
            `
          });
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;
        
        if (userId) {
          const status = subscription.status === 'active' ? 'active' : 
                        subscription.status === 'past_due' ? 'pending' : 'cancelled';

          const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
            payment_external_id: subscription.id 
          });

          if (subscriptions.length > 0) {
            await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
              status,
              payment_status: subscription.status === 'active' ? 'paid' : 'pending'
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
          payment_external_id: subscription.id 
        });

        if (subscriptions.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
            status: 'cancelled',
            end_date: new Date().toISOString().split('T')[0]
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
          payment_external_id: subscriptionId 
        });

        if (subscriptions.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
            payment_status: 'paid',
            status: 'active'
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
          payment_external_id: subscriptionId 
        });

        if (subscriptions.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
            payment_status: 'failed',
            status: 'pending'
          });
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
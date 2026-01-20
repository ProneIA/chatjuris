import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return Response.json({ error: 'No signature' }, { status: 400 });
  }

  try {
    const body = await req.text();
    
    // Verificar assinatura do webhook
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    const base44 = createClientFromRequest(req);

    // Processar eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.user_id;
        const userEmail = session.metadata.user_email;
        const planId = session.metadata.plan_id;

        // Buscar ou criar assinatura
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
          user_id: userId 
        });

        const planData = {
          pro_monthly: { 
            price: 119.90, 
            daily_actions_limit: 999999 
          },
          pro_yearly: { 
            price: 1198.80, 
            daily_actions_limit: 999999 
          }
        };

        const plan = planData[planId];

        if (subscriptions.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
            plan: 'pro',
            status: 'active',
            payment_status: 'paid',
            payment_external_id: session.subscription,
            price: plan.price,
            daily_actions_limit: plan.daily_actions_limit,
            daily_actions_used: 0,
            start_date: new Date().toISOString().split('T')[0],
            last_reset_date: new Date().toISOString().split('T')[0],
          });
        } else {
          await base44.asServiceRole.entities.Subscription.create({
            user_id: userId,
            plan: 'pro',
            status: 'active',
            payment_status: 'paid',
            payment_external_id: session.subscription,
            price: plan.price,
            daily_actions_limit: plan.daily_actions_limit,
            daily_actions_used: 0,
            start_date: new Date().toISOString().split('T')[0],
            last_reset_date: new Date().toISOString().split('T')[0],
          });
        }

        // Enviar email de boas-vindas
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: userEmail,
            subject: '🎉 Bem-vindo ao Juris Pro!',
            body: `
              <h2>Parabéns! Sua assinatura está ativa.</h2>
              <p>Você agora tem acesso total a todas as funcionalidades da plataforma Juris.</p>
              <p>Aproveite:</p>
              <ul>
                <li>✨ IA ilimitada</li>
                <li>📂 Clientes, processos e documentos ilimitados</li>
                <li>📚 Templates e jurisprudência</li>
                <li>📅 Calendário inteligente</li>
                <li>🎯 Suporte prioritário</li>
              </ul>
              <p>Acesse agora: <a href="${Deno.env.get('PUBLIC_URL')}">Ir para Juris</a></p>
            `
          });
        } catch (emailError) {
          console.error('Error sending email:', emailError);
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        // Atualizar status de pagamento
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
          payment_external_id: subscriptionId 
        });

        if (subscriptions.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
            payment_status: 'paid',
            status: 'active',
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
            status: 'pending',
          });
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
            plan: 'free',
            daily_actions_limit: 5,
            daily_actions_used: 0,
          });
        }
        break;
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 400 });
  }
});
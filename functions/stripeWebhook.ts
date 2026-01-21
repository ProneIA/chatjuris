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
        const subscriptionType = session.metadata.subscription_type;

        console.log('Processando checkout.session.completed:', {
          userId,
          planId,
          subscriptionType,
          sessionMode: session.mode,
          paymentStatus: session.payment_status
        });

        // Buscar assinatura existente
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
        
        const planLimits = {
          daily_actions_limit: 999999,
          daily_actions_used: 0
        };

        const isYearly = planId === 'pro_yearly';
        const startDate = new Date();
        
        // Calcular data de expiração: +12 meses para anual, null para recorrente
        let endDate = null;
        let nextBillingDate = null;
        
        if (isYearly) {
          // Plano anual: adicionar exatamente 365 dias
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 365);
          console.log('Plano anual - Expira em:', endDate.toISOString());
        } else {
          // Plano mensal: próxima cobrança em 30 dias
          nextBillingDate = new Date(startDate);
          nextBillingDate.setDate(nextBillingDate.getDate() + 30);
          console.log('Plano mensal - Próxima cobrança:', nextBillingDate.toISOString());
        }

        const subscriptionData = {
          user_id: userId,
          plan: 'pro',
          status: 'active',
          payment_method: 'credit_card',
          payment_status: 'paid',
          payment_external_id: session.subscription || session.payment_intent,
          price: planId === 'pro_monthly' ? 119.90 : 1198.80,
          start_date: startDate.toISOString().split('T')[0],
          last_reset_date: startDate.toISOString().split('T')[0],
          ...planLimits
        };

        // Adicionar data de expiração ou próxima cobrança
        if (endDate) {
          subscriptionData.end_date = endDate.toISOString().split('T')[0];
        }
        if (nextBillingDate) {
          subscriptionData.next_billing_date = nextBillingDate.toISOString().split('T')[0];
        }

        if (subscriptions.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, subscriptionData);
          console.log('Assinatura atualizada:', subscriptions[0].id);
        } else {
          const newSub = await base44.asServiceRole.entities.Subscription.create(subscriptionData);
          console.log('Assinatura criada:', newSub.id);
        }

        // Enviar email de confirmação
        try {
          const planName = planId === 'pro_monthly' ? 'Mensal (R$ 119,90/mês)' : 'Anual (R$ 1.198,80/ano)';
          const accessInfo = isYearly 
            ? `Seu acesso é válido até ${endDate.toLocaleDateString('pt-BR')}.`
            : 'Sua assinatura será renovada automaticamente todo mês.';

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: userEmail,
            subject: 'Assinatura Ativada - Juris Pro',
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7c3aed;">Bem-vindo ao Juris Pro! 🎉</h2>
                <p>Sua assinatura foi ativada com sucesso.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Plano:</strong> ${planName}</p>
                  <p><strong>Status:</strong> Ativo</p>
                  <p>${accessInfo}</p>
                </div>
                <p>Aproveite todos os recursos ilimitados da plataforma!</p>
                <a href="${Deno.env.get('PUBLIC_URL') || 'https://chatjuris.com'}" 
                   style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; margin-top: 20px;">
                  Acessar Plataforma
                </a>
              </div>
            `
          });
          console.log('Email enviado para:', userEmail);
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
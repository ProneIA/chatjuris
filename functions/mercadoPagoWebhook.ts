import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { MercadoPagoConfig, Payment } from 'npm:mercadopago@2.0.15';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    
    console.log('Webhook MP recebido:', body);

    // Mercado Pago envia notificações de diferentes tipos
    if (body.type !== 'payment') {
      console.log('Tipo de notificação ignorada:', body.type);
      return Response.json({ received: true });
    }

    const base44 = createClientFromRequest(req);
    
    // Configurar Mercado Pago
    const client = new MercadoPagoConfig({ 
      accessToken: Deno.env.get('MP_ACCESS_TOKEN') 
    });
    
    const payment = new Payment(client);

    // Buscar detalhes do pagamento
    const paymentData = await payment.get({ id: body.data.id });
    
    console.log('Dados do pagamento:', {
      id: paymentData.id,
      status: paymentData.status,
      externalReference: paymentData.external_reference
    });

    const userId = paymentData.external_reference;
    const metadata = paymentData.metadata;
    const planId = metadata?.plan_id;

    if (!userId || !planId) {
      console.error('Dados incompletos no pagamento');
      return Response.json({ error: 'Missing data' }, { status: 400 });
    }

    // Processar apenas pagamentos aprovados
    if (paymentData.status === 'approved') {
      const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
        user_id: userId 
      });

      const isYearly = planId === 'pro_yearly';
      const startDate = new Date();
      let endDate = null;
      let nextBillingDate = null;

      if (isYearly) {
        // Plano anual: válido por 365 dias
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 365);
      } else {
        // Plano mensal: próxima cobrança em 30 dias
        nextBillingDate = new Date(startDate);
        nextBillingDate.setDate(nextBillingDate.getDate() + 30);
      }

      const subscriptionData = {
        user_id: userId,
        plan: 'pro',
        status: 'active',
        payment_method: paymentData.payment_type_id || 'mercadopago',
        payment_status: 'paid',
        payment_external_id: paymentData.id.toString(),
        price: planId === 'pro_monthly' ? 1.00 : 1198.80,
        start_date: startDate.toISOString().split('T')[0],
        last_reset_date: startDate.toISOString().split('T')[0],
        daily_actions_limit: 999999,
        daily_actions_used: 0
      };

      if (endDate) {
        subscriptionData.end_date = endDate.toISOString().split('T')[0];
      }
      if (nextBillingDate) {
        subscriptionData.next_billing_date = nextBillingDate.toISOString().split('T')[0];
      }

      if (subscriptions.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(
          subscriptions[0].id, 
          subscriptionData
        );
        console.log('Assinatura atualizada:', subscriptions[0].id);
      } else {
        const newSub = await base44.asServiceRole.entities.Subscription.create(
          subscriptionData
        );
        console.log('Assinatura criada:', newSub.id);
      }

      // Enviar email de confirmação
      try {
        const userEmail = metadata?.user_email || paymentData.payer?.email;
        if (userEmail) {
          const planName = planId === 'pro_monthly' 
            ? 'Mensal (R$ 1,00/mês)' 
            : 'Anual (R$ 1.198,80/ano)';
          
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
        }
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
      }
    } else if (paymentData.status === 'pending') {
      // Atualizar status para pendente
      const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
        user_id: userId 
      });

      if (subscriptions.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(
          subscriptions[0].id,
          {
            status: 'pending',
            payment_status: 'pending',
            payment_external_id: paymentData.id.toString()
          }
        );
      }
    } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
      // Pagamento rejeitado/cancelado
      const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
        user_id: userId 
      });

      if (subscriptions.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(
          subscriptions[0].id,
          {
            status: 'cancelled',
            payment_status: 'failed'
          }
        );
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Erro no webhook MP:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
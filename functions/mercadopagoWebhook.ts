import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { processAffiliateCommission } from './processAffiliateCommission.js';

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    console.log('Webhook recebido do Mercado Pago');
    
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    console.log('Webhook body:', JSON.stringify(body, null, 2));

    // Mercado Pago envia notificações de payment
    if (body.type === 'payment' || body.action === 'payment.updated') {
      const paymentId = body.data?.id;
      
      if (!paymentId) {
        console.log('Payment ID não encontrado no webhook');
        return Response.json({ received: true }, { headers });
      }

      const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
      if (!MP_ACCESS_TOKEN) {
        console.error('MP_ACCESS_TOKEN não configurado');
        return Response.json({ error: 'MP não configurado' }, { status: 500, headers });
      }

      // Buscar detalhes do pagamento
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
        }
      });

      const payment = await paymentResponse.json();
      console.log('Detalhes do pagamento:', JSON.stringify(payment, null, 2));

      if (payment.status === 'approved') {
        const metadata = payment.metadata || {};
        const planId = metadata.plan_id;
        const userEmail = metadata.user_email;
        const affiliateCode = metadata.affiliate_code;

        if (!planId || !userEmail) {
          console.log('Metadata incompleto, ignorando webhook');
          return Response.json({ received: true }, { headers });
        }

        // Buscar subscription pelo payment_external_id
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
          payment_external_id: paymentId.toString() 
        });

        if (subscriptions.length === 0) {
          console.log('Subscription não encontrada para payment_id:', paymentId);
          return Response.json({ received: true }, { headers });
        }

        const subscription = subscriptions[0];

        // Verificar se já está ativa
        if (subscription.status === 'active' && subscription.payment_status === 'paid') {
          console.log('Subscription já estava ativa');
          return Response.json({ received: true, already_processed: true }, { headers });
        }

        // Ativar subscription
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          status: 'active',
          payment_status: 'paid'
        });

        console.log('Subscription ativada:', subscription.id);

        // Processar comissão do afiliado se houver
        if (affiliateCode) {
          console.log('Processando comissão para afiliado:', affiliateCode);
          await processAffiliateCommission(
            base44,
            subscription.id,
            affiliateCode,
            payment.transaction_amount,
            userEmail
          );
        }

        // Enviar email de confirmação
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: userEmail,
            subject: '🎉 Pagamento Confirmado - Bem-vindo ao Juris Pro!',
            body: `
Olá!

Seu pagamento foi confirmado com sucesso! 🎉

Sua assinatura ${planId === 'pro_monthly' ? 'Mensal' : 'Anual'} do Juris Pro está ativa.

Aproveite todos os recursos ilimitados:
✅ IA Ilimitada
✅ Todos os modos de IA
✅ Documentos e processos ilimitados
✅ Suporte prioritário 24/7

Comece agora mesmo a transformar sua prática jurídica!

Atenciosamente,
Equipe Juris
            `
          });
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError);
        }
      }
    }

    return Response.json({ received: true }, { headers });

  } catch (error) {
    console.error('Webhook Error:', error);
    return Response.json({ 
      received: true,
      error: error.message 
    }, { status: 200, headers }); // Sempre retorna 200 para não reenviar
  }
});
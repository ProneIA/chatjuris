import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { MercadoPagoConfig, Payment } from 'npm:mercadopago@2.0.15';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, paymentData, successUrl, failureUrl } = await req.json();

    console.log('=== PROCESSANDO PAGAMENTO ===');
    console.log('User:', user.email);
    console.log('Plan ID:', planId);
    console.log('Payment Data:', JSON.stringify(paymentData, null, 2));

    if (!planId || !paymentData) {
      return Response.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'Token não configurado' }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    // Configurar dados do pagamento
    const plans = {
      pro_yearly: { price: 1198.80, name: 'Plano Anual' },
      pro_monthly: { price: 119.90, name: 'Plano Mensal' }
    };

    const planData = plans[planId];
    if (!planData) {
      return Response.json({ error: 'Plano inválido' }, { status: 400 });
    }

    // Criar pagamento
    const paymentRequest = {
      transaction_amount: planData.price,
      token: paymentData.token,
      description: planData.name,
      installments: paymentData.installments || 1,
      payment_method_id: paymentData.payment_method_id,
      issuer_id: paymentData.issuer_id,
      payer: {
        email: user.email,
      },
      external_reference: user.id,
      notification_url: `${Deno.env.get('PUBLIC_URL')}/api/functions/mercadoPagoWebhook`,
    };

    // Adicionar identification apenas se fornecido
    if (paymentData.payer?.identification) {
      paymentRequest.payer.identification = paymentData.payer.identification;
    }

    console.log('=== ENVIANDO PARA MERCADO PAGO ===');
    console.log('Payment Request:', JSON.stringify(paymentRequest, null, 2));

    const result = await payment.create({ body: paymentRequest });

    console.log('=== RESPOSTA MERCADO PAGO ===');
    console.log('Status:', result.status);
    console.log('Status Detail:', result.status_detail);
    console.log('Payment ID:', result.id);

    // Se pagamento aprovado, criar/atualizar assinatura
    if (result.status === 'approved') {
      const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id: user.id });
      const subscription = subscriptions[0];

      const subscriptionData = {
        plan: 'pro',
        status: 'active',
        payment_method: 'credit_card',
        payment_status: 'paid',
        payment_external_id: result.id.toString(),
        price: planData.price,
        daily_actions_limit: 999999,
        daily_actions_used: 0,
        start_date: new Date().toISOString().split('T')[0],
        last_reset_date: new Date().toISOString().split('T')[0],
        next_billing_date: planId === 'pro_monthly' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };

      if (subscription) {
        await base44.asServiceRole.entities.Subscription.update(subscription.id, subscriptionData);
      } else {
        await base44.asServiceRole.entities.Subscription.create({
          user_id: user.id,
          ...subscriptionData
        });
      }

      // Enviar email de confirmação
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Assinatura Ativada - Juris',
        body: `Olá ${user.full_name || 'usuário'},\n\nSua assinatura do ${planData.name} foi ativada com sucesso!\n\nValor: R$ ${planData.price.toFixed(2)}\nData: ${new Date().toLocaleDateString('pt-BR')}\n\nObrigado por confiar na Juris!\n\nEquipe Juris`
      });
    }

    return Response.json({ 
      success: result.status === 'approved',
      status: result.status,
      paymentId: result.id,
      statusDetail: result.status_detail
    });

  } catch (error) {
    console.error('=== ERRO NO PROCESSAMENTO ===');
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Error Response:', JSON.stringify(error.response?.data || error.cause, null, 2));
    
    return Response.json({ 
      error: error.message || 'Erro ao processar pagamento',
      details: error.response?.data || error.cause,
      status: error.status || 500
    }, { status: error.status || 500 });
  }
});
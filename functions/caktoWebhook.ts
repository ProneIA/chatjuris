import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers });
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'Webhook Cakto ativo', timestamp: new Date().toISOString() }), { status: 200, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST' }), { status: 200, headers });
  }

  // Validar assinatura do webhook (se configurada)
  const webhookSecret = Deno.env.get('CAKTO_WEBHOOK_SECRET');
  const signature = req.headers.get('x-cakto-signature') || req.headers.get('x-webhook-signature');
  
  let bodyText;
  try {
    bodyText = await req.text();
  } catch (e) {
    return new Response(JSON.stringify({ received: true, parse_error: true }), { status: 200, headers });
  }

  // Verificar assinatura se o secret estiver configurado
  if (webhookSecret && signature) {
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(bodyText)
      .digest('hex');
    
    if (signature !== expectedSignature && signature !== `sha256=${expectedSignature}`) {
      console.error('Assinatura inválida do webhook');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers });
    }
  }

  let body;
  try {
    body = JSON.parse(bodyText);
  } catch (e) {
    return new Response(JSON.stringify({ received: true, parse_error: true }), { status: 200, headers });
  }

  console.log('=== WEBHOOK CAKTO ===');
  console.log('Evento:', body.event);
  // Não logar dados sensíveis em produção

  const event = body.event || '';
  const data = body.data || {};
  const customerEmail = data.customer?.email;

  if (!customerEmail) {
    return new Response(JSON.stringify({ received: true, no_email: true }), { status: 200, headers });
  }

  try {
    const base44 = createClientFromRequest(req);

    // Buscar usuário primeiro para validar existência
    const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
    if (!users || users.length === 0) {
      console.log('Usuário não encontrado:', customerEmail);
      return new Response(JSON.stringify({ received: true, user_not_found: true }), { status: 200, headers });
    }
    
    const user = users[0];
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id
    });
    const existingSub = subscriptions[0];

    const eventLower = event.toLowerCase();
    const isPaid = eventLower.includes('paid') || eventLower.includes('approved') || eventLower.includes('active') || eventLower.includes('created');
    const isCancelled = eventLower.includes('cancel') || eventLower.includes('failed') || eventLower.includes('expired') || eventLower.includes('refund') || eventLower.includes('chargeback');

    if (isPaid) {
      const proData = {
        plan: 'pro',
        status: 'active',
        payment_status: 'paid',
        daily_actions_limit: 999999,
        daily_actions_used: 0,
        price: 49.99,
        cakto_order_id: data.id || '',
        cakto_customer_id: data.subscription?.id || '',
        start_date: new Date().toISOString().split('T')[0],
        next_billing_date: data.subscription?.next_payment_date ? data.subscription.next_payment_date.split('T')[0] : null
      };

      if (existingSub) {
        await base44.asServiceRole.entities.Subscription.update(existingSub.id, proData);
        console.log('PRO ATIVADO:', customerEmail);
      } else {
        const newSub = await base44.asServiceRole.entities.Subscription.create({
          ...proData,
          user_id: user.id,
          last_reset_date: new Date().toISOString().split('T')[0]
        });
        console.log('NOVA ASSINATURA PRO:', customerEmail);

        // Verificar se há afiliado associado
        if (newSub.affiliate_code) {
          const affiliates = await base44.asServiceRole.entities.Affiliate.filter({ 
            affiliate_code: newSub.affiliate_code,
            status: 'active'
          });
          
          if (affiliates.length > 0) {
            const affiliate = affiliates[0];
            const commissionAmount = proData.price * (affiliate.commission_rate / 100);
            
            // Criar registro de comissão
            await base44.asServiceRole.entities.AffiliateCommission.create({
              affiliate_id: affiliate.id,
              affiliate_code: affiliate.affiliate_code,
              subscription_id: newSub.id,
              customer_email: customerEmail,
              subscription_value: proData.price,
              commission_rate: affiliate.commission_rate,
              commission_amount: commissionAmount,
              status: 'pending'
            });

            // Atualizar totais do afiliado
            await base44.asServiceRole.entities.Affiliate.update(affiliate.id, {
              total_sales: (affiliate.total_sales || 0) + 1,
              total_commission: (affiliate.total_commission || 0) + commissionAmount
            });

            console.log('COMISSÃO REGISTRADA:', affiliate.affiliate_code, commissionAmount);
          }
        }
      }
    }

    if (isCancelled && existingSub) {
      await base44.asServiceRole.entities.Subscription.update(existingSub.id, {
        plan: 'free',
        status: 'cancelled',
        payment_status: 'cancelled',
        daily_actions_limit: 5
      });
      console.log('CANCELADO:', customerEmail);
    }

    return new Response(JSON.stringify({ success: true, event, customer: customerEmail }), { status: 200, headers });

  } catch (error) {
    console.error('Erro:', error.message);
    return new Response(JSON.stringify({ received: true, error: error.message }), { status: 200, headers });
  }
});
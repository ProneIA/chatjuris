import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Webhook do Cakto para gerenciar assinaturas
// Eventos suportados: payment.approved, payment.failed, subscription.cancelled, subscription.renewed

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Webhook-Secret',
      },
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();
    console.log('Cakto Webhook received:', JSON.stringify(body, null, 2));

    const base44 = createClientFromRequest(req);

    // Extrair dados do webhook do Cakto
    // A estrutura pode variar - ajustar conforme documentação do Cakto
    const {
      event,
      type,
      data,
      order_id,
      customer_email,
      status,
      payment_status,
      subscription_id
    } = body;

    const eventType = event || type;
    const orderId = order_id || data?.order_id || subscription_id || data?.subscription_id;
    const customerEmail = customer_email || data?.customer?.email || data?.email;

    if (!eventType) {
      console.log('No event type found in webhook');
      return Response.json({ success: true, message: 'No event type' });
    }

    console.log(`Processing event: ${eventType}, orderId: ${orderId}, email: ${customerEmail}`);

    // Buscar assinatura pelo order_id ou email
    let subscriptions = [];
    
    if (orderId) {
      subscriptions = await base44.asServiceRole.entities.Subscription.filter({
        cakto_order_id: orderId
      });
    }
    
    if (subscriptions.length === 0 && customerEmail) {
      subscriptions = await base44.asServiceRole.entities.Subscription.filter({
        created_by: customerEmail
      });
    }

    // Processar eventos
    const eventLower = eventType.toLowerCase();
    
    // Pagamento aprovado - libera acesso
    if (eventLower.includes('approved') || eventLower.includes('paid') || eventLower.includes('completed') || eventLower.includes('success')) {
      console.log('Payment approved - activating subscription');
      
      if (subscriptions.length > 0) {
        const sub = subscriptions[0];
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          status: 'active',
          plan: 'pro',
          payment_status: 'paid',
          daily_actions_limit: 999999,
          next_billing_date: getNextBillingDate(),
          cakto_order_id: orderId || sub.cakto_order_id
        });
        console.log(`Subscription ${sub.id} activated`);
      } else if (customerEmail) {
        // Criar nova assinatura se não existir
        const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
        if (users.length > 0) {
          await base44.asServiceRole.entities.Subscription.create({
            user_id: users[0].id,
            plan: 'pro',
            status: 'active',
            payment_status: 'paid',
            daily_actions_limit: 999999,
            daily_actions_used: 0,
            price: 49.99,
            cakto_order_id: orderId,
            start_date: new Date().toISOString().split('T')[0],
            next_billing_date: getNextBillingDate(),
            last_reset_date: new Date().toISOString().split('T')[0]
          });
          console.log(`New subscription created for ${customerEmail}`);
        }
      }
      
      return Response.json({ success: true, action: 'subscription_activated' });
    }

    // Pagamento falhou - suspende acesso
    if (eventLower.includes('failed') || eventLower.includes('declined') || eventLower.includes('refused')) {
      console.log('Payment failed - suspending subscription');
      
      if (subscriptions.length > 0) {
        const sub = subscriptions[0];
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          status: 'expired',
          plan: 'free',
          payment_status: 'failed',
          daily_actions_limit: 5
        });
        console.log(`Subscription ${sub.id} suspended due to payment failure`);
      }
      
      return Response.json({ success: true, action: 'subscription_suspended' });
    }

    // Assinatura cancelada
    if (eventLower.includes('cancel') || eventLower.includes('terminated')) {
      console.log('Subscription cancelled');
      
      if (subscriptions.length > 0) {
        const sub = subscriptions[0];
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          status: 'cancelled',
          plan: 'free',
          payment_status: 'cancelled',
          daily_actions_limit: 5,
          end_date: new Date().toISOString().split('T')[0]
        });
        console.log(`Subscription ${sub.id} cancelled`);
      }
      
      return Response.json({ success: true, action: 'subscription_cancelled' });
    }

    // Assinatura renovada
    if (eventLower.includes('renew') || eventLower.includes('recurring')) {
      console.log('Subscription renewed');
      
      if (subscriptions.length > 0) {
        const sub = subscriptions[0];
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          status: 'active',
          plan: 'pro',
          payment_status: 'paid',
          daily_actions_limit: 999999,
          next_billing_date: getNextBillingDate()
        });
        console.log(`Subscription ${sub.id} renewed`);
      }
      
      return Response.json({ success: true, action: 'subscription_renewed' });
    }

    // Assinatura expirada (não renovada)
    if (eventLower.includes('expired') || eventLower.includes('overdue')) {
      console.log('Subscription expired - removing access');
      
      if (subscriptions.length > 0) {
        const sub = subscriptions[0];
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          status: 'expired',
          plan: 'free',
          daily_actions_limit: 5,
          end_date: new Date().toISOString().split('T')[0]
        });
        console.log(`Subscription ${sub.id} expired`);
      }
      
      return Response.json({ success: true, action: 'subscription_expired' });
    }

    // Evento não reconhecido - apenas logar
    console.log(`Unhandled event type: ${eventType}`);
    return Response.json({ success: true, message: 'Event logged' });

  } catch (error) {
    console.error('Webhook error:', error);
    // Retorna 200 para evitar retries do Cakto
    return Response.json({ success: false, error: error.message }, { status: 200 });
  }
});

function getNextBillingDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().split('T')[0];
}
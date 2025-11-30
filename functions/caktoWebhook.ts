import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Calcula a próxima data de cobrança (1 mês a partir de hoje)
function getNextBillingDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().split('T')[0];
}

Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Signature, Authorization'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // GET para verificar se o webhook está funcionando
  if (req.method === 'GET') {
    return Response.json({ 
      status: 'ok', 
      message: 'Cakto Webhook endpoint is active',
      timestamp: new Date().toISOString()
    }, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Cakto Webhook received:', JSON.stringify(body));

    // Extrair dados do webhook - suporta vários formatos do Cakto
    const {
      event,
      type,
      data,
      order,
      customer,
      payment,
      subscription,
      buyer
    } = body;

    const eventType = event || type || body.event_type;
    const orderData = data?.order || order || data;
    const customerData = data?.customer || customer || buyer || orderData?.customer || orderData?.buyer;
    const paymentData = data?.payment || payment;
    const subscriptionData = data?.subscription || subscription;

    // Identificar o email do cliente
    const customerEmail = 
      customerData?.email || 
      orderData?.customer?.email || 
      orderData?.buyer?.email ||
      paymentData?.customer?.email ||
      subscriptionData?.customer?.email ||
      body.email ||
      body.buyer_email ||
      body.customer_email;

    if (!customerEmail) {
      console.log('No customer email found in webhook payload:', JSON.stringify(body));
      return Response.json({ 
        received: true, 
        message: 'No customer email found',
        body_received: body
      }, { headers: corsHeaders });
    }

    console.log(`Processing event "${eventType}" for customer ${customerEmail}`);

    // Criar cliente Base44 com service role
    const base44 = createClientFromRequest(req);

    // Buscar assinatura do usuário pelo email (created_by)
    let userSubscription = null;
    
    try {
      const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
        created_by: customerEmail
      });
      userSubscription = subscriptions[0];
    } catch (e) {
      console.log('Error finding subscription by email:', e.message);
    }

    // Se não encontrar, tentar buscar por cakto_customer_id
    if (!userSubscription && (customerData?.id || subscriptionData?.customer_id)) {
      try {
        const subsByCustomerId = await base44.asServiceRole.entities.Subscription.filter({
          cakto_customer_id: String(customerData?.id || subscriptionData?.customer_id)
        });
        userSubscription = subsByCustomerId[0];
      } catch (e) {
        console.log('Error finding subscription by customer_id:', e.message);
      }
    }

    // Se não encontrar, tentar buscar por cakto_order_id
    if (!userSubscription && (orderData?.id || subscriptionData?.id || body.order_id)) {
      try {
        const orderId = orderData?.id || subscriptionData?.id || body.order_id;
        const subsByOrderId = await base44.asServiceRole.entities.Subscription.filter({
          cakto_order_id: String(orderId)
        });
        userSubscription = subsByOrderId[0];
      } catch (e) {
        console.log('Error finding subscription by order_id:', e.message);
      }
    }

    // Dados para ativar plano Pro
    const activateProData = {
      plan: 'pro',
      status: 'active',
      payment_status: 'paid',
      daily_actions_limit: 999999,
      daily_actions_used: 0,
      price: 49.99,
      next_billing_date: getNextBillingDate(),
      start_date: new Date().toISOString().split('T')[0],
      cakto_order_id: String(orderData?.id || subscriptionData?.id || body.order_id || ''),
      cakto_customer_id: String(customerData?.id || subscriptionData?.customer_id || '')
    };

    // Dados para desativar plano (voltar ao Free)
    const deactivateData = {
      plan: 'free',
      status: 'expired',
      payment_status: 'failed',
      daily_actions_limit: 5,
      daily_actions_used: 0
    };

    // Processar eventos - PAGAMENTO APROVADO
    const approvedEvents = [
      'payment.approved', 'payment.paid', 'payment_approved', 'payment_paid',
      'order.paid', 'order_paid', 'order.approved', 'order_approved',
      'subscription.active', 'subscription_active', 'subscription.renewed', 'subscription_renewed',
      'purchase.approved', 'purchase_approved', 'sale.completed', 'sale_completed',
      'approved', 'paid', 'completed'
    ];

    // Processar eventos - PAGAMENTO FALHOU/CANCELADO
    const failedEvents = [
      'payment.refused', 'payment.failed', 'payment.declined', 'payment_refused', 'payment_failed',
      'subscription.canceled', 'subscription.cancelled', 'subscription_canceled', 'subscription_cancelled',
      'subscription.expired', 'subscription.overdue', 'subscription_expired',
      'order.canceled', 'order.cancelled', 'order_canceled', 'order_cancelled',
      'payment.refunded', 'refund.created', 'chargeback.created',
      'refused', 'failed', 'declined', 'canceled', 'cancelled', 'expired', 'refunded'
    ];

    const eventLower = (eventType || '').toLowerCase();

    if (approvedEvents.some(e => eventLower.includes(e.toLowerCase()))) {
      // LIBERA ACESSO
      if (userSubscription) {
        await base44.asServiceRole.entities.Subscription.update(userSubscription.id, activateProData);
        console.log(`✅ Subscription ACTIVATED for ${customerEmail}`);
      } else {
        // Criar nova assinatura
        try {
          const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
          if (users[0]) {
            await base44.asServiceRole.entities.Subscription.create({
              ...activateProData,
              user_id: users[0].id,
              last_reset_date: new Date().toISOString().split('T')[0]
            });
            console.log(`✅ NEW subscription created for ${customerEmail}`);
          } else {
            console.log(`⚠️ User not found with email ${customerEmail}`);
          }
        } catch (e) {
          console.log('Error creating subscription:', e.message);
        }
      }
    } else if (failedEvents.some(e => eventLower.includes(e.toLowerCase()))) {
      // REMOVE ACESSO
      if (userSubscription) {
        await base44.asServiceRole.entities.Subscription.update(userSubscription.id, {
          ...deactivateData,
          status: eventLower.includes('cancel') ? 'cancelled' : 'expired'
        });
        console.log(`❌ Access REVOKED for ${customerEmail} - ${eventType}`);
      }
    } else {
      console.log(`⚪ Unhandled event type: ${eventType}`);
    }

    return Response.json({ 
      received: true, 
      event: eventType,
      customer: customerEmail,
      subscription_found: !!userSubscription
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      received: true, 
      error: error.message 
    }, { headers: corsHeaders });
  }
});
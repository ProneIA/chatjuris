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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Signature'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Cakto Webhook received:', JSON.stringify(body));

    // Extrair dados do webhook - suporta vários formatos
    const {
      event,
      type,
      data,
      order,
      customer,
      payment,
      subscription
    } = body;

    const eventType = event || type || body.eventType;
    const orderData = data?.order || order || data;
    const customerData = data?.customer || customer || body.customer;
    const paymentData = data?.payment || payment;
    const subscriptionData = data?.subscription || subscription;

    // Identificar o email do cliente
    const customerEmail = 
      customerData?.email || 
      orderData?.customer?.email || 
      orderData?.buyer?.email ||
      orderData?.email ||
      paymentData?.customer?.email ||
      subscriptionData?.customer?.email ||
      body.email ||
      body.buyer_email;

    if (!customerEmail) {
      console.log('No customer email found in webhook:', body);
      return Response.json({ received: true, message: 'No customer email found' }, { headers: corsHeaders });
    }

    console.log(`Processing event "${eventType}" for customer ${customerEmail}`);

    // Criar cliente Base44 com service role
    const base44 = createClientFromRequest(req);

    // Buscar assinatura do usuário pelo email (created_by)
    let userSubscription = null;
    
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      created_by: customerEmail
    });
    userSubscription = subscriptions[0];

    // Se não encontrar por email, buscar por cakto_customer_id
    if (!userSubscription && customerData?.id) {
      const subsByCustomerId = await base44.asServiceRole.entities.Subscription.filter({
        cakto_customer_id: customerData.id
      });
      userSubscription = subsByCustomerId[0];
    }

    // Se não encontrar, buscar por cakto_order_id
    if (!userSubscription && orderData?.id) {
      const subsByOrderId = await base44.asServiceRole.entities.Subscription.filter({
        cakto_order_id: orderData.id
      });
      userSubscription = subsByOrderId[0];
    }

    console.log(`Found subscription: ${userSubscription?.id || 'none'}`);

    // Processar eventos - PAGAMENTO APROVADO = LIBERA ACESSO
    const approvedEvents = [
      'payment.approved', 'payment.paid', 'payment_approved', 'payment_paid',
      'order.paid', 'order_paid', 'order.approved', 'order_approved',
      'subscription.active', 'subscription_active', 'subscription.renewed',
      'sale_approved', 'purchase_approved', 'approved'
    ];

    // PAGAMENTO PENDENTE
    const pendingEvents = [
      'payment.pending', 'payment_pending', 'payment.processing',
      'order.pending', 'order_pending', 'pending'
    ];

    // PAGAMENTO RECUSADO/FALHOU = REMOVE ACESSO
    const failedEvents = [
      'payment.refused', 'payment.failed', 'payment.declined',
      'payment_refused', 'payment_failed', 'payment_declined',
      'order.refused', 'order_refused', 'refused', 'failed', 'declined'
    ];

    // ASSINATURA CANCELADA = REMOVE ACESSO
    const cancelledEvents = [
      'subscription.canceled', 'subscription.cancelled', 'subscription_canceled',
      'subscription_cancelled', 'order.canceled', 'order.cancelled',
      'order_canceled', 'order_cancelled', 'canceled', 'cancelled'
    ];

    // ASSINATURA EXPIRADA = REMOVE ACESSO
    const expiredEvents = [
      'subscription.expired', 'subscription_expired', 'subscription.overdue',
      'subscription_overdue', 'subscription.unpaid', 'expired', 'overdue'
    ];

    // REEMBOLSO = REMOVE ACESSO
    const refundEvents = [
      'payment.refunded', 'refund.created', 'chargeback.created',
      'refunded', 'chargeback', 'dispute'
    ];

    const eventLower = (eventType || '').toLowerCase();

    if (approvedEvents.some(e => eventLower.includes(e.toLowerCase()))) {
      // LIBERAR ACESSO PRO
      const updateData = {
        plan: 'pro',
        status: 'active',
        payment_status: 'paid',
        daily_actions_limit: 999999,
        daily_actions_used: 0,
        price: 49.99,
        next_billing_date: getNextBillingDate(),
        start_date: new Date().toISOString().split('T')[0],
        cakto_order_id: orderData?.id || subscriptionData?.id,
        cakto_customer_id: customerData?.id
      };

      if (userSubscription) {
        await base44.asServiceRole.entities.Subscription.update(userSubscription.id, updateData);
        console.log(`✅ Subscription ACTIVATED for ${customerEmail}`);
      } else {
        // Buscar usuário pelo email para criar assinatura
        const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
        if (users[0]) {
          await base44.asServiceRole.entities.Subscription.create({
            ...updateData,
            user_id: users[0].id,
            last_reset_date: new Date().toISOString().split('T')[0]
          });
          console.log(`✅ NEW subscription created for ${customerEmail}`);
        } else {
          console.log(`⚠️ User not found: ${customerEmail}`);
        }
      }

    } else if (pendingEvents.some(e => eventLower.includes(e.toLowerCase()))) {
      // PAGAMENTO PENDENTE - manter status atual
      if (userSubscription) {
        await base44.asServiceRole.entities.Subscription.update(userSubscription.id, {
          payment_status: 'pending'
        });
        console.log(`⏳ Payment PENDING for ${customerEmail}`);
      }

    } else if (failedEvents.some(e => eventLower.includes(e.toLowerCase()))) {
      // PAGAMENTO FALHOU - REMOVER ACESSO
      if (userSubscription) {
        await base44.asServiceRole.entities.Subscription.update(userSubscription.id, {
          plan: 'free',
          status: 'expired',
          payment_status: 'failed',
          daily_actions_limit: 5,
          daily_actions_used: 0
        });
        console.log(`❌ Access REVOKED for ${customerEmail} - payment failed`);
      }

    } else if (cancelledEvents.some(e => eventLower.includes(e.toLowerCase()))) {
      // ASSINATURA CANCELADA - REMOVER ACESSO
      if (userSubscription) {
        await base44.asServiceRole.entities.Subscription.update(userSubscription.id, {
          plan: 'free',
          status: 'cancelled',
          payment_status: 'cancelled',
          daily_actions_limit: 5,
          daily_actions_used: 0
        });
        console.log(`🚫 Subscription CANCELLED for ${customerEmail}`);
      }

    } else if (expiredEvents.some(e => eventLower.includes(e.toLowerCase()))) {
      // ASSINATURA EXPIRADA - REMOVER ACESSO
      if (userSubscription) {
        await base44.asServiceRole.entities.Subscription.update(userSubscription.id, {
          plan: 'free',
          status: 'expired',
          payment_status: 'failed',
          daily_actions_limit: 5,
          daily_actions_used: 0
        });
        console.log(`⏰ Subscription EXPIRED for ${customerEmail}`);
      }

    } else if (refundEvents.some(e => eventLower.includes(e.toLowerCase()))) {
      // REEMBOLSO - REMOVER ACESSO
      if (userSubscription) {
        await base44.asServiceRole.entities.Subscription.update(userSubscription.id, {
          plan: 'free',
          status: 'cancelled',
          payment_status: 'cancelled',
          daily_actions_limit: 5,
          daily_actions_used: 0
        });
        console.log(`💸 Access REVOKED for ${customerEmail} - refund/chargeback`);
      }

    } else {
      console.log(`ℹ️ Unhandled event type: ${eventType}`);
    }

    return Response.json({ 
      success: true,
      received: true, 
      event: eventType,
      customer: customerEmail 
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    // Retornar 200 para evitar retentativas infinitas
    return Response.json({ 
      received: true, 
      error: error.message 
    }, { headers: corsHeaders });
  }
});
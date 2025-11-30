import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Valida a assinatura do webhook do Cakto
function validateWebhookSignature(payload, signature, secret) {
  // Implementar validação HMAC se o Cakto fornecer
  // Por enquanto, validamos se o secret está presente
  if (!secret) return true;
  // TODO: Adicionar validação HMAC quando disponível
  return true;
}

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
    const signature = req.headers.get('X-Webhook-Signature') || req.headers.get('x-webhook-signature');
    const webhookSecret = Deno.env.get('CAKTO_WEBHOOK_SECRET');
    
    const body = await req.json();
    console.log('Cakto Webhook received:', JSON.stringify(body));

    // Validar assinatura
    if (webhookSecret && !validateWebhookSignature(JSON.stringify(body), signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401, headers: corsHeaders });
    }

    // Extrair dados do webhook
    const {
      event,
      type,
      data,
      order,
      customer,
      payment,
      subscription
    } = body;

    const eventType = event || type;
    const orderData = data?.order || order || data;
    const customerData = data?.customer || customer;
    const paymentData = data?.payment || payment;
    const subscriptionData = data?.subscription || subscription;

    // Identificar o email do cliente
    const customerEmail = 
      customerData?.email || 
      orderData?.customer?.email || 
      orderData?.buyer?.email ||
      paymentData?.customer?.email ||
      subscriptionData?.customer?.email;

    if (!customerEmail) {
      console.log('No customer email found in webhook');
      return Response.json({ received: true, message: 'No customer email' }, { headers: corsHeaders });
    }

    console.log(`Processing event ${eventType} for customer ${customerEmail}`);

    // Criar cliente Base44 com service role
    const base44 = createClientFromRequest(req);

    // Buscar assinatura do usuário pelo email
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      created_by: customerEmail
    });

    let userSubscription = subscriptions[0];

    // Se não encontrar, tentar buscar por cakto_customer_id
    if (!userSubscription && (customerData?.id || subscriptionData?.customer_id)) {
      const subsByCustomerId = await base44.asServiceRole.entities.Subscription.filter({
        cakto_customer_id: customerData?.id || subscriptionData?.customer_id
      });
      userSubscription = subsByCustomerId[0];
    }

    // Se não encontrar, tentar buscar por cakto_order_id
    if (!userSubscription && (orderData?.id || subscriptionData?.id)) {
      const subsByOrderId = await base44.asServiceRole.entities.Subscription.filter({
        cakto_order_id: orderData?.id || subscriptionData?.id
      });
      userSubscription = subsByOrderId[0];
    }

    // Processar eventos
    switch (eventType) {
      // Pagamento aprovado - LIBERA ACESSO
      case 'payment.approved':
      case 'payment.paid':
      case 'payment_approved':
      case 'order.paid':
      case 'subscription.active':
      case 'subscription.renewed': {
        const updateData = {
          plan: 'pro',
          status: 'active',
          payment_status: 'paid',
          daily_actions_limit: 999999,
          daily_actions_used: 0,
          price: 49.99,
          next_billing_date: getNextBillingDate(),
          cakto_order_id: orderData?.id || subscriptionData?.id || userSubscription?.cakto_order_id,
          cakto_customer_id: customerData?.id || subscriptionData?.customer_id || userSubscription?.cakto_customer_id
        };

        if (userSubscription) {
          await base44.asServiceRole.entities.Subscription.update(userSubscription.id, updateData);
          console.log(`Subscription activated for ${customerEmail}`);
        } else {
          // Criar nova assinatura se não existir
          // Precisamos encontrar o user_id pelo email
          const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
          if (users[0]) {
            await base44.asServiceRole.entities.Subscription.create({
              ...updateData,
              user_id: users[0].id,
              start_date: new Date().toISOString().split('T')[0],
              last_reset_date: new Date().toISOString().split('T')[0]
            });
            console.log(`New subscription created for ${customerEmail}`);
          }
        }
        break;
      }

      // Pagamento falhou ou pendente - MANTÉM STATUS ATUAL
      case 'payment.pending':
      case 'payment.processing':
      case 'payment_pending': {
        if (userSubscription) {
          await base44.asServiceRole.entities.Subscription.update(userSubscription.id, {
            payment_status: 'pending'
          });
          console.log(`Payment pending for ${customerEmail}`);
        }
        break;
      }

      // Pagamento recusado/falhou - REMOVE ACESSO
      case 'payment.refused':
      case 'payment.failed':
      case 'payment.declined':
      case 'payment_refused':
      case 'payment_failed': {
        if (userSubscription) {
          await base44.asServiceRole.entities.Subscription.update(userSubscription.id, {
            plan: 'free',
            status: 'expired',
            payment_status: 'failed',
            daily_actions_limit: 5,
            daily_actions_used: 0
          });
          console.log(`Access revoked for ${customerEmail} - payment failed`);
        }
        break;
      }

      // Assinatura cancelada - REMOVE ACESSO
      case 'subscription.canceled':
      case 'subscription.cancelled':
      case 'subscription_canceled':
      case 'order.canceled':
      case 'order.cancelled': {
        if (userSubscription) {
          await base44.asServiceRole.entities.Subscription.update(userSubscription.id, {
            plan: 'free',
            status: 'cancelled',
            payment_status: 'cancelled',
            daily_actions_limit: 5,
            daily_actions_used: 0
          });
          console.log(`Subscription cancelled for ${customerEmail}`);
        }
        break;
      }

      // Assinatura expirada/não renovada - REMOVE ACESSO
      case 'subscription.expired':
      case 'subscription.overdue':
      case 'subscription_expired':
      case 'subscription.unpaid': {
        if (userSubscription) {
          await base44.asServiceRole.entities.Subscription.update(userSubscription.id, {
            plan: 'free',
            status: 'expired',
            payment_status: 'failed',
            daily_actions_limit: 5,
            daily_actions_used: 0
          });
          console.log(`Access revoked for ${customerEmail} - subscription expired`);
        }
        break;
      }

      // Reembolso - REMOVE ACESSO
      case 'payment.refunded':
      case 'refund.created':
      case 'chargeback.created': {
        if (userSubscription) {
          await base44.asServiceRole.entities.Subscription.update(userSubscription.id, {
            plan: 'free',
            status: 'cancelled',
            payment_status: 'cancelled',
            daily_actions_limit: 5,
            daily_actions_used: 0
          });
          console.log(`Access revoked for ${customerEmail} - refund/chargeback`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return Response.json({ 
      received: true, 
      event: eventType,
      customer: customerEmail 
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    // Retornar 200 para evitar retentativas do Cakto
    return Response.json({ 
      received: true, 
      error: error.message 
    }, { headers: corsHeaders });
  }
});
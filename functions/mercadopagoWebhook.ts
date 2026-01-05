import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const MP_API_BASE = "https://api.mercadopago.com";

// Busca detalhes do pagamento no MP
async function getPaymentDetails(paymentId) {
  const response = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` }
  });
  if (!response.ok) return null;
  return await response.json();
}

// Busca detalhes da assinatura no MP
async function getSubscriptionDetails(subscriptionId) {
  const response = await fetch(`${MP_API_BASE}/preapproval/${subscriptionId}`, {
    headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` }
  });
  if (!response.ok) return null;
  return await response.json();
}

// Atualiza o status da assinatura no banco baseado em detalhes do pagamento
async function updateSubscriptionFromPayment(base44, paymentDetails) {
  try {
    const metadata = paymentDetails.metadata;
    const userId = metadata?.user_id;
    const userEmail = metadata?.user_email || paymentDetails.payer?.email;
    const planId = metadata?.plan_id;

    if (!userId && !userEmail) {
      console.log('No user identifier in payment metadata');
      return;
    }

    const query = userId ? { user_id: userId } : { created_by: userEmail };
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter(query);

    if (subscriptions.length === 0) {
      console.log('No subscription found for user');
      return;
    }

    const subscription = subscriptions[0];
    const status = paymentDetails.status;

    let subscriptionStatus = 'pending';
    let paymentStatus = 'pending';

    if (status === 'approved') {
      subscriptionStatus = 'active';
      paymentStatus = 'paid';
    } else if (status === 'rejected' || status === 'cancelled') {
      subscriptionStatus = 'cancelled';
      paymentStatus = 'failed';
    } else if (status === 'pending' || status === 'in_process') {
      subscriptionStatus = 'pending';
      paymentStatus = 'pending';
    }

    const updateData = {
      status: subscriptionStatus,
      payment_status: paymentStatus,
      payment_external_id: paymentDetails.id?.toString(),
      plan: planId || subscription.plan || 'pro_monthly',
      daily_actions_limit: subscriptionStatus === 'active' ? 999999 : 5,
      daily_actions_used: 0,
      last_reset_date: new Date().toISOString().split('T')[0],
      start_date: subscriptionStatus === 'active' ? new Date().toISOString().split('T')[0] : subscription.start_date,
      next_billing_date: subscriptionStatus === 'active' ? calculateNextBillingDate(new Date()) : subscription.next_billing_date,
      price: paymentDetails.transaction_amount || subscription.price,
      payment_method: paymentDetails.payment_method_id || subscription.payment_method
    };

    await base44.asServiceRole.entities.Subscription.update(subscription.id, updateData);
    console.log('Subscription updated from payment:', subscription.id, updateData);
  } catch (error) {
    console.error('Error updating subscription from payment:', error);
  }
}

// Atualiza o status da assinatura no banco (assinaturas recorrentes)
async function updateSubscriptionStatus(base44, mpSubscriptionId, newStatus, paymentStatus, extraData = {}) {
  const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
    payment_external_id: mpSubscriptionId
  });

  if (subscriptions.length === 0) {
    console.log("Assinatura não encontrada no banco:", mpSubscriptionId);
    return null;
  }

  const subscription = subscriptions[0];
  
  const updateData = {
    status: newStatus,
    payment_status: paymentStatus,
    ...extraData
  };

  await base44.asServiceRole.entities.Subscription.update(subscription.id, updateData);
  
  console.log(`Assinatura ${subscription.id} atualizada: status=${newStatus}, payment=${paymentStatus}`);
  return subscription;
}

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-signature, x-request-id',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method === 'GET') {
    return Response.json({ status: 'Webhook ativo' }, { status: 200, headers });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    console.log("Webhook recebido:", JSON.stringify(body));

    const { type, data, action } = body;

    // Notificação de pagamento único (checkout preference)
    if (type === "payment") {
      const paymentId = data?.id;
      if (!paymentId) {
        console.log("ID do pagamento não fornecido");
        return Response.json({ received: true }, { headers });
      }

      const payment = await getPaymentDetails(paymentId);
      if (!payment) {
        console.log("Pagamento não encontrado");
        return Response.json({ received: true }, { headers });
      }

      console.log("Detalhes do pagamento:", JSON.stringify(payment));

      // Atualizar subscription baseado no pagamento
      await updateSubscriptionFromPayment(base44, payment);
    }

    // Notificação de assinatura recorrente (preapproval)
    if (type === "subscription_preapproval" || type === "preapproval") {
      const subscriptionId = data?.id;
      if (!subscriptionId) {
        console.log("ID da assinatura não fornecido");
        return Response.json({ received: true }, { headers });
      }

      const subscription = await getSubscriptionDetails(subscriptionId);
      if (!subscription) {
        console.log("Assinatura não encontrada");
        return Response.json({ received: true }, { headers });
      }

      console.log("Detalhes da assinatura:", JSON.stringify(subscription));

      switch (subscription.status) {
        case "authorized":
        case "active":
          await updateSubscriptionStatus(base44, subscriptionId, "active", "paid", {
            next_billing_date: subscription.next_payment_date?.split('T')[0]
          });
          break;

        case "paused":
          await updateSubscriptionStatus(base44, subscriptionId, "pending", "pending");
          break;

        case "cancelled":
          await updateSubscriptionStatus(base44, subscriptionId, "cancelled", "cancelled", {
            end_date: new Date().toISOString().split('T')[0]
          });
          break;

        case "pending":
          await updateSubscriptionStatus(base44, subscriptionId, "pending", "pending");
          break;
      }
    }

    // Notificação de pagamento autorizado em assinatura
    if (type === "subscription_authorized_payment" || type === "authorized_payment") {
      const paymentId = data?.id;
      if (paymentId) {
        const payment = await getPaymentDetails(paymentId);
        if (payment) {
          await updateSubscriptionFromPayment(base44, payment);
        }
      }
    }

    return Response.json({ received: true, processed: true }, { headers });

  } catch (error) {
    console.error("Erro no webhook:", error);
    return Response.json({ received: true, error: error.message }, { headers });
  }
});

function calculateNextBillingDate() {
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  return next.toISOString().split('T')[0];
}
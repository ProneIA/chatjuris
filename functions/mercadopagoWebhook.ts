import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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

// Atualiza o status da assinatura no banco
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
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  // Apenas POST é aceito para webhooks
  if (req.method !== "POST") {
    return Response.json({ error: "Método não permitido" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    console.log("Webhook recebido:", JSON.stringify(body));

    const { type, data, action } = body;

    // Notificação de pagamento
    if (type === "payment") {
      const paymentId = data?.id;
      if (!paymentId) {
        return Response.json({ received: true, message: "ID do pagamento não fornecido" });
      }

      const payment = await getPaymentDetails(paymentId);
      if (!payment) {
        return Response.json({ received: true, message: "Pagamento não encontrado" });
      }

      console.log("Detalhes do pagamento:", JSON.stringify(payment));

      // Busca a assinatura relacionada
      const mpSubscriptionId = payment.metadata?.preapproval_id || payment.external_reference;
      
      if (payment.status === "approved") {
        // Pagamento aprovado - libera acesso
        await updateSubscriptionStatus(base44, mpSubscriptionId, "active", "paid", {
          next_billing_date: calculateNextBillingDate()
        });
      } else if (payment.status === "rejected" || payment.status === "cancelled") {
        // Pagamento rejeitado
        await updateSubscriptionStatus(base44, mpSubscriptionId, "pending", "failed");
      }
    }

    // Notificação de assinatura (preapproval)
    if (type === "subscription_preapproval" || type === "preapproval") {
      const subscriptionId = data?.id;
      if (!subscriptionId) {
        return Response.json({ received: true, message: "ID da assinatura não fornecido" });
      }

      const subscription = await getSubscriptionDetails(subscriptionId);
      if (!subscription) {
        return Response.json({ received: true, message: "Assinatura não encontrada" });
      }

      console.log("Detalhes da assinatura:", JSON.stringify(subscription));

      switch (subscription.status) {
        case "authorized":
        case "active":
          // Assinatura ativa - libera acesso
          await updateSubscriptionStatus(base44, subscriptionId, "active", "paid", {
            next_billing_date: subscription.next_payment_date?.split('T')[0]
          });
          break;

        case "paused":
          // Assinatura pausada
          await updateSubscriptionStatus(base44, subscriptionId, "pending", "pending");
          break;

        case "cancelled":
          // Assinatura cancelada - bloqueia acesso
          await updateSubscriptionStatus(base44, subscriptionId, "cancelled", "cancelled", {
            end_date: new Date().toISOString().split('T')[0]
          });
          break;

        case "pending":
          // Aguardando pagamento
          await updateSubscriptionStatus(base44, subscriptionId, "pending", "pending");
          break;
      }
    }

    // Notificação de pagamento autorizado (authorized_payment)
    if (type === "subscription_authorized_payment") {
      const paymentId = data?.id;
      if (paymentId) {
        const payment = await getPaymentDetails(paymentId);
        if (payment && payment.status === "approved") {
          const mpSubscriptionId = payment.metadata?.preapproval_id;
          if (mpSubscriptionId) {
            await updateSubscriptionStatus(base44, mpSubscriptionId, "active", "paid", {
              next_billing_date: calculateNextBillingDate()
            });
          }
        }
      }
    }

    return Response.json({ received: true, processed: true });

  } catch (error) {
    console.error("Erro no webhook:", error);
    // Retorna 200 mesmo em caso de erro para evitar retentativas do MP
    return Response.json({ received: true, error: error.message });
  }
});

function calculateNextBillingDate() {
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  return next.toISOString().split('T')[0];
}
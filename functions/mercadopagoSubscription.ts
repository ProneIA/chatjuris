import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const MP_API_BASE = "https://api.mercadopago.com";

// Cria uma assinatura no Mercado Pago
async function createMPSubscription(userData, planData) {
  const response = await fetch(`${MP_API_BASE}/preapproval`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      reason: planData.reason || "Assinatura Juris Pro",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: planData.amount || 49.90,
        currency_id: "BRL"
      },
      back_url: planData.back_url || `${Deno.env.get("PUBLIC_URL")}/PaymentSuccess`,
      payer_email: userData.email,
      external_reference: userData.user_id
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao criar assinatura no Mercado Pago");
  }

  return await response.json();
}

// Busca detalhes de uma assinatura
async function getMPSubscription(subscriptionId) {
  const response = await fetch(`${MP_API_BASE}/preapproval/${subscriptionId}`, {
    headers: {
      "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

// Cancela uma assinatura
async function cancelMPSubscription(subscriptionId) {
  const response = await fetch(`${MP_API_BASE}/preapproval/${subscriptionId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status: "cancelled" })
  });

  return response.ok;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);

    // POST: Criar nova assinatura
    if (req.method === "POST") {
      const body = await req.json();
      const { action } = body;

      // Ação: Criar assinatura
      if (action === "create") {
        const user = await base44.auth.me();
        if (!user) {
          return Response.json({ error: "Não autorizado" }, { status: 401 });
        }

        // Verifica se já existe uma assinatura ativa
        const existingSubscriptions = await base44.entities.Subscription.filter({
          created_by: user.email,
          status: "active"
        });

        if (existingSubscriptions.length > 0) {
          return Response.json({ 
            error: "Você já possui uma assinatura ativa",
            subscription: existingSubscriptions[0]
          }, { status: 400 });
        }

        // Cria assinatura no Mercado Pago
        const mpSubscription = await createMPSubscription(
          { email: user.email, user_id: user.id },
          { 
            reason: body.plan_name || "Assinatura Juris Pro",
            amount: body.amount || 49.90,
            back_url: body.back_url
          }
        );

        // Salva no banco de dados
        const subscription = await base44.entities.Subscription.create({
          user_id: user.id,
          plan: "pro",
          status: "pending",
          payment_status: "pending",
          payment_method: "mercadopago",
          payment_external_id: mpSubscription.id,
          payment_external_url: mpSubscription.init_point,
          price: body.amount || 49.90,
          start_date: new Date().toISOString().split('T')[0],
          daily_actions_limit: 999999,
          daily_actions_used: 0,
          last_reset_date: new Date().toISOString().split('T')[0]
        });

        return Response.json({
          success: true,
          subscription_id: subscription.id,
          mp_subscription_id: mpSubscription.id,
          init_point: mpSubscription.init_point,
          sandbox_init_point: mpSubscription.sandbox_init_point
        });
      }

      // Ação: Cancelar assinatura
      if (action === "cancel") {
        const user = await base44.auth.me();
        if (!user) {
          return Response.json({ error: "Não autorizado" }, { status: 401 });
        }

        const subscriptions = await base44.entities.Subscription.filter({
          created_by: user.email,
          status: "active"
        });

        if (subscriptions.length === 0) {
          return Response.json({ error: "Nenhuma assinatura ativa encontrada" }, { status: 404 });
        }

        const subscription = subscriptions[0];

        // Cancela no Mercado Pago
        if (subscription.payment_external_id) {
          await cancelMPSubscription(subscription.payment_external_id);
        }

        // Atualiza no banco
        await base44.entities.Subscription.update(subscription.id, {
          status: "cancelled",
          payment_status: "cancelled",
          end_date: new Date().toISOString().split('T')[0]
        });

        return Response.json({ success: true, message: "Assinatura cancelada com sucesso" });
      }

      // Ação: Verificar status
      if (action === "status") {
        const user = await base44.auth.me();
        if (!user) {
          return Response.json({ error: "Não autorizado" }, { status: 401 });
        }

        const subscriptions = await base44.entities.Subscription.filter({
          created_by: user.email
        });

        const activeSubscription = subscriptions.find(s => s.status === "active");

        return Response.json({
          has_active_subscription: !!activeSubscription,
          subscription: activeSubscription || null,
          all_subscriptions: subscriptions
        });
      }
    }

    return Response.json({ error: "Método não suportado" }, { status: 405 });

  } catch (error) {
    console.error("Erro:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const MP_API_URL = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar subscription do usuário
    const subscriptions = await base44.entities.Subscription.filter({
      created_by: user.email
    });

    if (subscriptions.length === 0) {
      return Response.json({
        has_subscription: false,
        plan: "free",
        status: "inactive",
        access_granted: false
      });
    }

    const subscription = subscriptions[0];
    
    // Se tiver external_id, buscar status atualizado no MP
    let mpStatus = null;
    if (subscription.payment_external_id) {
      try {
        const mpResponse = await fetch(`${MP_API_URL}/preapproval/${subscription.payment_external_id}`, {
          headers: {
            "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
          }
        });
        
        if (mpResponse.ok) {
          mpStatus = await mpResponse.json();
          
          // Sincronizar status se diferente
          const mpStatusMap = {
            "authorized": "active",
            "pending": "pending",
            "paused": "cancelled",
            "cancelled": "cancelled"
          };
          
          const mappedStatus = mpStatusMap[mpStatus.status];
          if (mappedStatus && mappedStatus !== subscription.status) {
            const updateData = {
              status: mappedStatus,
              payment_status: mpStatus.status === "authorized" ? "paid" : subscription.payment_status
            };
            
            if (mappedStatus === "active") {
              updateData.daily_actions_limit = 999999;
            } else if (mappedStatus === "cancelled") {
              updateData.daily_actions_limit = 5;
            }
            
            await base44.entities.Subscription.update(subscription.id, updateData);
            subscription.status = mappedStatus;
          }
        }
      } catch (e) {
        console.error("Erro ao consultar MP:", e);
      }
    }

    const isActive = subscription.status === "active" && subscription.plan === "pro";

    return Response.json({
      has_subscription: true,
      plan: subscription.plan,
      status: subscription.status,
      payment_status: subscription.payment_status,
      access_granted: isActive,
      next_billing_date: subscription.next_billing_date,
      daily_actions_limit: subscription.daily_actions_limit,
      daily_actions_used: subscription.daily_actions_used,
      mp_status: mpStatus?.status,
      subscription_id: subscription.id
    });

  } catch (error) {
    console.error("Erro:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
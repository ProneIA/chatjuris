import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const MP_API_URL = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse do body da notificação
    const body = await req.json();
    console.log("Webhook MP recebido:", JSON.stringify(body));

    const { type, data, action } = body;

    // Tipos de notificação do Mercado Pago
    // - subscription_preapproval: eventos de assinatura
    // - payment: eventos de pagamento
    
    if (type === "subscription_preapproval" && data?.id) {
      // Buscar detalhes da assinatura no MP
      const preapprovalResponse = await fetch(`${MP_API_URL}/preapproval/${data.id}`, {
        headers: {
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
        }
      });
      
      const preapproval = await preapprovalResponse.json();
      console.log("Preapproval data:", JSON.stringify(preapproval));

      // external_reference contém o user_id
      const userId = preapproval.external_reference;
      const payerEmail = preapproval.payer_email;
      
      // Buscar subscription no BD pelo external_id ou email do pagador
      let subscriptions = await base44.asServiceRole.entities.Subscription.filter({
        payment_external_id: data.id
      });

      // Se não encontrou pelo external_id, buscar pelo user_id
      if (subscriptions.length === 0 && userId) {
        subscriptions = await base44.asServiceRole.entities.Subscription.filter({
          user_id: userId
        });
      }

      if (subscriptions.length === 0) {
        console.log("Subscription não encontrada para:", data.id);
        return Response.json({ received: true, message: "Subscription not found" });
      }

      const subscription = subscriptions[0];
      let updateData = {};

      // Mapear status do MP para nosso sistema
      switch (preapproval.status) {
        case "authorized":
          // Assinatura autorizada e ativa
          updateData = {
            status: "active",
            payment_status: "paid",
            payment_external_id: data.id,
            next_billing_date: preapproval.next_payment_date?.split('T')[0],
            daily_actions_limit: 999999,
            daily_actions_used: 0
          };
          console.log(`✅ Assinatura ATIVA para user ${userId}`);
          break;

        case "pending":
          // Aguardando pagamento
          updateData = {
            status: "pending",
            payment_status: "pending"
          };
          console.log(`⏳ Assinatura PENDENTE para user ${userId}`);
          break;

        case "paused":
          // Assinatura pausada
          updateData = {
            status: "cancelled",
            payment_status: "cancelled",
            daily_actions_limit: 5
          };
          console.log(`⏸️ Assinatura PAUSADA para user ${userId}`);
          break;

        case "cancelled":
          // Assinatura cancelada
          updateData = {
            status: "cancelled",
            payment_status: "cancelled",
            end_date: new Date().toISOString().split('T')[0],
            daily_actions_limit: 5
          };
          console.log(`❌ Assinatura CANCELADA para user ${userId}`);
          break;

        default:
          console.log(`Status desconhecido: ${preapproval.status}`);
      }

      if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.Subscription.update(subscription.id, updateData);
        console.log("Subscription atualizada:", subscription.id);
      }
    }

    // Notificações de pagamento individual
    if (type === "payment" && data?.id) {
      const paymentResponse = await fetch(`${MP_API_URL}/v1/payments/${data.id}`, {
        headers: {
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
        }
      });
      
      const payment = await paymentResponse.json();
      console.log("Payment data:", JSON.stringify(payment));

      // Se o pagamento está associado a uma assinatura
      if (payment.metadata?.preapproval_id) {
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
          payment_external_id: payment.metadata.preapproval_id
        });

        if (subscriptions.length > 0) {
          const subscription = subscriptions[0];
          
          if (payment.status === "approved") {
            await base44.asServiceRole.entities.Subscription.update(subscription.id, {
              status: "active",
              payment_status: "paid",
              daily_actions_limit: 999999,
              last_reset_date: new Date().toISOString().split('T')[0]
            });
            console.log(`✅ Pagamento APROVADO - Subscription ${subscription.id} ativada`);
          } else if (payment.status === "rejected") {
            await base44.asServiceRole.entities.Subscription.update(subscription.id, {
              payment_status: "failed"
            });
            console.log(`❌ Pagamento REJEITADO para subscription ${subscription.id}`);
          }
        }
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error("Erro no webhook:", error);
    // Sempre retornar 200 para o MP não reenviar
    return Response.json({ received: true, error: error.message });
  }
});
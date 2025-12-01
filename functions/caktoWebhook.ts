import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  // CORS headers para permitir requisições externas
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Responder preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  // Aceitar apenas POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const body = await req.json();
    console.log('Webhook Cakto recebido:', JSON.stringify(body, null, 2));

    const { event, data } = body;
    const customerEmail = data?.customer?.email;

    if (!customerEmail) {
      console.log('Email do cliente não encontrado');
      return new Response(JSON.stringify({ success: true, message: 'No customer email' }), { status: 200, headers });
    }

    console.log(`Evento: ${event}, Cliente: ${customerEmail}`);

    const base44 = createClientFromRequest(req);

    // Buscar assinatura existente
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      created_by: customerEmail
    });
    const subscription = subscriptions[0];

    // Processar evento
    const eventLower = (event || '').toLowerCase();
    
    // Pagamento aprovado - ativar Pro
    if (eventLower.includes('paid') || eventLower.includes('approved') || eventLower.includes('active') || eventLower.includes('created')) {
      const updateData = {
        plan: 'pro',
        status: 'active',
        payment_status: 'paid',
        daily_actions_limit: 999999,
        daily_actions_used: 0,
        price: 49.99,
        cakto_order_id: data?.id,
        cakto_customer_id: data?.subscription?.id,
        start_date: new Date().toISOString().split('T')[0],
        next_billing_date: data?.subscription?.next_payment_date?.split('T')[0]
      };

      if (subscription) {
        await base44.asServiceRole.entities.Subscription.update(subscription.id, updateData);
        console.log(`Assinatura ATIVADA para ${customerEmail}`);
      } else {
        const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
        if (users[0]) {
          await base44.asServiceRole.entities.Subscription.create({
            ...updateData,
            user_id: users[0].id,
            last_reset_date: new Date().toISOString().split('T')[0]
          });
          console.log(`Nova assinatura CRIADA para ${customerEmail}`);
        }
      }
    }
    
    // Cancelamento ou falha
    if (eventLower.includes('cancel') || eventLower.includes('failed') || eventLower.includes('expired') || eventLower.includes('refund')) {
      if (subscription) {
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          plan: 'free',
          status: 'cancelled',
          payment_status: 'cancelled',
          daily_actions_limit: 5,
          daily_actions_used: 0
        });
        console.log(`Assinatura CANCELADA para ${customerEmail}`);
      }
    }

    return new Response(JSON.stringify({ success: true, event, customer: customerEmail }), { status: 200, headers });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(JSON.stringify({ success: true, error: error.message }), { status: 200, headers });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers });
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'Webhook Cakto ativo', timestamp: new Date().toISOString() }), { status: 200, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST' }), { status: 200, headers });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ received: true, parse_error: true }), { status: 200, headers });
  }

  console.log('=== WEBHOOK CAKTO ===');
  console.log('Evento:', body.event);
  console.log('Body:', JSON.stringify(body));

  const event = body.event || '';
  const data = body.data || {};
  const customerEmail = data.customer?.email;

  if (!customerEmail) {
    return new Response(JSON.stringify({ received: true, no_email: true }), { status: 200, headers });
  }

  try {
    const base44 = createClientFromRequest(req);

    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      created_by: customerEmail
    });
    const existingSub = subscriptions[0];

    const eventLower = event.toLowerCase();
    const isPaid = eventLower.includes('paid') || eventLower.includes('approved') || eventLower.includes('active') || eventLower.includes('created');
    const isCancelled = eventLower.includes('cancel') || eventLower.includes('failed') || eventLower.includes('expired') || eventLower.includes('refund') || eventLower.includes('chargeback');

    if (isPaid) {
      const proData = {
        plan: 'pro',
        status: 'active',
        payment_status: 'paid',
        daily_actions_limit: 999999,
        daily_actions_used: 0,
        price: 49.99,
        cakto_order_id: data.id || '',
        cakto_customer_id: data.subscription?.id || '',
        start_date: new Date().toISOString().split('T')[0],
        next_billing_date: data.subscription?.next_payment_date ? data.subscription.next_payment_date.split('T')[0] : null
      };

      if (existingSub) {
        await base44.asServiceRole.entities.Subscription.update(existingSub.id, proData);
        console.log('PRO ATIVADO:', customerEmail);
      } else {
        const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
        if (users[0]) {
          await base44.asServiceRole.entities.Subscription.create({
            ...proData,
            user_id: users[0].id,
            last_reset_date: new Date().toISOString().split('T')[0]
          });
          console.log('NOVA ASSINATURA PRO:', customerEmail);
        }
      }
    }

    if (isCancelled && existingSub) {
      await base44.asServiceRole.entities.Subscription.update(existingSub.id, {
        plan: 'free',
        status: 'cancelled',
        payment_status: 'cancelled',
        daily_actions_limit: 5
      });
      console.log('CANCELADO:', customerEmail);
    }

    return new Response(JSON.stringify({ success: true, event, customer: customerEmail }), { status: 200, headers });

  } catch (error) {
    console.error('Erro:', error.message);
    return new Response(JSON.stringify({ received: true, error: error.message }), { status: 200, headers });
  }
});
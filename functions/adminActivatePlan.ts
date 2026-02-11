import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Apenas admins podem ativar planos
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { user_id, plan_type, price } = await req.json();

    if (!user_id || !plan_type) {
      return Response.json({ error: 'Missing required fields: user_id, plan_type' }, { status: 400 });
    }

    if (!['monthly', 'yearly', 'lifetime'].includes(plan_type)) {
      return Response.json({ error: 'Invalid plan_type. Must be: monthly, yearly, or lifetime' }, { status: 400 });
    }

    const now = new Date();
    let endDate = null;
    let status = 'active';
    let isLifetime = false;

    // Calcular end_date baseado no plano
    if (plan_type === 'monthly') {
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 30);
    } else if (plan_type === 'yearly') {
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 365);
    } else if (plan_type === 'lifetime') {
      endDate = null;
      status = 'lifetime';
      isLifetime = true;
    }

    // Encerrar subscription ativa anterior
    const activeSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user_id,
      status: { $in: ['trial', 'active', 'lifetime'] }
    });

    for (const oldSub of activeSubscriptions) {
      await base44.asServiceRole.entities.Subscription.update(oldSub.id, {
        status: 'canceled'
      });
      console.log(`Canceled previous subscription ${oldSub.id}`);
    }

    // Criar nova subscription
    const newSubscription = await base44.asServiceRole.entities.Subscription.create({
      user_id: user_id,
      plan_type: plan_type,
      status: status,
      start_date: now.toISOString(),
      end_date: endDate ? endDate.toISOString() : null,
      trial_end_date: null,
      is_lifetime: isLifetime,
      price: price || 0,
      payment_method: 'manual'
    });

    return Response.json({ 
      success: true,
      subscription: newSubscription,
      message: `Plan ${plan_type} activated for user ${user_id}`
    });

  } catch (error) {
    console.error('Error in adminActivatePlan:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Apenas admin pode ativar planos
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { user_id, plan_type, price } = await req.json();

    if (!user_id || !plan_type) {
      return Response.json({ error: 'user_id and plan_type are required' }, { status: 400 });
    }

    const validPlanTypes = ['monthly', 'yearly', 'lifetime'];
    if (!validPlanTypes.includes(plan_type)) {
      return Response.json({ error: 'Invalid plan_type' }, { status: 400 });
    }

    const now = new Date();
    let subscriptionData = {
      user_id,
      plan_type,
      start_date: now.toISOString(),
      payment_method: 'manual',
      price: price || 0
    };

    // Configurar dados específicos do plano
    if (plan_type === 'monthly') {
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 30);
      
      subscriptionData.status = 'active';
      subscriptionData.end_date = endDate.toISOString();
      subscriptionData.is_lifetime = false;
      
    } else if (plan_type === 'yearly') {
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 365);
      
      subscriptionData.status = 'active';
      subscriptionData.end_date = endDate.toISOString();
      subscriptionData.is_lifetime = false;
      
    } else if (plan_type === 'lifetime') {
      subscriptionData.status = 'lifetime';
      subscriptionData.end_date = null;
      subscriptionData.is_lifetime = true;
    }

    // 1. Cancelar subscription ativa anterior
    const activeSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_id,
      status: { $in: ['trial', 'active', 'lifetime'] }
    });

    for (const sub of activeSubscriptions) {
      await base44.asServiceRole.entities.Subscription.update(sub.id, {
        status: 'canceled',
        canceled_at: now.toISOString(),
        canceled_reason: 'Upgraded to new plan'
      });
    }

    // 2. Criar nova subscription
    const newSubscription = await base44.asServiceRole.entities.Subscription.create(subscriptionData);

    // 3. Log de auditoria
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      action: 'admin_activate_plan',
      entity_type: 'Subscription',
      entity_id: newSubscription.id,
      target_user_id: user_id,
      details: JSON.stringify({ plan_type, price })
    });

    return Response.json({ 
      success: true,
      subscription: newSubscription,
      message: `Plan ${plan_type} activated successfully`
    });

  } catch (error) {
    console.error('Error activating plan:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
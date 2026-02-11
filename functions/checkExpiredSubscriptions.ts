import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Apenas admin pode executar esta rotina
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const nowISO = now.toISOString();
    
    let expiredCount = 0;
    let trialExpiredCount = 0;
    let activeExpiredCount = 0;

    // 1. Buscar subscriptions em trial
    const trialSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
      status: 'trial'
    });

    for (const sub of trialSubscriptions) {
      if (sub.trial_end_date) {
        const trialEnd = new Date(sub.trial_end_date);
        
        if (now > trialEnd) {
          await base44.asServiceRole.entities.Subscription.update(sub.id, {
            status: 'expired'
          });
          trialExpiredCount++;
          expiredCount++;
        }
      }
    }

    // 2. Buscar subscriptions ativas
    const activeSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
      status: 'active'
    });

    for (const sub of activeSubscriptions) {
      if (sub.end_date) {
        const endDate = new Date(sub.end_date);
        
        if (now > endDate) {
          await base44.asServiceRole.entities.Subscription.update(sub.id, {
            status: 'expired'
          });
          activeExpiredCount++;
          expiredCount++;
        }
      }
    }

    // 3. Log de auditoria
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      action: 'check_expired_subscriptions',
      entity_type: 'Subscription',
      details: JSON.stringify({
        total_expired: expiredCount,
        trial_expired: trialExpiredCount,
        active_expired: activeExpiredCount,
        executed_at: nowISO
      })
    });

    return Response.json({ 
      success: true,
      expired_count: expiredCount,
      trial_expired: trialExpiredCount,
      active_expired: activeExpiredCount,
      message: `Checked and expired ${expiredCount} subscriptions`
    });

  } catch (error) {
    console.error('Error checking expired subscriptions:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
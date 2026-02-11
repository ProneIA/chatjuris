import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar se é admin (função deve ser chamada apenas por admin ou cron)
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    let expiredCount = 0;

    // Buscar todas as subscriptions ativas ou em trial
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      status: { $in: ['trial', 'active'] }
    });

    console.log(`Checking ${subscriptions.length} subscriptions...`);

    for (const subscription of subscriptions) {
      let shouldExpire = false;

      // Verificar trial expirado
      if (subscription.status === 'trial' && subscription.trial_end_date) {
        const trialEndDate = new Date(subscription.trial_end_date);
        if (now > trialEndDate) {
          shouldExpire = true;
          console.log(`Trial expired for user ${subscription.user_id}`);
        }
      }

      // Verificar assinatura ativa expirada
      if (subscription.status === 'active' && subscription.end_date) {
        const endDate = new Date(subscription.end_date);
        if (now > endDate) {
          shouldExpire = true;
          console.log(`Subscription expired for user ${subscription.user_id}`);
        }
      }

      // Atualizar para expired
      if (shouldExpire) {
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          status: 'expired'
        });
        expiredCount++;
      }
    }

    return Response.json({ 
      success: true,
      checked: subscriptions.length,
      expired: expiredCount,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('Error in checkExpiredSubscriptions:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
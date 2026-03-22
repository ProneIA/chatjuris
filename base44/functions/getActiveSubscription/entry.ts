import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar subscription ativa (trial, active ou lifetime)
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id,
      status: { $in: ['trial', 'active', 'lifetime'] }
    }, '-created_date', 1);

    let activeSubscription = subscriptions.length > 0 ? subscriptions[0] : null;
    
    // VALIDAÇÃO: Verificar se end_date expirou (exceto lifetime)
    if (activeSubscription && activeSubscription.plan_type !== 'lifetime' && activeSubscription.end_date) {
      const now = new Date().toISOString().split('T')[0];
      const isExpired = now > activeSubscription.end_date;
      
      if (isExpired) {
        // Atualizar status para expired
        await base44.asServiceRole.entities.Subscription.update(activeSubscription.id, {
          status: 'expired'
        });
        activeSubscription = null;
      }
    }

    return Response.json({ 
      subscription: activeSubscription,
      hasAccess: activeSubscription !== null
    });

  } catch (error) {
    console.error('Error in getActiveSubscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
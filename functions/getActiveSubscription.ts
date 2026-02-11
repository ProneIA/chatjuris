import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id } = await req.json();
    const targetUserId = user_id || user.id;

    // Apenas admin pode consultar outros usuários
    if (targetUserId !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar subscription ativa (trial, active ou lifetime)
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_id: targetUserId,
      status: { $in: ['trial', 'active', 'lifetime'] }
    }, '-created_date', 1);

    const activeSubscription = subscriptions[0] || null;

    return Response.json({ 
      subscription: activeSubscription,
      hasActive: !!activeSubscription
    });

  } catch (error) {
    console.error('Error getting active subscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
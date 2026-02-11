import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se usuário já tem subscription ativa
    const existingSubscriptions = await base44.entities.Subscription.filter({
      user_id: user.id,
      status: { $in: ['trial', 'active', 'lifetime'] }
    });

    if (existingSubscriptions.length > 0) {
      return Response.json({ 
        error: 'User already has an active subscription',
        subscription: existingSubscriptions[0]
      }, { status: 400 });
    }

    // Criar trial de 7 dias
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 7);

    const trialSubscription = await base44.entities.Subscription.create({
      user_id: user.id,
      plan_type: 'trial',
      status: 'trial',
      start_date: now.toISOString(),
      trial_end_date: trialEnd.toISOString(),
      end_date: null,
      is_lifetime: false,
      price: 0,
      payment_method: 'trial'
    });

    return Response.json({ 
      success: true,
      subscription: trialSubscription,
      trial_days: 7,
      trial_end_date: trialEnd.toISOString()
    });

  } catch (error) {
    console.error('Error creating trial subscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
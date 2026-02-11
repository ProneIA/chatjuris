import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se já tem subscription
    const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id
    });

    if (existingSubscriptions.length > 0) {
      return Response.json({ 
        error: 'User already has a subscription',
        subscription: existingSubscriptions[0]
      }, { status: 400 });
    }

    // Criar trial de 7 dias
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    const newSubscription = await base44.asServiceRole.entities.Subscription.create({
      user_id: user.id,
      plan_type: 'trial',
      status: 'trial',
      start_date: now.toISOString(),
      end_date: null,
      trial_end_date: trialEndDate.toISOString(),
      is_lifetime: false,
      price: 0,
      payment_method: 'trial'
    });

    return Response.json({ 
      success: true,
      subscription: newSubscription,
      message: '7-day trial activated'
    });

  } catch (error) {
    console.error('Error in createTrialSubscription:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
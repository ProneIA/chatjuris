import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ 
        canAccess: false, 
        reason: 'not_authenticated',
        redirectToPricing: true
      });
    }

    // Buscar subscription ativa
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id,
      status: { $in: ['trial', 'active', 'lifetime'] }
    }, '-created_date', 1);

    const subscription = subscriptions[0];

    // Sem subscription ativa
    if (!subscription) {
      return Response.json({ 
        canAccess: false, 
        reason: 'no_active_subscription',
        redirectToPricing: true
      });
    }

    const now = new Date();

    // VITALÍCIO: sempre tem acesso
    if (subscription.is_lifetime) {
      return Response.json({ canAccess: true, subscription });
    }

    // TRIAL: verificar trial_end_date
    if (subscription.status === 'trial') {
      if (!subscription.trial_end_date) {
        return Response.json({ canAccess: false, reason: 'invalid_trial' });
      }

      const trialEnd = new Date(subscription.trial_end_date);
      
      if (now <= trialEnd) {
        return Response.json({ canAccess: true, subscription });
      } else {
        // Trial expirado - atualizar status
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          status: 'expired'
        });
        
        return Response.json({ 
          canAccess: false, 
          reason: 'trial_expired',
          redirectToPricing: true
        });
      }
    }

    // ACTIVE: verificar end_date
    if (subscription.status === 'active') {
      if (!subscription.end_date) {
        return Response.json({ canAccess: true, subscription });
      }

      const endDate = new Date(subscription.end_date);
      
      if (now <= endDate) {
        return Response.json({ canAccess: true, subscription });
      } else {
        // Assinatura expirada - atualizar status
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          status: 'expired'
        });
        
        return Response.json({ 
          canAccess: false, 
          reason: 'subscription_expired',
          redirectToPricing: true
        });
      }
    }

    // Status expirado ou cancelado
    return Response.json({ 
      canAccess: false, 
      reason: 'subscription_not_active',
      redirectToPricing: true
    });

  } catch (error) {
    console.error('Error checking access:', error);
    return Response.json({ 
      canAccess: false, 
      reason: 'error',
      error: error.message 
    }, { status: 500 });
  }
});
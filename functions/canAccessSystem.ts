import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        canAccess: false, 
        redirectToPricing: true,
        reason: 'Not authenticated'
      }, { status: 401 });
    }

    // Buscar subscription ativa
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id,
      status: { $in: ['trial', 'active', 'lifetime'] }
    }, '-created_date', 1);

    if (subscriptions.length === 0) {
      return Response.json({ 
        canAccess: false, 
        redirectToPricing: true,
        reason: 'No active subscription'
      });
    }

    const subscription = subscriptions[0];
    const now = new Date();

    // Plano vitalício: sempre tem acesso
    if (subscription.is_lifetime) {
      return Response.json({ 
        canAccess: true, 
        subscription 
      });
    }

    // Trial: verificar se não expirou
    if (subscription.status === 'trial') {
      if (!subscription.trial_end_date) {
        return Response.json({ 
          canAccess: false, 
          redirectToPricing: true,
          reason: 'Trial without end date'
        });
      }

      const trialEndDate = new Date(subscription.trial_end_date);
      
      if (now <= trialEndDate) {
        return Response.json({ 
          canAccess: true, 
          subscription,
          daysLeft: Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24))
        });
      } else {
        // Trial expirado - atualizar status
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          status: 'expired'
        });
        return Response.json({ 
          canAccess: false, 
          redirectToPricing: true,
          reason: 'Trial expired'
        });
      }
    }

    // Assinatura ativa: verificar se não expirou
    if (subscription.status === 'active') {
      if (!subscription.end_date) {
        // Sem data de expiração
        return Response.json({ 
          canAccess: true, 
          subscription 
        });
      }

      const endDate = new Date(subscription.end_date);
      
      if (now <= endDate) {
        return Response.json({ 
          canAccess: true, 
          subscription,
          daysLeft: Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
        });
      } else {
        // Assinatura expirada - atualizar status
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          status: 'expired'
        });
        return Response.json({ 
          canAccess: false, 
          redirectToPricing: true,
          reason: 'Subscription expired'
        });
      }
    }

    // Status lifetime
    if (subscription.status === 'lifetime') {
      return Response.json({ 
        canAccess: true, 
        subscription 
      });
    }

    // Qualquer outro status: sem acesso
    return Response.json({ 
      canAccess: false, 
      redirectToPricing: true,
      reason: `Invalid status: ${subscription.status}`
    });

  } catch (error) {
    console.error('Error in canAccessSystem:', error);
    return Response.json({ 
      canAccess: false,
      error: error.message 
    }, { status: 500 });
  }
});
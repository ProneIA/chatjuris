import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Autenticar usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar subscription do usuário
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
      user_id: user.id 
    });

    if (subscriptions.length === 0) {
      // Criar subscription free se não existir
      const newSub = await base44.asServiceRole.entities.Subscription.create({
        user_id: user.id,
        plan: 'free',
        status: 'trial',
        payment_status: 'pending',
        daily_actions_limit: 0,
        daily_actions_used: 0,
        price: 0,
        start_date: new Date().toISOString().split('T')[0],
        last_reset_date: new Date().toISOString().split('T')[0]
      });

      return Response.json({ 
        subscription: newSub,
        hasAccess: false,
        message: 'Assinatura necessária para acessar a plataforma'
      });
    }

    const subscription = subscriptions[0];
    
    // Verificar se tem acesso (plan PRO e status active)
    const hasAccess = subscription.plan === 'pro' && subscription.status === 'active';

    return Response.json({ 
      subscription,
      hasAccess,
      message: hasAccess ? 'Acesso liberado' : 'Assinatura inativa ou expirada'
    });

  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return Response.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, { status: 500 });
  }
});
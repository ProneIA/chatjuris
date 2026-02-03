import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação de admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('🔍 DEBUG - Checking expired subscriptions...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar todas as subscriptions ativas
    const allSubs = await base44.asServiceRole.entities.Subscription.filter({ 
      status: 'active' 
    });
    
    console.log(`📊 DEBUG - Found ${allSubs.length} active subscriptions to check`);
    
    let expiredCount = 0;
    
    for (const sub of allSubs) {
      // Verificar se a assinatura expirou
      if (sub.end_date && today > sub.end_date) {
        console.log(`⏰ DEBUG - Subscription expired for user ${sub.user_id}`, {
          endDate: sub.end_date,
          today: today,
          plan: sub.plan
        });
        
        // Bloquear acesso
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          status: 'expired',
          daily_actions_limit: 0
        });
        
        expiredCount++;
        console.log(`🔒 DEBUG - Access blocked for user ${sub.user_id}`);
      }
    }
    
    console.log(`✅ DEBUG - Check complete. ${expiredCount} subscriptions expired.`);
    
    return Response.json({ 
      success: true, 
      message: `Checked ${allSubs.length} subscriptions, ${expiredCount} expired and blocked`
    });

  } catch (error) {
    console.error('❌ DEBUG - Error checking subscriptions:', error);
    return Response.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, { status: 500 });
  }
});
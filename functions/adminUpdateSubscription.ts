import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const adminUser = await base44.auth.me();

    if (!adminUser || adminUser.role !== 'admin') {
      return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action, subscriptionData } = body;

    if (!userId || !action) {
      return Response.json({ error: 'userId e action são obrigatórios' }, { status: 400 });
    }

    // Buscar assinatura existente
    const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
    
    let result;
    const timestamp = new Date().toISOString();

    if (action === 'activate_pro') {
      const subData = {
        user_id: userId,
        plan: "pro",
        status: "active",
        daily_actions_limit: 999999,
        daily_actions_used: 0,
        price: subscriptionData?.price || 0,
        payment_method: "manual",
        start_date: new Date().toISOString().split('T')[0],
        last_reset_date: new Date().toISOString().split('T')[0],
        ...(subscriptionData?.end_date && { end_date: subscriptionData.end_date })
      };

      if (existingSubs.length > 0) {
        result = await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, subData);
      } else {
        result = await base44.asServiceRole.entities.Subscription.create(subData);
      }

      // Log de auditoria (opcional - apenas se a entidade existir)
      try {
        await base44.asServiceRole.entities.AuditLog.create({
          action: 'activate_pro_subscription',
          performed_by: adminUser.email,
          target_user_id: userId,
          details: `Admin ${adminUser.email} ativou plano Pro para user ${userId}`,
          timestamp
        });
      } catch (logError) {
        console.log('AuditLog não disponível, mas assinatura foi criada:', logError.message);
      }

    } else if (action === 'deactivate_pro') {
      if (existingSubs.length > 0) {
        result = await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
          plan: "free",
          status: "active",
          daily_actions_limit: 5,
          daily_actions_used: 0,
          price: 0
        });

        // Log de auditoria (opcional - apenas se a entidade existir)
        try {
          await base44.asServiceRole.entities.AuditLog.create({
            action: 'deactivate_pro_subscription',
            performed_by: adminUser.email,
            target_user_id: userId,
            details: `Admin ${adminUser.email} alterou plano para Free para user ${userId}`,
            timestamp
          });
        } catch (logError) {
          console.log('AuditLog não disponível, mas assinatura foi atualizada:', logError.message);
        }
      }
    } else if (action === 'update') {
      if (existingSubs.length > 0 && subscriptionData) {
        result = await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, subscriptionData);

        // Log de auditoria (opcional - apenas se a entidade existir)
        try {
          await base44.asServiceRole.entities.AuditLog.create({
            action: 'update_subscription',
            performed_by: adminUser.email,
            target_user_id: userId,
            details: `Admin ${adminUser.email} atualizou assinatura de user ${userId}: ${JSON.stringify(subscriptionData)}`,
            timestamp
          });
        } catch (logError) {
          console.log('AuditLog não disponível, mas assinatura foi atualizada:', logError.message);
        }
      }
    }

    return Response.json({ 
      success: true,
      subscription: result 
    });

  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});
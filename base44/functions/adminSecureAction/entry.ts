import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // VERIFICAÇÃO OBRIGATÓRIA: Apenas admin
    if (!user) {
      // Registrar tentativa de acesso não autenticado
      await logSecurityAttempt(base44, null, 'unauthenticated_admin_access');
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      // Registrar tentativa de acesso não autorizado
      await logSecurityAttempt(base44, user.email, 'unauthorized_admin_access');
      return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const body = await req.json();
    const { action, data } = body;

    if (!action) {
      return Response.json({ error: 'Ação não especificada' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'list_users':
        result = await base44.asServiceRole.entities.User.list('-created_date');
        break;

      case 'list_subscriptions':
        result = await base44.asServiceRole.entities.Subscription.list('-created_date');
        break;

      case 'list_audit_logs':
        result = await base44.asServiceRole.entities.AuditLog.list('-created_date', 100);
        break;

      case 'update_subscription':
        if (!data?.userId || !data?.planType) {
          return Response.json({ error: 'userId e planType são obrigatórios' }, { status: 400 });
        }
        result = await updateUserSubscription(base44, user, data);
        break;

      case 'release_manual':
        if (!data?.email || !data?.planType) {
          return Response.json({ error: 'email e planType são obrigatórios' }, { status: 400 });
        }
        result = await releaseManualSubscription(base44, user, data);
        break;

      case 'cleanup_duplicates':
        result = await cleanupDuplicateSubscriptions(base44, user);
        break;

      default:
        return Response.json({ error: 'Ação inválida' }, { status: 400 });
    }

    return Response.json({ success: true, data: result });

  } catch (error) {
    console.error('Erro na ação admin:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function logSecurityAttempt(base44, email, action) {
  try {
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: email || 'anonymous',
      action: action,
      entity_type: 'SecurityAttempt',
      details: JSON.stringify({
        timestamp: new Date().toISOString(),
        message: 'Tentativa de acesso não autorizado ao painel admin'
      })
    });
  } catch (e) {
    console.error('Erro ao registrar tentativa de segurança:', e);
  }
}

async function updateUserSubscription(base44, adminUser, data) {
  const { userId, userEmail, planType } = data;
  
  const startDate = new Date();
  let endDate = null;

  if (planType === 'trial') {
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
  } else if (planType === 'monthly') {
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (planType === 'annual') {
    endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  // REGRA DE UNICIDADE: Expirar TODAS as assinaturas anteriores do usuário
  const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
  
  for (const sub of existingSubs) {
    if (sub.status === 'active' || sub.status === 'trial') {
      await base44.asServiceRole.entities.Subscription.update(sub.id, {
        status: 'expired',
        daily_actions_limit: 0
      });
    }
  }

  // Criar NOVA assinatura (nunca reutilizar a antiga)
  const subscriptionData = {
    user_id: userId,
    plan: planType === 'trial' ? 'free' : 'pro',
    plan_type: planType,
    status: planType === 'trial' ? 'trial' : 'active',
    payment_status: 'paid',
    payment_method: 'manual',
    daily_actions_limit: 999999,
    daily_actions_used: 0,
    last_reset_date: startDate.toISOString().split('T')[0],
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate ? endDate.toISOString().split('T')[0] : null,
    next_billing_date: endDate ? endDate.toISOString().split('T')[0] : null,
    activated_at: new Date().toISOString()
  };

  const result = await base44.asServiceRole.entities.Subscription.create(subscriptionData);

  // Criar log de auditoria
  await base44.asServiceRole.entities.AuditLog.create({
    user_email: adminUser.email,
    action: 'manual_subscription_release',
    entity_type: 'Subscription',
    entity_id: userId,
    target_user_id: userId,
    details: JSON.stringify({
      target_email: userEmail,
      plan_type: planType,
      notes: 'Alteração via painel admin',
      end_date: endDate ? endDate.toISOString().split('T')[0] : 'vitalício',
      expired_previous_count: existingSubs.filter(s => s.status === 'active' || s.status === 'trial').length
    })
  });

  return result;
}

async function releaseManualSubscription(base44, adminUser, data) {
  const { email, planType, notes } = data;

  // Buscar usuário pelo email
  const users = await base44.asServiceRole.entities.User.filter({ email });
  let targetUser = users[0];

  if (!targetUser) {
    // Criar usuário se não existir
    targetUser = await base44.asServiceRole.entities.User.create({
      email,
      full_name: email.split('@')[0],
      role: 'user'
    });
  }

  const startDate = new Date();
  let endDate = null;

  if (planType === 'trial') {
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
  } else if (planType === 'monthly') {
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (planType === 'annual') {
    endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  // REGRA DE UNICIDADE: Expirar TODAS as assinaturas anteriores do usuário
  const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: targetUser.id });
  
  for (const sub of existingSubs) {
    if (sub.status === 'active' || sub.status === 'trial') {
      await base44.asServiceRole.entities.Subscription.update(sub.id, {
        status: 'expired',
        daily_actions_limit: 0
      });
    }
  }

  // Criar NOVA assinatura (nunca reutilizar a antiga)
  const subscriptionData = {
    user_id: targetUser.id,
    plan: planType === 'trial' ? 'free' : 'pro',
    plan_type: planType,
    status: planType === 'trial' ? 'trial' : 'active',
    payment_status: 'paid',
    payment_method: 'manual',
    daily_actions_limit: 999999,
    daily_actions_used: 0,
    last_reset_date: startDate.toISOString().split('T')[0],
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate ? endDate.toISOString().split('T')[0] : null,
    next_billing_date: endDate ? endDate.toISOString().split('T')[0] : null,
    activated_at: new Date().toISOString()
  };

  const result = await base44.asServiceRole.entities.Subscription.create(subscriptionData);

  // Criar log de auditoria
  await base44.asServiceRole.entities.AuditLog.create({
    user_email: adminUser.email,
    action: 'manual_subscription_release',
    entity_type: 'Subscription',
    entity_id: targetUser.id,
    target_user_id: targetUser.id,
    details: JSON.stringify({
      target_email: email,
      plan_type: planType,
      notes: notes || 'Liberação manual via painel admin',
      end_date: endDate ? endDate.toISOString().split('T')[0] : 'vitalício',
      expired_previous_count: existingSubs.filter(s => s.status === 'active' || s.status === 'trial').length
    })
  });

  return { targetUser, subscription: result };
}

// Função para limpar assinaturas duplicadas existentes
async function cleanupDuplicateSubscriptions(base44, adminUser) {
  const allSubscriptions = await base44.asServiceRole.entities.Subscription.list('-created_date');
  
  // Agrupar por user_id
  const userSubscriptions = {};
  for (const sub of allSubscriptions) {
    if (!userSubscriptions[sub.user_id]) {
      userSubscriptions[sub.user_id] = [];
    }
    userSubscriptions[sub.user_id].push(sub);
  }

  let expiredCount = 0;
  let usersAffected = 0;

  for (const userId in userSubscriptions) {
    const subs = userSubscriptions[userId];
    
    // Filtrar apenas ativas/trial
    const activeSubs = subs.filter(s => s.status === 'active' || s.status === 'trial');
    
    if (activeSubs.length > 1) {
      usersAffected++;
      
      // Ordenar por created_date (mais recente primeiro)
      activeSubs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      // Manter apenas a mais recente, expirar o resto
      for (let i = 1; i < activeSubs.length; i++) {
        await base44.asServiceRole.entities.Subscription.update(activeSubs[i].id, {
          status: 'expired',
          daily_actions_limit: 0
        });
        expiredCount++;
      }
    }
  }

  // Log de auditoria
  await base44.asServiceRole.entities.AuditLog.create({
    user_email: adminUser.email,
    action: 'cleanup_duplicate_subscriptions',
    entity_type: 'Subscription',
    details: JSON.stringify({
      timestamp: new Date().toISOString(),
      expired_count: expiredCount,
      users_affected: usersAffected,
      message: 'Limpeza de assinaturas duplicadas executada'
    })
  });

  return {
    expired_count: expiredCount,
    users_affected: usersAffected
  };
}
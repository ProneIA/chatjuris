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

  const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });

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

  let result;
  if (existingSubs.length > 0) {
    result = await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, subscriptionData);
  } else {
    result = await base44.asServiceRole.entities.Subscription.create(subscriptionData);
  }

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
      end_date: endDate ? endDate.toISOString().split('T')[0] : 'vitalício'
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

  const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: targetUser.id });

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

  let result;
  if (existingSubs.length > 0) {
    result = await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, subscriptionData);
  } else {
    result = await base44.asServiceRole.entities.Subscription.create(subscriptionData);
  }

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
      end_date: endDate ? endDate.toISOString().split('T')[0] : 'vitalício'
    })
  });

  return { targetUser, subscription: result };
}
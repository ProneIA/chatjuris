import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { user_email, user_id, plan_type: rawPlanType, plan_id, payment_id, payment_method } = body;

    // Derivar plan_type a partir de plan_id se não vier explicitamente
    const plan_type = rawPlanType || (() => {
      if (!plan_id) return null;
      if (plan_id.includes('yearly') || plan_id.includes('annual')) return 'yearly';
      if (plan_id.includes('lifetime')) return 'lifetime';
      return 'monthly';
    })();

    if ((!user_email && !user_id) || !plan_type) {
      return Response.json({ error: 'user_email ou user_id, e plan_type/plan_id são obrigatórios' }, { status: 400 });
    }

    // Buscar usuário por email ou id
    let users = [];
    if (user_id) {
      users = await base44.asServiceRole.entities.User.filter({ id: user_id });
    }
    if (users.length === 0 && user_email) {
      users = await base44.asServiceRole.entities.User.filter({ email: user_email });
    }

    if (users.length === 0) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const targetUser = users[0];
    const now = new Date();
    let updateData = {};

    switch (plan_type) {
      case 'monthly': {
        const monthlyEnd = new Date(now);
        monthlyEnd.setDate(monthlyEnd.getDate() + 30);
        updateData = {
          subscription_status: 'active',
          subscription_type: 'monthly',
          subscription_start_date: now.toISOString(),
          subscription_end_date: monthlyEnd.toISOString(),
          subscription_expires_at: monthlyEnd.toISOString(),
          blocked_at: null,
          email_locked: false,
          payment_reference: payment_id || null,
          is_lifetime: false
        };
        break;
      }
      case 'yearly': {
        const yearlyEnd = new Date(now);
        yearlyEnd.setDate(yearlyEnd.getDate() + 365);
        updateData = {
          subscription_status: 'active',
          subscription_type: 'yearly',
          subscription_start_date: now.toISOString(),
          subscription_end_date: yearlyEnd.toISOString(),
          subscription_expires_at: yearlyEnd.toISOString(),
          blocked_at: null,
          email_locked: false,
          payment_reference: payment_id || null,
          is_lifetime: false
        };
        break;
      }
      case 'lifetime':
        updateData = {
          subscription_status: 'lifetime',
          subscription_type: 'lifetime',
          subscription_start_date: now.toISOString(),
          subscription_end_date: null,
          subscription_expires_at: null,
          blocked_at: null,
          email_locked: false,
          payment_reference: payment_id || null,
          is_lifetime: true
        };
        break;
      default:
        return Response.json({ error: 'plan_type inválido' }, { status: 400 });
    }

    const updatedUser = await base44.asServiceRole.entities.User.update(targetUser.id, updateData);

    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id: targetUser.id });

    const subscriptionData = {
      user_id: targetUser.id,
      plan_type,
      status: plan_type === 'lifetime' ? 'lifetime' : 'active',
      payment_method: payment_method || 'direct',
      payment_external_id: payment_id,
      start_date: now.toISOString(),
      end_date: updateData.subscription_end_date || null
    };

    if (subscriptions.length > 0) {
      await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, subscriptionData);
    } else {
      await base44.asServiceRole.entities.Subscription.create(subscriptionData);
    }

    await base44.asServiceRole.entities.AuditLog.create({
      user_email: targetUser.email,
      action: 'subscription_activated',
      entity_type: 'User',
      entity_id: targetUser.id,
      details: JSON.stringify({ plan_type, payment_id, payment_method, ...updateData })
    });

    return Response.json({ success: true, user: updatedUser, plan_type });

  } catch (error) {
    console.error('[activateSubscription] Erro:', error);
    return Response.json({ success: false, error: 'Erro interno. Tente novamente.' }, { status: 500 });
  }
});
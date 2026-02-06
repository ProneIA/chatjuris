import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Backend function para criar/atualizar assinatura
 * REGRA PRINCIPAL: Apenas 1 assinatura ativa por usuário
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { action, planType } = body;

    // ========================================
    // AÇÃO: Criar trial automático para novo usuário
    // ========================================
    if (action === 'create_trial') {
      // Verificar se já usou trial
      if (user.has_used_trial) {
        return Response.json({ 
          success: false, 
          error: 'Usuário já utilizou o período de teste' 
        }, { status: 400 });
      }

      // REGRA: Expirar todas as assinaturas ativas anteriores
      const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: user.id });
      for (const sub of existingSubs) {
        if (sub.status === 'active' || sub.status === 'trial') {
          await base44.asServiceRole.entities.Subscription.update(sub.id, {
            status: 'expired',
            daily_actions_limit: 0
          });
        }
      }

      // Criar nova assinatura de trial
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7);

      const newSub = await base44.asServiceRole.entities.Subscription.create({
        user_id: user.id,
        plan: 'pro',
        plan_type: 'trial',
        status: 'trial',
        daily_actions_limit: 999999,
        daily_actions_used: 0,
        last_reset_date: today.toISOString().split('T')[0],
        price: 0,
        payment_method: 'trial',
        start_date: today.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        activated_at: new Date().toISOString()
      });

      // Marcar que usuário usou trial
      await base44.asServiceRole.entities.User.update(user.id, {
        has_used_trial: true
      });

      // Log de auditoria
      await base44.asServiceRole.entities.AuditLog.create({
        user_email: user.email,
        action: 'trial_created',
        entity_type: 'Subscription',
        entity_id: newSub.id,
        details: JSON.stringify({
          plan_type: 'trial',
          end_date: endDate.toISOString().split('T')[0]
        })
      });

      return Response.json({ 
        success: true, 
        data: newSub,
        message: 'Período de teste ativado com sucesso'
      });
    }

    // ========================================
    // AÇÃO: Verificar status da assinatura atual
    // ========================================
    if (action === 'get_status') {
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      
      // Filtrar para pegar apenas a ativa/trial mais recente
      const activeSub = subs
        .filter(s => s.status === 'active' || s.status === 'trial')
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

      if (!activeSub) {
        return Response.json({
          success: true,
          data: {
            hasActiveSubscription: false,
            canUseTrial: !user.has_used_trial,
            subscription: null
          }
        });
      }

      // Verificar se expirou
      const today = new Date().toISOString().split('T')[0];
      const isExpired = activeSub.end_date && today > activeSub.end_date;

      if (isExpired && activeSub.plan_type !== 'lifetime') {
        // Atualizar para expirado
        await base44.asServiceRole.entities.Subscription.update(activeSub.id, {
          status: 'expired',
          daily_actions_limit: 0
        });

        return Response.json({
          success: true,
          data: {
            hasActiveSubscription: false,
            isExpired: true,
            canUseTrial: false,
            subscription: { ...activeSub, status: 'expired' }
          }
        });
      }

      return Response.json({
        success: true,
        data: {
          hasActiveSubscription: true,
          isExpired: false,
          isInTrial: activeSub.status === 'trial',
          isLifetime: activeSub.plan_type === 'lifetime',
          subscription: activeSub
        }
      });
    }

    // ========================================
    // AÇÃO: Ativar plano pago (após webhook de pagamento)
    // ========================================
    if (action === 'activate_paid_plan') {
      if (!planType || !['monthly', 'annual', 'lifetime'].includes(planType)) {
        return Response.json({ 
          error: 'planType inválido. Use: monthly, annual ou lifetime' 
        }, { status: 400 });
      }

      // REGRA: Expirar todas as assinaturas ativas anteriores
      const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: user.id });
      for (const sub of existingSubs) {
        if (sub.status === 'active' || sub.status === 'trial') {
          await base44.asServiceRole.entities.Subscription.update(sub.id, {
            status: 'expired',
            daily_actions_limit: 0
          });
        }
      }

      // Calcular data de expiração
      const today = new Date();
      let endDate = null;

      if (planType === 'monthly') {
        endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (planType === 'annual') {
        endDate = new Date(today);
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      // lifetime não tem end_date

      // Criar nova assinatura
      const newSub = await base44.asServiceRole.entities.Subscription.create({
        user_id: user.id,
        plan: 'pro',
        plan_type: planType,
        status: 'active',
        daily_actions_limit: 999999,
        daily_actions_used: 0,
        last_reset_date: today.toISOString().split('T')[0],
        payment_method: 'hotmart',
        payment_status: 'paid',
        start_date: today.toISOString().split('T')[0],
        end_date: endDate ? endDate.toISOString().split('T')[0] : null,
        next_billing_date: endDate ? endDate.toISOString().split('T')[0] : null,
        activated_at: new Date().toISOString()
      });

      // Log de auditoria
      await base44.asServiceRole.entities.AuditLog.create({
        user_email: user.email,
        action: 'subscription_activated',
        entity_type: 'Subscription',
        entity_id: newSub.id,
        details: JSON.stringify({
          plan_type: planType,
          end_date: endDate ? endDate.toISOString().split('T')[0] : 'lifetime',
          previous_subs_expired: existingSubs.filter(s => s.status === 'active' || s.status === 'trial').length
        })
      });

      return Response.json({ 
        success: true, 
        data: newSub,
        message: `Plano ${planType} ativado com sucesso`
      });
    }

    return Response.json({ error: 'Ação não reconhecida' }, { status: 400 });

  } catch (error) {
    console.error('Erro em createSubscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ 
                canAccess: false, 
                reason: 'unauthorized',
                redirectToPricing: true 
            }, { status: 401 });
        }

        const result = await validateUserAccess(base44, user);
        return Response.json(result);
    } catch (error) {
        console.error('[canAccessSystem] Erro inesperado:', error?.message);
        return Response.json({ 
            canAccess: false,
            reason: 'system_error',
            message: 'Não foi possível verificar sua assinatura. Tente novamente em instantes.'
        }, { status: 503 });
    }
});

async function validateUserAccess(base44, user) {
    const now = new Date();
    const nowISO = now.toISOString();

    // ============================================================
    // VERIFICAÇÃO email_locked — conta deletada, bloquear login
    // ============================================================
    if (user.email_locked === true) {
        return {
            canAccess: false,
            reason: 'email_locked',
            message: 'Este e-mail já utilizou o período de teste gratuito. Faça o pagamento para continuar.',
            redirectToPricing: true
        };
    }

    // ============================================================
    // VERIFICAÇÃO subscription_status == "deleted"
    // ============================================================
    if (user.subscription_status === 'deleted') {
        return {
            canAccess: false,
            reason: 'account_deleted',
            message: 'Sua conta foi removida por inatividade.',
            redirectToLogin: true
        };
    }

    // ============================================================
    // VERIFICAÇÃO subscription_status == "blocked"
    // ============================================================
    if (user.subscription_status === 'blocked') {
        return {
            canAccess: false,
            reason: 'account_blocked',
            message: 'Seu acesso está bloqueado. Renove sua assinatura para continuar.',
            redirectToPricing: true
        };
    }

    // ============================================================
    // PASSO 1: Buscar a Subscription mais recente do usuário
    // Esta é a FONTE DA VERDADE - tem prioridade sobre user.fields
    // ============================================================
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
        { user_id: user.id }, '-created_date', 5
    );

    // Buscar a melhor subscription ativa
    const activeSub = findBestSubscription(subscriptions, now);

    // ============================================================
    // PASSO 2: Se tem subscription válida, liberar acesso
    // ============================================================
    if (activeSub) {
        // Sincronizar campos do User se necessário
        const expectedStatus = activeSub.plan_type === 'lifetime' ? 'lifetime' : 'active';
        if (user.subscription_status !== expectedStatus || user.subscription_type !== activeSub.plan_type) {
            await base44.asServiceRole.entities.User.update(user.id, {
                subscription_status: expectedStatus,
                subscription_type: activeSub.plan_type,
                subscription_start_date: activeSub.start_date,
                subscription_end_date: activeSub.end_date || null,
                is_lifetime: activeSub.plan_type === 'lifetime'
            });
        }

        if (activeSub.plan_type === 'lifetime' || activeSub.status === 'lifetime') {
            return {
                canAccess: true,
                subscription_status: 'lifetime',
                subscription_type: 'lifetime',
                reason: 'lifetime_access'
            };
        }

        if (activeSub.status === 'trial') {
            const endDate = new Date(activeSub.end_date || activeSub.trial_end_date);
            const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
            return {
                canAccess: true,
                subscription_status: 'trial',
                subscription_type: 'trial',
                trial_end_date: activeSub.end_date || activeSub.trial_end_date,
                days_left: Math.max(0, daysLeft),
                reason: 'trial_active'
            };
        }

        // Plano pago ativo
        const daysLeft = activeSub.end_date
            ? Math.ceil((new Date(activeSub.end_date) - now) / (1000 * 60 * 60 * 24))
            : 999;

        return {
            canAccess: true,
            subscription_status: 'active',
            subscription_type: activeSub.plan_type,
            subscription_end_date: activeSub.end_date,
            days_left: Math.max(0, daysLeft),
            reason: 'subscription_active'
        };
    }

    // ============================================================
    // PASSO 3: Sem subscription válida — verificar trial no User
    // (usuários que ainda não tiveram Subscription criada)
    // ============================================================
    if (user.subscription_status === 'trial') {
        const trialEnd = user.trial_ends_at || user.trial_end_date;
        if (trialEnd && nowISO <= trialEnd) {
            const daysLeft = Math.ceil((new Date(trialEnd) - now) / (1000 * 60 * 60 * 24));
            return {
                canAccess: true,
                subscription_status: 'trial',
                subscription_type: 'trial',
                trial_end_date: trialEnd,
                days_left: Math.max(0, daysLeft),
                reason: 'trial_active'
            };
        } else if (trialEnd && nowISO > trialEnd) {
            // Trial expirado — bloquear e atualizar status
            await base44.asServiceRole.entities.User.update(user.id, {
                subscription_status: 'blocked',
                blocked_at: nowISO
            }).catch(() => {});
            return {
                canAccess: false,
                reason: 'trial_expired',
                message: 'Seu período de teste encerrou. Assine para continuar.',
                redirectToPricing: true
            };
        }
    }

    // ============================================================
    // PASSO 4: Verificar campos do User como fallback final
    // (para planos lifetime marcados diretamente no User)
    // ============================================================
    if (user.is_lifetime === true || user.subscription_type === 'lifetime' || user.subscription_status === 'lifetime') {
        return {
            canAccess: true,
            subscription_status: 'lifetime',
            subscription_type: 'lifetime',
            reason: 'lifetime_user_field'
        };
    }

    // ============================================================
    // PASSO 5: Sem acesso válido — bloquear e redirecionar
    // ============================================================

    // Atualizar status do user para blocked se estava ativo/trial sem sub válida
    if (user.subscription_status === 'active') {
        await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'blocked',
            blocked_at: nowISO
        }).catch(() => {});
    }

    return {
        canAccess: false,
        subscription_status: 'blocked',
        reason: 'no_active_subscription',
        message: 'Sua assinatura expirou. Renove para continuar.',
        redirectToPricing: true
    };
}

/**
 * Encontra a melhor subscription ativa para o usuário.
 * Prioridade: lifetime > active (não expirado) > trial (não expirado)
 */
function findBestSubscription(subscriptions, now) {
    if (!subscriptions || subscriptions.length === 0) return null;

    const nowStr = now.toISOString();

    // 1. Lifetime tem prioridade máxima
    const lifetime = subscriptions.find(s => 
        s.plan_type === 'lifetime' || s.status === 'lifetime'
    );
    if (lifetime) return lifetime;

    // 2. Assinatura ativa paga (não expirada)
    const activePaid = subscriptions.find(s => 
        s.status === 'active' && 
        s.plan_type !== 'trial' &&
        (!s.end_date || nowStr <= s.end_date)
    );
    if (activePaid) return activePaid;

    // 3. Trial ativo (não expirado)
    const activeTrial = subscriptions.find(s => 
        s.status === 'trial' && 
        s.end_date && 
        nowStr <= s.end_date
    );
    if (activeTrial) return activeTrial;

    return null;
}
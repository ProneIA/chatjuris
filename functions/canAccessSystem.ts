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
        return Response.json({ 
            canAccess: true, // Em caso de erro técnico, não bloquear o usuário
            reason: 'error_fallback',
            error: error.message
        }, { status: 200 });
    }
});

async function validateUserAccess(base44, user) {
    const now = new Date();
    const nowISO = now.toISOString();

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
    if (user.subscription_status === 'trial' && user.trial_end_date) {
        if (nowISO <= user.trial_end_date) {
            const daysLeft = Math.ceil((new Date(user.trial_end_date) - now) / (1000 * 60 * 60 * 24));
            return {
                canAccess: true,
                subscription_status: 'trial',
                subscription_type: 'trial',
                trial_end_date: user.trial_end_date,
                days_left: Math.max(0, daysLeft),
                reason: 'trial_active'
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

    // Atualizar status do user para expired se estava ativo
    if (user.subscription_status === 'active' || user.subscription_status === 'trial') {
        await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'expired'
        });
    }

    return {
        canAccess: false,
        subscription_status: 'expired',
        reason: 'no_active_subscription',
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

    // 4. Qualquer subscription com status active (mesmo sem end_date explícita)
    const anyActive = subscriptions.find(s => s.status === 'active');
    if (anyActive) return anyActive;

    return null;
}
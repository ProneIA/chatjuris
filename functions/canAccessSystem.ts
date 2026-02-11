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

        // VALIDAÇÃO CENTRAL DE ACESSO
        const result = await validateUserAccess(base44, user);

        return Response.json(result);
    } catch (error) {
        return Response.json({ 
            canAccess: false, 
            reason: 'error',
            error: error.message,
            redirectToPricing: true 
        }, { status: 500 });
    }
});

async function validateUserAccess(base44, user) {
    const now = new Date().toISOString();

    // 1) PLANO VITALÍCIO - acesso ilimitado
    if (user.is_lifetime === true) {
        return {
            canAccess: true,
            subscription_status: 'lifetime',
            subscription_type: 'lifetime',
            reason: 'lifetime_access'
        };
    }

    // 2) TRIAL - verificar se ainda está dentro do período
    if (user.subscription_status === 'trial') {
        if (user.trial_end_date && now <= user.trial_end_date) {
            const daysLeft = Math.ceil((new Date(user.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24));
            return {
                canAccess: true,
                subscription_status: 'trial',
                subscription_type: 'trial',
                trial_end_date: user.trial_end_date,
                days_left: daysLeft,
                reason: 'trial_active'
            };
        } else {
            // Trial expirado - atualizar status
            await base44.asServiceRole.entities.User.update(user.id, {
                subscription_status: 'expired'
            });
            
            return {
                canAccess: false,
                subscription_status: 'expired',
                reason: 'trial_expired',
                redirectToPricing: true
            };
        }
    }

    // 3) ASSINATURA ATIVA - verificar se não expirou
    if (user.subscription_status === 'active') {
        if (user.subscription_end_date && now <= user.subscription_end_date) {
            const daysLeft = Math.ceil((new Date(user.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24));
            return {
                canAccess: true,
                subscription_status: 'active',
                subscription_type: user.subscription_type,
                subscription_end_date: user.subscription_end_date,
                days_left: daysLeft,
                reason: 'subscription_active'
            };
        } else {
            // Assinatura expirada - atualizar status
            await base44.asServiceRole.entities.User.update(user.id, {
                subscription_status: 'expired'
            });
            
            return {
                canAccess: false,
                subscription_status: 'expired',
                reason: 'subscription_expired',
                redirectToPricing: true
            };
        }
    }

    // 4) STATUS EXPIRADO OU CANCELADO - sem acesso
    if (user.subscription_status === 'expired' || user.subscription_status === 'canceled') {
        return {
            canAccess: false,
            subscription_status: user.subscription_status,
            reason: user.subscription_status === 'expired' ? 'subscription_expired' : 'subscription_canceled',
            redirectToPricing: true
        };
    }

    // Status inválido ou não definido
    return {
        canAccess: false,
        subscription_status: user.subscription_status || 'none',
        reason: 'invalid_status',
        redirectToPricing: true
    };
}
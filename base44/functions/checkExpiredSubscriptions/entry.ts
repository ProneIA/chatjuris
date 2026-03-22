import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // ADMIN ONLY
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Acesso negado - apenas admin' }, { status: 403 });
        }

        const now = new Date().toISOString();
        let expiredCount = 0;

        // 1) Verificar assinaturas ATIVAS que expiraram
        const activeUsers = await base44.asServiceRole.entities.User.filter({
            subscription_status: 'active'
        });

        for (const u of activeUsers) {
            if (u.subscription_end_date && now > u.subscription_end_date && !u.is_lifetime) {
                await base44.asServiceRole.entities.User.update(u.id, {
                    subscription_status: 'expired'
                });
                
                await base44.asServiceRole.entities.AuditLog.create({
                    user_email: u.email,
                    action: 'subscription_expired',
                    entity_type: 'User',
                    entity_id: u.id,
                    details: JSON.stringify({
                        previous_status: 'active',
                        subscription_end_date: u.subscription_end_date
                    })
                });
                
                expiredCount++;
            }
        }

        // 2) Verificar TRIALS que expiraram
        const trialUsers = await base44.asServiceRole.entities.User.filter({
            subscription_status: 'trial'
        });

        for (const u of trialUsers) {
            if (u.trial_end_date && now > u.trial_end_date) {
                await base44.asServiceRole.entities.User.update(u.id, {
                    subscription_status: 'expired'
                });
                
                await base44.asServiceRole.entities.AuditLog.create({
                    user_email: u.email,
                    action: 'trial_expired',
                    entity_type: 'User',
                    entity_id: u.id,
                    details: JSON.stringify({
                        previous_status: 'trial',
                        trial_end_date: u.trial_end_date
                    })
                });
                
                expiredCount++;
            }
        }

        return Response.json({
            success: true,
            expired_count: expiredCount,
            checked_at: now
        });
    } catch (error) {
        console.error('Erro ao verificar assinaturas:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});
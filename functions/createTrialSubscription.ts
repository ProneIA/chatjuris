import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ 
                success: false, 
                error: 'Usuário não autenticado' 
            }, { status: 401 });
        }

        // VALIDAÇÃO ROBUSTA: Bloquear se usuário JÁ teve trial (mesmo expirado)
        if (user.trial_start_date || user.subscription_start_date || user.subscription_status === 'expired') {
            return Response.json({ 
                success: false, 
                error: 'Usuário já teve trial ou assinatura anteriormente'
            }, { status: 400 });
        }

        // Criar trial de 7 dias (UTC para evitar problemas de timezone)
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const updatedUser = await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'trial',
            subscription_type: 'trial',
            trial_start_date: now.toISOString(),
            trial_end_date: trialEnd.toISOString(),
            is_lifetime: false
        });

        // Log de auditoria
        await base44.asServiceRole.entities.AuditLog.create({
            user_email: user.email,
            action: 'trial_created',
            entity_type: 'User',
            entity_id: user.id,
            details: JSON.stringify({
                trial_start: now.toISOString(),
                trial_end: trialEnd.toISOString()
            })
        });

        return Response.json({
            success: true,
            user: updatedUser,
            trial_days: 7,
            trial_end_date: trialEnd.toISOString()
        });
    } catch (error) {
        console.error('Erro ao criar trial:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});
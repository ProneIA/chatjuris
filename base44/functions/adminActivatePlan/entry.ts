import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const adminUser = await base44.auth.me();

        // ADMIN ONLY
        if (adminUser?.role !== 'admin') {
            return Response.json({ error: 'Acesso negado - apenas admin' }, { status: 403 });
        }

        const body = await req.json();
        const { user_id, plan_type } = body;

        if (!user_id || !plan_type) {
            return Response.json({ 
                error: 'user_id e plan_type são obrigatórios' 
            }, { status: 400 });
        }

        const now = new Date();
        let updateData = {};

        switch (plan_type) {
            case 'monthly':
                const monthlyEnd = new Date(now);
                monthlyEnd.setDate(monthlyEnd.getDate() + 30);
                
                updateData = {
                    subscription_status: 'active',
                    subscription_type: 'monthly',
                    subscription_start_date: now.toISOString(),
                    subscription_end_date: monthlyEnd.toISOString(),
                    is_lifetime: false
                };
                break;

            case 'yearly':
                const yearlyEnd = new Date(now);
                yearlyEnd.setDate(yearlyEnd.getDate() + 365);
                
                updateData = {
                    subscription_status: 'active',
                    subscription_type: 'yearly',
                    subscription_start_date: now.toISOString(),
                    subscription_end_date: yearlyEnd.toISOString(),
                    is_lifetime: false
                };
                break;

            case 'lifetime':
                updateData = {
                    subscription_status: 'lifetime',
                    subscription_type: 'lifetime',
                    subscription_start_date: now.toISOString(),
                    subscription_end_date: null,
                    is_lifetime: true
                };
                break;

            default:
                return Response.json({ 
                    error: 'plan_type inválido. Use: monthly, yearly ou lifetime' 
                }, { status: 400 });
        }

        const updatedUser = await base44.asServiceRole.entities.User.update(user_id, updateData);

        // Log de auditoria
        await base44.asServiceRole.entities.AuditLog.create({
            user_email: adminUser.email,
            action: 'admin_activate_plan',
            entity_type: 'User',
            entity_id: user_id,
            target_user_id: user_id,
            details: JSON.stringify({
                plan_type,
                activated_by: adminUser.email,
                ...updateData
            })
        });

        return Response.json({
            success: true,
            user: updatedUser,
            plan_type
        });
    } catch (error) {
        console.error('Erro ao ativar plano:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});
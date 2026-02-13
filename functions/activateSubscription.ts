import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Função para ser chamada por webhooks de pagamento
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        
        const { user_email, plan_type, payment_id, payment_method } = body;

        if (!user_email || !plan_type) {
            return Response.json({ 
                error: 'user_email e plan_type são obrigatórios' 
            }, { status: 400 });
        }

        // Buscar usuário por email usando service role
        const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
        
        if (users.length === 0) {
            return Response.json({ 
                error: 'Usuário não encontrado' 
            }, { status: 404 });
        }

        const user = users[0];
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
                    error: 'plan_type inválido' 
                }, { status: 400 });
        }

        const updatedUser = await base44.asServiceRole.entities.User.update(user.id, updateData);
        
        // SINCRONIZAÇÃO: Atualizar/criar Subscription.entity também
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
            user_id: user.id 
        });
        
        const subscriptionData = {
            user_id: user.id,
            plan: 'pro',
            plan_type: plan_type,
            status: plan_type === 'lifetime' ? 'lifetime' : 'active',
            payment_status: 'paid',
            payment_method: payment_method || 'direct',
            payment_external_id: payment_id,
            start_date: now.toISOString().split('T')[0],
            end_date: updateData.subscription_end_date ? updateData.subscription_end_date.split('T')[0] : null,
            daily_actions_limit: 999999,
            daily_actions_used: 0,
            last_reset_date: now.toISOString().split('T')[0]
        };
        
        if (subscriptions.length > 0) {
            await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, subscriptionData);
        } else {
            await base44.asServiceRole.entities.Subscription.create(subscriptionData);
        }

        // Log de auditoria
        await base44.asServiceRole.entities.AuditLog.create({
            user_email: user.email,
            action: 'subscription_activated',
            entity_type: 'User',
            entity_id: user.id,
            details: JSON.stringify({
                plan_type,
                payment_id,
                payment_method,
                ...updateData
            })
        });

        return Response.json({
            success: true,
            user: updatedUser,
            plan_type
        });
    } catch (error) {
        console.error('Erro ao ativar assinatura:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});
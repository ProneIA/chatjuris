import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Função para administradores gerenciarem planos Hotmart

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // ADMIN ONLY
        if (user?.role !== 'admin') {
            return Response.json({ 
                error: 'Acesso negado - apenas admin' 
            }, { status: 403 });
        }

        const method = req.method;

        // GET: Listar todos os planos
        if (method === 'GET') {
            const plans = await base44.asServiceRole.entities.HotmartPlan.list();
            return Response.json({ 
                success: true, 
                plans 
            });
        }

        // POST: Criar ou atualizar plano
        if (method === 'POST') {
            const body = await req.json();
            const { action, plan_data, plan_id } = body;

            if (action === 'create') {
                const newPlan = await base44.asServiceRole.entities.HotmartPlan.create(plan_data);
                
                await base44.asServiceRole.entities.AuditLog.create({
                    user_email: user.email,
                    action: 'hotmart_plan_created',
                    entity_type: 'HotmartPlan',
                    entity_id: newPlan.id,
                    details: JSON.stringify(plan_data)
                });
                
                return Response.json({ 
                    success: true, 
                    plan: newPlan 
                });
            }

            if (action === 'update' && plan_id) {
                const updatedPlan = await base44.asServiceRole.entities.HotmartPlan.update(plan_id, plan_data);
                
                await base44.asServiceRole.entities.AuditLog.create({
                    user_email: user.email,
                    action: 'hotmart_plan_updated',
                    entity_type: 'HotmartPlan',
                    entity_id: plan_id,
                    details: JSON.stringify(plan_data)
                });
                
                return Response.json({ 
                    success: true, 
                    plan: updatedPlan 
                });
            }

            if (action === 'delete' && plan_id) {
                await base44.asServiceRole.entities.HotmartPlan.delete(plan_id);
                
                await base44.asServiceRole.entities.AuditLog.create({
                    user_email: user.email,
                    action: 'hotmart_plan_deleted',
                    entity_type: 'HotmartPlan',
                    entity_id: plan_id,
                    details: '{}'
                });
                
                return Response.json({ 
                    success: true 
                });
            }

            return Response.json({ 
                error: 'Ação inválida' 
            }, { status: 400 });
        }

        return Response.json({ 
            error: 'Método não permitido' 
        }, { status: 405 });

    } catch (error) {
        console.error('Erro ao gerenciar planos Hotmart:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});
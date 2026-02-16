import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ 
                error: 'Não autenticado' 
            }, { status: 401 });
        }

        const { plan_name } = await req.json();

        if (!plan_name) {
            return Response.json({ 
                error: 'plan_name é obrigatório' 
            }, { status: 400 });
        }

        // Buscar configuração do plano
        const plans = await base44.asServiceRole.entities.HotmartPlan.filter({
            name: plan_name,
            is_active: true
        });

        if (plans.length === 0) {
            return Response.json({ 
                error: 'Plano não encontrado' 
            }, { status: 404 });
        }

        const plan = plans[0];

        // Se for teste grátis, processar localmente
        if (plan.is_free && plan.name === 'TESTE') {
            // Verificar se usuário já teve trial
            if (user.trial_start_date || user.subscription_status === 'expired') {
                return Response.json({ 
                    error: 'Você já utilizou o período de teste gratuito' 
                }, { status: 400 });
            }

            // Criar trial localmente via função existente
            const trialResult = await base44.functions.invoke('createTrialSubscription', {});
            
            return Response.json({
                success: true,
                type: 'trial',
                trial_activated: true,
                redirect_to: '/Dashboard'
            });
        }

        // Para planos pagos, retornar URL do checkout Hotmart
        if (!plan.hotmart_checkout_url) {
            return Response.json({ 
                error: 'URL de checkout não configurada para este plano' 
            }, { status: 500 });
        }

        // Construir URL com parâmetros do usuário
        const checkoutUrl = new URL(plan.hotmart_checkout_url);
        checkoutUrl.searchParams.append('email', user.email);
        checkoutUrl.searchParams.append('name', user.full_name || '');
        checkoutUrl.searchParams.append('doc', ''); // CPF se disponível

        // Log de auditoria
        await base44.asServiceRole.entities.AuditLog.create({
            user_email: user.email,
            action: 'checkout_initiated',
            entity_type: 'HotmartPlan',
            entity_id: plan.id,
            details: JSON.stringify({
                plan_name: plan.name,
                price: plan.price
            })
        });

        return Response.json({
            success: true,
            type: 'hotmart_redirect',
            checkout_url: checkoutUrl.toString(),
            plan: {
                name: plan.name,
                price: plan.price,
                duration_days: plan.duration_days
            }
        });

    } catch (error) {
        console.error('Erro ao criar checkout:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Função para criar os 4 planos padrão no sistema
// Executar apenas UMA VEZ na configuração inicial

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

        const plansToCreate = [
            {
                name: 'TESTE',
                duration_days: 7,
                price: 0,
                hotmart_product_id: null,
                hotmart_checkout_url: null,
                is_recurring: false,
                is_free: true,
                features: [
                    'Assistente Jurídico IA (limitado)',
                    'Análise de documentos',
                    'Geração de peças jurídicas',
                    'Calculadoras básicas'
                ],
                description: '7 dias grátis para testar a plataforma',
                installments: null,
                is_active: true
            },
            {
                name: 'MENSAL',
                duration_days: 30,
                price: 119.90,
                hotmart_product_id: 'CONFIGURAR_NO_HOTMART',
                hotmart_checkout_url: 'https://pay.hotmart.com/Q104225643H',
                is_recurring: true,
                is_free: false,
                features: [
                    'Assistente Jurídico IA ilimitado',
                    'Análise de documentos com IA',
                    'Geração de peças jurídicas',
                    'Pesquisa de jurisprudência',
                    'Calculadoras jurídicas avançadas',
                    'Gestão completa de casos',
                    'Suporte prioritário 24/7'
                ],
                description: 'Renovação automática mensal',
                installments: null,
                is_active: true
            },
            {
                name: 'ANUAL',
                duration_days: 365,
                price: 1198.80,
                hotmart_product_id: 'CONFIGURAR_NO_HOTMART',
                hotmart_checkout_url: 'https://pay.hotmart.com/T104226080W',
                is_recurring: false,
                is_free: false,
                features: [
                    'Tudo do plano mensal',
                    '2 meses grátis no plano anual',
                    'Economia de R$ 240/ano',
                    'Acesso vitalício a atualizações',
                    'Treinamento exclusivo',
                    'API de integração',
                    'Consultoria técnica mensal'
                ],
                description: 'Pagamento único anual (não recorrente)',
                installments: 'ou 12x de R$ 99,90',
                is_active: true
            },
            {
                name: 'VITALICIO',
                duration_days: null,
                price: 1599.90,
                hotmart_product_id: 'CONFIGURAR_NO_HOTMART',
                hotmart_checkout_url: 'https://pay.hotmart.com/L104287363X',
                is_recurring: false,
                is_free: false,
                features: [
                    'Acesso VITALÍCIO ilimitado',
                    'Todos os recursos premium',
                    'Todas as atualizações futuras',
                    'Suporte VIP prioritário',
                    'Sem mensalidades',
                    'Pague uma vez, use para sempre',
                    'Melhor custo-benefício'
                ],
                description: 'Pagamento único - acesso permanente',
                installments: 'ou 12x de R$ 133,33 sem juros',
                is_active: true
            }
        ];

        const createdPlans = [];

        for (const planData of plansToCreate) {
            // Verificar se plano já existe
            const existing = await base44.asServiceRole.entities.HotmartPlan.filter({
                name: planData.name
            });

            if (existing.length > 0) {
                console.log(`Plano ${planData.name} já existe, pulando...`);
                createdPlans.push(existing[0]);
                continue;
            }

            const newPlan = await base44.asServiceRole.entities.HotmartPlan.create(planData);
            console.log(`✅ Plano ${planData.name} criado com sucesso`);
            createdPlans.push(newPlan);
        }

        // Log de auditoria
        await base44.asServiceRole.entities.AuditLog.create({
            user_email: user.email,
            action: 'hotmart_plans_seeded',
            entity_type: 'HotmartPlan',
            details: JSON.stringify({
                plans_created: createdPlans.length,
                timestamp: new Date().toISOString()
            })
        });

        return Response.json({
            success: true,
            message: 'Planos criados/verificados com sucesso',
            plans: createdPlans
        });

    } catch (error) {
        console.error('Erro ao criar planos:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});
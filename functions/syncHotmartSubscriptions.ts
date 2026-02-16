import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// CRON JOB: Sincronizar assinaturas recorrentes com Hotmart
// Executar diariamente para verificar status de assinaturas mensais

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

        const now = new Date();
        let syncedCount = 0;
        let expiredCount = 0;

        // Buscar assinaturas recorrentes (apenas mensal tem auto_renew)
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            plan_type: 'monthly',
            status: 'active'
        });

        console.log(`📊 Verificando ${subscriptions.length} assinaturas mensais ativas`);

        for (const sub of subscriptions) {
            // Verificar se está próximo da renovação (7 dias antes)
            if (sub.end_date) {
                const endDate = new Date(sub.end_date);
                const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

                // Se expirou
                if (daysUntilExpiry <= 0) {
                    console.log(`⚠️ Assinatura ${sub.id} expirou (user: ${sub.user_id})`);
                    
                    await base44.asServiceRole.entities.Subscription.update(sub.id, {
                        status: 'expired'
                    });
                    
                    await base44.asServiceRole.entities.User.update(sub.user_id, {
                        subscription_status: 'expired'
                    });
                    
                    expiredCount++;
                }
                // Se faltam 7 dias ou menos, enviar alerta
                else if (daysUntilExpiry <= 7) {
                    console.log(`📧 Enviando alerta de renovação para user ${sub.user_id} (${daysUntilExpiry} dias)`);
                    
                    const users = await base44.asServiceRole.entities.User.filter({ id: sub.user_id });
                    if (users.length > 0) {
                        const user = users[0];
                        
                        try {
                            await base44.asServiceRole.integrations.Core.SendEmail({
                                to: user.email,
                                subject: `⏰ Sua assinatura Mensal expira em ${daysUntilExpiry} dias`,
                                body: `
                                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                        <h2 style="color: #7c3aed;">Atenção: Renovação Necessária ⏰</h2>
                                        <p>Olá <strong>${user.full_name || 'Usuário'}</strong>,</p>
                                        <p>Sua assinatura <strong>Mensal</strong> expira em <strong>${daysUntilExpiry} dias</strong>.</p>
                                        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                                            <p style="margin: 0;"><strong>Data de expiração:</strong> ${endDate.toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <p>Para manter seu acesso ilimitado, renove sua assinatura antes do vencimento.</p>
                                        <a href="${Deno.env.get('PUBLIC_URL') || 'https://chatjuris.com'}/Pricing" 
                                           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; 
                                                  text-decoration: none; border-radius: 6px; margin-top: 20px;">
                                            Renovar Assinatura
                                        </a>
                                        <p style="margin-top: 30px; color: #666; font-size: 12px;">
                                            Se já renovou, ignore este email.
                                        </p>
                                    </div>
                                `
                            });
                        } catch (emailError) {
                            console.error('Erro ao enviar email de alerta:', emailError);
                        }
                    }
                }

                syncedCount++;
            }
        }

        // Log de auditoria
        await base44.asServiceRole.entities.AuditLog.create({
            user_email: 'system',
            action: 'hotmart_subscriptions_synced',
            entity_type: 'Subscription',
            details: JSON.stringify({
                total_checked: subscriptions.length,
                synced: syncedCount,
                expired: expiredCount,
                timestamp: now.toISOString()
            })
        });

        return Response.json({
            success: true,
            total_checked: subscriptions.length,
            synced: syncedCount,
            expired: expiredCount,
            checked_at: now.toISOString()
        });

    } catch (error) {
        console.error('Erro ao sincronizar assinaturas Hotmart:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});
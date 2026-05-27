/**
 * Job diário de controle de assinaturas
 * Roda às 02:00 BRT diariamente via automação agendada
 *
 * PASSO A: Bloquear assinaturas pagas vencidas (active + expires_at < agora)
 * PASSO B: Apagar dados de contas bloqueadas há +30 dias
 * PASSO C: Bloquear trials expirados
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  // Aceitar chamada de cron (sem user) ou admin autenticado
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');

  let authorized = false;
  let base44 = null;

  if (expectedSecret && cronSecret === expectedSecret) {
    authorized = true;
    base44 = createClientFromRequest(req);
  } else {
    try {
      base44 = createClientFromRequest(req);
      const u = await base44.auth.me();
      if (u?.role === 'admin') authorized = true;
    } catch {}
  }

  if (!authorized) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const now = new Date();
  const nowISO = now.toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const results = { blocked_paid: 0, blocked_trial: 0, deleted: 0, errors: [] };

  // ─────────────────────────────────────────────────────────────
  // PASSO A — Bloquear assinaturas pagas vencidas
  // ─────────────────────────────────────────────────────────────
  try {
    const activeUsers = await base44.asServiceRole.entities.User.filter(
      { subscription_status: 'active' }, '-created_date', 500
    );

    for (const user of activeUsers) {
      const expiresAt = user.subscription_expires_at || user.subscription_end_date;
      if (!expiresAt) continue;
      if (nowISO > expiresAt) {
        try {
          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'blocked',
            blocked_at: nowISO
          });
          // Também bloquear na entidade Subscription
          const subs = await base44.asServiceRole.entities.Subscription.filter(
            { user_id: user.id, status: 'active' }, '-created_date', 1
          );
          if (subs.length > 0) {
            await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
              status: 'expired'
            });
          }
          results.blocked_paid++;
          console.log(`[DailyJob] PASSO A — Bloqueado: ${user.email}`);
        } catch (e) {
          results.errors.push(`block_paid:${user.email}:${e.message}`);
        }
      }
    }
  } catch (e) {
    results.errors.push(`passo_a:${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────
  // PASSO B — Apagar dados de contas bloqueadas há +30 dias
  // ─────────────────────────────────────────────────────────────
  try {
    const blockedUsers = await base44.asServiceRole.entities.User.filter(
      { subscription_status: 'blocked' }, '-created_date', 500
    );

    for (const user of blockedUsers) {
      if (!user.blocked_at) continue;
      if (user.blocked_at > thirtyDaysAgo) continue; // menos de 30 dias, pular

      try {
        // Apagar dados vinculados ao usuário
        await deleteUserData(base44, user);

        // Marcar como deleted + email_locked
        await base44.asServiceRole.entities.User.update(user.id, {
          subscription_status: 'deleted',
          deleted_at: nowISO,
          email_locked: true,
          // Limpar dados pessoais do próprio registro User
          phone: null,
          payment_reference: null
        });

        results.deleted++;
        console.log(`[DailyJob] PASSO B — Dados apagados: ${user.email}`);
      } catch (e) {
        results.errors.push(`delete_data:${user.email}:${e.message}`);
      }
    }
  } catch (e) {
    results.errors.push(`passo_b:${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────
  // PASSO C — Bloquear trials expirados
  // ─────────────────────────────────────────────────────────────
  try {
    const trialUsers = await base44.asServiceRole.entities.User.filter(
      { subscription_status: 'trial' }, '-created_date', 500
    );

    for (const user of trialUsers) {
      const endsAt = user.trial_ends_at || user.trial_end_date;
      if (!endsAt) continue;
      if (nowISO > endsAt) {
        try {
          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'blocked',
            blocked_at: nowISO
          });
          results.blocked_trial++;
          console.log(`[DailyJob] PASSO C — Trial bloqueado: ${user.email}`);
        } catch (e) {
          results.errors.push(`block_trial:${user.email}:${e.message}`);
        }
      }
    }
  } catch (e) {
    results.errors.push(`passo_c:${e.message}`);
  }

  console.log('[DailyJob] Concluído:', results);
  return Response.json({ success: true, ...results, ran_at: nowISO });
});

/**
 * Apaga todos os dados vinculados ao usuário (processos, documentos, clientes, etc.)
 * NÃO deleta o registro User em si — apenas os dados vinculados
 */
async function deleteUserData(base44, user) {
  const email = user.email;
  const userId = user.id;

  const entitiesToClean = [
    'Processo', 'Case', 'Client', 'LegalDocument', 'Task',
    'CalendarEvent', 'Jurisprudence', 'LegalResearch', 'Template',
    'Conversation', 'Comment', 'Notification', 'CaseUpdate',
    'ClientMessage', 'DocumentVersion', 'DiaryMonitoring', 'DiaryPublication',
    'ClientPayment', 'HonorarioContrato', 'ParcelaHonorario', 'Despesa'
  ];

  for (const entityName of entitiesToClean) {
    try {
      const records = await base44.asServiceRole.entities[entityName]?.filter(
        { created_by: email }, '-created_date', 500
      );
      if (!records || records.length === 0) continue;
      for (const record of records) {
        await base44.asServiceRole.entities[entityName].delete(record.id).catch(() => {});
      }
      console.log(`[deleteUserData] ${entityName}: ${records.length} registros removidos para ${email}`);
    } catch {
      // Entidade pode não existir, ignorar silenciosamente
    }
  }

  // Log de auditoria da deleção
  await base44.asServiceRole.entities.AuditLog.create({
    user_email: email,
    action: 'USER_DATA_DELETED_BY_INACTIVITY',
    entity_type: 'User',
    entity_id: userId,
    details: JSON.stringify({
      reason: 'blocked_30_days',
      deleted_at: new Date().toISOString()
    })
  }).catch(() => {});
}
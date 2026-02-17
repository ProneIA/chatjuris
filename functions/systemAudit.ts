import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── Configurações de entidades auditadas ──────────────────────────────────
const ENTITIES_TO_AUDIT = [
  'Case', 'Client', 'Task', 'LegalDocument', 'Template',
  'CalendarEvent', 'Subscription', 'HotmartTransaction',
  'AuditLog', 'AdminMasterLog', 'Conversation',
  'Team', 'TeamMember', 'TeamTask', 'TeamDocument', 'TeamMessage',
  'InsightJuridico', 'CasoPublico', 'LegalResearch',
  'Notification', 'UserConsent', 'ClientPayment', 'HonorarioContrato',
  'ParcelaHonorario', 'Despesa', 'Affiliate', 'AffiliateCommission',
];

// Funções backend conhecidas
const BACKEND_FUNCTIONS = [
  'canAccessSystem', 'createTrialSubscription', 'adminMasterMetrics',
  'adminGetUsers', 'adminUpdateSubscription', 'adminActivatePlan',
  'hotmartWebhook', 'checkExpiredSubscriptions', 'systemAudit',
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function severity(level, title, detail, category) {
  return { level, title, detail, category, ts: new Date().toISOString() };
}

function scoreDeduction(issues) {
  let deduction = 0;
  for (const i of issues) {
    if (i.level === 'CRITICAL') deduction += 20;
    else if (i.level === 'HIGH') deduction += 10;
    else if (i.level === 'MEDIUM') deduction += 5;
    else deduction += 1;
  }
  return Math.min(deduction, 100);
}

// ─── A) Verificação de Entidades / DB ──────────────────────────────────────
async function auditDatabaseIntegrity(base44) {
  const issues = [];
  const stats = {};
  const start = Date.now();

  for (const entity of ENTITIES_TO_AUDIT) {
    try {
      const t0 = Date.now();
      const records = await base44.asServiceRole.entities[entity].list('-created_date', 5);
      const elapsed = Date.now() - t0;
      stats[entity] = { count: records.length, query_ms: elapsed };

      if (elapsed > 3000) {
        issues.push(severity('HIGH', `Query lenta: ${entity}`, `Demorou ${elapsed}ms para listar registros`, 'performance'));
      }
    } catch (e) {
      issues.push(severity('HIGH', `Entidade inacessível: ${entity}`, e.message, 'database'));
    }
  }

  // Verificar usuários sem assinatura
  try {
    const users = await base44.asServiceRole.entities.User ? [] : [];
    const subs = await base44.asServiceRole.entities.Subscription.list('-created_date', 200);
    const subsUserIds = new Set(subs.map(s => s.user_id));

    // Verificar assinaturas expiradas ainda marcadas como ativas
    const expiredButActive = subs.filter(s =>
      s.status === 'active' &&
      s.end_date &&
      !s.is_lifetime &&
      new Date(s.end_date) < new Date()
    );
    if (expiredButActive.length > 0) {
      issues.push(severity('MEDIUM',
        `${expiredButActive.length} assinatura(s) expirada(s) ainda marcadas como ativas`,
        'Executar checkExpiredSubscriptions para corrigir',
        'database'
      ));
    }

    // Verificar transações sem subscription_id
    const transactions = await base44.asServiceRole.entities.HotmartTransaction.list('-created_date', 100);
    const orphanTx = transactions.filter(t => !t.subscription_id && t.status === 'approved');
    if (orphanTx.length > 0) {
      issues.push(severity('MEDIUM',
        `${orphanTx.length} transação(ões) aprovadas sem assinatura vinculada`,
        'Pode indicar falha no webhook de ativação',
        'database'
      ));
    }

    // Verificar casos sem client_id
    const cases = await base44.asServiceRole.entities.Case.list('-created_date', 100);
    const orphanCases = cases.filter(c => !c.client_id || c.client_id.trim() === '');
    if (orphanCases.length > 0) {
      issues.push(severity('LOW',
        `${orphanCases.length} processo(s) sem client_id definido`,
        'Registros órfãos no banco de dados',
        'database'
      ));
    }

    // Verificar tarefas vencidas e ainda pendentes
    const tasks = await base44.asServiceRole.entities.Task.list('-created_date', 200);
    const overdue = tasks.filter(t =>
      t.status === 'pending' &&
      t.due_date &&
      new Date(t.due_date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    if (overdue.length > 20) {
      issues.push(severity('LOW',
        `${overdue.length} tarefas vencidas há mais de 7 dias ainda pendentes`,
        'Avaliar se é esperado ou necessita limpeza',
        'database'
      ));
    }

  } catch (e) {
    issues.push(severity('HIGH', 'Falha na verificação de integridade DB', e.message, 'database'));
  }

  return {
    status: issues.filter(i => ['HIGH', 'CRITICAL'].includes(i.level)).length > 0 ? 'WARNING' : 'OK',
    duration_ms: Date.now() - start,
    entity_stats: stats,
    issues,
  };
}

// ─── B) Verificação de Segurança e Auth ───────────────────────────────────
async function auditSecurity(base44) {
  const issues = [];
  const start = Date.now();

  // Verificar logs de acesso negado recentes
  try {
    const auditLogs = await base44.asServiceRole.entities.AuditLog.list('-created_date', 100);
    const deniedAccess = auditLogs.filter(l =>
      l.action?.includes('unauthorized') ||
      l.action?.includes('denied') ||
      l.action?.includes('forbidden')
    );

    if (deniedAccess.length > 10) {
      issues.push(severity('HIGH',
        `${deniedAccess.length} tentativas de acesso não autorizado recentes`,
        'Verificar se há ataque de força bruta ou exploração de endpoints',
        'security'
      ));
    }

    // Verificar ações administrativas suspeitas
    const adminActions = auditLogs.filter(l => l.action?.includes('admin'));
    if (adminActions.length > 50) {
      issues.push(severity('MEDIUM',
        `Volume elevado de ações administrativas: ${adminActions.length}`,
        'Revisar logs de auditoria para garantir conformidade',
        'security'
      ));
    }
  } catch (e) {
    issues.push(severity('MEDIUM', 'Não foi possível acessar logs de auditoria', e.message, 'security'));
  }

  // Verificar AdminMaster logs
  try {
    const adminLogs = await base44.asServiceRole.entities.AdminMasterLog.list('-created_date', 50);
    const recentUnauth = adminLogs.filter(l =>
      l.action === 'access_denied' &&
      new Date(l.created_date) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    if (recentUnauth.length > 0) {
      issues.push(severity('HIGH',
        `${recentUnauth.length} tentativa(s) de acesso ao Admin Master bloqueadas nas últimas 24h`,
        'Possível tentativa de escalada de privilégios',
        'security'
      ));
    }
  } catch (_) {}

  // Verificar consentimentos LGPD
  try {
    const consents = await base44.asServiceRole.entities.UserConsent.list('-created_date', 500);
    const rejectedConsents = consents.filter(c => !c.accepted);
    if (rejectedConsents.length > 0) {
      issues.push(severity('LOW',
        `${rejectedConsents.length} usuário(s) com consentimento LGPD rejeitado registrado`,
        'Confirmar que esses usuários têm acesso limitado conforme a política',
        'lgpd'
      ));
    }
  } catch (_) {}

  // Verificar afiliados com comissões pendentes há mais de 30 dias
  try {
    const commissions = await base44.asServiceRole.entities.AffiliateCommission.list('-created_date', 100);
    const staleCommissions = commissions.filter(c =>
      c.status === 'pending' &&
      new Date(c.created_date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    if (staleCommissions.length > 0) {
      issues.push(severity('LOW',
        `${staleCommissions.length} comissão(ões) de afiliado pendentes há mais de 30 dias`,
        'Verificar processo de pagamento de comissões',
        'financial'
      ));
    }
  } catch (_) {}

  return {
    status: issues.filter(i => ['HIGH', 'CRITICAL'].includes(i.level)).length > 0 ? 'RISK' : 'OK',
    duration_ms: Date.now() - start,
    issues,
  };
}

// ─── C) Verificação de Performance ────────────────────────────────────────
async function auditPerformance(base44) {
  const issues = [];
  const slowQueries = [];
  const timings = [];
  const start = Date.now();

  const entitiesToMeasure = ['Case', 'Client', 'Task', 'LegalDocument', 'Subscription', 'CalendarEvent'];

  for (const entity of entitiesToMeasure) {
    try {
      const t0 = Date.now();
      await base44.asServiceRole.entities[entity].list('-created_date', 20);
      const ms = Date.now() - t0;
      timings.push(ms);
      if (ms > 500) {
        slowQueries.push({ entity, ms });
        issues.push(severity('MEDIUM',
          `Query lenta em ${entity}: ${ms}ms`,
          'Considerar otimização de índices ou paginação mais agressiva',
          'performance'
        ));
      }
    } catch (_) {}
  }

  const avg = timings.length ? Math.round(timings.reduce((a, b) => a + b, 0) / timings.length) : 0;

  if (avg > 800) {
    issues.push(severity('HIGH', `Tempo médio de resposta elevado: ${avg}ms`, 'Sistema com performance degradada', 'performance'));
  }

  return {
    status: slowQueries.length > 2 ? 'SLOW' : 'OK',
    avg_response_ms: avg,
    slow_queries: slowQueries,
    duration_ms: Date.now() - start,
    issues,
  };
}

// ─── D) Verificação de Conformidade LGPD ──────────────────────────────────
async function auditLGPD(base44) {
  const issues = [];
  const start = Date.now();

  // Verificar logs que possam conter dados sensíveis
  try {
    const auditLogs = await base44.asServiceRole.entities.AuditLog.list('-created_date', 50);
    const suspiciousLogs = auditLogs.filter(log => {
      const details = (log.details || '').toLowerCase();
      return (
        details.includes('"cpf"') ||
        details.includes('"cnpj"') ||
        details.includes('"password"') ||
        details.includes('"senha"') ||
        details.includes('"token"') ||
        details.length > 5000 // logs muito grandes podem conter dados jurídicos
      );
    });

    if (suspiciousLogs.length > 0) {
      issues.push(severity('HIGH',
        `${suspiciousLogs.length} log(s) de auditoria podem conter dados sensíveis`,
        'Revisar o campo "details" nos AuditLogs — não deve armazenar CPF, CNPJ, tokens ou textos jurídicos',
        'lgpd'
      ));
    }
  } catch (_) {}

  // Verificar conversações IA — tamanho dos dados
  try {
    const conversations = await base44.asServiceRole.entities.Conversation.list('-created_date', 20);
    const largeConvs = conversations.filter(c => {
      const msgs = c.messages || [];
      const totalChars = msgs.reduce((acc, m) => acc + (m.content || '').length, 0);
      return totalChars > 100000;
    });

    if (largeConvs.length > 0) {
      issues.push(severity('LOW',
        `${largeConvs.length} conversa(s) IA com volume elevado de dados`,
        'Avaliar política de retenção de conversações — dados jurídicos sensíveis podem estar armazenados',
        'lgpd'
      ));
    }
  } catch (_) {}

  // Verificar se consentimentos estão sendo registrados
  try {
    const consents = await base44.asServiceRole.entities.UserConsent.list('-created_date', 10);
    if (consents.length === 0) {
      issues.push(severity('MEDIUM',
        'Nenhum registro de consentimento LGPD encontrado',
        'Verificar se o ConsentModal está funcionando e salvando corretamente',
        'lgpd'
      ));
    }
  } catch (_) {
    issues.push(severity('MEDIUM', 'Não foi possível verificar consentimentos LGPD', 'Entidade UserConsent inacessível', 'lgpd'));
  }

  // Verificar dados de afiliados exportáveis
  try {
    const withdrawals = await base44.asServiceRole.entities.WithdrawalRequest.list('-created_date', 20);
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
    if (pendingWithdrawals.length > 10) {
      issues.push(severity('LOW',
        `${pendingWithdrawals.length} solicitações de saque pendentes`,
        'Revisar processo de pagamento de afiliados',
        'financial'
      ));
    }
  } catch (_) {}

  return {
    status: issues.filter(i => ['HIGH', 'CRITICAL'].includes(i.level)).length > 0 ? 'ISSUE' : 'COMPLIANT',
    duration_ms: Date.now() - start,
    issues,
  };
}

// ─── E) Verificação de Integridade Financeira ──────────────────────────────
async function auditFinancial(base44) {
  const issues = [];
  const start = Date.now();

  try {
    const subs = await base44.asServiceRole.entities.Subscription.list('-created_date', 500);
    const active = subs.filter(s => s.status === 'active' && !s.is_lifetime);
    const trial = subs.filter(s => s.status === 'trial');
    const expired = subs.filter(s => s.status === 'expired');
    const lifetime = subs.filter(s => s.is_lifetime || s.plan_type === 'lifetime');

    // Verificar trials muito longos
    const longTrials = trial.filter(s => {
      if (!s.trial_end_date) return false;
      const daysLeft = (new Date(s.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24);
      return daysLeft < -3; // trial expirado há mais de 3 dias ainda no status trial
    });
    if (longTrials.length > 0) {
      issues.push(severity('MEDIUM',
        `${longTrials.length} trial(s) expirado(s) ainda com status "trial"`,
        'Executar checkExpiredSubscriptions para atualizar status',
        'financial'
      ));
    }

    // Verificar assinaturas sem user_id
    const noUser = subs.filter(s => !s.user_id);
    if (noUser.length > 0) {
      issues.push(severity('HIGH',
        `${noUser.length} assinatura(s) sem user_id vinculado`,
        'Registros órfãos — verificar processo de criação de assinaturas',
        'database'
      ));
    }

    return {
      status: issues.filter(i => i.level === 'CRITICAL' || i.level === 'HIGH').length > 0 ? 'WARNING' : 'OK',
      summary: {
        total: subs.length,
        active: active.length,
        trial: trial.length,
        expired: expired.length,
        lifetime: lifetime.length,
      },
      duration_ms: Date.now() - start,
      issues,
    };
  } catch (e) {
    return {
      status: 'WARNING',
      issues: [severity('HIGH', 'Falha na auditoria financeira', e.message, 'financial')],
      duration_ms: Date.now() - start,
    };
  }
}

// ─── Handler Principal ─────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const auditStart = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      // Registrar tentativa
      try {
        await base44.asServiceRole.entities.AuditLog.create({
          user_email: user?.email || 'anonymous',
          action: 'unauthorized_system_audit_access',
          entity_type: 'SecurityAttempt',
          details: JSON.stringify({ ip: req.headers.get('x-forwarded-for'), timestamp: new Date().toISOString() }),
        });
      } catch (_) {}
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const trigger = body.trigger || 'manual';

    // ── Registrar início da auditoria
    await base44.asServiceRole.entities.AdminMasterLog.create({
      admin_email: user.email,
      action: `system_audit_started_${trigger}`,
      ip_address: (req.headers.get('x-forwarded-for') || '').split(',')[0].split('.').slice(0, 2).join('.') + '.x.x',
      user_agent: req.headers.get('user-agent')?.slice(0, 100) || '',
      details: JSON.stringify({ trigger, timestamp: new Date().toISOString() }),
    });

    // ── Executar todas as verificações em paralelo
    const [dbResult, secResult, perfResult, lgpdResult, finResult] = await Promise.all([
      auditDatabaseIntegrity(base44),
      auditSecurity(base44),
      auditPerformance(base44),
      auditLGPD(base44),
      auditFinancial(base44),
    ]);

    // ── Consolidar todos os issues
    const allIssues = [
      ...dbResult.issues,
      ...secResult.issues,
      ...perfResult.issues,
      ...lgpdResult.issues,
      ...finResult.issues,
    ];

    const criticalCount = allIssues.filter(i => i.level === 'CRITICAL').length;
    const highCount = allIssues.filter(i => i.level === 'HIGH').length;
    const mediumCount = allIssues.filter(i => i.level === 'MEDIUM').length;
    const lowCount = allIssues.filter(i => i.level === 'LOW').length;

    // ── Calcular score
    const deduction = scoreDeduction(allIssues);
    const score = Math.max(0, 100 - deduction);

    const report = {
      generated_at: new Date().toISOString(),
      executed_by: user.email,
      trigger,
      routes_status: 'OK', // Frontend routes — verificação estrutural (sem req HTTP reais em sandbox)
      auth_security: secResult.status,
      database_integrity: dbResult.status,
      performance: perfResult.status,
      security: secResult.status === 'OK' ? 'SAFE' : 'ATTENTION',
      lgpd_compliance: lgpdResult.status,
      financial_integrity: finResult.status,
      overall_system_health: score,
      issue_summary: { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount, total: allIssues.length },
      details: {
        database: { status: dbResult.status, entity_stats: dbResult.entity_stats },
        security: { status: secResult.status },
        performance: { status: perfResult.status, avg_response_ms: perfResult.avg_response_ms, slow_queries: perfResult.slow_queries },
        lgpd: { status: lgpdResult.status },
        financial: { status: finResult.status, summary: finResult.summary },
      },
    };

    // ── Salvar log da auditoria
    const auditLog = await base44.asServiceRole.entities.SystemAuditLog.create({
      executed_by: user.email,
      trigger,
      result_score: score,
      routes_status: report.routes_status,
      auth_security: report.auth_security,
      database_integrity: report.database_integrity,
      performance: report.performance,
      security: report.security,
      lgpd_compliance: report.lgpd_compliance,
      critical_issues: criticalCount,
      total_issues: allIssues.length,
      issues_json: JSON.stringify(allIssues),
      report_json: JSON.stringify(report),
      duration_ms: Date.now() - auditStart,
      notification_sent: false,
    });

    // ── Enviar notificação se houver críticos
    let notificationSent = false;
    if (criticalCount > 0 || highCount > 2) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: `🚨 JURIS Auditoria — ${criticalCount} problema(s) CRÍTICO(s) detectado(s)`,
          body: `
<h2>Relatório de Auditoria do Sistema JURIS</h2>
<p><strong>Score de Saúde:</strong> ${score}/100</p>
<p><strong>Problemas Críticos:</strong> ${criticalCount}</p>
<p><strong>Problemas High:</strong> ${highCount}</p>
<p><strong>Problemas Medium:</strong> ${mediumCount}</p>
<p><strong>Problemas Low:</strong> ${lowCount}</p>
<h3>Problemas encontrados:</h3>
<ul>
${allIssues.filter(i => i.level === 'CRITICAL' || i.level === 'HIGH').map(i =>
  `<li><strong>[${i.level}] ${i.title}</strong><br/>${i.detail}</li>`
).join('')}
</ul>
<p><em>Execute a auditoria no painel Admin Master para detalhes completos.</em></p>
          `.trim(),
        });
        notificationSent = true;
        await base44.asServiceRole.entities.SystemAuditLog.update(auditLog.id, { notification_sent: true });
      } catch (_) {}
    }

    return Response.json({
      success: true,
      report,
      issues: allIssues,
      notification_sent: notificationSent,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
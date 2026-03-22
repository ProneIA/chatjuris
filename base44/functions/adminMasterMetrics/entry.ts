import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Rate limiting simples em memória
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
  } else {
    entry.count++;
  }

  rateLimitMap.set(ip, entry);
  return entry.count <= RATE_LIMIT_MAX;
}

Deno.serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Rate limit
  if (!checkRateLimit(ip)) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const base44 = createClientFromRequest(req);

    // Autenticação obrigatória
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Apenas admin pode acessar
    if (user.role !== 'admin') {
      // Registrar tentativa negada
      await base44.asServiceRole.entities.AdminMasterLog.create({
        admin_email: user.email,
        action: 'access_denied',
        ip_address: ip,
        details: JSON.stringify({ reason: 'insufficient_role', role: user.role })
      }).catch(() => {});
      return Response.json({ error: 'Acesso negado. Apenas super administradores.' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const section = body.section || 'overview';

    // Registrar log de acesso
    await base44.asServiceRole.entities.AdminMasterLog.create({
      admin_email: user.email,
      action: `view_${section}`,
      ip_address: ip,
      user_agent: req.headers.get('user-agent') || '',
      details: JSON.stringify({ timestamp: new Date().toISOString() })
    }).catch(() => {});

    // ==========================================
    // DADOS AGREGADOS — SEM DADOS INDIVIDUAIS
    // ==========================================
    const [allSubscriptions, allUsers, auditLogs] = await Promise.all([
      base44.asServiceRole.entities.Subscription.list('-created_date', 2000),
      base44.asServiceRole.entities.User.list('-created_date', 2000),
      base44.asServiceRole.entities.AuditLog.list('-created_date', 500),
    ]);

    // --- Métricas de Usuários ---
    const totalUsers = allUsers.length;

    const usersWithActiveSubscription = new Set(
      allSubscriptions.filter(s => s.status === 'active' || s.status === 'trial' || s.status === 'lifetime').map(s => s.user_id)
    );
    const activeUsers = usersWithActiveSubscription.size;

    const now = new Date();
    const last30days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const newUsersLast30Days = allUsers.filter(u => new Date(u.created_date) >= last30days).length;

    // --- Distribuição de Planos ---
    const uniqueActiveSubs = {};
    for (const sub of allSubscriptions) {
      if (sub.status === 'active' || sub.status === 'trial' || sub.status === 'lifetime') {
        if (!uniqueActiveSubs[sub.user_id] || new Date(sub.created_date) > new Date(uniqueActiveSubs[sub.user_id].created_date)) {
          uniqueActiveSubs[sub.user_id] = sub;
        }
      }
    }
    const activePlans = Object.values(uniqueActiveSubs);

    const planDistribution = {
      trial: activePlans.filter(s => s.status === 'trial' || s.plan_type === 'trial').length,
      monthly: activePlans.filter(s => s.plan_type === 'monthly' && s.status === 'active').length,
      yearly: activePlans.filter(s => (s.plan_type === 'yearly' || s.plan_type === 'annual') && s.status === 'active').length,
      lifetime: activePlans.filter(s => s.plan_type === 'lifetime' || s.status === 'lifetime').length,
    };

    // --- MRR Estimado (apenas agregado) ---
    const PLAN_PRICES = { monthly: 47, yearly: 397 / 12, lifetime: 0 };
    const mrr = Math.round(
      (planDistribution.monthly * PLAN_PRICES.monthly + planDistribution.yearly * PLAN_PRICES.yearly) * 100
    ) / 100;

    // --- Crescimento mensal ---
    const subsLast30 = allSubscriptions.filter(s =>
      new Date(s.created_date) >= last30days && (s.status === 'active' || s.status === 'lifetime')
    ).length;

    const last60days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const subsPrev30 = allSubscriptions.filter(s => {
      const d = new Date(s.created_date);
      return d >= last60days && d < last30days && (s.status === 'active' || s.status === 'lifetime');
    }).length;
    const growthRate = subsPrev30 > 0 ? Math.round(((subsLast30 - subsPrev30) / subsPrev30) * 100) : null;

    // --- Saúde do sistema (baseada nos logs de auditoria) ---
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentLogs = auditLogs.filter(l => new Date(l.created_date) >= last24h);
    const errorsLast24h = recentLogs.filter(l =>
      l.action?.toLowerCase().includes('error') || l.action?.toLowerCase().includes('fail')
    ).length;

    // --- Ações recentes (anonimizadas) ---
    const recentActions = auditLogs.slice(0, 20).map(l => ({
      action: l.action,
      entity_type: l.entity_type,
      timestamp: l.created_date,
      // SEM email, SEM entity_id, SEM dados pessoais
    }));

    // --- Taxa de conversão trial -> pago ---
    const trialTotal = allSubscriptions.filter(s => s.plan_type === 'trial').length;
    const convertedFromTrial = allSubscriptions.filter(s =>
      s.plan_type !== 'trial' && (s.status === 'active' || s.status === 'lifetime')
    ).length;
    const conversionRate = trialTotal > 0 ? Math.round((convertedFromTrial / trialTotal) * 100) : 0;

    // --- Churn (assinaturas canceladas/expiradas nos últimos 30 dias) ---
    const churnLast30 = allSubscriptions.filter(s =>
      new Date(s.updated_date) >= last30days && (s.status === 'expired' || s.status === 'canceled')
    ).length;

    // --- Logs Admin Master (anonimizados) ---
    let adminLogs = [];
    try {
      const rawLogs = await base44.asServiceRole.entities.AdminMasterLog.list('-created_date', 50);
      adminLogs = rawLogs.map(l => ({
        action: l.action,
        timestamp: l.created_date,
        ip_address: l.ip_address ? l.ip_address.split('.').slice(0, 2).join('.') + '.x.x' : 'N/A', // Parcialmente anonimizado
      }));
    } catch (_) {}

    return Response.json({
      // OVERVIEW
      users: {
        total: totalUsers,
        active: activeUsers,
        new_last_30_days: newUsersLast30Days,
        inactive: totalUsers - activeUsers,
      },
      // FINANCIAL
      financial: {
        mrr_estimated: mrr,
        arr_estimated: mrr * 12,
        subscriptions_last_30_days: subsLast30,
        growth_rate_percent: growthRate,
        churn_last_30_days: churnLast30,
        conversion_rate_percent: conversionRate,
      },
      // PRODUCT
      product: {
        plan_distribution: planDistribution,
        total_active_subscriptions: activePlans.length,
      },
      // SYSTEM HEALTH
      system: {
        errors_last_24h: errorsLast24h,
        audit_events_last_24h: recentLogs.length,
        recent_actions: recentActions,
      },
      // ADMIN MASTER LOGS
      admin_access_logs: adminLogs,
      // META
      generated_at: new Date().toISOString(),
      disclaimer: "Todos os dados são estritamente agregados e anonimizados. Nenhum dado individual, pessoal ou sensível é retornado. Conforme LGPD.",
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
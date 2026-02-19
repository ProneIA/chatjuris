/**
 * Reconciliação Financeira Mercado Pago
 *
 * Executado diariamente (automation scheduled).
 * Consulta pagamentos pendentes no banco e revalida via API MP.
 * Ativa assinaturas de pagamentos aprovados que o webhook pode ter perdido.
 *
 * ADMIN-ONLY: verificar role === 'admin' ou executar apenas via automation.
 */
import { MercadoPagoConfig, Payment } from 'npm:mercadopago@2.0.15';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PLANS = {
  pro_monthly: { price: 119.90, name: 'Juris Pro - Plano Mensal', durationDays: 30 },
  pro_yearly:  { price: 1198.80, name: 'Juris Pro - Plano Anual',  durationDays: 365 }
};
const AMOUNT_TOLERANCE = 0.10;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Permitir via automation (sem user) ou somente admins
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Proibido: apenas administradores' }, { status: 403 });
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN') || Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) return Response.json({ error: 'MP_ACCESS_TOKEN não configurado' }, { status: 500 });

    const client = new MercadoPagoConfig({ accessToken });
    const paymentApi = new Payment(client);

    const report = {
      started_at: new Date().toISOString(),
      total_checked: 0,
      activated: 0,
      still_pending: 0,
      errors: 0,
      details: []
    };

    // 1) Buscar pagamentos pendentes (não aprovados) com mp_payment_id
    const pendingPayments = await base44.asServiceRole.entities.Payment.filter({ status: 'pending' });
    report.total_checked = pendingPayments.length;
    console.log(`[reconciliacao] ${pendingPayments.length} pagamentos pendentes para verificar`);

    for (const payment of pendingPayments) {
      if (!payment.mp_payment_id) continue;

      try {
        // Revalidar via API
        const mpData = await paymentApi.get({ id: payment.mp_payment_id });
        const mpStatus = mpData.status;
        const paidAmount = mpData.transaction_amount;
        const planId = payment.plan_id || mpData.metadata?.plan_id;
        const userId = payment.user_id || mpData.external_reference;

        await base44.asServiceRole.entities.Payment.update(payment.id, {
          status: mpStatus,
          status_detail: mpData.status_detail || '',
          raw_response: JSON.stringify({ id: mpData.id, status: mpStatus, amount: paidAmount })
        });

        const logEntry = { mp_payment_id: payment.mp_payment_id, status: mpStatus, planId, userId };

        if (mpStatus === 'approved') {
          const plan = PLANS[planId];
          if (!plan) {
            logEntry.error = `Plano desconhecido: ${planId}`;
            report.errors++;
          } else if (Math.abs(paidAmount - plan.price) > AMOUNT_TOLERANCE) {
            logEntry.error = `Valor incorreto: pago ${paidAmount} esperado ${plan.price}`;
            report.errors++;
          } else {
            await _activateSubscription(base44, userId, planId, plan, String(mpData.id), mpData.payment_type_id || 'mercadopago');
            const userEmail = payment.user_email || mpData.payer?.email;
            if (userEmail) await _sendConfirmationEmail(base44, userEmail, plan);
            logEntry.activated = true;
            report.activated++;
            console.log(`[reconciliacao] ✅ Ativado: ${userId} / ${planId}`);
          }
        } else if (mpStatus === 'pending') {
          report.still_pending++;
        }

        report.details.push(logEntry);

      } catch (e) {
        console.error(`[reconciliacao] Erro ao verificar ${payment.mp_payment_id}:`, e.message);
        report.errors++;
        report.details.push({ mp_payment_id: payment.mp_payment_id, error: e.message });
      }
    }

    // 2) Verificar WebhookEvents com processed=false (falhas anteriores - retry)
    const failedEvents = await base44.asServiceRole.entities.WebhookEvent.filter({ processed: false });
    const retryReport = { retried: 0, retry_errors: 0 };

    for (const ev of failedEvents) {
      if (!ev.mp_payment_id || ev.error?.includes('FRAUD')) continue;
      // Verificar se o pagamento já foi tratado
      const paid = await base44.asServiceRole.entities.Payment.filter({ mp_payment_id: ev.mp_payment_id });
      if (paid.length > 0 && paid[0].status === 'approved') {
        // Já processado — marcar evento como ok
        await base44.asServiceRole.entities.WebhookEvent.update(ev.id, {
          processed: true,
          processed_at: new Date().toISOString(),
          error: null
        });
        retryReport.retried++;
      }
    }

    report.retry = retryReport;
    report.finished_at = new Date().toISOString();

    // Log de auditoria da reconciliação
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: user?.email || 'automation',
      action: 'reconciliacao_mp_executada',
      entity_type: 'Payment',
      entity_id: 'batch',
      details: JSON.stringify({
        total: report.total_checked,
        activated: report.activated,
        errors: report.errors
      })
    });

    console.log('[reconciliacao] ✅ Concluída:', JSON.stringify(report));
    return Response.json({ success: true, report });

  } catch (error) {
    console.error('[reconciliacao] ❌ Erro crítico:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────

async function _activateSubscription(base44, userId, planId, plan, mpPaymentId, method) {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const subData = {
    user_id: userId,
    plan_type: planId === 'pro_yearly' ? 'yearly' : 'monthly',
    status: 'active',
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    price: plan.price,
    payment_method: method,
    payment_external_id: mpPaymentId
  };

  const existing = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
  if (existing.length > 0) {
    await base44.asServiceRole.entities.Subscription.update(existing[0].id, subData);
  } else {
    await base44.asServiceRole.entities.Subscription.create(subData);
  }

  const users = await base44.asServiceRole.entities.User.filter({ id: userId });
  if (users.length > 0) {
    await base44.asServiceRole.entities.User.update(users[0].id, {
      subscription_status: 'active',
      subscription_type: planId === 'pro_yearly' ? 'yearly' : 'monthly',
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString()
    });
  }
}

async function _sendConfirmationEmail(base44, email, plan) {
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: '✅ Assinatura Ativada - Juris Pro',
      body: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#7c3aed">Bem-vindo ao Juris Pro! 🎉</h2>
          <p>Sua assinatura <strong>${plan.name}</strong> foi ativada com sucesso.</p>
          <a href="${Deno.env.get('PUBLIC_URL') || 'https://chatjuris.com'}"
             style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px">
            Acessar Juris
          </a>
        </div>
      `
    });
  } catch (e) {
    console.error('[reconciliacao] Erro email:', e.message);
  }
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_ORIGINS = ['https://chatjuris.com', 'https://www.chatjuris.com'];

function getCorsHeaders(req) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

Deno.serve(async (req) => {
  const headers = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // Verificar segredo de cron ou autenticação admin
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');

  let authorized = false;
  if (expectedSecret && cronSecret === expectedSecret) {
    authorized = true;
  } else {
    try {
      const base44Auth = createClientFromRequest(req);
      const u = await base44Auth.auth.me();
      if (u?.role === 'admin') authorized = true;
    } catch {}
  }

  if (!authorized) {
    return Response.json({ error: 'Não autorizado' }, { status: 401, headers });
  }

  try {
    const base44 = createClientFromRequest(req);

    console.log('Verificando lembretes de pagamento...');

    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      status: 'active',
      plan_type: 'monthly'
    });

    console.log(`Encontradas ${subscriptions.length} assinaturas mensais ativas`);

    const today = new Date();
    const remindersToSend = [];

    for (const sub of subscriptions) {
      if (!sub.end_date) continue;

      const billingDate = new Date(sub.end_date);
      const daysUntilDue = Math.ceil((billingDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntilDue === 3) {
        const users = await base44.asServiceRole.entities.User.filter({ id: sub.user_id });
        if (users.length === 0) continue;

        const user = users[0];
        remindersToSend.push({
          userEmail: user.email,
          userName: user.full_name || 'Cliente',
          planName: 'Profissional Mensal',
          amount: (sub.price || 119.90).toFixed(2).replace('.', ','),
          dueDate: billingDate.toLocaleDateString('pt-BR'),
          daysUntilDue
        });
      }
    }

    for (const reminder of remindersToSend) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: reminder.userEmail,
          subject: `Lembrete: sua assinatura vence em ${reminder.daysUntilDue} dias`,
          body: `Olá, ${reminder.userName}!\n\nSua assinatura do plano ${reminder.planName} vence em ${reminder.daysUntilDue} dias (${reminder.dueDate}).\n\nValor: R$ ${reminder.amount}\n\nAcesse o ChatJuris para renovar sua assinatura.\n\nAtenciosamente,\nEquipe ChatJuris`
        });
      } catch (emailError) {
        console.error(`Erro ao enviar lembrete para ${reminder.userEmail}:`, emailError);
      }
    }

    return Response.json({
      success: true,
      checked: subscriptions.length,
      sent: remindersToSend.length
    }, { headers });

  } catch (error) {
    console.error('[checkPaymentReminders] Erro:', error);
    return Response.json({ error: 'Erro interno. Tente novamente.' }, { status: 500, headers });
  }
});
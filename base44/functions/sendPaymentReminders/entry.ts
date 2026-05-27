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
    return new Response(null, { status: 204, headers });
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

    console.log('Iniciando verificação de lembretes de pagamento...');

    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      status: 'active',
      plan: 'pro'
    });

    console.log(`Encontradas ${subscriptions.length} assinaturas ativas`);

    const today = new Date();
    let remindersSent = 0;

    for (const sub of subscriptions) {
      if (!sub.next_billing_date) continue;

      const nextBillingDate = new Date(sub.next_billing_date);
      const daysUntilExpiry = Math.ceil((nextBillingDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry === 3) {
        try {
          const users = await base44.asServiceRole.entities.User.filter({ id: sub.user_id });
          const user = users[0];

          if (!user) continue;

          await base44.asServiceRole.functions.invoke('sendNotificationEmail', {
            type: 'payment_reminder',
            userEmail: user.email,
            userName: user.full_name || 'Cliente',
            data: {
              planName: 'Juris Pro',
              daysUntilExpiry,
              nextBillingDate: nextBillingDate.toLocaleDateString('pt-BR'),
              amount: sub.price || 119.90
            }
          });

          remindersSent++;
        } catch (error) {
          console.error(`Erro ao enviar lembrete para assinatura ${sub.id}:`, error);
        }
      }
    }

    return Response.json({
      success: true,
      remindersSent,
      totalSubscriptions: subscriptions.length
    }, { headers });

  } catch (error) {
    console.error('[sendPaymentReminders] Erro:', error);
    return Response.json({ error: 'Erro interno. Tente novamente.' }, { status: 500, headers });
  }
});
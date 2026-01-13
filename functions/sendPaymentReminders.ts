import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const base44 = createClientFromRequest(req);

    console.log('Iniciando verificação de lembretes de pagamento...');

    // Buscar assinaturas ativas com plano pro
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

      // Enviar lembrete 3 dias antes do vencimento
      if (daysUntilExpiry === 3) {
        try {
          // Buscar dados do usuário
          const users = await base44.asServiceRole.entities.User.filter({ id: sub.user_id });
          const user = users[0];

          if (!user) {
            console.log(`Usuário não encontrado para assinatura ${sub.id}`);
            continue;
          }

          await base44.asServiceRole.functions.invoke('sendNotificationEmail', {
            type: 'payment_reminder',
            userEmail: user.email,
            userName: user.full_name || 'Cliente',
            data: {
              planName: 'Juris Pro',
              daysUntilExpiry: daysUntilExpiry,
              nextBillingDate: nextBillingDate.toLocaleDateString('pt-BR'),
              amount: sub.price || 119.90
            }
          });

          remindersSent++;
          console.log(`Lembrete enviado para ${user.email}`);
        } catch (error) {
          console.error(`Erro ao enviar lembrete para assinatura ${sub.id}:`, error);
        }
      }
    }

    console.log(`Total de lembretes enviados: ${remindersSent}`);

    return Response.json({ 
      success: true, 
      remindersSent,
      totalSubscriptions: subscriptions.length 
    }, { headers });
  } catch (error) {
    console.error('Erro ao enviar lembretes:', error);
    return Response.json({ error: error.message }, { status: 500, headers });
  }
});
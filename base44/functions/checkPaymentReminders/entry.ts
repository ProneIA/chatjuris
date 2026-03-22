import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    console.log('Verificando lembretes de pagamento...');

    // Buscar todas as assinaturas ativas mensais
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      status: 'active',
      plan: 'pro_monthly'
    });

    console.log(`Encontradas ${subscriptions.length} assinaturas mensais ativas`);

    const today = new Date();
    const remindersToSend = [];

    for (const sub of subscriptions) {
      if (!sub.next_billing_date) continue;

      const billingDate = new Date(sub.next_billing_date);
      const daysUntilDue = Math.ceil((billingDate - today) / (1000 * 60 * 60 * 24));

      // Enviar lembretes 3 dias antes do vencimento
      if (daysUntilDue === 3) {
        console.log(`Lembrete necessário para assinatura ${sub.id} - ${daysUntilDue} dias até vencimento`);

        // Buscar informações do usuário
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

    console.log(`Enviando ${remindersToSend.length} lembretes...`);

    // Enviar emails
    for (const reminder of remindersToSend) {
      try {
        await base44.asServiceRole.functions.invoke('sendNotificationEmail', {
          templateType: 'payment_reminder',
          data: reminder
        });
        console.log(`Lembrete enviado para ${reminder.userEmail}`);
      } catch (error) {
        console.error(`Erro ao enviar lembrete para ${reminder.userEmail}:`, error);
      }
    }

    return Response.json({
      success: true,
      checked: subscriptions.length,
      sent: remindersToSend.length
    }, { headers });

  } catch (error) {
    console.error('Erro ao verificar lembretes:', error);
    return Response.json({ error: error.message }, { status: 500, headers });
  }
});
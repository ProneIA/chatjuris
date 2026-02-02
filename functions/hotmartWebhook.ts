import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validar token do webhook
    const authHeader = req.headers.get('Authorization');
    const expectedToken = Deno.env.get('HOTMART_BASIC_TOKEN');
    
    if (!authHeader || authHeader !== expectedToken) {
      console.log('Token inválido:', authHeader);
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Webhook Hotmart recebido:', JSON.stringify(body, null, 2));

    const event = body.event;
    const data = body.data;

    if (!event || !data) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Extrair informações do comprador
    const buyerEmail = data.buyer?.email || data.subscriber?.email;
    const buyerName = data.buyer?.name || data.subscriber?.name;
    
    if (!buyerEmail) {
      console.log('Email do comprador não encontrado');
      return Response.json({ error: 'Buyer email not found' }, { status: 400 });
    }

    // Buscar ou criar usuário
    let users = await base44.asServiceRole.entities.User.filter({ email: buyerEmail });
    let user = users[0];

    // Se usuário não existe, criar convite
    if (!user) {
      console.log('Usuário não encontrado, criando convite...');
      await base44.users.inviteUser(buyerEmail, 'user');
      // Aguardar um pouco para o usuário ser criado
      await new Promise(resolve => setTimeout(resolve, 2000));
      users = await base44.asServiceRole.entities.User.filter({ email: buyerEmail });
      user = users[0];
    }

    if (!user) {
      console.log('Não foi possível criar/encontrar usuário');
      return Response.json({ error: 'User not found or created' }, { status: 400 });
    }

    // Buscar assinatura existente
    const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ 
      user_id: user.id 
    });

    const hotmartTransactionId = data.purchase?.transaction || data.subscription?.subscriber_code;
    const productId = data.product?.id;
    const productName = data.product?.name;

    // Processar eventos
    switch (event) {
      case 'PURCHASE_COMPLETE':
      case 'PURCHASE_APPROVED':
        console.log('Compra aprovada para:', buyerEmail);
        
        if (existingSubs.length > 0) {
          // Atualizar assinatura existente
          await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
            plan: 'pro',
            status: 'active',
            daily_actions_limit: 999999,
            daily_actions_used: 0,
            payment_method: 'external',
            payment_status: 'paid',
            payment_external_id: hotmartTransactionId,
            start_date: new Date().toISOString().split('T')[0],
            last_reset_date: new Date().toISOString().split('T')[0],
            price: data.purchase?.price?.value || 0
          });
        } else {
          // Criar nova assinatura
          await base44.asServiceRole.entities.Subscription.create({
            user_id: user.id,
            plan: 'pro',
            status: 'active',
            daily_actions_limit: 999999,
            daily_actions_used: 0,
            payment_method: 'external',
            payment_status: 'paid',
            payment_external_id: hotmartTransactionId,
            start_date: new Date().toISOString().split('T')[0],
            last_reset_date: new Date().toISOString().split('T')[0],
            price: data.purchase?.price?.value || 0
          });
        }

        // Registrar log de auditoria
        await base44.asServiceRole.entities.AuditLog.create({
          action: 'hotmart_purchase_approved',
          performed_by: 'system',
          target_user_id: user.id,
          target_user_email: buyerEmail,
          details: `Compra Hotmart aprovada. Transaction: ${hotmartTransactionId}, Product: ${productName}`
        });

        break;

      case 'PURCHASE_CANCELED':
      case 'PURCHASE_REFUNDED':
      case 'SUBSCRIPTION_CANCELLATION':
        console.log('Assinatura cancelada/reembolsada para:', buyerEmail);
        
        if (existingSubs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
            status: 'cancelled',
            plan: 'free',
            daily_actions_limit: 5,
            payment_status: 'cancelled'
          });

          // Registrar log
          await base44.asServiceRole.entities.AuditLog.create({
            action: 'hotmart_subscription_cancelled',
            performed_by: 'system',
            target_user_id: user.id,
            target_user_email: buyerEmail,
            details: `Assinatura Hotmart cancelada. Event: ${event}, Transaction: ${hotmartTransactionId}`
          });
        }
        break;

      case 'PURCHASE_DELAYED':
        console.log('Pagamento pendente para:', buyerEmail);
        
        if (existingSubs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
            status: 'pending',
            payment_status: 'pending'
          });
        } else {
          await base44.asServiceRole.entities.Subscription.create({
            user_id: user.id,
            plan: 'free',
            status: 'pending',
            daily_actions_limit: 5,
            daily_actions_used: 0,
            payment_method: 'external',
            payment_status: 'pending',
            payment_external_id: hotmartTransactionId,
            last_reset_date: new Date().toISOString().split('T')[0]
          });
        }
        break;

      default:
        console.log('Evento não tratado:', event);
    }

    return Response.json({ 
      success: true, 
      message: 'Webhook processado com sucesso',
      event: event,
      email: buyerEmail
    });

  } catch (error) {
    console.error('Erro no webhook Hotmart:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});
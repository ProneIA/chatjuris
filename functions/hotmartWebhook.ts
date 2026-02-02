import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validar webhook Hotmart
    const hotmartToken = req.headers.get('x-hotmart-hottok');
    const expectedToken = Deno.env.get('HOTMART_BASIC_TOKEN');
    
    if (!hotmartToken || hotmartToken !== expectedToken) {
      console.error('Token inválido');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    console.log('Webhook Hotmart recebido:', JSON.stringify(payload, null, 2));

    const { event, data } = payload;
    
    if (!event || !data) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { buyer, purchase, subscription } = data;
    const userEmail = buyer?.email;

    if (!userEmail) {
      console.error('Email do comprador não encontrado');
      return Response.json({ error: 'Email not found' }, { status: 400 });
    }

    // Buscar ou criar usuário
    let users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    let user = users[0];

    if (!user) {
      // Criar usuário automaticamente
      user = await base44.asServiceRole.entities.User.create({
        email: userEmail,
        full_name: buyer?.name || 'Usuário Hotmart',
        role: 'user'
      });
      console.log('Novo usuário criado:', user.id);
    }

    // Buscar subscription existente
    const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ 
      user_id: user.id 
    });

    const hotmartData = {
      transaction_id: purchase?.transaction || subscription?.subscriber_code,
      product_id: data.product?.id,
      product_name: data.product?.name,
      hotmart_subscription_id: subscription?.subscriber_code,
      purchase_date: purchase?.approved_date || new Date().toISOString(),
    };

    // Processar eventos
    switch (event) {
      case 'PURCHASE_COMPLETE':
      case 'PURCHASE_APPROVED':
      case 'PURCHASE_BILLET_PRINTED':
        // Ativar assinatura PRO
        if (existingSubs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
            plan: 'pro',
            status: 'active',
            payment_status: 'paid',
            payment_method: purchase?.payment?.type || 'hotmart',
            payment_external_id: hotmartData.transaction_id,
            price: (purchase?.price?.value || 0) / 100,
            start_date: new Date().toISOString().split('T')[0],
            ...hotmartData
          });
        } else {
          await base44.asServiceRole.entities.Subscription.create({
            user_id: user.id,
            plan: 'pro',
            status: 'active',
            payment_status: 'paid',
            payment_method: purchase?.payment?.type || 'hotmart',
            payment_external_id: hotmartData.transaction_id,
            price: (purchase?.price?.value || 0) / 100,
            start_date: new Date().toISOString().split('T')[0],
            ...hotmartData
          });
        }
        console.log('Assinatura PRO ativada para:', userEmail);
        break;

      case 'PURCHASE_CANCELED':
      case 'PURCHASE_REFUNDED':
      case 'PURCHASE_CHARGEBACK':
      case 'SUBSCRIPTION_CANCELLATION':
        // Cancelar assinatura
        if (existingSubs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
            status: 'cancelled',
            payment_status: 'cancelled',
            end_date: new Date().toISOString().split('T')[0]
          });
        }
        console.log('Assinatura cancelada para:', userEmail);
        break;

      case 'SUBSCRIPTION_REACTIVATION':
        // Reativar assinatura
        if (existingSubs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
            status: 'active',
            payment_status: 'paid',
            end_date: null
          });
        }
        console.log('Assinatura reativada para:', userEmail);
        break;

      default:
        console.log('Evento não tratado:', event);
    }

    // Log de auditoria
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'hotmart_webhook',
        performed_by: 'system',
        target_user: userEmail,
        details: `Evento: ${event}`,
        metadata: { event, hotmartData }
      });
    } catch (e) {
      console.warn('Erro ao criar log de auditoria:', e.message);
    }

    return Response.json({ success: true, message: 'Webhook processado' });

  } catch (error) {
    console.error('Erro no webhook Hotmart:', error);
    return Response.json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});
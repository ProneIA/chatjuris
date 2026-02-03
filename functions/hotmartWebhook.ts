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

    // Detectar plano baseado no produto/preço
    const price = (purchase?.price?.value || 0) / 100;
    const isAnnual = price > 100 || (data.product?.name || '').toLowerCase().includes('anual');
    const plan = isAnnual ? 'annual' : 'monthly';
    
    // Calcular data de expiração
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (isAnnual) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const hotmartData = {
      transaction_id: purchase?.transaction || subscription?.subscriber_code,
      product_id: data.product?.id,
      product_name: data.product?.name,
      hotmart_subscription_id: subscription?.subscriber_code,
      purchase_date: purchase?.approved_date || new Date().toISOString(),
    };
    
    console.log('📅 DEBUG - Plan detection:', { 
      price, 
      plan, 
      isAnnual, 
      startDate: startDate.toISOString().split('T')[0], 
      endDate: endDate.toISOString().split('T')[0] 
    });

    // Processar eventos
    switch (event) {
      case 'PURCHASE_COMPLETE':
      case 'PURCHASE_APPROVED':
      case 'PURCHASE_BILLET_PRINTED':
        console.log('💳 DEBUG - Payment received, activating PRO for:', userEmail);
        console.log('📋 DEBUG - Plan:', plan, '| Price:', price, '| Valid until:', endDate.toISOString().split('T')[0]);
        
        // Ativar assinatura PRO com limite ilimitado e data de expiração
        const subscriptionData = {
          plan: 'pro',
          status: 'active',
          payment_status: 'paid',
          payment_method: purchase?.payment?.type || 'hotmart',
          payment_external_id: hotmartData.transaction_id,
          price: price,
          daily_actions_limit: 999999,
          daily_actions_used: 0,
          last_reset_date: startDate.toISOString().split('T')[0],
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          next_billing_date: endDate.toISOString().split('T')[0],
          ...hotmartData
        };
        
        if (existingSubs.length > 0) {
          console.log('📝 DEBUG - Updating existing subscription:', existingSubs[0].id);
          await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, subscriptionData);
        } else {
          console.log('✨ DEBUG - Creating new PRO subscription');
          await base44.asServiceRole.entities.Subscription.create({
            user_id: user.id,
            ...subscriptionData
          });
        }
        console.log('✅ DEBUG - PRO subscription activated with unlimited access until:', endDate.toISOString().split('T')[0]);
        break;

      case 'PURCHASE_CANCELED':
      case 'PURCHASE_REFUNDED':
      case 'PURCHASE_CHARGEBACK':
      case 'SUBSCRIPTION_CANCELLATION':
        console.log('❌ DEBUG - Payment cancelled/refunded, blocking access for:', userEmail);
        // Cancelar assinatura e bloquear acesso
        if (existingSubs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
            status: 'cancelled',
            payment_status: 'cancelled',
            daily_actions_limit: 0,
            end_date: new Date().toISOString().split('T')[0]
          });
          console.log('🔒 DEBUG - Access blocked for:', userEmail);
        }
        break;

      case 'SUBSCRIPTION_REACTIVATION':
        console.log('🔄 DEBUG - Subscription reactivated, restoring access for:', userEmail);
        // Reativar assinatura
        if (existingSubs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
            status: 'active',
            payment_status: 'paid',
            daily_actions_limit: 999999,
            daily_actions_used: 0,
            last_reset_date: new Date().toISOString().split('T')[0],
            end_date: null
          });
          console.log('✅ DEBUG - Access restored for:', userEmail);
        }
        break;

      case 'SUBSCRIPTION_PAYMENT_APPROVED':
        console.log('🔄 DEBUG - Subscription renewal payment approved for:', userEmail);
        // Renovar assinatura
        if (existingSubs.length > 0) {
          const newEndDate = new Date();
          if (isAnnual) {
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          } else {
            newEndDate.setMonth(newEndDate.getMonth() + 1);
          }
          
          await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
            status: 'active',
            payment_status: 'paid',
            daily_actions_limit: 999999,
            end_date: newEndDate.toISOString().split('T')[0],
            next_billing_date: newEndDate.toISOString().split('T')[0],
            ...hotmartData
          });
          console.log('✅ DEBUG - Subscription renewed until:', newEndDate.toISOString().split('T')[0]);
        }
        break;

      default:
        console.log('⚠️ DEBUG - Unhandled event:', event);
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
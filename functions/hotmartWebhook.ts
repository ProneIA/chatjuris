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

    // IDENTIFICAÇÃO DE PLANO PELO PRODUCT_ID OU CHECKOUT_LINK
    const productId = data.product?.id;
    const checkoutLink = data.product?.checkout_link || '';
    const price = (purchase?.price?.value || 0) / 100;
    
    // Buscar plano configurado pelo hotmart_product_id ou checkout_url
    let detectedPlan = null;
    const allPlans = await base44.asServiceRole.entities.HotmartPlan.filter({});
    
    for (const p of allPlans) {
      if (p.hotmart_product_id === productId || p.hotmart_checkout_url === checkoutLink) {
        detectedPlan = p;
        break;
      }
    }
    
    // Fallback: detecção por preço/nome (legado)
    let planType, durationDays;
    if (detectedPlan) {
      planType = detectedPlan.name.toLowerCase();
      durationDays = detectedPlan.duration_days;
    } else {
      // Lógica antiga de fallback
      const isLifetime = checkoutLink === 'https://pay.hotmart.com/L104287363X' || price >= 1500;
      const isAnnual = !isLifetime && (price > 100 || (data.product?.name || '').toLowerCase().includes('anual'));
      
      if (isLifetime) {
        planType = 'vitalicio';
        durationDays = null;
      } else if (isAnnual) {
        planType = 'anual';
        durationDays = 365;
      } else {
        planType = 'mensal';
        durationDays = 30;
      }
    }
    
    // Calcular data de expiração
    const startDate = new Date();
    let endDate = null;
    
    if (durationDays !== null && durationDays !== undefined) {
      endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    }

    const transactionId = purchase?.transaction || subscription?.subscriber_code || `hotmart_${Date.now()}`;
    
    const hotmartData = {
      transaction_id: transactionId,
      product_id: data.product?.id,
      product_name: data.product?.name,
      product_url: checkoutLink,
      hotmart_subscription_id: subscription?.subscriber_code,
      purchase_date: purchase?.approved_date || new Date().toISOString(),
    };
    
    // Converter plan_type para formato padrão (monthly, yearly, lifetime)
    const normalizedPlanType = planType === 'mensal' ? 'monthly' 
      : planType === 'anual' ? 'yearly' 
      : planType === 'vitalicio' ? 'lifetime' 
      : planType;
    
    console.log('📅 DEBUG - Plan detection:', { 
      price, 
      planType,
      isLifetime,
      isAnnual, 
      checkoutLink,
      startDate: startDate.toISOString().split('T')[0], 
      endDate: endDate ? endDate.toISOString().split('T')[0] : 'VITALÍCIO (sem expiração)' 
    });

    // Processar eventos
    switch (event) {
      case 'PURCHASE_COMPLETE':
      case 'PURCHASE_APPROVED':
      case 'PURCHASE_BILLET_PRINTED':
      case 'SUBSCRIPTION_PURCHASED':
        console.log('💳 DEBUG - Payment received, activating PRO for:', userEmail);
        console.log('📋 DEBUG - Plan Type:', planType, '| Price:', price, '| Valid until:', endDate ? endDate.toISOString().split('T')[0] : 'VITALÍCIO');
        
        // Determinar auto_renew baseado no tipo de plano
        const autoRenew = normalizedPlanType === 'monthly'; // Apenas mensal renova automaticamente
        
        // Ativar assinatura PRO com limite ilimitado
        const subscriptionData = {
          plan: 'pro',
          plan_type: normalizedPlanType,
          status: normalizedPlanType === 'lifetime' ? 'lifetime' : 'active',
          payment_status: 'paid',
          payment_method: purchase?.payment?.type || 'hotmart',
          payment_external_id: transactionId,
          price: price,
          daily_actions_limit: 999999,
          daily_actions_used: 0,
          last_reset_date: startDate.toISOString().split('T')[0],
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate ? endDate.toISOString().split('T')[0] : null,
          next_billing_date: (autoRenew && endDate) ? endDate.toISOString().split('T')[0] : null,
          activated_at: new Date().toISOString(),
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
        console.log('✅ DEBUG - PRO subscription activated:', normalizedPlanType === 'lifetime' ? 'VITALÍCIO (acesso permanente)' : `até ${endDate.toISOString().split('T')[0]}`);
        
        // SINCRONIZAÇÃO: Atualizar User.entity também
        const userUpdateData = {
            subscription_status: normalizedPlanType === 'lifetime' ? 'lifetime' : 'active',
            subscription_type: normalizedPlanType,
            subscription_start_date: startDate.toISOString(),
            subscription_end_date: endDate ? endDate.toISOString() : null,
            is_lifetime: normalizedPlanType === 'lifetime'
        };
        
        await base44.asServiceRole.entities.User.update(user.id, userUpdateData);
        console.log('✅ DEBUG - User.entity sincronizado');
        
        // REGISTRAR TRANSAÇÃO
        await base44.asServiceRole.entities.HotmartTransaction.create({
          user_id: user.id,
          subscription_id: existingSubs[0]?.id || null,
          hotmart_transaction_id: transactionId,
          plan_name: planType.toUpperCase(),
          amount: price,
          status: 'approved',
          payment_method: purchase?.payment?.type || 'hotmart',
          event_type: event,
          hotmart_payload: JSON.stringify(payload),
          processed_at: new Date().toISOString()
        });
        
        // Enviar email de boas-vindas
        try {
          const planDisplayName = normalizedPlanType === 'lifetime' ? 'Vitalício' 
            : normalizedPlanType === 'yearly' ? 'Anual' 
            : 'Mensal';
          
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: userEmail,
            subject: `🎉 Assinatura ${planDisplayName} Ativada - Juris Pro`,
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7c3aed;">Bem-vindo ao Juris Pro! 🚀</h2>
                <p>Olá <strong>${buyer?.name || 'Usuário'}</strong>,</p>
                <p>Sua assinatura <strong>${planDisplayName}</strong> foi ativada com sucesso!</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Plano:</strong> ${planDisplayName}</p>
                  <p><strong>Valor:</strong> R$ ${price.toFixed(2)}</p>
                  <p><strong>Status:</strong> ✅ Ativo</p>
                  ${normalizedPlanType !== 'lifetime' ? `<p><strong>Válido até:</strong> ${endDate.toLocaleDateString('pt-BR')}</p>` : '<p><strong>Acesso:</strong> Vitalício (sem expiração)</p>'}
                </div>
                <p>Aproveite todos os recursos ilimitados da plataforma!</p>
                <a href="${Deno.env.get('PUBLIC_URL') || 'https://chatjuris.com'}/Dashboard" 
                   style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; margin-top: 20px;">
                  Acessar Plataforma
                </a>
                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                  Se tiver dúvidas, entre em contato conosco.
                </p>
              </div>
            `
          });
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError);
        }
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
        // Renovar assinatura (apenas se não for vitalício)
        if (existingSubs.length > 0) {
          // Verificar se é vitalício
          if (existingSubs[0].plan_type === 'lifetime') {
            console.log('⚠️ DEBUG - Plano vitalício não precisa de renovação');
            break;
          }
          
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
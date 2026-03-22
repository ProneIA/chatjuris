/**
 * POST /api/functions/createCheckoutPreference
 * Cria uma preferência de checkout no Mercado Pago
 * 
 * SEGURANÇA:
 * - Apenas no backend (nunca expõe access token)
 * - Valida usuário autenticado
 * - Usa external_reference = user_id
 * - Gera idempotency key para evitar duplicatas
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PLANS = {
  pro_monthly: {
    name: 'Juris Pro - Plano Mensal',
    price: 119.90,
    durationDays: 30,
    description: 'Assinatura mensal da plataforma Juris Pro'
  },
  pro_yearly: {
    name: 'Juris Pro - Plano Anual',
    price: 1198.80,
    durationDays: 365,
    description: 'Assinatura anual da plataforma Juris Pro'
  }
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { planId, payerData } = body;

    // ✅ Validar plano
    if (!PLANS[planId]) {
      return Response.json({ error: 'Plano inválido' }, { status: 400 });
    }

    const plan = PLANS[planId];

    // ✅ Validar dados do pagador (obrigatório)
    if (!payerData?.fullName || !payerData?.cpf || !payerData?.email) {
      return Response.json({
        error: 'Dados do pagador incompletos: nome, CPF e email são obrigatórios'
      }, { status: 400 });
    }

    // ✅ Obter access token (seguro)
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'Gateway não configurado' }, { status: 500 });
    }

    const publicUrl = Deno.env.get('PUBLIC_URL') || 'https://app.jurispro.com';
    const idempotencyKey = crypto.randomUUID();

    // ✅ Construir payload para Mercado Pago
    const preference = {
      items: [
        {
          title: plan.name,
          description: plan.description,
          category_id: 'digital_goods',
          quantity: 1,
          unit_price: plan.price,
          id: planId
        }
      ],
      payer: {
        name: payerData.fullName.split(' ')[0],
        surname: payerData.fullName.split(' ').slice(1).join(' ') || 'Usuario',
        email: payerData.email,
        identification: {
          type: 'CPF',
          number: payerData.cpf.replace(/\D/g, '')
        }
      },
      external_reference: user.id, // ✅ Vincular ao usuário
      auto_return: 'approved',
      back_urls: {
        success: `${publicUrl}/CheckoutSuccess`,
        failure: `${publicUrl}/Pricing`,
        pending: `${publicUrl}/Pricing`
      },
      notification_url: `${publicUrl}/api/functions/mercadoPagoWebhook`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_id: planId,
        idempotency_key: idempotencyKey
      }
    };

    // ✅ Criar preferência no Mercado Pago
    const mpResponse = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(preference)
      }
    );

    if (!mpResponse.ok) {
      const error = await mpResponse.text();
      console.error('[MP] Erro ao criar preferência:', error);
      return Response.json(
        { error: 'Erro ao criar checkout' },
        { status: 500 }
      );
    }

    const mpData = await mpResponse.json();

    // ✅ Salvar registro de preferência para auditoria
    await base44.asServiceRole.entities.Payment.create({
      user_id: user.id,
      user_email: user.email,
      plan_id: planId,
      payment_type: 'checkout_pro',
      amount: plan.price,
      status: 'pending',
      mp_preference_id: mpData.id,
      idempotency_key: idempotencyKey,
      raw_response: JSON.stringify({ id: mpData.id, init_point: mpData.init_point })
    });

    return Response.json({
      success: true,
      preferenceId: mpData.id,
      checkoutUrl: mpData.init_point,
      idempotencyKey
    });

  } catch (error) {
    console.error('[createCheckoutPreference] Erro:', error.message);
    return Response.json(
      { error: error.message || 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
});
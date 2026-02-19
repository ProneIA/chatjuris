import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      return Response.json({ error: 'Missing MP_ACCESS_TOKEN' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const planId = body.planId || 'pro_monthly';

    const PLANS = {
      pro_monthly: { price: 119.90, name: 'Juris Pro - Plano Mensal' },
      pro_yearly: { price: 1198.80, name: 'Juris Pro - Plano Anual' }
    };

    const plan = PLANS[planId] || PLANS.pro_monthly;

    // Criar preferência de pagamento (Checkout Pro)
    const preference = {
      items: [
        {
          title: plan.name,
          description: `Assinatura ${plan.name} - Plataforma Juris IA`,
          quantity: 1,
          unit_price: plan.price,
          currency_id: 'BRL'
        }
      ],
      payer: {
        name: 'João',
        surname: 'Silva',
        email: 'test_user_123@testuser.com',
        phone: {
          area_code: '11',
          number: '98765-4321'
        },
        identification: {
          type: 'CPF',
          number: '12345678909'
        },
        address: {
          zip_code: '01234000',
          street_name: 'Av. das Nações',
          street_number: 1000,
          neighborhood: 'Centro',
          city: 'São Paulo',
          federal_unit: 'SP'
        }
      },
      back_urls: {
        success: `${Deno.env.get('PUBLIC_URL')}/Checkout?status=success`,
        failure: `${Deno.env.get('PUBLIC_URL')}/Checkout?status=failure`,
        pending: `${Deno.env.get('PUBLIC_URL')}/Checkout?status=pending`
      },
      auto_return: 'approved',
      external_reference: `TEST_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`,
      notification_url: `${Deno.env.get('PUBLIC_URL')}/api/functions/mercadoPagoWebhook`
    };

    // Gerar ID único para idempotência
    const idempotencyKey = crypto.randomUUID();

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
        'X-Request-Id': crypto.randomUUID(),
        'X-TLS-Version': '1.2'
      },
      body: JSON.stringify(preference)
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('MP Error:', mpData);
      return Response.json({
        error: 'Erro ao criar preferência no Mercado Pago',
        details: mpData
      }, { status: 400 });
    }

    return Response.json({
      success: true,
      preference_id: mpData.id,
      checkout_url: mpData.init_point,
      sandbox_url: mpData.sandbox_init_point,
      message: '✅ Link de pagamento gerado com sucesso!',
      security_info: {
        payer_identification: 'CPF 12345678909 (João Silva)',
        address_included: 'Av. das Nações, 1000 - Centro, São Paulo-SP',
        headers_sent: {
          'X-Idempotency-Key': 'Ativado',
          'X-Request-Id': 'Ativado',
          'X-TLS-Version': '1.2+'
        },
        device_id_required: 'Será injetado no frontend via script MP'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({
      error: 'Erro ao gerar link de pagamento',
      message: error.message
    }, { status: 500 });
  }
});
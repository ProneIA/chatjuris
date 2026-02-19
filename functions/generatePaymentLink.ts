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

    // Criar preferência de pagamento (Checkout Pro)
    const preference = {
      items: [
        {
          title: 'Teste de Qualidade - R$ 2,00',
          description: 'Pagamento para teste de integração Mercado Pago',
          quantity: 1,
          unit_price: 2.00,
          currency_id: 'BRL'
        }
      ],
      payer: {
        name: user.full_name || 'Teste',
        email: user.email,
        phone: {
          area_code: '11',
          number: '98765-4321'
        },
        address: {
          street_name: 'Avenida Paulista',
          street_number: '1000',
          zip_code: '01311100'
        },
        identification: {
          type: 'CPF',
          number: '12345678909'
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

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
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
      message: '✅ Link de pagamento gerado com sucesso!'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({
      error: 'Erro ao gerar link de pagamento',
      message: error.message
    }, { status: 500 });
  }
});
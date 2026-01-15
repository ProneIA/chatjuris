import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'Mercado Pago não configurado' }, { status: 500 });
    }

    const publicUrl = Deno.env.get('PUBLIC_URL') || 'https://seusite.com';

    // Criar preferência de pagamento
    const preference = {
      items: [
        {
          title: 'tester',
          description: 'Pagamento de teste',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 1.0,
        },
      ],
      back_urls: {
        success: `${publicUrl}/paymentSuccess?status=success`,
        failure: `${publicUrl}/paymentSuccess?status=error`,
        pending: `${publicUrl}/paymentSuccess?status=pending`,
      },
      auto_return: 'approved',
      payer: {
        email: user.email,
        name: user.full_name || 'Tester',
      },
      metadata: {
        user_id: user.id,
        user_email: user.email,
        test_payment: true,
      },
    };

    // Fazer requisição para o Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro Mercado Pago:', error);
      return Response.json({ error: 'Erro ao criar pagamento' }, { status: 500 });
    }

    const data = await response.json();

    return Response.json({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    });
  } catch (error) {
    console.error('Erro ao criar pagamento de teste:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
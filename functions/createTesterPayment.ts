import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('MERCADOPAGO_ACCESS_TOKEN não configurado');
      return Response.json({ error: 'Access Token do Mercado Pago não configurado' }, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    const publicUrl = Deno.env.get('PUBLIC_URL') || 'https://seusite.com';

    // Criar preferência usando fetch direto (mais estável no Base44)
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: 'tester',
            description: 'Pagamento de teste',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: 1,
          },
        ],
        back_urls: {
          success: `${publicUrl}/payment-success?status=success`,
          failure: `${publicUrl}/payment-success?status=error`,
          pending: `${publicUrl}/payment-success?status=pending`,
        },
        auto_return: 'approved',
        payer: {
          email: user.email,
          name: user.full_name
        },
        metadata: {
          user_id: user.id,
          user_email: user.email,
          type: 'tester'
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro Mercado Pago:', data);
      return Response.json({ error: 'Erro na API do Mercado Pago', details: data }, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    return Response.json({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point
    }, { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return Response.json({ 
      error: 'Erro ao criar pagamento teste',
      details: error.message 
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { MercadoPagoConfig, Preference } from 'npm:mercadopago@2.0.15';

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
      return Response.json({ error: 'Mercado Pago não configurado' }, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Configurar cliente do Mercado Pago
    const client = new MercadoPagoConfig({ 
      accessToken,
      options: { timeout: 5000 }
    });
    const preference = new Preference(client);

    // Criar preferência de pagamento
    const preferenceData = {
      items: [
        {
          title: "tester",
          description: "Pagamento de teste",
          quantity: 1,
          currency_id: "BRL",
          unit_price: 1.0,
        },
      ],
      back_urls: {
        success: `${Deno.env.get('PUBLIC_URL')}/payment-success?status=success`,
        failure: `${Deno.env.get('PUBLIC_URL')}/payment-success?status=error`,
        pending: `${Deno.env.get('PUBLIC_URL')}/payment-success?status=pending`,
      },
      auto_return: "approved",
      payer: {
        email: user.email,
        name: user.full_name
      },
      metadata: {
        user_id: user.id,
        user_email: user.email,
        type: "tester"
      }
    };

    const response = await preference.create({ body: preferenceData });

    return Response.json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point
    }, { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error("Erro ao criar pagamento teste:", error);
    return Response.json({ 
      error: "Erro ao criar pagamento",
      details: error.message 
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
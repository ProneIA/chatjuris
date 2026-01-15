import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { userEmail, userName } = await req.json();
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Token não configurado' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const preferenceData = {
      items: [{
        title: 'Plano Starter - Juris',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: 9.90
      }],
      payer: {
        email: userEmail,
        name: userName
      },
      back_urls: {
        success: `${Deno.env.get('PUBLIC_URL')}/payment-success?status=success&plan=starter`,
        failure: `${Deno.env.get('PUBLIC_URL')}/payment-success?status=error`,
        pending: `${Deno.env.get('PUBLIC_URL')}/payment-success?status=pending`
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('PUBLIC_URL')}/api/mercadopagoWebhook`,
      external_reference: `starter_${user.id}_${Date.now()}`
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro MP:', data);
      return new Response(
        JSON.stringify({ error: 'Erro do Mercado Pago', details: data }),
        { status: response.status, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        init_point: data.sandbox_init_point || data.init_point
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Erro:', error.message);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno', 
        message: error.message
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
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
    console.log('🚀 Iniciando createTesterPayment...');
    
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      console.error('❌ Token não encontrado');
      return new Response(
        JSON.stringify({ error: 'Token não configurado' }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ Token encontrado:', accessToken.substring(0, 15) + '...');

    const preferenceData = {
      items: [{
        title: 'Teste Mercado Pago',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: 1.00
      }],
      back_urls: {
        success: 'https://seusite.com/sucesso',
        failure: 'https://seusite.com/erro',
        pending: 'https://seusite.com/pendente'
      },
      auto_return: 'approved'
    };

    console.log('📤 Enviando para MP:', JSON.stringify(preferenceData, null, 2));

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    console.log('📥 Status MP:', response.status);
    
    const responseText = await response.text();
    console.log('📥 Resposta bruta:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Erro ao parsear JSON:', e);
      return new Response(
        JSON.stringify({ error: 'Resposta inválida do MP', raw: responseText }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!response.ok) {
      console.error('❌ MP retornou erro:', data);
      return new Response(
        JSON.stringify({ error: 'Erro do Mercado Pago', details: data }),
        { status: response.status, headers: corsHeaders }
      );
    }

    console.log('✅ Sucesso! init_point:', data.init_point);
    console.log('✅ sandbox_init_point:', data.sandbox_init_point);

    return new Response(
      JSON.stringify({
        init_point: data.sandbox_init_point || data.init_point
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('💥 Erro fatal:', error.message);
    console.error('Stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno', 
        message: error.message,
        type: error.constructor.name
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
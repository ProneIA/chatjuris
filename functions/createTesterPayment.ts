Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    
    console.log('🔍 DEBUG - Token existe?', accessToken ? 'SIM' : 'NÃO');
    console.log('🔍 DEBUG - Token (primeiros 20 chars):', accessToken?.substring(0, 20));

    if (!accessToken) {
      console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado no ambiente');
      return new Response(
        JSON.stringify({ 
          error: 'Token do Mercado Pago não encontrado',
          hint: 'Configure MERCADOPAGO_ACCESS_TOKEN nas Environment Variables'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📤 Fazendo requisição para Mercado Pago...');

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: 'tester',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: 1,
          },
        ],
      }),
    });

    const data = await mpResponse.json();

    console.log('📥 Resposta Mercado Pago - Status:', mpResponse.status);
    console.log('📥 Resposta Mercado Pago - Data:', data);

    if (!mpResponse.ok) {
      console.error('❌ Erro na API do Mercado Pago:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Erro na API do Mercado Pago', 
          status: mpResponse.status,
          details: data 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Pagamento criado com sucesso!');

    return new Response(
      JSON.stringify({
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
        id: data.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Erro interno:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao criar pagamento teste',
        message: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
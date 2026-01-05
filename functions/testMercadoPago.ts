import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      return Response.json({ 
        error: 'Mercado Pago access token não configurado' 
      }, { status: 500 });
    }

    // Testar a conexão com a API do Mercado Pago
    // Buscar informações da conta
    const response = await fetch('https://api.mercadopago.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return Response.json({ 
        success: false,
        error: 'Erro ao conectar com Mercado Pago',
        details: errorData
      }, { status: response.status });
    }

    const userData = await response.json();

    // Buscar métodos de pagamento disponíveis
    const paymentMethodsResponse = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const paymentMethods = await paymentMethodsResponse.json();

    return Response.json({
      success: true,
      message: 'Conexão com Mercado Pago estabelecida com sucesso!',
      account: {
        id: userData.id,
        nickname: userData.nickname,
        email: userData.email,
        country: userData.country_id,
        site: userData.site_id
      },
      payment_methods_count: paymentMethods.length,
      available_payment_types: [...new Set(paymentMethods.map(pm => pm.payment_type_id))]
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
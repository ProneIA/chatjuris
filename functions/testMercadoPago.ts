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
    // Buscar métodos de pagamento disponíveis (endpoint público que sempre funciona)
    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
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
        status: response.status,
        details: errorData
      }, { status: response.status });
    }

    const paymentMethods = await response.json();

    // Testar criação de preferência de pagamento (sem salvar)
    const testPreference = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{
          title: 'Teste API',
          quantity: 1,
          unit_price: 1.00
        }],
        back_urls: {
          success: 'https://test.com',
          failure: 'https://test.com',
          pending: 'https://test.com'
        },
        auto_return: 'approved'
      })
    });

    const canCreatePreference = testPreference.ok;

    return Response.json({
      success: true,
      message: 'API do Mercado Pago funcionando corretamente! ✅',
      token_valid: true,
      payment_methods_available: paymentMethods.length,
      can_create_payments: canCreatePreference,
      payment_types: [...new Set(paymentMethods.map(pm => pm.payment_type_id))],
      credit_card_brands: paymentMethods
        .filter(pm => pm.payment_type_id === 'credit_card')
        .map(pm => pm.name)
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
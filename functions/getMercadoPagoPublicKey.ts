import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const base44 = createClientFromRequest(req);
    await base44.auth.me();

    // Retornar a chave pública do Mercado Pago
    // A chave pública pode ser derivada do access token ou configurada separadamente
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      return Response.json({ 
        error: 'Mercado Pago não configurado' 
      }, { status: 500, headers });
    }

    // Buscar informações da conta para obter a public key
    const response = await fetch('https://api.mercadopago.com/v1/account/credentials', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return Response.json({ 
        error: 'Erro ao buscar credenciais' 
      }, { status: response.status, headers });
    }

    const credentials = await response.json();
    
    // A public key geralmente está em credentials.public_key
    // Se não estiver disponível, precisamos usar uma public key pré-configurada
    const publicKey = credentials.public_key || Deno.env.get('MERCADOPAGO_PUBLIC_KEY');

    return Response.json({
      success: true,
      publicKey
    }, { headers });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500, headers });
  }
});
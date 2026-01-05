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

    // Buscar Public Key diretamente da variável de ambiente
    const publicKey = Deno.env.get('MP_PUBLIC_KEY');
    
    if (!publicKey) {
      return Response.json({ 
        error: 'MP_PUBLIC_KEY não configurada. Configure nas variáveis de ambiente.',
        success: false
      }, { status: 500, headers });
    }

    console.log('Public key retornada:', publicKey.substring(0, 20) + '...');
    
    return Response.json({
      success: true,
      publicKey
    }, { headers });

  } catch (error) {
    console.error('Erro ao buscar public key:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500, headers });
  }
});
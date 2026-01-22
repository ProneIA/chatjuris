import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publicKey = Deno.env.get('MP_PUBLIC_KEY');
    
    if (!publicKey) {
      return Response.json({ error: 'Chave pública não configurada' }, { status: 500 });
    }

    return Response.json({ publicKey });
  } catch (error) {
    console.error('Erro ao buscar chaves:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
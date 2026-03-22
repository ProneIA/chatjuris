import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    // Buscar todos os usuários e assinaturas com privilégios de service role
    const [users, subscriptions] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Subscription.list()
    ]);

    return Response.json({ 
      success: true,
      users,
      subscriptions 
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});
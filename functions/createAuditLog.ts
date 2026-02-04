import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, entity_type, entity_id, target_user_id, details } = body;

    if (!action) {
      return Response.json({ error: 'action é obrigatório' }, { status: 400 });
    }

    // Capturar IP do cliente
    const clientIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-real-ip') ||
                     'unknown';

    // Criar log com service role para garantir que sempre funciona
    const log = await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      action,
      entity_type: entity_type || null,
      entity_id: entity_id || null,
      target_user_id: target_user_id || null,
      ip_address: clientIp,
      details: JSON.stringify({
        timestamp: new Date().toISOString(),
        user_name: user.full_name,
        ...details
      })
    });

    return Response.json({ success: true, log_id: log.id });
  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
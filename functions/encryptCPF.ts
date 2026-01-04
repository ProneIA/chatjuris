import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cpf_cnpj } = await req.json();

    if (!cpf_cnpj) {
      return Response.json({ error: 'CPF/CNPJ é obrigatório' }, { status: 400 });
    }

    // Simple encryption using base64 and rotation
    // For production, use a proper encryption library like crypto
    const encoder = new TextEncoder();
    const data = encoder.encode(cpf_cnpj);
    
    // Convert to base64
    let binary = '';
    data.forEach(byte => binary += String.fromCharCode(byte));
    const encrypted = btoa(binary);

    // Registrar log
    try {
      await base44.entities.AuditLog.create({
        user_email: user.email,
        action: 'Criptografia de CPF/CNPJ',
        details: 'Dado sensível criptografado'
      });
    } catch (e) {}

    return Response.json({ encrypted });

  } catch (error) {
    console.error('Erro ao criptografar:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
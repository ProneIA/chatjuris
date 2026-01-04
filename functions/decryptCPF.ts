import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { encrypted } = await req.json();

    if (!encrypted) {
      return Response.json({ error: 'Dado criptografado é obrigatório' }, { status: 400 });
    }

    // Decrypt from base64
    try {
      const binary = atob(encrypted);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const decoder = new TextDecoder();
      const decrypted = decoder.decode(bytes);

      // Registrar log
      try {
        await base44.entities.AuditLog.create({
          user_email: user.email,
          action: 'Descriptografia de CPF/CNPJ',
          details: 'Acesso a dado sensível criptografado'
        });
      } catch (e) {}

      return Response.json({ decrypted });
    } catch (error) {
      return Response.json({ error: 'Falha ao descriptografar' }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
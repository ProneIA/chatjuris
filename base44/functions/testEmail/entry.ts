import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_ORIGINS = ['https://chatjuris.com', 'https://www.chatjuris.com'];

function getCorsHeaders(req) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

Deno.serve(async (req) => {
  const headers = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Apenas administradores podem usar esta função' }, { status: 403, headers });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Juris - Assistente Jurídico',
      to: user.email,
      subject: '✅ Email de Teste - Sistema Juris',
      body: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif;">
          <h2>Email de Teste</h2>
          <p>Olá <strong>${user.full_name || user.email}</strong>,</p>
          <p>Este é um email de teste do sistema de notificações do Juris.</p>
          <p>✅ O sistema está funcionando corretamente!</p>
          <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
          <p>© 2026 Juris - Assistente Jurídico Inteligente</p>
        </body>
        </html>
      `
    });

    return Response.json({
      success: true,
      message: `Email enviado com sucesso para ${user.email}!`
    }, { headers });

  } catch (error) {
    console.error('[testEmail] Erro:', error);
    return Response.json({ error: 'Erro interno. Tente novamente.' }, { status: 500, headers });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const base44 = createClientFromRequest(req);

    console.log('Iniciando envio de email de teste...');

    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Juris',
      to: 'ld.andrade@outlook.com',
      subject: '✅ Email de Teste - Juris',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚖️ Juris</h1>
              <p>Assistente Jurídico Inteligente</p>
            </div>
            <div class="content">
              <div class="success-icon">✉️</div>
              <h2>Email de Teste</h2>
              <p>Olá,</p>
              <p>Este é um email de teste do sistema de notificações do Juris.</p>
              <p>O sistema está funcionando corretamente! ✅</p>
              <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
              <p>Todos os templates de email estão configurados e prontos para enviar notificações automáticas aos clientes.</p>
            </div>
            <div class="footer">
              <p>© 2026 Juris - Assistente Jurídico Inteligente</p>
              <p>Este é um email de teste enviado em ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('Email de teste enviado com sucesso!', result);

    return Response.json({ 
      success: true, 
      message: 'Email enviado para ld.andrade@outlook.com',
      timestamp: new Date().toISOString()
    }, { headers });
  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
    return Response.json({ error: error.message }, { status: 500, headers });
  }
});
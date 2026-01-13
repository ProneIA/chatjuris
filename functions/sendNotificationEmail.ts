import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const EMAIL_TEMPLATES = {
  payment_confirmed: (userName, planName, amount) => ({
    subject: '✅ Pagamento Confirmado - Juris',
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
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
          .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚖️ Juris</h1>
            <p>Assistente Jurídico Inteligente</p>
          </div>
          <div class="content">
            <div class="success-icon">🎉</div>
            <h2>Pagamento Confirmado!</h2>
            <p>Olá <strong>${userName}</strong>,</p>
            <p>Seu pagamento foi aprovado com sucesso! Sua assinatura já está ativa.</p>
            
            <div class="details">
              <p><strong>Plano:</strong> ${planName}</p>
              <p><strong>Valor:</strong> R$ ${amount}</p>
              <p><strong>Status:</strong> ✅ Ativo</p>
            </div>
            
            <p>Todas as funcionalidades premium já estão disponíveis:</p>
            <ul>
              <li>✓ IA Jurídica Ilimitada</li>
              <li>✓ Gerador de Documentos</li>
              <li>✓ Análise de Jurisprudência</li>
              <li>✓ Suporte Prioritário</li>
            </ul>
            
            <center>
              <a href="${Deno.env.get('PUBLIC_URL') || 'https://app.base44.com'}" class="button">Acessar Juris Pro</a>
            </center>
            
            <p>Obrigado por confiar no Juris!</p>
          </div>
          <div class="footer">
            <p>© 2026 Juris - Assistente Jurídico Inteligente</p>
            <p>Este é um email automático, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  welcome: (userName, planName) => ({
    subject: '🎉 Bem-vindo ao Juris Pro!',
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
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .feature-box { background: #f9f9f9; padding: 15px; border-left: 4px solid #667eea; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚖️ Bem-vindo ao Juris Pro!</h1>
          </div>
          <div class="content">
            <h2>Olá ${userName}! 👋</h2>
            <p>É um prazer ter você conosco. Sua assinatura <strong>${planName}</strong> está ativa e pronta para uso!</p>
            
            <h3>🚀 Próximos Passos:</h3>
            
            <div class="feature-box">
              <strong>1. Explore a IA Jurídica</strong><br>
              Faça perguntas complexas e receba respostas fundamentadas em legislação e jurisprudência.
            </div>
            
            <div class="feature-box">
              <strong>2. Gere Documentos Profissionais</strong><br>
              Crie petições, contratos e pareceres em minutos com IA especializada.
            </div>
            
            <div class="feature-box">
              <strong>3. Organize seus Processos</strong><br>
              Gerencie casos, clientes e prazos em um só lugar.
            </div>
            
            <div class="feature-box">
              <strong>4. Pesquise Jurisprudência</strong><br>
              Encontre precedentes relevantes com busca inteligente.
            </div>
            
            <center>
              <a href="${Deno.env.get('PUBLIC_URL') || 'https://app.base44.com'}" class="button">Começar Agora</a>
            </center>
            
            <p><strong>Precisa de ajuda?</strong><br>
            Nossa equipe está disponível para te auxiliar. Basta entrar em contato!</p>
          </div>
          <div class="footer">
            <p>© 2026 Juris - Assistente Jurídico Inteligente</p>
            <p>Este é um email automático, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  subscription_activated: (userName, planName, nextBillingDate) => ({
    subject: '✅ Assinatura Ativada - Juris',
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
          .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚖️ Juris</h1>
          </div>
          <div class="content">
            <h2>Assinatura Ativada! 🎉</h2>
            <p>Olá <strong>${userName}</strong>,</p>
            <p>Sua assinatura foi ativada com sucesso!</p>
            
            <div class="details">
              <p><strong>Plano:</strong> ${planName}</p>
              <p><strong>Status:</strong> ✅ Ativo</p>
              ${nextBillingDate ? `<p><strong>Próximo vencimento:</strong> ${nextBillingDate}</p>` : ''}
            </div>
            
            <p>Aproveite todos os recursos do Juris Pro sem limites!</p>
          </div>
          <div class="footer">
            <p>© 2026 Juris - Assistente Jurídico Inteligente</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  payment_reminder: (userName, planName, amount, dueDate, daysUntilDue) => ({
    subject: `⏰ Lembrete: Vencimento em ${daysUntilDue} dias - Juris`,
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
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚖️ Juris</h1>
          </div>
          <div class="content">
            <h2>Lembrete de Vencimento ⏰</h2>
            <p>Olá <strong>${userName}</strong>,</p>
            
            <div class="warning-box">
              <p><strong>Sua assinatura vence em ${daysUntilDue} dias!</strong></p>
            </div>
            
            <p>Para continuar aproveitando todos os recursos do Juris Pro, certifique-se de que seu pagamento está em dia.</p>
            
            <div class="details">
              <p><strong>Plano:</strong> ${planName}</p>
              <p><strong>Valor:</strong> R$ ${amount}</p>
              <p><strong>Vencimento:</strong> ${dueDate}</p>
            </div>
            
            <p>O pagamento será processado automaticamente no método cadastrado.</p>
            
            <center>
              <a href="${Deno.env.get('PUBLIC_URL') || 'https://app.base44.com'}/settings" class="button">Gerenciar Assinatura</a>
            </center>
          </div>
          <div class="footer">
            <p>© 2026 Juris - Assistente Jurídico Inteligente</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

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
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const { templateType, data } = await req.json();

    if (!EMAIL_TEMPLATES[templateType]) {
      return Response.json({ error: 'Template not found' }, { status: 400, headers });
    }

    const template = EMAIL_TEMPLATES[templateType](...Object.values(data));

    console.log(`Enviando email ${templateType} para ${data.userEmail || user.email}`);

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Juris',
      to: data.userEmail || user.email,
      subject: template.subject,
      body: template.body
    });

    console.log('Email enviado com sucesso');

    return Response.json({ success: true }, { headers });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return Response.json({ error: error.message }, { status: 500, headers });
  }
});
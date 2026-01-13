import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { type, userEmail, userName, data } = await req.json();

    let subject = '';
    let body = '';

    switch (type) {
      case 'payment_approved':
        subject = '✅ Pagamento Aprovado - Juris Pro Ativado!';
        body = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Pagamento Confirmado!</h1>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">Olá <strong>${userName}</strong>,</p>
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                Seu pagamento foi processado com sucesso! 🚀<br><br>
                Sua assinatura <strong>${data?.planName || 'Juris Pro'}</strong> já está ativa e todas as funcionalidades estão disponíveis para você.
              </p>
              <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">✓ Recursos Ativados:</h3>
                <ul style="color: #047857; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>IA Jurídica Ilimitada</li>
                  <li>Geração de Documentos</li>
                  <li>Análise de Processos</li>
                  <li>Pesquisa de Jurisprudência</li>
                  <li>Suporte Prioritário</li>
                </ul>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get('PUBLIC_URL') || 'https://app.juris.com'}" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Acessar o Sistema
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Valor: <strong>R$ ${data?.amount ? data.amount.toFixed(2).replace('.', ',') : '---'}</strong><br>
                Data: <strong>${new Date().toLocaleDateString('pt-BR')}</strong>
              </p>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Juris - Inteligência Jurídica</p>
              <p>Este é um email automático, não responda.</p>
            </div>
          </div>
        `;
        break;

      case 'welcome':
        subject = '🎊 Bem-vindo ao Juris Pro!';
        body = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Bem-vindo ao Juris! 🚀</h1>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">Olá <strong>${userName}</strong>,</p>
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                Estamos muito felizes em tê-lo conosco! 🎉<br><br>
                Você agora tem acesso à plataforma mais completa de inteligência jurídica com IA.
              </p>
              <div style="background: #eff6ff; padding: 25px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">🌟 Primeiros Passos:</h3>
                <ol style="color: #1e3a8a; margin: 0; padding-left: 20px; line-height: 2;">
                  <li>Conheça o Assistente IA jurídico</li>
                  <li>Gere seu primeiro documento legal</li>
                  <li>Explore os templates disponíveis</li>
                  <li>Configure suas preferências</li>
                </ol>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get('PUBLIC_URL') || 'https://app.juris.com'}" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Começar Agora
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px; text-align: center;">
                Precisa de ajuda? Entre em contato com nosso suporte prioritário.
              </p>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Juris - Inteligência Jurídica</p>
            </div>
          </div>
        `;
        break;

      case 'payment_reminder':
        subject = '⏰ Lembrete: Vencimento da sua assinatura Juris';
        body = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Lembrete de Pagamento</h1>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">Olá <strong>${userName}</strong>,</p>
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                Sua assinatura <strong>${data?.planName || 'Juris Pro'}</strong> vence em <strong>${data?.daysUntilExpiry || '3'} dias</strong>.
              </p>
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Data de vencimento:</strong> ${data?.nextBillingDate || 'Em breve'}<br>
                  <strong>Valor:</strong> R$ ${data?.amount ? data.amount.toFixed(2).replace('.', ',') : '---'}
                </p>
              </div>
              <p style="font-size: 14px; color: #6b7280;">
                Não se preocupe! Seu pagamento será processado automaticamente no método cadastrado.
              </p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get('PUBLIC_URL') || 'https://app.juris.com'}/settings" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Verificar Assinatura
                </a>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Juris - Inteligência Jurídica</p>
            </div>
          </div>
        `;
        break;

      case 'subscription_activated':
        subject = '🎯 Assinatura Ativada com Sucesso!';
        body = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ Assinatura Ativada!</h1>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">Olá <strong>${userName}</strong>,</p>
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                Sua assinatura <strong>${data?.planName || 'Juris Pro'}</strong> foi ativada com sucesso! 🎊
              </p>
              <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="color: #065f46; margin: 0; font-size: 14px; font-weight: bold;">
                  Agora você tem acesso completo a todas as funcionalidades premium!
                </p>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get('PUBLIC_URL') || 'https://app.juris.com'}" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Explorar Funcionalidades
                </a>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Juris - Inteligência Jurídica</p>
            </div>
          </div>
        `;
        break;

      default:
        return Response.json({ error: 'Tipo de notificação inválido' }, { status: 400, headers });
    }

    // Enviar email usando Core.SendEmail
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Juris',
      to: userEmail,
      subject: subject,
      body: body
    });

    return Response.json({ success: true }, { headers });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return Response.json({ error: error.message }, { status: 500, headers });
  }
});
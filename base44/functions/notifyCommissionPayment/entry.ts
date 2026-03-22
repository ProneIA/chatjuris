import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { affiliate_email, affiliate_name, commission_amount, payment_date } = await req.json();

    // Enviar email para o afiliado
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: affiliate_email,
      subject: '💰 Comissão Paga - Juris',
      body: `
Olá ${affiliate_name}!

Sua comissão foi paga com sucesso! 🎉

Detalhes do Pagamento:
• Valor: R$ ${commission_amount.toFixed(2)}
• Data: ${payment_date}

O pagamento foi enviado para sua chave PIX cadastrada.

Continue indicando o Juris e aumente seus ganhos!

Atenciosamente,
Equipe Juris
      `
    });

    // Enviar email para o admin
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: '✅ Confirmação de Pagamento de Comissão - Juris',
      body: `
Pagamento de comissão confirmado:

Afiliado: ${affiliate_name}
Email: ${affiliate_email}
Valor: R$ ${commission_amount.toFixed(2)}
Data: ${payment_date}

O afiliado foi notificado automaticamente.
      `
    });

    return Response.json({ 
      success: true, 
      message: 'Notificações enviadas com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao notificar pagamento:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
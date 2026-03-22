import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Apenas admin pode criar afiliados
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, user_email, phone, pix_key, commission_rate, notes, affiliate_code } = body;

    // Ativação automática baseada em critérios
    let status = 'pending';
    if (commission_rate >= 20) {
      status = 'active';
    }

    // Criar o afiliado
    const affiliate = await base44.asServiceRole.entities.Affiliate.create({
      name,
      user_email,
      phone,
      pix_key,
      commission_rate,
      notes,
      affiliate_code,
      status,
      total_sales: 0,
      total_commission: 0,
      total_paid: 0
    });

    // Atualizar o usuário para marcar como afiliado
    const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
    if (users.length > 0) {
      await base44.asServiceRole.entities.User.update(users[0].id, {
        is_affiliate: true,
        affiliate_id: affiliate.id
      });
    }

    // Enviar notificação de boas-vindas
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user_email,
      subject: status === 'active' ? '🎉 Bem-vindo ao Programa de Afiliados Juris!' : '⏳ Sua Solicitação de Afiliado Foi Recebida',
      body: status === 'active' ? `
Olá ${name}!

Parabéns! Você foi aprovado automaticamente como afiliado do Juris! 🎉

Seus Dados:
• Código de Afiliado: ${affiliate_code}
• Taxa de Comissão: ${commission_rate}%
• Status: ATIVO ✅

Seu link de indicação:
${Deno.env.get('PUBLIC_URL')}/Pricing?ref=${affiliate_code}

Comece a compartilhar e ganhar comissões agora mesmo!

Atenciosamente,
Equipe Juris
      ` : `
Olá ${name}!

Sua solicitação para se tornar afiliado foi recebida e está em análise.

Seus Dados:
• Código de Afiliado: ${affiliate_code}
• Taxa de Comissão: ${commission_rate}%
• Status: PENDENTE APROVAÇÃO ⏳

Você receberá um email assim que sua conta for aprovada.

Atenciosamente,
Equipe Juris
      `
    });

    return Response.json({ success: true, affiliate, auto_approved: status === 'active' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
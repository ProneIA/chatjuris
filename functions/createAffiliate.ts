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

    // Criar o afiliado
    const affiliate = await base44.asServiceRole.entities.Affiliate.create({
      name,
      user_email,
      phone,
      pix_key,
      commission_rate,
      notes,
      affiliate_code,
      status: 'active',
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

    return Response.json({ success: true, affiliate });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
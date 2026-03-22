import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Função auxiliar para processar comissão de afiliado
 * Deve ser chamada quando um pagamento for aprovado
 */
export async function processAffiliateCommission(base44, subscriptionId, affiliateCode, subscriptionValue, customerEmail) {
  if (!affiliateCode) {
    console.log('Nenhum código de afiliado fornecido');
    return null;
  }

  try {
    // Buscar o afiliado pelo código
    const affiliates = await base44.asServiceRole.entities.Affiliate.filter({ 
      affiliate_code: affiliateCode,
      status: 'active'
    });

    if (affiliates.length === 0) {
      console.log('Afiliado não encontrado ou não está ativo:', affiliateCode);
      return null;
    }

    const affiliate = affiliates[0];
    const commissionAmount = (subscriptionValue * affiliate.commission_rate) / 100;

    // Criar registro de comissão
    const commission = await base44.asServiceRole.entities.AffiliateCommission.create({
      affiliate_id: affiliate.id,
      affiliate_code: affiliateCode,
      subscription_id: subscriptionId,
      customer_email: customerEmail,
      subscription_value: subscriptionValue,
      commission_rate: affiliate.commission_rate,
      commission_amount: commissionAmount,
      status: 'pending'
    });

    // Atualizar totais do afiliado
    await base44.asServiceRole.entities.Affiliate.update(affiliate.id, {
      total_sales: (affiliate.total_sales || 0) + 1,
      total_commission: (affiliate.total_commission || 0) + commissionAmount
    });

    console.log('Comissão criada com sucesso:', commission.id);
    return { affiliate, commission };
  } catch (error) {
    console.error('Erro ao processar comissão:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { subscriptionId, affiliateCode, subscriptionValue, customerEmail } = await req.json();

    const result = await processAffiliateCommission(
      base44,
      subscriptionId,
      affiliateCode,
      subscriptionValue,
      customerEmail
    );

    return Response.json({ 
      success: !!result,
      commission: result?.commission,
      affiliate: result?.affiliate
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
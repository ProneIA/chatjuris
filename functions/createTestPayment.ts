/**
 * Cria uma preferência de pagamento de teste no Mercado Pago (R$ 2,00)
 * Retorna o link de pagamento (init_point)
 */
import { MercadoPagoConfig, Preference } from 'npm:mercadopago@2.0.15';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN') || Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) return Response.json({ error: 'MP_ACCESS_TOKEN não configurado' }, { status: 500 });

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const publicUrl = Deno.env.get('PUBLIC_URL') || '';

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'test_item_001',
            title: 'Teste de Pagamento - Juris',
            description: 'Pagamento de teste R$ 2,00',
            category_id: 'digital_goods',
            quantity: 1,
            unit_price: 2.00,
            currency_id: 'BRL'
          }
        ],
        payer: {
          email: user.email,
          first_name: user.full_name?.split(' ')[0] || 'Teste',
          last_name: user.full_name?.split(' ').slice(1).join(' ') || 'Usuario'
        },
        external_reference: user.id,
        statement_descriptor: 'JURIS IA TESTE',
        back_urls: {
          success: publicUrl ? `${publicUrl}/PaymentSuccess` : undefined,
          failure: publicUrl ? `${publicUrl}/Pricing` : undefined,
          pending: publicUrl ? `${publicUrl}/Pricing` : undefined,
        },
        auto_return: 'approved',
        notification_url: publicUrl?.startsWith('https')
          ? `${publicUrl}/api/functions/mercadoPagoWebhook`
          : undefined
      }
    });

    console.log('[createTestPayment] Preferência criada:', result.id);

    return Response.json({
      success: true,
      preference_id: result.id,
      init_point: result.init_point,           // link produção
      sandbox_init_point: result.sandbox_init_point // link sandbox/teste
    });

  } catch (error) {
    console.error('[createTestPayment] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
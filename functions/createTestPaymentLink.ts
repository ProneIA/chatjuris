/**
 * Cria uma preferência de pagamento de teste (R$ 2,00) no Mercado Pago
 * Retorna o link de checkout para testar a integração
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

    const publicUrl = Deno.env.get('PUBLIC_URL') || 'https://chatjuris.com';

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'test_item',
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
          last_name: user.full_name?.split(' ').slice(1).join(' ') || 'Juris'
        },
        external_reference: `TEST_${user.id}_${Date.now()}`,
        notification_url: `${publicUrl}/api/functions/mercadoPagoWebhook`,
        back_urls: {
          success: `${publicUrl}/PaymentSuccess?status=approved`,
          failure: `${publicUrl}/Pricing?status=failed`,
          pending: `${publicUrl}/Pricing?status=pending`
        },
        auto_return: 'approved',
        statement_descriptor: 'JURIS TESTE',
        metadata: {
          test: true,
          user_id: user.id,
          user_email: user.email
        }
      }
    });

    console.log('[createTestPaymentLink] Preferência criada:', result.id);

    return Response.json({
      success: true,
      preference_id: result.id,
      checkout_url: result.init_point,         // produção
      sandbox_url: result.sandbox_init_point,   // sandbox
      amount: 'R$ 2,00'
    });

  } catch (error) {
    console.error('[createTestPaymentLink] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
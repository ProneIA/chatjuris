/**
 * POST /api/functions/testCheckoutPro
 * Cria uma preferência de pagamento no Mercado Pago (Checkout Pro - PRODUÇÃO)
 * e retorna o init_point para redirecionar o comprador.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { MercadoPagoConfig, Preference } from 'npm:mercadopago@2.0.15';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'MP_ACCESS_TOKEN não configurado' }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preferenceApi = new Preference(client);

    const body = await req.json().catch(() => ({}));
    const buyerEmail = body.email || user.email;

    // Sanitizar nome/sobrenome
    const sanitize = (s) => (s || '').replace(/[<>"']/g, '').trim().slice(0, 100);
    const fullName = user.full_name || '';
    const firstName = sanitize(body.firstName || fullName.split(' ')[0] || 'Usuario');
    const lastName  = sanitize(body.lastName  || fullName.split(' ').slice(1).join(' ') || 'Teste');

    const preference = await preferenceApi.create({
      body: {
        items: [
          {
            title: 'Teste de Integração',
            quantity: 1,
            unit_price: 5.00,
            currency_id: 'BRL'
          }
        ],
        payer: {
          email: buyerEmail,
          name: firstName,      // nome para Checkout Pro
          surname: lastName     // sobrenome para Checkout Pro
        },
        back_urls: {
          success: `${Deno.env.get('PUBLIC_URL') || 'https://chatjuris.com'}/PaymentSuccess`,
          failure: `${Deno.env.get('PUBLIC_URL') || 'https://chatjuris.com'}/Pricing`,
          pending: `${Deno.env.get('PUBLIC_URL') || 'https://chatjuris.com'}/Pricing`
        },
        auto_return: 'approved',
        statement_descriptor: 'JURIS IA',
        external_reference: `test-${user.id}-${Date.now()}`
      }
    });

    console.log('[testCheckoutPro] Preferência criada:', preference.id);

    return Response.json({
      success: true,
      preference_id: preference.id,
      init_point: preference.init_point,        // link de PRODUÇÃO
      sandbox_init_point: preference.sandbox_init_point // link de teste (sandbox)
    });

  } catch (error) {
    console.error('[testCheckoutPro] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
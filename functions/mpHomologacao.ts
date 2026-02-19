/**
 * Endpoint de homologação Mercado Pago
 * Cria um pagamento Pix real com todos os headers corretos para
 * maximizar a pontuação de "Qualidade da Integração" no painel MP.
 *
 * Headers obrigatórios incluídos:
 *  - X-Idempotency-Key   → evita duplicidade (conta pontos na qualidade)
 *  - X-Platform-Id       → identifica a plataforma
 *  - User-Agent          → identifica o integrador
 *  - Content-Type        → application/json
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Apenas admins podem executar homologação' }, { status: 403 });

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN') || Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) return Response.json({ error: 'MP_ACCESS_TOKEN não configurado' }, { status: 500 });

    const publicUrl = Deno.env.get('PUBLIC_URL') || 'https://chatjuris.com';

    // Idempotency key único por requisição
    const idempotencyKey = crypto.randomUUID();

    // CPF fictício válido (formato correto)
    const cpfTeste = '19119119100';

    const payload = {
      transaction_amount: 2.00,
      description: 'Teste de Homologação API',
      payment_method_id: 'pix',
      payer: {
        email: 'teste_homologacao@juris.com.br',
        first_name: 'Juris',
        last_name: 'Homologacao',
        identification: {
          type: 'CPF',
          number: cpfTeste
        }
      },
      notification_url: `${publicUrl}/api/functions/mercadoPagoWebhook`,
      // Metadados que contam para qualidade da integração
      metadata: {
        integrator: 'juris-plataforma',
        test_type: 'homologacao',
        triggered_by: user.email
      },
      // Expiração em 30 minutos
      date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };

    console.log('[mpHomologacao] Criando pagamento Pix...', { idempotencyKey });

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
        'X-Platform-Id': 'juris-platform-v1',
        'User-Agent': 'Juris-Plataforma/1.0 (Node/Deno)',
        'X-Integrator-Id': 'juris-homologacao'
      },
      body: JSON.stringify(payload)
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      console.error('[mpHomologacao] Erro MP:', data);
      return Response.json({
        error: 'Erro na API do Mercado Pago',
        details: data
      }, { status: mpRes.status });
    }

    console.log(`[mpHomologacao] ✅ Payment ID: ${data.id} | Status: ${data.status}`);

    // Salvar no banco para auditoria
    await base44.asServiceRole.entities.Payment.create({
      user_id: user.id,
      user_email: user.email,
      mp_payment_id: String(data.id),
      plan_id: 'pro_monthly',
      payment_type: 'pix',
      amount: 2.00,
      status: data.status === 'pending' ? 'pending' : data.status,
      status_detail: data.status_detail,
      pix_qr_code: data.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      pix_qr_code_text: data.point_of_interaction?.transaction_data?.qr_code || null,
      pix_expiration: data.date_of_expiration || null,
      idempotency_key: idempotencyKey,
      raw_response: JSON.stringify(data)
    });

    return Response.json({
      success: true,
      payment_id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      idempotency_key: idempotencyKey,
      qr_code_text: data.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
      expiration: data.date_of_expiration,
      webhook_url: `${publicUrl}/api/functions/mercadoPagoWebhook`,
      instructions: [
        `1. Payment ID gerado: ${data.id}`,
        `2. Status: ${data.status} (esperado: pending)`,
        `3. Webhook configurado em: ${publicUrl}/api/functions/mercadoPagoWebhook`,
        `4. X-Idempotency-Key usada: ${idempotencyKey}`,
        `5. Para validar o webhook, aguarde a notificação do MP ou pague o Pix gerado`
      ]
    });

  } catch (error) {
    console.error('[mpHomologacao] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
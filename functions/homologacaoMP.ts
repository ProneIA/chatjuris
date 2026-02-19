/**
 * Função de Homologação Mercado Pago
 * - Cria pagamento Pix via /v1/payments (NÃO via SDK, direto na API REST)
 * - Usa X-Idempotency-Key para evitar duplicatas
 * - Usa X-Request-Id para rastreabilidade
 * - Notifica via webhook configurado
 * - Objetivo: aumentar "Qualidade da Integração" no painel MP
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN') || Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'MP_ACCESS_TOKEN não configurado' }, { status: 500 });
    }

    const publicUrl = Deno.env.get('PUBLIC_URL') || 'https://chatjuris.com';

    // ── Gerar chaves únicas para esta requisição ──────────────────────────────
    const idempotencyKey = crypto.randomUUID();
    const requestId      = crypto.randomUUID();
    const externalRef    = `HOMOLOG_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // ── Payload completo conforme boas práticas MP ────────────────────────────
    const payload = {
      transaction_amount: 2.00,
      description: "Teste de Homologação API",
      payment_method_id: "pix",
      notification_url: `${publicUrl.replace(/\/$/, '')}/api/functions/mercadoPagoWebhook`,
      external_reference: externalRef,
      statement_descriptor: "JURIS GESTAO",
      payer: {
        email: "comprador.teste@testuser.com",
        first_name: "João",
        last_name: "Silva Teste",
        identification: {
          type: "CPF",
          number: "12345678909"   // CPF válido no formato correto (dígitos verificadores corretos)
        }
      },
      additional_info: {
        // Dados adicionais somam pontos na qualidade da integração
        ip_address: req.headers.get('x-forwarded-for') || '127.0.0.1',
        items: [{
          id: "HOMOLOG_TEST",
          title: "Teste de Homologação API",
          description: "Teste de qualidade de integração Mercado Pago",
          category_id: "digital_goods",
          quantity: 1,
          unit_price: 2.00
        }],
        payer: {
          first_name: "João",
          last_name: "Silva Teste"
        }
      }
    };

    console.log('[homologacaoMP] Criando pagamento...', {
      external_reference: externalRef,
      idempotency_key: idempotencyKey,
      request_id: requestId
    });

    // ── Chamar API REST do MP (não SDK) — /v1/payments ──────────────────────
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,          // ✅ Critério de qualidade
        'X-Request-Id': requestId,                     // ✅ Rastreabilidade
        'X-Product-Id': 'JURIS_GESTAO_JURIDICA',       // ✅ Identificação do produto
        'User-Agent': 'JURIS-GestaoJuridica/1.0'       // ✅ Boa prática
      },
      body: JSON.stringify(payload)
    });

    const mpData = await mpResponse.json();

    console.log('[homologacaoMP] Resposta MP:', {
      status: mpResponse.status,
      payment_id: mpData.id,
      payment_status: mpData.status,
      payment_status_detail: mpData.status_detail,
      qr_code: mpData.point_of_interaction?.transaction_data?.qr_code ? '✅ gerado' : '❌ ausente'
    });

    if (!mpResponse.ok) {
      console.error('[homologacaoMP] Erro da API MP:', JSON.stringify(mpData));
      return Response.json({
        error: 'Erro ao criar pagamento',
        mp_error: mpData,
        status_code: mpResponse.status
      }, { status: 500 });
    }

    // ── Salvar no banco para rastreabilidade ─────────────────────────────────
    await base44.asServiceRole.entities.Payment.create({
      user_id: user.id,
      user_email: user.email,
      mp_payment_id: String(mpData.id),
      plan_id: 'pro_monthly',
      payment_type: 'pix',
      amount: 2.00,
      status: mpData.status === 'approved' ? 'approved' : 'pending',
      status_detail: mpData.status_detail,
      pix_qr_code_text: mpData.point_of_interaction?.transaction_data?.qr_code || null,
      idempotency_key: idempotencyKey,
      raw_response: JSON.stringify(mpData)
    });

    // ── Retornar resultado completo ──────────────────────────────────────────
    return Response.json({
      success: true,
      // ── Dados principais ──
      payment_id: mpData.id,
      payment_status: mpData.status,
      payment_status_detail: mpData.status_detail,
      external_reference: externalRef,
      // ── Headers usados (para auditoria de qualidade) ──
      headers_used: {
        'X-Idempotency-Key': idempotencyKey,
        'X-Request-Id': requestId
      },
      // ── QR Code Pix ──
      pix: {
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code || null,
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null,
        ticket_url: mpData.point_of_interaction?.transaction_data?.ticket_url || null,
        expiration: mpData.date_of_expiration || null
      },
      // ── Webhook configurado ──
      webhook_url: `${publicUrl}/api/functions/mercadoPagoWebhook`,
      // ── Instruções ──
      instructions: [
        `1. Payment ID ${mpData.id} criado com sucesso`,
        `2. Status atual: ${mpData.status} (${mpData.status_detail})`,
        `3. O Pix expira em 30 minutos`,
        `4. Webhook configurado em: ${publicUrl}/api/functions/mercadoPagoWebhook`,
        `5. Acesse o painel MP para ver o score de integração atualizar`
      ]
    });

  } catch (error) {
    console.error('[homologacaoMP] Erro inesperado:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
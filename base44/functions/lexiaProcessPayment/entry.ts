/**
 * lexiaProcessPayment — Processa pagamento via Mercado Pago API v1
 *
 * POST payload esperado do frontend:
 * {
 *   token:               string  — card token gerado pelo MP Brick
 *   installments:        number  — parcelas (1 p/ mensal, 1-12 p/ anual)
 *   payment_method_id:   string  — bandeira (visa, mastercard, elo, etc.)
 *   issuer_id:           string  — emissor do cartão
 *   transaction_amount:  number  — valor total em BRL
 *   description:         string  — nome do plano
 *   plan_id:             string  — id interno do plano
 *   payer: {
 *     email:       string
 *     first_name:  string
 *     last_name:   string
 *   }
 * }
 *
 * Para planos ANUAIS (installments > 1), inclui:
 *   payment_method_options.installments.type = "free_payer"
 *   (juros absorvidos pelo vendedor — configurar no MP dashboard)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    // 1. Autenticar usuário
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 2. Ler payload
    const body = await req.json();
    const {
      token,
      installments,
      payment_method_id,
      issuer_id,
      transaction_amount,
      description,
      plan_id,
      payer,
      device_id,
    } = body;

    // 3. Validações básicas
    if (!token || !transaction_amount || !payment_method_id) {
      return Response.json({ error: 'Dados de pagamento incompletos' }, { status: 400 });
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN') || Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'Credenciais do Mercado Pago não configuradas' }, { status: 500 });
    }

    const isAnnual = (plan_id || "").includes("yearly");

    // 4. Montar body do pagamento MP
    const publicUrl = Deno.env.get("PUBLIC_URL") || "";
    const notificationUrl = `${publicUrl}/api/functions/mercadoPagoWebhook`;

    const mpPayload = {
      token,
      installments: Number(installments) || 1,
      payment_method_id,
      issuer_id,
      transaction_amount: Number(transaction_amount),
      description: description || "Assinatura LexIA",
      notification_url: notificationUrl,
      // Device ID obrigatório pelo MP para antifraude
      ...(device_id && { additional_info: { ip_address: req.headers.get("x-forwarded-for") || "0.0.0.0" } }),
      ...(device_id && { device_id }),
      payer: {
        email: payer?.email || user.email,
        first_name: payer?.first_name || "",
        last_name: payer?.last_name || "",
        // Inclui CPF se o Brick capturou identificação
        ...(payer?.identification?.number && {
          identification: {
            type: payer.identification.type || "CPF",
            number: payer.identification.number,
          },
        }),
      },
      // PCI Compliance: não armazenar dados de cartão no MP
      binary_mode: true,
      // 3DS para maior segurança nas transações
      three_d_secure_mode: "optional",
      // Reduz contestações — aparece na fatura do cartão
      statement_descriptor: "JURIS PRO",
      metadata: {
        plan_id,
        user_id: user.id,
        user_email: user.email,
      },
      // Para planos anuais: juros absorvidos pelo vendedor (free_payer)
      ...(isAnnual && Number(installments) > 1 && {
        payment_method_options: {
          installments: {
            type: "free_payer",
          },
        },
      }),
    };

    // 5. Chamar API do Mercado Pago
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${user.id}-${plan_id}-${Date.now()}`,
        // Device fingerprint obrigatório pelo MP (antifraude)
        ...(device_id && { "X-meli-session-id": device_id }),
      },
      body: JSON.stringify(mpPayload),
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      console.error("MP API error:", JSON.stringify(mpData));
      return Response.json({
        status: "rejected",
        message: mpData?.message || "Erro ao processar pagamento",
        mp_error: mpData,
      }, { status: 400 });
    }

    const paymentStatus = mpData.status;
    // Tratar in_process/pending como sucesso temporário (ex: antifraude)
    const isApproved = paymentStatus === "approved" || paymentStatus === "in_process" || paymentStatus === "pending";

    // 6. Registrar pagamento no banco (assíncrono — não bloqueia resposta)
    if (isApproved) {
      try {
        await base44.asServiceRole.entities.Payment.create({
          user_id: user.id,
          user_email: user.email,
          mp_payment_id: String(mpData.id),
          plan_id: plan_id || "unknown",
          payment_type: "credit_card",
          amount: Number(transaction_amount),
          status: "approved",
          status_detail: mpData.status_detail,
          raw_response: JSON.stringify(mpData).slice(0, 4000),
        });
      } catch (saveErr) {
        console.warn("Aviso: falha ao salvar Payment entity:", saveErr.message);
      }

      // 7. Ativar assinatura do usuário
      try {
        await base44.functions.invoke("activateSubscription", {
          user_id: user.id,
          plan_id,
          payment_id: String(mpData.id),
          amount: Number(transaction_amount),
        });
      } catch (subErr) {
        console.warn("Aviso: falha ao ativar assinatura:", subErr.message);
      }
    }

    // 8. Retornar resultado ao frontend
    // Mapear status_detail para mensagens amigáveis
    const friendlyErrors = {
      "cc_rejected_bad_filled_card_number": "Número do cartão inválido.",
      "cc_rejected_bad_filled_date":        "Data de validade inválida.",
      "cc_rejected_bad_filled_security_code": "Código de segurança inválido.",
      "cc_rejected_insufficient_amount":    "Saldo insuficiente no cartão.",
      "cc_rejected_blacklist":              "Cartão não autorizado. Tente outro.",
      "cc_rejected_high_risk":              "Transação recusada por segurança. Tente outro cartão.",
      "cc_rejected_call_for_authorize":     "Entre em contato com o banco para autorizar a transação.",
    };
    const detail = mpData.status_detail || "";
    const humanMsg = friendlyErrors[detail] || "Pagamento não aprovado. Verifique os dados ou tente outro cartão.";

    return Response.json({
      status: isApproved ? "approved" : "rejected",
      id: mpData.id,
      status_detail: detail,
      message: isApproved ? "Pagamento aprovado com sucesso!" : humanMsg,
    });

  } catch (error) {
    console.error("lexiaProcessPayment error:", error);
    return Response.json({ error: error.message, status: "error" }, { status: 500 });
  }
});
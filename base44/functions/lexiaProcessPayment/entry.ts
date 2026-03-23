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
    const mpPayload = {
      token,
      installments: Number(installments) || 1,
      payment_method_id,
      issuer_id,
      transaction_amount: Number(transaction_amount),
      description: description || "Assinatura LexIA",
      payer: {
        email: payer?.email || user.email,
        first_name: payer?.first_name || "",
        last_name: payer?.last_name || "",
      },
      metadata: {
        plan_id,
        user_id: user.id,
        user_email: user.email,
      },
      // Para planos anuais: juros absorvidos pelo vendedor
      ...(isAnnual && installments > 1 && {
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
    const isApproved = paymentStatus === "approved";

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
    return Response.json({
      status: isApproved ? "approved" : paymentStatus,
      id: mpData.id,
      status_detail: mpData.status_detail,
      message: isApproved
        ? "Pagamento aprovado com sucesso!"
        : `Pagamento ${paymentStatus}: ${mpData.status_detail || "verifique os dados do cartão"}`,
    });

  } catch (error) {
    console.error("lexiaProcessPayment error:", error);
    return Response.json({ error: error.message, status: "error" }, { status: 500 });
  }
});
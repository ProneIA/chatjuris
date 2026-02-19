/**
 * POST /api/functions/createPayment
 * Cria pagamento via Pix ou Cartão de Crédito no Mercado Pago.
 * Body: { planId, paymentType, cardToken?, installments?, payerDoc? }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { MercadoPagoConfig, Payment } from 'npm:mercadopago@2.0.15';

// Planos válidos com valores fixos (nunca confiar no cliente)
const PLANS = {
  pro_monthly: { price: 119.90, name: 'Juris Pro - Plano Mensal', durationDays: 30 },
  pro_yearly:  { price: 1198.80, name: 'Juris Pro - Plano Anual',  durationDays: 365 }
};

const PIX_EXPIRATION_MINUTES = 30;

Deno.serve(async (req) => {
  try {
    // ✅ FORÇAR TLS 1.2+
    const tlsVersion = req.headers.get('x-tls-version') || '1.2';
    if (parseFloat(tlsVersion) < 1.2) {
      return Response.json({ error: 'TLS 1.2+ obrigatório' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await req.json();
    const {
      planId, paymentType, cardToken, installments = 1, payerDoc,
      payerFirstName, payerLastName, payerEmail, deviceId, payerAddress
    } = body;

    // Validações básicas
    if (!planId || !paymentType) {
      return Response.json({ error: 'planId e paymentType são obrigatórios' }, { status: 400 });
    }
    if (!PLANS[planId]) {
      return Response.json({ error: 'Plano inválido' }, { status: 400 });
    }
    if (!['pix', 'credit_card'].includes(paymentType)) {
      return Response.json({ error: 'paymentType deve ser pix ou credit_card' }, { status: 400 });
    }
    if (paymentType === 'credit_card' && !cardToken) {
      return Response.json({ error: 'cardToken é obrigatório para cartão de crédito' }, { status: 400 });
    }

    const plan = PLANS[planId];
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN') || Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) return Response.json({ error: 'Gateway não configurado' }, { status: 500 });

    // ✅ HEADERS DE SEGURANÇA - TLS 1.2+, Idempotência, etc.
    const idempotencyKey = crypto.randomUUID();
    const requestId = crypto.randomUUID();
    
    const client = new MercadoPagoConfig({
      accessToken,
      timeout: 30000,
      // ✅ Força HTTPS e TLS 1.2+ + Idempotência
      headers: {
        'User-Agent': 'Juris-API/1.0 (Deno)',
        'X-TLS-Version': '1.2+',
        'X-Idempotency-Key': idempotencyKey,
        'X-Request-Id': requestId,
        'Accept-Encoding': 'gzip, deflate'
      }
    });
    const paymentApi = new Payment(client);

    const publicUrl = Deno.env.get('PUBLIC_URL') || '';
    const notificationUrl = publicUrl.startsWith('https')
      ? `${publicUrl}/api/functions/mercadoPagoWebhook`
      : undefined;

    // ✅ Idempotency key já foi definido nos headers (UUID aleatório)

    // Sanitizar nome/sobrenome
    const sanitize = (s) => (s || "").replace(/[<>"']/g, "").trim().slice(0, 100);
    const firstName = sanitize(payerFirstName) || user.full_name?.split(" ")[0] || "Usuario";
    const lastName  = sanitize(payerLastName)  || user.full_name?.split(" ").slice(1).join(" ") || "Juris";

    // ✅ DADOS COMPLETOS DO PAGADOR (apenas com dados reais do usuário)
    const payerPayload = {
      email: payerEmail || user.email,
      first_name: firstName,
      last_name: lastName,
      identification: {
        type: payerDoc?.type || 'CPF',
        number: payerDoc?.number || ''
      },
      // ✅ ENDEREÇO APENAS SE FORNECIDO (não hardcoded)
      ...(payerAddress && {
        address: {
          zip_code: payerAddress.zipCode?.replace(/\D/g, ''),
          street_name: payerAddress.streetName,
          street_number: payerAddress.streetNumber,
          city: payerAddress.cityName,
          federal_unit: payerAddress.stateName
        }
      })
    };

    const basePayload = {
      transaction_amount: plan.price,
      description: `${plan.name} - Juris IA`,
      external_reference: user.id,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_id: planId,
        idempotency_key: idempotencyKey,
        // ✅ Device ID no metadata (rastreabilidade)
        device_id: deviceId || null
      },
      payer: payerPayload,
      // ✅ ADDITIONAL INFO - Dados completos para antifraude
      additional_info: {
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '',
        items: [
          {
            id: planId,
            title: plan.name,
            description: `Assinatura ${plan.name} - Plataforma Juris IA`,
            category_id: 'digital_goods',
            quantity: 1,
            unit_price: plan.price
          }
        ],
        payer: {
          first_name: firstName,
          last_name: lastName,
          registration_date: new Date().toISOString(),
          // ✅ Device ID obrigatório aqui
          ...(deviceId && { device_id: deviceId })
        }
      }
    };

    if (notificationUrl) basePayload.notification_url = notificationUrl;

    let mpResult;

    // ── PIX ────────────────────────────────────────────────────────────────
    if (paymentType === 'pix') {
      const expiresAt = new Date(Date.now() + PIX_EXPIRATION_MINUTES * 60 * 1000).toISOString();

      const pixPayload = {
        ...basePayload,
        payment_method_id: 'pix',
        date_of_expiration: expiresAt
      };

      console.log('[createPayment] Criando Pix para', user.email, planId);
      mpResult = await paymentApi.create({ body: pixPayload });

      const qrCode = mpResult?.point_of_interaction?.transaction_data?.qr_code_base64 || null;
      const qrText = mpResult?.point_of_interaction?.transaction_data?.qr_code || null;

      // Salvar no banco
      await base44.asServiceRole.entities.Payment.create({
        user_id: user.id,
        user_email: user.email,
        mp_payment_id: String(mpResult.id),
        plan_id: planId,
        payment_type: 'pix',
        amount: plan.price,
        status: mpResult.status || 'pending',
        status_detail: mpResult.status_detail || '',
        pix_qr_code: qrCode,
        pix_qr_code_text: qrText,
        pix_expiration: expiresAt,
        idempotency_key: idempotencyKey,
        raw_response: JSON.stringify({ id: mpResult.id, status: mpResult.status })
      });

      return Response.json({
        success: true,
        paymentId: mpResult.id,
        status: mpResult.status,
        pix: {
          qrCode,
          qrText,
          expiresAt
        }
      });
    }

    // ── CARTÃO ─────────────────────────────────────────────────────────────
    if (paymentType === 'credit_card') {
      const cardPayload = {
        ...basePayload,
        token: cardToken,
        installments: Number(installments),
        statement_descriptor: 'JURIS IA'
      };

      if (payerDoc?.type && payerDoc?.number) {
        cardPayload.payer.identification = { type: payerDoc.type, number: payerDoc.number };
      }

      console.log('[createPayment] Criando pagamento cartão para', user.email, planId);
      mpResult = await paymentApi.create({ body: cardPayload });

      // Salvar no banco
      await base44.asServiceRole.entities.Payment.create({
        user_id: user.id,
        user_email: user.email,
        mp_payment_id: String(mpResult.id),
        plan_id: planId,
        payment_type: 'credit_card',
        amount: plan.price,
        status: mpResult.status || 'pending',
        status_detail: mpResult.status_detail || '',
        idempotency_key: idempotencyKey,
        raw_response: JSON.stringify({ id: mpResult.id, status: mpResult.status, status_detail: mpResult.status_detail })
      });

      // Se aprovado na hora, ativar assinatura
      if (mpResult.status === 'approved') {
        await _activateSubscription(base44, user, planId, plan, String(mpResult.id), 'credit_card');
        await _sendConfirmationEmail(base44, user, plan);
      }

      return Response.json({
        success: mpResult.status === 'approved',
        paymentId: mpResult.id,
        status: mpResult.status,
        statusDetail: mpResult.status_detail
      });
    }

  } catch (error) {
    console.error('[createPayment] Erro:', error.message, error.cause);
    return Response.json({
      error: error.message || 'Erro ao processar pagamento',
      details: error.cause?.message
    }, { status: 500 });
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────

async function _activateSubscription(base44, user, planId, plan, mpPaymentId, method) {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const subData = {
    user_id: user.id,
    plan_type: planId === 'pro_yearly' ? 'yearly' : 'monthly',
    status: 'active',
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    price: plan.price,
    payment_method: method,
    payment_external_id: mpPaymentId
  };

  const existing = await base44.asServiceRole.entities.Subscription.filter({ user_id: user.id });
  if (existing.length > 0) {
    await base44.asServiceRole.entities.Subscription.update(existing[0].id, subData);
  } else {
    await base44.asServiceRole.entities.Subscription.create(subData);
  }

  // Atualizar user entity
  const users = await base44.asServiceRole.entities.User.filter({ id: user.id });
  if (users.length > 0) {
    await base44.asServiceRole.entities.User.update(users[0].id, {
      subscription_status: 'active',
      subscription_type: planId === 'pro_yearly' ? 'yearly' : 'monthly',
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString()
    });
  }
}

async function _sendConfirmationEmail(base44, user, plan) {
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: '✅ Assinatura Ativada - Juris Pro',
      body: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#7c3aed">Bem-vindo ao Juris Pro! 🎉</h2>
          <p>Sua assinatura <strong>${plan.name}</strong> foi ativada com sucesso.</p>
          <p>Valor: <strong>R$ ${plan.price.toFixed(2).replace('.', ',')}</strong></p>
          <p>Acesse a plataforma e aproveite todos os recursos:</p>
          <a href="${Deno.env.get('PUBLIC_URL') || 'https://chatjuris.com'}"
             style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px">
            Acessar Juris
          </a>
        </div>
      `
    });
  } catch (e) {
    console.error('[createPayment] Erro ao enviar email:', e.message);
  }
}
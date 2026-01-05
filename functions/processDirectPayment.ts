import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const MP_API_BASE = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const { planId, paymentMethod, formData, user } = await req.json();

    const plans = {
      pro_monthly: { name: "Pro Mensal", price: 119.90 },
      pro_yearly: { name: "Pro Anual", price: 1198.80 }
    };

    const plan = plans[planId];
    if (!plan) {
      return Response.json({ error: 'Plano inválido' }, { status: 400, headers });
    }

    // Criar pagamento direto
    const paymentData = {
      transaction_amount: plan.price,
      description: `Assinatura ${plan.name} - Juris`,
      payment_method_id: formData.payment_method_id,
      token: formData.token,
      installments: formData.installments || 1,
      payer: {
        email: user.email,
        identification: formData.payer?.identification
      },
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_id: planId
      }
    };

    const response = await fetch(`${MP_API_BASE}/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${user.id}-${planId}-${Date.now()}`
      },
      body: JSON.stringify(paymentData)
    });

    const paymentResult = await response.json();

    if (!response.ok) {
      return Response.json({
        success: false,
        error: paymentResult.message || 'Erro ao processar pagamento',
        details: paymentResult
      }, { status: response.status, headers });
    }

    // Criar ou atualizar subscription
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
      user_id: user.id 
    });

    const subscriptionData = {
      user_id: user.id,
      plan: planId.startsWith('pro') ? 'pro' : planId,
      status: paymentResult.status === 'approved' ? 'active' : 'pending',
      payment_status: paymentResult.status === 'approved' ? 'paid' : 'pending',
      payment_external_id: paymentResult.id?.toString(),
      payment_method: paymentMethod,
      price: plan.price,
      daily_actions_limit: paymentResult.status === 'approved' ? 999999 : 5,
      daily_actions_used: 0,
      last_reset_date: new Date().toISOString().split('T')[0],
      start_date: paymentResult.status === 'approved' ? new Date().toISOString().split('T')[0] : null,
      next_billing_date: paymentResult.status === 'approved' ? calculateNextBillingDate(planId) : null
    };

    if (subscriptions.length > 0) {
      await base44.asServiceRole.entities.Subscription.update(
        subscriptions[0].id, 
        subscriptionData
      );
    } else {
      await base44.asServiceRole.entities.Subscription.create(subscriptionData);
    }

    // Retornar resultado
    if (paymentResult.status === 'approved') {
      return Response.json({
        success: true,
        status: 'approved',
        payment_id: paymentResult.id
      }, { headers });
    } else if (paymentResult.status === 'pending' && paymentResult.payment_type_id === 'pix') {
      return Response.json({
        success: true,
        status: 'pending',
        payment_id: paymentResult.id,
        qr_code: paymentResult.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentResult.point_of_interaction?.transaction_data?.qr_code_base64
      }, { headers });
    } else {
      return Response.json({
        success: false,
        status: paymentResult.status,
        error: 'Pagamento não aprovado',
        details: paymentResult
      }, { headers });
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500, headers });
  }
});

function calculateNextBillingDate(planId) {
  const next = new Date();
  if (planId === 'pro_yearly') {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next.toISOString().split('T')[0];
}
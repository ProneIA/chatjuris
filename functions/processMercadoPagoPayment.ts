import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const MP_API_BASE = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const { formData, planId, userId } = await req.json();

    // Criar pagamento com os dados do formulário
    const paymentData = {
      transaction_amount: formData.transaction_amount,
      token: formData.token,
      description: formData.description,
      installments: formData.installments,
      payment_method_id: formData.payment_method_id,
      issuer_id: formData.issuer_id,
      payer: {
        email: formData.payer.email,
        identification: formData.payer.identification
      },
      metadata: {
        user_id: userId,
        user_email: user.email,
        plan_id: planId
      }
    };

    const paymentResponse = await fetch(`${MP_API_BASE}/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json();
      console.error('Erro ao processar pagamento:', errorData);
      return Response.json({ 
        success: false,
        error: 'Erro ao processar pagamento',
        details: errorData
      }, { status: 400, headers });
    }

    const payment = await paymentResponse.json();
    
    // Atualizar subscription com o resultado do pagamento
    const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ 
      user_id: userId 
    });

    const subscriptionData = {
      payment_external_id: payment.id.toString(),
      payment_status: payment.status === 'approved' ? 'paid' : 'pending',
      status: payment.status === 'approved' ? 'active' : 'pending',
      daily_actions_limit: payment.status === 'approved' ? 999999 : 5,
      start_date: payment.status === 'approved' ? new Date().toISOString().split('T')[0] : undefined
    };

    if (existingSubs.length > 0) {
      await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, subscriptionData);
    }

    return Response.json({ 
      success: payment.status === 'approved',
      payment_id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail
    }, { headers });

  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500, headers });
  }
});
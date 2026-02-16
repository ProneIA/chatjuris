import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { subscriber_code } = await req.json();

        if (!subscriber_code) {
            return Response.json({ error: 'subscriber_code é obrigatório' }, { status: 400 });
        }

        const tokenResponse = await base44.functions.invoke('hotmartGetAccessToken', {});
        
        if (!tokenResponse.data.success) {
            return Response.json({ error: 'Falha ao obter token' }, { status: 500 });
        }

        const accessToken = tokenResponse.data.access_token;
        const apiUrl = `https://developers.hotmart.com/payments/api/v1/subscriptions/${subscriber_code}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            return Response.json({ error: 'Assinatura não encontrada', details: errorData }, { status: response.status });
        }

        const data = await response.json();

        return Response.json({
            success: true,
            subscription: {
                subscriber_code: data.subscriber_code,
                status: data.status,
                plan_name: data.plan?.name,
                product_name: data.product?.name,
                start_date: data.date_subscription_start,
                end_date: data.date_subscription_end,
                cancellation_date: data.cancellation_date,
                payment_value: data.plan?.value / 100,
                currency: data.plan?.currency,
                recurrency_period: data.plan?.recurrency_period
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
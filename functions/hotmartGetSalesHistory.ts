import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { start_date, end_date, max_results = 50 } = await req.json();

        const tokenResponse = await base44.functions.invoke('hotmartGetAccessToken', {});
        
        if (!tokenResponse.data.success) {
            return Response.json({ error: 'Falha ao obter token' }, { status: 500 });
        }

        const accessToken = tokenResponse.data.access_token;
        const apiUrl = new URL('https://developers.hotmart.com/payments/api/v1/sales/history');
        
        if (start_date) apiUrl.searchParams.append('start_date', start_date);
        if (end_date) apiUrl.searchParams.append('end_date', end_date);
        apiUrl.searchParams.append('max_results', max_results.toString());

        const response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            return Response.json({ error: 'Falha ao consultar vendas', details: errorData }, { status: response.status });
        }

        const data = await response.json();
        const sales = (data.items || []).map(sale => ({
            transaction_id: sale.transaction,
            buyer_email: sale.buyer?.email,
            buyer_name: sale.buyer?.name,
            product_name: sale.product?.name,
            product_id: sale.product?.id,
            status: sale.status,
            amount: sale.purchase?.price?.value / 100,
            currency: sale.purchase?.price?.currency_code,
            payment_type: sale.purchase?.payment?.type,
            approved_date: sale.purchase?.approved_date,
            subscription_id: sale.subscription?.subscriber_code
        }));

        return Response.json({
            success: true,
            total: sales.length,
            sales
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
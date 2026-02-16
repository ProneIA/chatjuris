import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Acesso negado - apenas admin' }, { status: 403 });
        }

        const clientId = Deno.env.get('HOTMART_CLIENT_ID');
        const clientSecret = Deno.env.get('HOTMART_CLIENT_SECRET');

        if (!clientId || !clientSecret) {
            return Response.json({ 
                error: 'Credenciais Hotmart não configuradas' 
            }, { status: 500 });
        }

        const tokenUrl = 'https://api-sec-vlc.hotmart.com/security/oauth/token';
        const credentials = btoa(`${clientId}:${clientSecret}`);
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`
            },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            return Response.json({ 
                error: 'Falha na autenticação Hotmart',
                details: errorData
            }, { status: response.status });
        }

        const data = await response.json();
        
        return Response.json({
            success: true,
            access_token: data.access_token,
            token_type: data.token_type,
            expires_in: data.expires_in,
            expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Função para verificar status da assinatura na API da Hotmart
 * Útil para sincronização manual ou verificações pontuais
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Autenticar usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apenas admins podem fazer verificações manuais
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();
    
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const clientId = Deno.env.get('HOTMART_CLIENT_ID');
    const clientSecret = Deno.env.get('HOTMART_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return Response.json({ error: 'Hotmart credentials not configured' }, { status: 500 });
    }

    // 1. Obter token de acesso
    const authResponse = await fetch('https://api-sec-vlc.hotmart.com/security/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      })
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Erro ao obter token Hotmart:', errorText);
      return Response.json({ 
        error: 'Failed to authenticate with Hotmart',
        details: errorText
      }, { status: 500 });
    }

    const { access_token } = await authResponse.json();

    // 2. Buscar assinaturas do usuário
    const subscriptionsResponse = await fetch(
      `https://developers.hotmart.com/payments/api/v1/subscriptions?subscriber_email=${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!subscriptionsResponse.ok) {
      const errorText = await subscriptionsResponse.text();
      console.error('Erro ao buscar assinaturas:', errorText);
      return Response.json({ 
        error: 'Failed to fetch subscriptions',
        details: errorText
      }, { status: 500 });
    }

    const subscriptions = await subscriptionsResponse.json();

    // 3. Atualizar subscription no banco de dados
    const users = await base44.asServiceRole.entities.User.filter({ email });
    
    if (users.length > 0) {
      const targetUser = users[0];
      const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ 
        user_id: targetUser.id 
      });

      const hasActiveHotmartSub = subscriptions.items?.some(
        sub => sub.status === 'ACTIVE' || sub.status === 'OVERDUE'
      );

      if (existingSubs.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
          status: hasActiveHotmartSub ? 'active' : 'cancelled',
          plan: hasActiveHotmartSub ? 'pro' : 'free',
          daily_actions_limit: hasActiveHotmartSub ? 999999 : 5
        });
      }

      return Response.json({ 
        success: true,
        email,
        hasActiveSubscription: hasActiveHotmartSub,
        subscriptions: subscriptions.items || []
      });
    }

    return Response.json({ 
      success: false,
      message: 'User not found in system',
      email
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});
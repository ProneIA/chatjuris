import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const CAKTO_API_URL = 'https://api.cakto.com.br';

async function getCaktoHeaders() {
  return {
    'Authorization': `Bearer ${Deno.env.get('CAKTO_API_KEY')}`,
    'Content-Type': 'application/json'
  };
}

async function getCustomerPayments(customerId) {
  try {
    const headers = await getCaktoHeaders();
    const response = await fetch(`${CAKTO_API_URL}/v1/customers/${customerId}/payments`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.payments || data.data || [];
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
}

async function getSubscriptionStatus(orderId) {
  try {
    const headers = await getCaktoHeaders();
    const response = await fetch(`${CAKTO_API_URL}/v1/orders/${orderId}`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

async function cancelSubscription(orderId) {
  try {
    const headers = await getCaktoHeaders();
    const response = await fetch(`${CAKTO_API_URL}/v1/subscriptions/${orderId}/cancel`, {
      method: 'POST',
      headers
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, customerId, orderId } = body;

    switch (action) {
      case 'history': {
        if (!customerId) {
          return Response.json({ payments: [] });
        }
        const payments = await getCustomerPayments(customerId);
        return Response.json({ payments });
      }

      case 'status': {
        if (!orderId) {
          return Response.json({ error: 'Order ID required' }, { status: 400 });
        }
        const status = await getSubscriptionStatus(orderId);
        return Response.json({ subscription: status });
      }

      case 'cancel': {
        if (!orderId) {
          return Response.json({ error: 'Order ID required' }, { status: 400 });
        }
        const success = await cancelSubscription(orderId);
        return Response.json({ success });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
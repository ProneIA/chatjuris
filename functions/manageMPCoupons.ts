import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") || Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const MP_API_BASE = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const body = await req.json();
    const { action, coupon_data, coupon_id } = body;

    const headers = {
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // ── Listar cupons ──────────────────────────────────────────────────────────
    if (action === 'list') {
      const res = await fetch(`${MP_API_BASE}/v1/coupon-codes?limit=50`, { headers });
      const data = await res.json();
      if (!res.ok) return Response.json({ error: data.message || 'Erro ao listar cupons', detail: data }, { status: res.status });
      return Response.json({ success: true, data: data.results || [] });
    }

    // ── Criar cupom ────────────────────────────────────────────────────────────
    if (action === 'create') {
      const payload = coupon_data || {
        name: "DESCONTO_50_MENSAL",
        code: "MENSAL50OFF",
        type: "fixed_percentage",
        value: 50,
        max_allowed_amount: 100,
        total_amount: 10000,
        status: "active",
        date_expiration: "2026-12-31T23:59:59.000-03:00",
        rules: {
          max_redeems_per_user: 1
        }
      };

      const res = await fetch(`${MP_API_BASE}/v1/coupon-codes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return Response.json({ error: data.message || data.cause?.[0]?.description || 'Erro ao criar cupom', detail: data }, { status: res.status });
      return Response.json({ success: true, data });
    }

    // ── Buscar cupom por ID ────────────────────────────────────────────────────
    if (action === 'get') {
      const res = await fetch(`${MP_API_BASE}/v1/coupon-codes/${coupon_id}`, { headers });
      const data = await res.json();
      if (!res.ok) return Response.json({ error: data.message || 'Cupom não encontrado', detail: data }, { status: res.status });
      return Response.json({ success: true, data });
    }

    // ── Desativar/Ativar cupom ─────────────────────────────────────────────────
    if (action === 'toggle_status') {
      const { new_status } = body; // "active" | "inactive"
      const res = await fetch(`${MP_API_BASE}/v1/coupon-codes/${coupon_id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: new_status }),
      });
      const data = await res.json();
      if (!res.ok) return Response.json({ error: data.message || 'Erro ao atualizar cupom', detail: data }, { status: res.status });
      return Response.json({ success: true, data });
    }

    return Response.json({ error: 'Ação inválida. Use: list, create, get, toggle_status' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") || Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const MP_API_BASE = "https://api.mercadopago.com";

// Endpoint correto: /discount-campaigns (cupons de desconto para checkout/preapproval)
// Ref: https://www.mercadopago.com.br/developers/pt/docs/subscriptions/how-tos/coupons

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const body = await req.json();
    const { action, coupon_data, coupon_id, new_status } = body;

    const headers = {
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // ── Listar planos de assinatura do MP (para pegar o ID do plano mensal) ────
    if (action === 'list_plans') {
      const res = await fetch(`${MP_API_BASE}/preapproval_plan/search?status=active&limit=50`, { headers });
      const data = await res.json();
      if (!res.ok) return Response.json({ error: data.message || 'Erro ao listar planos', detail: data }, { status: res.status });
      return Response.json({ success: true, data: data.results || [] });
    }

    // ── Listar campanhas/cupons ────────────────────────────────────────────────
    if (action === 'list') {
      const res = await fetch(`${MP_API_BASE}/v1/discount-campaigns?limit=50`, { headers });
      const data = await res.json();
      if (!res.ok) return Response.json({ error: data.message || 'Erro ao listar cupons', detail: data }, { status: res.status });
      return Response.json({ success: true, data: data.results || data || [] });
    }

    // ── Criar campanha/cupom ───────────────────────────────────────────────────
    if (action === 'create') {
      const MONTHLY_PLAN_ID = "36824280f92847a4a060dbe2b3745836";
      const payload = coupon_data || {
        name: "DESCONTO_50_MENSAL",
        code: "MENSAL50OFF",
        type: "fixed_percentage",
        value: 50,
        max_allowed_amount: 100,
        total_amount: 10000,
        status: "active",
        date_expiration: "2026-12-31T23:59:59.000-03:00",
        eligibility: {
          preapproval_plan_ids: [MONTHLY_PLAN_ID]
        },
        rules: {
          max_redeems_per_user: 1
        }
      };

      const res = await fetch(`${MP_API_BASE}/v1/discount-campaigns`, {
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
      const res = await fetch(`${MP_API_BASE}/v1/discount-campaigns/${coupon_id}`, { headers });
      const data = await res.json();
      if (!res.ok) return Response.json({ error: data.message || 'Cupom não encontrado', detail: data }, { status: res.status });
      return Response.json({ success: true, data });
    }

    // ── Ativar/Desativar cupom ─────────────────────────────────────────────────
    if (action === 'toggle_status') {
      const res = await fetch(`${MP_API_BASE}/v1/discount-campaigns/${coupon_id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: new_status }),
      });
      const data = await res.json();
      if (!res.ok) return Response.json({ error: data.message || 'Erro ao atualizar status', detail: data }, { status: res.status });
      return Response.json({ success: true, data });
    }

    // ── Retornar o payload JSON para uso manual (ex: via Postman/cURL) ─────────
    if (action === 'get_payload_template') {
      return Response.json({
        success: true,
        data: {
          description: "Payload para criar cupom MENSAL50OFF via API do Mercado Pago",
          endpoint: "POST https://api.mercadopago.com/v1/discount-campaigns",
          headers_required: {
            Authorization: "Bearer SEU_ACCESS_TOKEN",
            "Content-Type": "application/json"
          },
          payload: {
            name: "DESCONTO_50_MENSAL",
            code: "MENSAL50OFF",
            type: "fixed_percentage",
            value: 50,
            max_allowed_amount: 100,
            total_amount: 10000,
            status: "active",
            date_expiration: "2026-12-31T23:59:59.000-03:00",
            eligibility: {
              preapproval_plan_ids: ["36824280f92847a4a060dbe2b3745836"]
            },
            rules: {
              max_redeems_per_user: 1
            }
          }
        }
      });
    }

    return Response.json({ error: 'Ação inválida. Use: list, create, get, toggle_status, get_payload_template' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
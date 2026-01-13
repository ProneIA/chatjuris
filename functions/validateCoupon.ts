import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PLANOS = {
  mensal: {
    id: "pro_monthly",
    preco: 119.90
  },
  anual: {
    id: "pro_yearly",
    preco: 99.90
  }
};

function aplicarCupom({ plano, cupom }) {
  let precoBase = 0;
  let desconto = 0;

  if (plano === "pro_monthly" || plano === "mensal") {
    precoBase = 119.90;

    if (cupom === "JURIS25") {
      desconto = precoBase * 0.25;
    } else if (cupom) {
      throw new Error("Cupom inválido para o plano mensal");
    }
  }

  if (plano === "pro_yearly" || plano === "anual") {
    precoBase = 99.90;

    if (cupom === "JURIS50") {
      desconto = precoBase * 0.5;
    } else if (cupom) {
      throw new Error("Cupom inválido para o plano anual");
    }
  }

  const precoFinal = Number(
    Math.max(precoBase - desconto, 0).toFixed(2)
  );

  return {
    precoBase,
    desconto: Number(desconto.toFixed(2)),
    precoFinal,
    percentual: desconto > 0 ? Math.round((desconto / precoBase) * 100) : 0
  };
}

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const { plano, cupom } = await req.json();

    if (!plano) {
      return Response.json({ error: 'Plano é obrigatório' }, { status: 400, headers });
    }

    try {
      const result = aplicarCupom({ plano, cupom });
      
      console.log('Cupom validado:', { plano, cupom, result });

      return Response.json({ 
        valid: true, 
        ...result 
      }, { headers });
    } catch (err) {
      console.log('Cupom inválido:', err.message);
      
      return Response.json(
        { valid: false, message: err.message },
        { status: 400, headers }
      );
    }
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    return Response.json({ error: error.message }, { status: 500, headers });
  }
});
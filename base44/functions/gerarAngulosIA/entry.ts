import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tema, area_juridica, perfil_advogado } = await req.json();
    if (!tema || !area_juridica) {
      return Response.json({ error: 'tema e area_juridica são obrigatórios' }, { status: 400 });
    }

    const perfilTexto = perfil_advogado
      ? `Perfil do advogado: ${perfil_advogado}`
      : 'Perfil do advogado: não informado';

    const prompt = `Você é um especialista em marketing jurídico para advogados brasileiros.

Tema: ${tema}
Área: ${area_juridica}
${perfilTexto}

Gere um direcionamento de conteúdo para redes sociais com:
- 4 ângulos de abordagem diferentes para o tema (diretos e práticos)
- 1 gancho de abertura forte para Instagram/Reels
- Formato mais indicado (carrossel, reel curto, artigo LinkedIn, thread)
- Público-alvo ideal para esse conteúdo
- Tom recomendado (educativo, empático, técnico, provocativo)

REGRAS:
- Nunca sugerir captação direta de clientela
- Foco em conteúdo educativo e de autoridade
- Conformidade com Código de Ética da OAB e LGPD
- Linguagem acessível ao público leigo

Retorne apenas JSON válido com o schema: { "angulos": ["string"], "gancho_abertura": "string", "formato_indicado": "string", "publico_alvo": "string", "tom_recomendado": "string" }`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          angulos: { type: "array", items: { type: "string" } },
          gancho_abertura: { type: "string" },
          formato_indicado: { type: "string" },
          publico_alvo: { type: "string" },
          tom_recomendado: { type: "string" }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
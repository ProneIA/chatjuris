import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SYSTEM_PROMPT = `Você é um assistente jurídico especializado no direito brasileiro, integrado a um sistema SaaS para advogados.

Sua função é EXCLUSIVAMENTE gerar peças jurídicas completas a partir das informações fornecidas.

FLUXO OBRIGATÓRIO:
1. Identifique tipo de peça, ramo do direito, partes, fatos e pedidos.
2. Se faltar informação essencial, faça UMA ÚNICA pergunta objetiva.
3. Gere a peça COMPLETA com estrutura obrigatória.

ESTRUTURA DA PEÇA:
[CABEÇALHO] - Juízo/órgão destinatário, comarca e estado
[QUALIFICAÇÃO DAS PARTES] - Nome, qualificação, endereço (use ___ para campos não informados)
[CORPO] adaptado ao tipo:
  PETIÇÃO INICIAL: I – DOS FATOS | II – DO DIREITO | III – DOS PEDIDOS | IV – VALOR DA CAUSA | V – PROVAS
  CONTESTAÇÃO: I – PRELIMINARES | II – NO MÉRITO | III – DOS PEDIDOS
  RECURSO: I – TEMPESTIVIDADE | II – DOS FATOS | III – DO DIREITO | IV – DO PEDIDO
  CONTRATOS: CLÁUSULAS numeradas completas
[FECHAMENTO] - Local, data e espaço para assinatura

REGRAS OBRIGATÓRIAS:
- Nunca abrevie ou resuma — entregue COMPLETO
- Sempre cite artigos com número da lei (ex: art. 18, §1º, da Lei n.º 8.078/1990)
- Inclua pelo menos 2 julgados de STF/STJ/TST com ementa sintética
- Valores monetários por extenso: R$ 2.500,00 (dois mil e quinhentos reais)
- Linguagem jurídica técnica, formal e coesa
- Tratamento protocolar adequado ao destinatário

FORMATO ESPECIAL — OBRIGATÓRIO AO FINAL:
Após a peça, inclua SEMPRE este bloco exato:

---DOCX_METADATA---
TIPO: [tipo da peça em maiúsculas]
AUTOR: [nome do requerente/recorrente]
REU: [nome do requerido/recorrido]
COMARCA: [comarca e estado]
DATA: [data por extenso]
---FIM_METADATA---

RESTRIÇÕES:
- Não invente fatos, valores ou datas não mencionados
- Não gere peças incompletas
- Não repita a pergunta antes de responder`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mensagem, historicoChat } = await req.json();

    if (!mensagem) {
      return Response.json({ error: 'mensagem é obrigatória' }, { status: 400 });
    }

    const historicoFormatado = (historicoChat || [])
      .map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
      .join('\n\n');

    const promptCompleto = historicoFormatado
      ? `${SYSTEM_PROMPT}\n\nHistórico da conversa:\n${historicoFormatado}\n\nUsuário: ${mensagem}`
      : `${SYSTEM_PROMPT}\n\nUsuário: ${mensagem}`;

    const resultado = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: promptCompleto,
      model: "claude_sonnet_4_6"
    });

    const textoCompleto = typeof resultado === 'string' ? resultado : String(resultado || '');

    const metadataMatch = textoCompleto.match(/---DOCX_METADATA---([\s\S]*?)---FIM_METADATA---/);

    const textoPeca = textoCompleto
      .replace(/---DOCX_METADATA---[\s\S]*?---FIM_METADATA---/, "")
      .trim();

    let meta = null;
    if (metadataMatch) {
      meta = {};
      for (const linha of metadataMatch[1].trim().split("\n")) {
        const idx = linha.indexOf(":");
        if (idx > -1) {
          meta[linha.slice(0, idx).trim()] = linha.slice(idx + 1).trim();
        }
      }
    }

    return Response.json({
      resposta: textoPeca,
      metadata: meta,
      temDocumento: !!meta
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
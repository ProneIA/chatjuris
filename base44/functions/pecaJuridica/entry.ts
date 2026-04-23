import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const mensagem = body.mensagem || '';
    const historicoChat = body.historicoChat || [];

    const historicoFormatado = historicoChat
      .map((m) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
      .join('\n\n');

    const prompt = `Você é um assistente jurídico especializado no direito brasileiro. Gere peças jurídicas completas.

REGRAS:
- Gere a peça COMPLETA, nunca resumida
- Cite artigos de lei com número: "art. 18, paragrafo 1, da Lei n. 8.078/1990"
- Inclua pelo menos 2 julgados de STF/STJ/TST com ementa sintética
- Use linguagem jurídica técnica e formal
- Escreva valores monetários por extenso
- Ao final, inclua SEMPRE o bloco de metadados

ESTRUTURA OBRIGATÓRIA:
CABECALHO - Juizo/orgao destinatario, comarca e estado
QUALIFICACAO DAS PARTES - Nome, qualificacao, endereco
CORPO - DOS FATOS | DO DIREITO | DOS PEDIDOS | VALOR DA CAUSA | PROVAS
FECHAMENTO - Local, data e espaco para assinatura

AO FINAL DA PECA, inclua EXATAMENTE:
---DOCX_METADATA---
TIPO: [tipo da peca em maiusculas]
AUTOR: [nome do requerente]
REU: [nome do requerido]
COMARCA: [comarca e estado]
DATA: [data por extenso]
---FIM_METADATA---

${historicoFormatado ? `Historico anterior:\n${historicoFormatado}\n\n` : ''}Usuario: ${mensagem}`;

    const resultado = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt,
      model: 'claude_sonnet_4_6',
    });

    const textoCompleto = typeof resultado === 'string' ? resultado : String(resultado || '');

    const metadataMatch = textoCompleto.match(/---DOCX_METADATA---([\s\S]*?)---FIM_METADATA---/);

    const textoPeca = textoCompleto
      .replace(/---DOCX_METADATA---[\s\S]*?---FIM_METADATA---/, '')
      .trim();

    let meta = null;
    if (metadataMatch) {
      meta = {};
      for (const linha of metadataMatch[1].trim().split('\n')) {
        const idx = linha.indexOf(':');
        if (idx > -1) {
          meta[linha.slice(0, idx).trim()] = linha.slice(idx + 1).trim();
        }
      }
    }

    return Response.json({
      resposta: textoPeca,
      metadata: meta,
      temDocumento: !!meta,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
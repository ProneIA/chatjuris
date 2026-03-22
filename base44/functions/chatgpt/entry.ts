/**
 * LGPD Art. 46 + Art. 33 — Assistente IA com Anonimização de PII
 * Antes de enviar qualquer mensagem à OpenAI (transferência internacional — EUA),
 * o sistema remove/substitui dados pessoais identificáveis (PII) por tokens neutros.
 * Isso mitiga o risco de exposição de dados sensíveis a terceiro internacional
 * e protege o sigilo profissional do advogado (Lei 8.906/94, art. 7º XIX).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import OpenAI from 'npm:openai@4.68.1';

// ─── Anonimizador de PII ──────────────────────────────────────────────────────
function anonymizePII(text) {
  if (!text || typeof text !== 'string') return { anonymized: text, map: {} };

  const map = {};
  let counter = { cpf: 0, cnpj: 0, email: 0, phone: 0, proc: 0, name: 0 };
  let result = text;

  // CPF: 000.000.000-00 ou 00000000000
  result = result.replace(/\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b/g, (match) => {
    const token = `[CPF_${++counter.cpf}]`;
    map[token] = match;
    return token;
  });

  // CNPJ: 00.000.000/0000-00
  result = result.replace(/\b\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\s]?\d{4}[-\s]?\d{2}\b/g, (match) => {
    const token = `[CNPJ_${++counter.cnpj}]`;
    map[token] = match;
    return token;
  });

  // E-mail
  result = result.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (match) => {
    const token = `[EMAIL_${++counter.email}]`;
    map[token] = match;
    return token;
  });

  // Telefone: (00) 00000-0000 ou variantes
  result = result.replace(/\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}/g, (match) => {
    const token = `[FONE_${++counter.phone}]`;
    map[token] = match;
    return token;
  });

  // Número de processo CNJ: 0000000-00.0000.0.00.0000
  result = result.replace(/\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g, (match) => {
    const token = `[PROC_${++counter.proc}]`;
    map[token] = match;
    return token;
  });

  return { anonymized: result, map };
}

function deanonymize(text, map) {
  if (!text || !map || Object.keys(map).length === 0) return text;
  let result = text;
  for (const [token, original] of Object.entries(map)) {
    result = result.split(token).join(original);
  }
  return result;
}

// ─── Handler principal ────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const { messages, mode } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const systemPrompts = {
      assistant: `Você é JURIS, um assistente jurídico inteligente e especializado em direito brasileiro. 
Você ajuda advogados com:
- Análise de casos e processos
- Pesquisa de jurisprudência
- Redação de petições e documentos
- Orientações sobre prazos processuais
- Interpretação de leis e normas

Seja preciso, profissional e cite fontes quando relevante. Responda sempre em português brasileiro.
IMPORTANTE: Quando encontrar tokens como [CPF_1], [EMAIL_1], etc., trate-os como identificadores genéricos — não os revele nem tente adivinhar os valores reais.`,

      legal_document_generator: `Você é um especialista em redação jurídica brasileira.
Gere documentos legais completos, bem estruturados e tecnicamente corretos.
Use linguagem formal e técnica apropriada. Inclua todos os elementos necessários do documento solicitado.`,

      document_analyzer: `Você é um especialista em análise de documentos jurídicos.
Analise documentos legais identificando pontos importantes, riscos, cláusulas relevantes e sugestões de melhoria.`
    };

    const systemMessage = systemPrompts[mode] || systemPrompts.assistant;

    // Anonimizar TODOS os conteúdos das mensagens antes de enviar à OpenAI
    // Mantém um mapa consolidado para re-identificar a resposta
    const consolidatedMap = {};
    const anonymizedMessages = messages.map(m => {
      const { anonymized, map } = anonymizePII(m.content);
      Object.assign(consolidatedMap, map);
      return { role: m.role, content: anonymized };
    });

    const piiTokensFound = Object.keys(consolidatedMap).length;
    if (piiTokensFound > 0) {
      console.info(`LGPD: ${piiTokensFound} tokens de PII anonimizados antes de enviar à OpenAI.`);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        ...anonymizedMessages
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    // Re-identificar a resposta com os valores reais do contexto do usuário
    const rawContent = response.choices[0].message.content;
    const finalContent = deanonymize(rawContent, consolidatedMap);

    return Response.json({
      content: finalContent,
      usage: response.usage,
      pii_tokens_anonymized: piiTokensFound
    });

  } catch (error) {
    console.error('ChatGPT Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
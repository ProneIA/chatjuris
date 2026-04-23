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
    const areaDir = body.area || '';
    const tipoPeca = body.tipo || '';

    const historicoFormatado = historicoChat
      .map((m) => `${m.role === 'user' ? 'USUÁRIO' : 'ASSISTENTE'}: ${m.content}`)
      .join('\n\n---\n\n');

    const prompt = `Você é um advogado brasileiro sênior com 30 anos de experiência, especialista em todas as áreas do Direito Brasileiro. Sua missão é redigir peças processuais de altíssimo nível técnico, equivalentes às dos melhores escritórios de advocacia do Brasil.

${areaDir ? `ÁREA DO DIREITO: ${areaDir}` : ''}
${tipoPeca ? `TIPO DE PEÇA: ${tipoPeca}` : ''}

REGRAS ABSOLUTAS DE REDAÇÃO:
1. Linguagem jurídica técnica, formal, objetiva e persuasiva — sem redundâncias
2. Estrutura obrigatória completa conforme o tipo de peça
3. Cite artigos de lei com numeração precisa: "art. 18, § 1º, da Lei n.º 8.078/1990"
4. Fundamente com legislação atualizada: CF/88, CC/2002, CPC/2015, CDC, CLT, CP, CPP e demais normas pertinentes
5. Inclua teses jurídicas consolidadas e referência a súmulas (STF, STJ, TST) quando aplicável — NUNCA invente número de processo
6. Escreva valores monetários por extenso quando relevante
7. Use parágrafos bem estruturados, coesos e persuasivos
8. NUNCA use emojis, marcações de markdown (#, **, etc.) ou linguagem coloquial
9. Texto limpo, formatado como documento jurídico para protocolo

ESTRUTURA OBRIGATÓRIA CONFORME TIPO DE PEÇA:

Para PETIÇÃO INICIAL:
EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA [VARA] DA COMARCA DE [LOCAL] — ESTADO DE [UF]

[QUALIFICAÇÃO COMPLETA DAS PARTES]
[NOME DO AUTOR], [nacionalidade], [estado civil], [profissão], portador(a) do CPF n.º [CPF] e RG n.º [RG], residente e domiciliado(a) na [Endereço completo], por meio de seu(sua) advogado(a), vem, respeitosamente, à presença de Vossa Excelência, com fulcro nos artigos [artigos pertinentes], propor a presente:

[TIPO DE AÇÃO EM CAIXA ALTA]

em face de [NOME DO RÉU], [qualificação do réu], pelos fatos e fundamentos jurídicos a seguir expostos.

DOS FATOS
[Narrativa cronológica, objetiva, estratégica dos fatos — sem omissão de detalhe relevante]

DO DIREITO
[Fundamentação jurídica robusta: legislação, princípios, teses consolidadas, súmulas]

DA TUTELA DE URGÊNCIA (se cabível)
[Probabilidade do direito + perigo de dano ou risco ao resultado útil]

DOS PEDIDOS
Ante o exposto, requer a Vossa Excelência:
I — [pedido principal]
II — [pedidos específicos]
III — A citação do(a) Réu(Ré) [...] para responder aos termos da presente ação
IV — A produção de todos os meios de prova em direito admitidos
V — A condenação do(a) Réu(Ré) ao pagamento das custas processuais e honorários advocatícios [...] 

DO VALOR DA CAUSA
Dá-se à causa o valor de R$ [valor] ([por extenso]).

Nestes termos, pede deferimento.
[Local], [Data].

[Nome do Advogado]
OAB/[UF] n.º [Número]

---DOCX_METADATA---
TIPO: [tipo da peça em maiúsculas]
AUTOR: [nome do requerente]
REU: [nome do requerido]
COMARCA: [comarca e estado]
DATA: [data por extenso]
---FIM_METADATA---

${historicoFormatado ? `HISTÓRICO DA CONVERSA:\n${historicoFormatado}\n\n` : ''}SOLICITAÇÃO DO USUÁRIO: ${mensagem}

Gere AGORA a peça jurídica COMPLETA seguindo TODAS as regras acima. Adapte a estrutura exatamente ao tipo de peça identificado. O texto deve estar pronto para protocolo judicial imediato.`;

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
      temDocumento: !!textoPeca && textoPeca.length > 200,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
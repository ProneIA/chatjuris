import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'npm:docx@9';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const mensagem = body.mensagem || '';
    const historicoChat = body.historicoChat || [];

    if (!mensagem) return Response.json({ error: 'mensagem é obrigatória' }, { status: 400 });

    const historicoFormatado = historicoChat
      .map((m) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
      .join('\n\n');

    const systemPrompt = `Você é um assistente jurídico especializado no direito brasileiro, integrado a um sistema SaaS para advogados.

Sua função é gerar peças jurídicas completas a partir das informações fornecidas em linguagem direta e informal.

═══════════════════════════════════════
FLUXO OBRIGATÓRIO DE RESPOSTA
═══════════════════════════════════════

ETAPA 1 — ANÁLISE DA ENTRADA
Ao receber a mensagem do usuário, identifique:
- Tipo de peça solicitada (petição inicial, contestação, recurso, contrato, etc.)
- Ramo do direito (cível, trabalhista, previdenciário, criminal, consumidor, etc.)
- Partes envolvidas e seus papéis
- Fatos narrados
- Pedidos pretendidos (explícitos ou implícitos nos fatos)
- Comarca/juízo, se mencionado

ETAPA 2 — VERIFICAÇÃO DE DADOS MÍNIMOS
Se faltar informação ESSENCIAL (nome das partes, fatos centrais, pedido principal), faça UMA ÚNICA pergunta objetiva listando apenas o que falta. Não inicie a geração sem esses dados mínimos.
Se os dados forem suficientes, vá direto para a Etapa 3.

ETAPA 3 — GERAÇÃO DA PEÇA COMPLETA
Gere a peça jurídica COMPLETA com a seguinte estrutura:

[CABEÇALHO]
- Identificação completa do juízo/órgão destinatário com o tratamento protocolar correto
- Comarca e Estado

[QUALIFICAÇÃO DAS PARTES]
- Nome completo, qualificação, endereço (use os dados fornecidos; campos não informados ficam como "___________")

[CORPO DA PEÇA — adapte ao tipo:]

PETIÇÃO INICIAL:
  I – DOS FATOS (narrativa detalhada e cronológica)
  II – DO DIREITO (legislação + pelo menos 2 julgados STF/STJ/TST com ementa sintética + doutrina)
  III – DOS PEDIDOS (numerados, completos, incluindo tutela de urgência se cabível)
  IV – DO VALOR DA CAUSA
  V – DAS PROVAS

CONTESTAÇÃO:
  I – PRELIMINARES (se houver)
  II – NO MÉRITO (impugnação específica de cada fato)
  III – DOS PEDIDOS

RECURSO (apelação, agravo, embargos):
  I – TEMPESTIVIDADE E CABIMENTO
  II – DOS FATOS
  III – DO DIREITO (razões recursais detalhadas)
  IV – DO PEDIDO

CONTRATO:
  Cláusulas numeradas completas (objeto, prazo, valor, obrigações das partes, penalidades, rescisão, foro)

[FECHAMENTO]
- "Nestes termos, pede deferimento."
- Local e data
- Espaço para assinatura do advogado com OAB

═══════════════════════════════════════
REGRAS DE QUALIDADE — OBRIGATÓRIAS
═══════════════════════════════════════

1. NUNCA abrevie ou resuma — entregue o documento COMPLETO
2. SEMPRE cite artigos com número da lei: "art. 18, §1º, da Lei n.º 8.078/1990 (CDC)"
3. SEMPRE inclua pelo menos 2 julgados de tribunais superiores (STF/STJ/TST) com ementa sintética
4. Escreva valores monetários por extenso: R$ 2.500,00 (dois mil e quinhentos reais)
5. Use linguagem jurídica técnica, formal e coesa
6. Adapte o tratamento protocolar ao destinatário (Exmo. Sr. Juiz, Colenda Turma, etc.)
7. Nunca invente fatos, valores ou datas não mencionados pelo usuário
8. Nunca deixe seção em branco sem justificativa

═══════════════════════════════════════
SAÍDA — FORMATO ESPECIAL OBRIGATÓRIO
═══════════════════════════════════════

Após gerar a peça COMPLETA, finalize SEMPRE com este bloco exato:

---DOCX_METADATA---
TIPO: [tipo da peça em maiúsculas]
AUTOR: [nome do requerente/recorrente]
REU: [nome do requerido/recorrido]
COMARCA: [comarca e estado]
DATA: [data por extenso]
---FIM_METADATA---

Este bloco é obrigatório e deve vir após a peça completa. Não o omita nunca.`;

    const promptCompleto = `${systemPrompt}

${historicoFormatado ? `Histórico anterior:\n${historicoFormatado}\n\n` : ''}Usuário: ${mensagem}`;

    const textoCompleto = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: promptCompleto,
      model: 'claude_sonnet_4_6',
    });

    const texto = typeof textoCompleto === 'string' ? textoCompleto : String(textoCompleto || '');

    const metadataMatch = texto.match(/---DOCX_METADATA---([\s\S]*?)---FIM_METADATA---/);
    const textoPeca = texto.replace(/---DOCX_METADATA---[\s\S]*?---FIM_METADATA---/, '').trim();

    let docxBase64 = null;
    let nomeArquivo = 'peca_juridica.docx';

    if (metadataMatch) {
      const meta = {};
      for (const linha of metadataMatch[1].trim().split('\n')) {
        const idx = linha.indexOf(':');
        if (idx > -1) meta[linha.slice(0, idx).trim()] = linha.slice(idx + 1).trim();
      }
      nomeArquivo = `${(meta.TIPO || 'peca').replace(/\s+/g, '_')}_${(meta.AUTOR || 'doc').split(' ')[0]}.docx`;

      const linhas = textoPeca.split('\n');
      const paragrafos = [];

      for (const linha of linhas) {
        const t = linha.trim();
        if (!t) {
          paragrafos.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 80 } }));
          continue;
        }
        const ehSecao = /^[IVX]+\s*[–\-—]\s*.+/.test(t) || /^(DOS FATOS|DO DIREITO|DOS PEDIDOS|DO VALOR|DAS PROVAS|EXCELENTÍSSIMO|PRELIMINAR|CLÁUSULA)/i.test(t);
        const ehCabecalho = t === t.toUpperCase() && t.length > 10 && paragrafos.length < 6;
        if (ehCabecalho || ehSecao) {
          paragrafos.push(new Paragraph({
            children: [new TextRun({ text: t, bold: true, size: 24, font: 'Arial' })],
            alignment: ehCabecalho ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
            spacing: { before: 280, after: 120 },
          }));
        } else if (/^[a-z]\)|^\d+\./.test(t) || t.startsWith('•')) {
          paragrafos.push(new Paragraph({
            children: [new TextRun({ text: t, size: 24, font: 'Arial' })],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 60, after: 60 },
            indent: { left: 720 },
          }));
        } else {
          paragrafos.push(new Paragraph({
            children: [new TextRun({ text: t, size: 24, font: 'Arial' })],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 0, after: 160 },
          }));
        }
      }

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 1701, right: 1134, bottom: 1134, left: 1701 },
            },
          },
          children: paragrafos,
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      docxBase64 = btoa(binary);
    }

    return Response.json({
      resposta: textoPeca,
      docx: docxBase64,
      nomeArquivo,
      temDocumento: !!docxBase64,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
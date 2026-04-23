import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'npm:docx@9.5.0';

const SYSTEM_PROMPT = `Você é um assistente jurídico especializado no direito brasileiro, integrado a um sistema SaaS para advogados.

Sua função neste módulo é EXCLUSIVAMENTE gerar peças jurídicas completas a partir das informações fornecidas pelo usuário em linguagem direta e informal.

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
Se faltar alguma informação ESSENCIAL para gerar a peça (ex: nome das partes, fatos centrais, pedido), faça UMA ÚNICA pergunta objetiva listando apenas o que está faltando. Não inicie a geração sem esses dados.

Se os dados forem suficientes, vá direto para a Etapa 3. Não peça confirmação desnecessária.

ETAPA 3 — GERAÇÃO DA PEÇA
Gere a peça jurídica COMPLETA com a seguinte estrutura obrigatória:

[CABEÇALHO]
- Identificação completa do juízo/órgão destinatário
- Comarca e Estado

[QUALIFICAÇÃO DAS PARTES]
- Nome completo, qualificação, endereço (use os dados fornecidos; para campos não informados, use marcador como "___________")

[CORPO DA PEÇA]
Adapte conforme o tipo:

• PETIÇÃO INICIAL:
  I – DOS FATOS (narrativa detalhada e cronológica)
  II – DO DIREITO (legislação + jurisprudência + doutrina)
  III – DOS PEDIDOS (numerados, completos, incluindo tutela de urgência se cabível)
  IV – DO VALOR DA CAUSA
  V – DAS PROVAS

• CONTESTAÇÃO:
  I – PRELIMINARES (se houver)
  II – NO MÉRITO
  III – DOS PEDIDOS

• RECURSO:
  I – TEMPESTIVIDADE E CABIMENTO
  II – DOS FATOS
  III – DO DIREITO (razões recursais)
  IV – DO PEDIDO

• CONTRATOS:
  CLÁUSULAS numeradas completas (objeto, prazo, valor, obrigações, rescisão, foro)

[FECHAMENTO]
- Local e data (use a cidade informada ou "_________, ___ de ________ de 2025")
- Espaço para assinatura do advogado com OAB

═══════════════════════════════════════
REGRAS DE QUALIDADE — OBRIGATÓRIAS
═══════════════════════════════════════

1. NUNCA abrevie ou resuma a peça — entregue o documento COMPLETO
2. NUNCA deixe seção em branco sem justificativa
3. SEMPRE cite artigos com número da lei: "art. 18, §1º, da Lei n.º 8.078/1990 (CDC)"
4. SEMPRE inclua pelo menos 2 julgados de tribunais superiores (STF/STJ/TST) com ementa sintética
5. Escreva valores monetários por extenso: R$ 2.500,00 (dois mil e quinhentos reais)
6. Use linguagem jurídica técnica, formal e coesa
7. Adapte o tratamento protocolar ao destinatário (Exmo. Sr. Juiz, Colenda Turma, etc.)

═══════════════════════════════════════
SAÍDA — FORMATO ESPECIAL OBRIGATÓRIO
═══════════════════════════════════════

Após gerar a peça, você DEVE finalizar sua resposta com um bloco especial no seguinte formato EXATO:

---DOCX_METADATA---
TIPO: [tipo da peça em maiúsculas, ex: PETIÇÃO INICIAL]
AUTOR: [nome do requerente/recorrente]
REU: [nome do requerido/recorrido]
COMARCA: [comarca e estado]
DATA: [data por extenso]
---FIM_METADATA---

Este bloco deve vir SEMPRE ao final, após a peça completa. Não o omita.

RESTRIÇÕES:
- Não forneça orientação estratégica sem ser solicitado
- Não invente fatos, valores ou datas não mencionados pelo usuário
- Não gere peças incompletas alegando limitação de tamanho
- Não repita a pergunta do usuário antes de responder`;

// ─── PARSER DO BLOCO METADATA ────────────────────────────────────────────────
function parsearMetadata(bloco) {
  const meta = {};
  const linhas = bloco.trim().split("\n");
  for (const linha of linhas) {
    const [chave, ...valor] = linha.split(":");
    if (chave && valor.length) {
      meta[chave.trim()] = valor.join(":").trim();
    }
  }
  return meta;
}

// ─── GERADOR DO .DOCX ────────────────────────────────────────────────────────
async function gerarDocx(texto, meta) {
  const linhas = texto.split("\n");
  const paragrafos = [];

  for (const linha of linhas) {
    const trimmed = linha.trim();

    if (!trimmed) {
      paragrafos.push(new Paragraph({ children: [new TextRun("")], spacing: { after: 80 } }));
      continue;
    }

    const ehSecao = /^[IVX]+\s*[–\-—]\s*.+/.test(trimmed) ||
      /^(DOS FATOS|DO DIREITO|DOS PEDIDOS|DO VALOR|DAS PROVAS|EXCELENTÍSSIMO|PRELIMINAR)/i.test(trimmed);

    const ehCabecalho = trimmed === trimmed.toUpperCase() && trimmed.length > 10 && paragrafos.length < 6;

    if (ehCabecalho || ehSecao) {
      paragrafos.push(new Paragraph({
        children: [new TextRun({ text: trimmed, bold: true, size: 24, font: "Arial" })],
        alignment: ehCabecalho ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
        spacing: { before: 280, after: 120 }
      }));
    } else if (trimmed.startsWith("•") || trimmed.match(/^[a-z]\)/i) || trimmed.match(/^\d+\./)) {
      paragrafos.push(new Paragraph({
        children: [new TextRun({ text: trimmed, size: 24, font: "Arial" })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 60, after: 60 },
        indent: { left: 720 }
      }));
    } else {
      paragrafos.push(new Paragraph({
        children: [new TextRun({ text: trimmed, size: 24, font: "Arial" })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 0, after: 160 }
      }));
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1701, right: 1134, bottom: 1134, left: 1701 }
        }
      },
      children: paragrafos
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  // Convert Uint8Array to base64
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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

    // 1. CHAMA A API DO CLAUDE
    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY"),
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 8192,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [
          ...(historicoChat || []),
          { role: "user", content: mensagem }
        ]
      })
    });

    if (!resposta.ok) {
      const erro = await resposta.text();
      return Response.json({ error: `Erro na API Claude: ${erro}` }, { status: 500 });
    }

    const dados = await resposta.json();
    const textoCompleto = dados.content[0].text;

    // 2. EXTRAI O BLOCO DE METADATA
    const metadataMatch = textoCompleto.match(
      /---DOCX_METADATA---([\s\S]*?)---FIM_METADATA---/
    );

    // 3. EXTRAI O TEXTO DA PEÇA (sem o bloco de metadata)
    const textoPeca = textoCompleto
      .replace(/---DOCX_METADATA---[\s\S]*?---FIM_METADATA---/, "")
      .trim();

    // 4. SE TEM METADATA, GERA O .DOCX
    let docxBase64 = null;
    let nomeArquivo = "peca_juridica.docx";

    if (metadataMatch) {
      const meta = parsearMetadata(metadataMatch[1]);
      nomeArquivo = `${(meta.TIPO || "peca").replace(/\s+/g, "_")}_${(meta.AUTOR || "doc").split(" ")[0]}.docx`;
      docxBase64 = await gerarDocx(textoPeca, meta);
    }

    // 5. RETORNA PARA O FRONTEND
    return Response.json({
      resposta: textoPeca,
      docx: docxBase64,
      nomeArquivo,
      temDocumento: !!docxBase64
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
// utils/documentFormatter.js
// Formata e exporta peças jurídicas em DOCX e PDF

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  LevelFormat,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
} from "docx";
import { saveAs } from "file-saver";

// ─── PARSER ───────────────────────────────────────────────────────────────────

export function parseDocumentoJuridico(textoIA) {
  const linhas = textoIA.split("\n");
  const blocos = [];

  for (const linha of linhas) {
    const limpa = linha.trim();

    if (!limpa) {
      blocos.push({ tipo: "espacamento" });
      continue;
    }

    // Título principal — tudo maiúsculo, linha curta, sem ponto final
    if (
      limpa === limpa.toUpperCase() &&
      limpa.length > 3 &&
      limpa.length < 120 &&
      !limpa.endsWith(".") &&
      !limpa.startsWith("•") &&
      !limpa.startsWith("-") &&
      !limpa.match(/^\d+\./)
    ) {
      blocos.push({ tipo: "titulo_principal", texto: limpa });
      continue;
    }

    // Seção
    if (
      limpa.match(/^(I{1,4}V?|VI{0,3}|IX|X{1,3})\s*[-–—]\s*/i) ||
      limpa.match(/^(DOS?|DAS?|DO|DA)\s+[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ]/i) ||
      limpa.match(/^\d+\.\s+[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ]/) ||
      limpa.match(/^(PREÂMBULO|CONSIDERAÇÕES|CONCLUSÃO|DISPOSITIVO|REQUERIMENTO)/i)
    ) {
      blocos.push({ tipo: "secao", texto: limpa });
      continue;
    }

    // Alínea
    if (limpa.match(/^[a-z]\)\s+/) || limpa.match(/^[IVX]+\)\s+/)) {
      blocos.push({ tipo: "alinea", texto: limpa });
      continue;
    }

    // Fecho / assinatura
    if (
      limpa.match(/^(Termos em que|Nestes termos|Nesses termos)/i) ||
      limpa.match(/^(Pede deferimento|Aguarda deferimento)/i) ||
      limpa.match(/^[A-Za-z\s]+,\s+\d+\s+de\s+\w+\s+de\s+\d{4}/i) ||
      limpa.match(/^_+$/) ||
      limpa.match(/^(OAB\/|Advogado\(a\)|Dr\.|Dra\.)/i)
    ) {
      blocos.push({ tipo: "fecho", texto: limpa });
      continue;
    }

    // Citação legal
    if (limpa.match(/^(Art\.|§|Súmula|Enunciado|Lei n)/i)) {
      blocos.push({ tipo: "citacao_legal", texto: limpa });
      continue;
    }

    blocos.push({ tipo: "paragrafo", texto: limpa });
  }

  return blocos;
}

// ─── GERADOR DOCX ─────────────────────────────────────────────────────────────

export async function gerarDOCX(textoIA, nomeArquivo, metadados = {}) {
  const blocos = parseDocumentoJuridico(textoIA);
  const paragrafos = [];

  for (const bloco of blocos) {
    switch (bloco.tipo) {
      case "espacamento":
        paragrafos.push(new Paragraph({ children: [new TextRun("")], spacing: { after: 100 } }));
        break;

      case "titulo_principal":
        paragrafos.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 300 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1a1a2e", space: 4 } },
            children: [new TextRun({ text: bloco.texto, bold: true, size: 28, font: "Arial" })],
          })
        );
        break;

      case "secao":
        paragrafos.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 360, after: 200 },
            children: [new TextRun({ text: bloco.texto, bold: true, size: 24, font: "Arial", allCaps: true })],
          })
        );
        break;

      case "alinea":
        paragrafos.push(
          new Paragraph({
            alignment: AlignmentType.BOTH,
            spacing: { before: 120, after: 120, line: 360 },
            indent: { left: 720, hanging: 360 },
            children: [new TextRun({ text: bloco.texto, size: 24, font: "Arial" })],
          })
        );
        break;

      case "citacao_legal":
        paragrafos.push(
          new Paragraph({
            alignment: AlignmentType.BOTH,
            spacing: { before: 160, after: 160, line: 320 },
            indent: { left: 1440, right: 1440 },
            shading: { fill: "F5F5F5" },
            children: [new TextRun({ text: bloco.texto, size: 22, font: "Arial", italics: true, color: "333333" })],
          })
        );
        break;

      case "fecho":
        paragrafos.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: bloco.texto,
                size: 24,
                font: "Arial",
                bold: !!bloco.texto.match(/^Termos|^Pede|^Aguarda/i),
              }),
            ],
          })
        );
        break;

      default:
        paragrafos.push(
          new Paragraph({
            alignment: AlignmentType.BOTH,
            spacing: { before: 120, after: 120, line: 360 },
            indent: { left: 0, firstLine: 720 },
            children: [new TextRun({ text: bloco.texto, size: 24, font: "Arial" })],
          })
        );
    }
  }

  const doc = new Document({
    numbering: {
      config: [{
        reference: "alineas",
        levels: [{
          level: 0,
          format: LevelFormat.LOWER_LETTER,
          text: "%1)",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      }],
    },
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 24, color: "000000" },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1701, right: 1134, bottom: 1134, left: 1701 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 100 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 2 } },
              children: [
                new TextRun({ text: metadados.areaLabel || "Documento Jurídico", size: 16, font: "Arial", color: "666666" }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 100 },
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 2 } },
              children: [
                new TextRun({ text: "Página ", size: 16, font: "Arial", color: "666666" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "666666" }),
                new TextRun({ text: " de ", size: 16, font: "Arial", color: "666666" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: "Arial", color: "666666" }),
              ],
            }),
          ],
        }),
      },
      children: paragrafos,
    }],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `${nomeArquivo}.docx`);
}

// ─── GERADOR PDF (impressão nativa) ───────────────────────────────────────────

export function gerarPDF(textoIA, nomeArquivo, metadados = {}) {
  const blocos = parseDocumentoJuridico(textoIA);

  let htmlContent = "";
  for (const bloco of blocos) {
    switch (bloco.tipo) {
      case "espacamento":
        htmlContent += `<div class="espacamento"></div>`;
        break;
      case "titulo_principal":
        htmlContent += `<div class="titulo-principal">${bloco.texto}</div>`;
        break;
      case "secao":
        htmlContent += `<div class="secao">${bloco.texto}</div>`;
        break;
      case "alinea":
        htmlContent += `<div class="alinea">${bloco.texto}</div>`;
        break;
      case "citacao_legal":
        htmlContent += `<div class="citacao-legal">${bloco.texto}</div>`;
        break;
      case "fecho":
        htmlContent += `<div class="fecho">${bloco.texto}</div>`;
        break;
      default:
        htmlContent += `<p class="paragrafo">${bloco.texto}</p>`;
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>${nomeArquivo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    font-size: 12pt;
    line-height: 1.8;
    color: #000;
    background: white;
    padding: 30mm 20mm 20mm 30mm;
  }
  .titulo-principal {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    text-transform: uppercase;
    margin: 20pt 0 15pt 0;
    padding-bottom: 8pt;
    border-bottom: 2px solid #1a1a2e;
    letter-spacing: 0.5px;
  }
  .secao {
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
    margin: 18pt 0 10pt 0;
    letter-spacing: 0.3px;
  }
  .paragrafo {
    text-align: justify;
    margin: 6pt 0;
    text-indent: 1.25cm;
  }
  .alinea {
    text-align: justify;
    margin: 6pt 0 6pt 2cm;
    text-indent: -0.7cm;
  }
  .citacao-legal {
    font-size: 11pt;
    font-style: italic;
    margin: 10pt 2cm;
    padding: 8pt 12pt;
    background: #f5f5f5;
    border-left: 3px solid #666;
    color: #333;
  }
  .fecho { text-align: center; margin: 15pt 0 8pt 0; }
  .espacamento { height: 6pt; }
  @media print {
    body { padding: 0; }
    @page { size: A4; margin: 30mm 20mm 20mm 30mm; }
  }
</style>
</head>
<body>${htmlContent}</body>
</html>`;

  const janela = window.open("", "_blank");
  if (janela) {
    janela.document.write(html);
    janela.document.close();
    janela.onload = () => setTimeout(() => { janela.focus(); janela.print(); }, 500);
  }
}
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, FileText, Copy } from "lucide-react";
import { toast } from "sonner";

// Gera um DOCX real usando a API de Blobs com formatação RTF-like via HTML
function generateDocxBlob(title, content) {
  // Remove markdown formatting
  const clean = content
    .replace(/#{1,6}\s+(.+)/g, (_, t) => t.toUpperCase())
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_{1,2}(.+?)_{1,2}/g, '$1')
    .replace(/`(.+?)`/g, '$1');

  // Build HTML for Word
  const paragraphs = clean.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>';
    
    const isTitle = trimmed === trimmed.toUpperCase() && trimmed.length > 5 && trimmed.length < 120;
    
    if (isTitle) {
      return `<w:p>
        <w:pPr>
          <w:jc w:val="center"/>
          <w:spacing w:before="240" w:after="120"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:b/><w:sz w:val="26"/></w:rPr>
          <w:t xml:space="preserve">${escapeXml(trimmed)}</w:t>
        </w:r>
      </w:p>`;
    }
    
    return `<w:p>
      <w:pPr>
        <w:jc w:val="both"/>
        <w:spacing w:after="120"/>
        <w:ind w:firstLine="720"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="24"/></w:rPr>
        <w:t xml:space="preserve">${escapeXml(trimmed)}</w:t>
      </w:r>
    </w:p>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mo="http://schemas.microsoft.com/office/mac/office/2008/main"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:mv="urn:schemas-microsoft-com:mac:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 wp14">
  <w:body>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
        <w:t>${escapeXml(title)}</w:t>
      </w:r>
    </w:p>
    ${paragraphs}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1800" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  return xml;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function downloadDocx(title, content) {
  // Use docx-compatible HTML approach via Blob
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <meta name=ProgId content=Word.Document>
      <meta name=Generator content='Microsoft Word 11'>
      <meta name=Originator content='Microsoft Word 11'>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>90</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.5;
          margin: 2.5cm 2.5cm 2.5cm 3cm;
        }
        h1, h2, h3 { font-size: 12pt; font-weight: bold; text-align: center; }
        p { text-align: justify; text-indent: 1.25cm; margin: 6pt 0; }
        .section-title { text-align: center; font-weight: bold; text-indent: 0; margin: 12pt 0 6pt; }
        .no-indent { text-indent: 0; }
      </style>
    </head>
    <body>
      ${formatContentToHtml(title, content)}
    </body>
    </html>`;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/vnd.ms-word;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'peca-juridica'}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatContentToHtml(title, content) {
  const lines = content.split('\n');
  let html = `<h1 style="text-align:center; font-size:13pt; margin-bottom:24pt;">${title}</h1>`;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      html += '<br>';
      return;
    }
    
    // Remove markdown
    const clean = trimmed
      .replace(/^#{1,6}\s+/, '')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    const isAllCaps = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !/^\d/.test(trimmed);
    
    if (isAllCaps) {
      html += `<p class="section-title">${clean}</p>`;
    } else if (/^\d+[\.\)]\s/.test(trimmed)) {
      html += `<p style="text-indent:0; margin-left:1.25cm;">${clean}</p>`;
    } else {
      html += `<p>${clean}</p>`;
    }
  });
  
  return html;
}

export default function DocumentPreviewModal({ open, onClose, title, content }) {
  if (!content) return null;

  const handleDownloadDocx = async () => {
    await downloadDocx(title, content);
    toast.success("Documento DOCX baixado com sucesso!");
  };

  const handleCopy = () => {
    const plain = content
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1');
    navigator.clipboard.writeText(plain);
    toast.success("Documento copiado!");
  };

  // Render content formatted for preview
  const renderPreview = () => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-3" />;
      
      const clean = trimmed
        .replace(/^#{1,6}\s+/, '')
        .replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${t}</strong>`)
        .replace(/\*(.+?)\*/g, (_, t) => `<em>${t}</em>`);
      
      const isAllCaps = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !/^\d/.test(trimmed);
      const isNumbered = /^\d+[\.\)]\s/.test(trimmed);
      
      if (isAllCaps) {
        return (
          <p key={idx} className="text-center font-bold text-sm mt-6 mb-2 tracking-wide"
            dangerouslySetInnerHTML={{ __html: clean }} />
        );
      }
      if (isNumbered) {
        return (
          <p key={idx} className="text-sm leading-relaxed ml-4 mb-1"
            dangerouslySetInnerHTML={{ __html: clean }} />
        );
      }
      return (
        <p key={idx} className="text-sm leading-relaxed text-justify indent-8 mb-1"
          dangerouslySetInnerHTML={{ __html: clean }} />
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <DialogTitle className="text-base font-semibold truncate max-w-md">
              {title || "Peça Jurídica"}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-1" />
              Copiar
            </Button>
            <Button size="sm" onClick={handleDownloadDocx} className="bg-blue-700 hover:bg-blue-800 text-white">
              <Download className="w-4 h-4 mr-1" />
              Baixar DOCX
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Document Preview - A4 style */}
        <div className="flex-1 overflow-y-auto bg-gray-200 p-6">
          <div
            className="bg-white mx-auto shadow-lg"
            style={{
              width: '210mm',
              minHeight: '297mm',
              maxWidth: '100%',
              padding: '2.5cm 2.5cm 2.5cm 3cm',
              fontFamily: "'Times New Roman', serif",
              fontSize: '12pt',
              lineHeight: '1.6',
              boxSizing: 'border-box',
            }}
          >
            <div className="text-center font-bold text-sm mb-8 tracking-widest border-b border-gray-200 pb-4">
              {(title || "PEÇA JURÍDICA").toUpperCase()}
            </div>
            <div className="space-y-0">
              {renderPreview()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
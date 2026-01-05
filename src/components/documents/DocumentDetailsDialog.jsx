import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, FileText, ExternalLink, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function DocumentDetailsDialog({ document, isOpen, onClose, theme = 'light' }) {
  const isDark = theme === 'dark';

  const exportToPDF = () => {
    if (!document) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    
    // Título
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(document.title || 'Documento', margin, margin);
    
    // Tipo e data
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    let yPos = margin + 10;
    doc.text(`Tipo: ${document.type || 'N/A'}`, margin, yPos);
    yPos += 6;
    doc.text(`Criado em: ${new Date(document.created_date).toLocaleDateString('pt-BR')}`, margin, yPos);
    yPos += 10;
    
    // Conteúdo
    if (document.content) {
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(document.content, maxWidth);
      
      lines.forEach(line => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin, yPos);
        yPos += 6;
      });
    }
    
    // OCR Content
    if (document.ocr_content) {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      yPos += 10;
      doc.setFont(undefined, 'bold');
      doc.text('Texto Extraído (OCR):', margin, yPos);
      yPos += 8;
      doc.setFont(undefined, 'normal');
      
      const ocrLines = doc.splitTextToSize(document.ocr_content, maxWidth);
      ocrLines.forEach(line => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin, yPos);
        yPos += 6;
      });
    }
    
    doc.save(`${document.title || 'documento'}.pdf`);
    toast.success('PDF gerado com sucesso!');
  };

  const exportToWord = () => {
    if (!document) return;
    
    let content = `${document.title || 'Documento'}\n\n`;
    content += `Tipo: ${document.type || 'N/A'}\n`;
    content += `Data de Criação: ${new Date(document.created_date).toLocaleDateString('pt-BR')}\n\n`;
    
    if (document.content) {
      content += `CONTEÚDO:\n${document.content}\n\n`;
    }
    
    if (document.ocr_content) {
      content += `TEXTO EXTRAÍDO (OCR):\n${document.ocr_content}\n\n`;
    }
    
    if (document.notes) {
      content += `OBSERVAÇÕES:\n${document.notes}\n`;
    }
    
    const blob = new Blob([content], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${document.title || 'documento'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Documento Word exportado!');
  };
  const [copied, setCopied] = React.useState(false);

  if (!document) return null;

  const handleCopyContent = () => {
    const contentToCopy = document.content || document.ocr_content || '';
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    toast.success('Conteúdo copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  const hasContent = document.content || document.ocr_content;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-neutral-900 text-white' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            {document.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-sm font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                Tipo
              </p>
              <Badge variant="secondary">
                {document.type || 'Documento'}
              </Badge>
            </div>
            <div>
              <p className={`text-sm font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                Data de Criação
              </p>
              <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {new Date(document.created_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div>
              <p className={`text-sm font-medium mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {document.notes && (
            <div>
              <p className={`text-sm font-medium mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                Observações
              </p>
              <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                {document.notes}
              </p>
            </div>
          )}

          {/* Content Section */}
          {hasContent && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                  Conteúdo do Documento
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyContent}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Conteúdo
                    </>
                  )}
                </Button>
              </div>
              <div className={`p-4 rounded-lg border max-h-96 overflow-y-auto ${
                isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <pre className={`text-sm whitespace-pre-wrap font-mono ${
                  isDark ? 'text-neutral-300' : 'text-gray-800'
                }`}>
                  {document.content || document.ocr_content}
                </pre>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {document.file_url && (
              <>
                <Button
                  onClick={handleDownload}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Arquivo
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </>
            )}
            {!document.file_url && !hasContent && (
              <div className={`text-center py-8 w-full ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum conteúdo disponível</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
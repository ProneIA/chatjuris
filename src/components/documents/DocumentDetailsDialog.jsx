import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, FileText, ExternalLink, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function DocumentDetailsDialog({ document, isOpen, onClose, theme = 'light' }) {
  const isDark = theme === 'dark';
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
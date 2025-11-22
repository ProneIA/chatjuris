import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Clock, 
  Search, 
  Calendar,
  Eye,
  Download,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DocumentHistory({ documents, onSelectDocument, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDocs = documents.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const typeLabels = {
    peticao: "Petição",
    recurso: "Recurso",
    contestacao: "Contestação",
    contrato: "Contrato",
    procuracao: "Procuração",
    parecer: "Parecer",
    memorando: "Memorando",
    outros: "Outros"
  };

  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800",
    review: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    sent: "bg-purple-100 text-purple-800",
    archived: "bg-slate-100 text-slate-800"
  };

  const statusLabels = {
    draft: "Rascunho",
    review: "Em Revisão",
    approved: "Aprovado",
    sent: "Enviado",
    archived: "Arquivado"
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Histórico de Documentos Gerados
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar no histórico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-y-auto">
          {filteredDocs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum documento encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
                <div 
                  key={doc.id}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => {
                    onSelectDocument(doc);
                    onClose?.();
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <h3 className="font-semibold text-slate-900 truncate">
                          {doc.title}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {typeLabels[doc.type] || doc.type}
                        </Badge>
                        <Badge className={`text-xs ${statusColors[doc.status]}`}>
                          {statusLabels[doc.status] || doc.status}
                        </Badge>
                        {doc.template_used && (
                          <Badge variant="secondary" className="text-xs">
                            📝 {doc.template_used}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {doc.created_date && format(new Date(doc.created_date), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {doc.created_by && (
                          <div>
                            Criado por: {doc.created_by}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDocument(doc);
                        onClose?.();
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
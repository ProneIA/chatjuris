import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, FileText, FolderOpen, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ClientRelatedData({ clientId, theme = 'light' }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const { data: cases = [] } = useQuery({
    queryKey: ['client-cases', clientId],
    queryFn: () => base44.entities.Case.filter({ client_id: clientId }, '-created_date'),
    enabled: !!clientId
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      const all = await base44.entities.LegalDocument.list('-created_date', 200);
      return all.filter(doc => Array.isArray(doc.client_ids) && doc.client_ids.includes(clientId));
    },
    enabled: !!clientId
  });

  const statusColors = {
    new: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    waiting: "bg-orange-100 text-orange-700",
    closed: "bg-green-100 text-green-700",
    archived: "bg-gray-100 text-gray-700"
  };

  const statusLabels = {
    new: "Novo",
    in_progress: "Em Andamento",
    waiting: "Aguardando",
    closed: "Encerrado",
    archived: "Arquivado"
  };

  return (
    <div className="space-y-6">
      {/* Processos */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Briefcase className="w-5 h-5" />
          Processos ({cases.length})
        </h3>
        {cases.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Nenhum processo vinculado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {cases.map((c) => (
              <Card
                key={c.id}
                className={`cursor-pointer transition-all hover:shadow-md ${isDark ? 'bg-neutral-800 border-neutral-700 hover:border-neutral-600' : 'hover:border-blue-300'}`}
                onClick={() => navigate(createPageUrl("CaseDetails") + "?id=" + c.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {c.title}
                      </h4>
                      {c.description && (
                        <p className={`text-sm mb-2 line-clamp-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                          {c.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Badge className={statusColors[c.status]}>
                          {statusLabels[c.status]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {c.area}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Documentos */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <FileText className="w-5 h-5" />
          Documentos ({documents.length})
        </h3>
        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Nenhum documento vinculado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {documents.slice(0, 5).map((doc) => (
              <Card
                key={doc.id}
                className={`cursor-pointer transition-all hover:shadow-md ${isDark ? 'bg-neutral-800 border-neutral-700 hover:border-neutral-500' : 'hover:border-blue-300'}`}
                onClick={() => navigate(createPageUrl('DocumentsEnhanced') + '?docId=' + doc.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDark ? 'bg-neutral-700' : 'bg-blue-50'
                    }`}>
                      <FileText className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {doc.title}
                      </p>
                      {doc.type && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {doc.type}
                        </Badge>
                      )}
                    </div>
                    {doc.file_url && (
                      <Eye className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                    )}
                    {!doc.file_url && (
                      <span className={`text-xs flex-shrink-0 ${isDark ? 'text-neutral-600' : 'text-slate-300'}`}>sem arquivo</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {documents.length > 5 && (
              <p className="text-center text-sm text-slate-500">
                + {documents.length - 5} documento(s)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
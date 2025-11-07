import React from "react";
import { motion } from "framer-motion";
import { FileText, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeColors = {
  peticao: "bg-blue-100 text-blue-800",
  recurso: "bg-purple-100 text-purple-800",
  contestacao: "bg-red-100 text-red-800",
  contrato: "bg-green-100 text-green-800",
  procuracao: "bg-yellow-100 text-yellow-800",
  parecer: "bg-indigo-100 text-indigo-800",
  memorando: "bg-pink-100 text-pink-800",
  outros: "bg-slate-100 text-slate-800"
};

const statusColors = {
  draft: "bg-yellow-100 text-yellow-800",
  review: "bg-purple-100 text-purple-800",
  approved: "bg-green-100 text-green-800",
  sent: "bg-blue-100 text-blue-800",
  archived: "bg-slate-100 text-slate-800"
};

export default function DocumentList({ documents, isLoading, onSelectDocument, selectedDocument }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">Nenhum documento encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map(doc => (
        <motion.div
          key={doc.id}
          whileHover={{ scale: 1.01, y: -2 }}
          onClick={() => onSelectDocument(doc)}
          className={`bg-white rounded-xl p-6 border-2 cursor-pointer transition-all ${
            selectedDocument?.id === doc.id
              ? 'border-blue-500 shadow-lg'
              : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900 text-lg">
                  {doc.title}
                </h3>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                {doc.template_used && (
                  <span>Template: {doc.template_used}</span>
                )}
                {doc.created_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(doc.created_date), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={statusColors[doc.status]}>
                {doc.status === 'draft' && 'Rascunho'}
                {doc.status === 'review' && 'Em Revisão'}
                {doc.status === 'approved' && 'Aprovado'}
                {doc.status === 'sent' && 'Enviado'}
                {doc.status === 'archived' && 'Arquivado'}
              </Badge>
              <Badge className={typeColors[doc.type]}>
                {doc.type?.charAt(0).toUpperCase() + doc.type?.slice(1)}
              </Badge>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
import React from "react";
import { motion } from "framer-motion";
import { FolderOpen, Calendar, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const areaColors = {
  civil: "bg-blue-100 text-blue-800",
  criminal: "bg-red-100 text-red-800",
  trabalhista: "bg-purple-100 text-purple-800",
  tributario: "bg-yellow-100 text-yellow-800",
  familia: "bg-pink-100 text-pink-800",
  empresarial: "bg-green-100 text-green-800",
  consumidor: "bg-orange-100 text-orange-800",
  previdenciario: "bg-indigo-100 text-indigo-800",
  outros: "bg-slate-100 text-slate-800"
};

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  waiting: "bg-yellow-100 text-yellow-800",
  closed: "bg-green-100 text-green-800",
  archived: "bg-slate-100 text-slate-800"
};

const priorityColors = {
  low: "bg-slate-100 text-slate-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

export default function CaseList({ cases, isLoading, onSelectCase, selectedCase }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">Nenhum processo encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cases.map(caseItem => (
        <motion.div
          key={caseItem.id}
          whileHover={{ scale: 1.01, y: -2 }}
          onClick={() => onSelectCase(caseItem)}
          className={`bg-white rounded-xl p-6 border-2 cursor-pointer transition-all ${
            selectedCase?.id === caseItem.id
              ? 'border-blue-500 shadow-lg'
              : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-slate-900 text-lg">
                  {caseItem.title}
                </h3>
                {caseItem.priority === 'urgent' && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              {caseItem.case_number && (
                <p className="text-sm text-slate-500 mb-2">
                  Processo: {caseItem.case_number}
                </p>
              )}
              <p className="text-sm text-slate-600">
                Cliente: {caseItem.client_name}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={statusColors[caseItem.status]}>
                {caseItem.status === 'new' && 'Novo'}
                {caseItem.status === 'in_progress' && 'Em Andamento'}
                {caseItem.status === 'waiting' && 'Aguardando'}
                {caseItem.status === 'closed' && 'Fechado'}
                {caseItem.status === 'archived' && 'Arquivado'}
              </Badge>
              <Badge className={priorityColors[caseItem.priority]}>
                {caseItem.priority === 'urgent' && 'Urgente'}
                {caseItem.priority === 'high' && 'Alta'}
                {caseItem.priority === 'medium' && 'Média'}
                {caseItem.priority === 'low' && 'Baixa'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Badge className={areaColors[caseItem.area]}>
              {caseItem.area?.charAt(0).toUpperCase() + caseItem.area?.slice(1)}
            </Badge>
            {caseItem.deadline && (
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Prazo: {format(new Date(caseItem.deadline), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
            {caseItem.value && (
              <div className="text-slate-600">
                Valor: R$ {caseItem.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
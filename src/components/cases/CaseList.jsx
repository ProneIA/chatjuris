import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const areaColors = {
  civil: "bg-blue-100 text-blue-800",
  criminal: "bg-red-100 text-red-800",
  trabalhista: "bg-green-100 text-green-800",
  tributario: "bg-yellow-100 text-yellow-800",
  familia: "bg-purple-100 text-purple-800",
  empresarial: "bg-indigo-100 text-indigo-800",
  consumidor: "bg-pink-100 text-pink-800",
  previdenciario: "bg-orange-100 text-orange-800",
  outros: "bg-slate-100 text-slate-800"
};

const statusColors = {
  new: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  waiting: "bg-yellow-100 text-yellow-800",
  closed: "bg-slate-100 text-slate-800",
  archived: "bg-slate-100 text-slate-500"
};

const priorityColors = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700"
};

export default function CaseList({ cases, isLoading, onSelectCase, selectedCase, folders = [], onMoveToFolder }) {
  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum processo encontrado</h3>
        <p className="text-slate-600">Crie um novo processo para começar</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {cases.map((caseItem) => {
        const isSelected = selectedCase?.id === caseItem.id;
        return (
          <motion.div
            key={caseItem.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Card
              onClick={() => onSelectCase(caseItem)}
              className={cn(
                "p-4 cursor-pointer transition-all hover:shadow-md",
                isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-slate-50"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {caseItem.title}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {caseItem.client_name}
                  </p>
                  {caseItem.case_number && (
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      {caseItem.case_number}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={statusColors[caseItem.status]}>
                  {caseItem.status === 'new' && 'Novo'}
                  {caseItem.status === 'in_progress' && 'Em Andamento'}
                  {caseItem.status === 'waiting' && 'Aguardando'}
                  {caseItem.status === 'closed' && 'Encerrado'}
                  {caseItem.status === 'archived' && 'Arquivado'}
                </Badge>
                
                <Badge className={priorityColors[caseItem.priority]}>
                  {caseItem.priority === 'urgent' && '🔥 Urgente'}
                  {caseItem.priority === 'high' && 'Alta'}
                  {caseItem.priority === 'medium' && 'Média'}
                  {caseItem.priority === 'low' && 'Baixa'}
                </Badge>

                <Badge variant="outline" className={areaColors[caseItem.area]}>
                  {caseItem.area}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                {caseItem.deadline && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(caseItem.deadline), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                )}
                {caseItem.value && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(caseItem.value)}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
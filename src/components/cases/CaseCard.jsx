import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, MoreVertical, Folder } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const areaColors = {
  civil: "bg-blue-100 text-blue-800",
  criminal: "bg-red-100 text-red-800",
  trabalhista: "bg-green-100 text-green-800",
  tributario: "bg-purple-100 text-purple-800",
  familia: "bg-pink-100 text-pink-800",
  empresarial: "bg-indigo-100 text-indigo-800",
  consumidor: "bg-orange-100 text-orange-800",
  previdenciario: "bg-teal-100 text-teal-800",
  outros: "bg-gray-100 text-gray-800"
};

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  waiting: "bg-yellow-100 text-yellow-800",
  closed: "bg-gray-100 text-gray-800",
  archived: "bg-slate-100 text-slate-800"
};

const priorityColors = {
  low: "bg-slate-100 text-slate-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

export default function CaseCard({ 
  caseData, 
  isSelected, 
  onClick, 
  folders = [],
  onMoveToFolder 
}) {
  const folder = folders.find(f => f.id === caseData.folder_id);

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl p-4 border-2 cursor-pointer transition-all",
        isSelected ? "border-blue-400 shadow-lg" : "border-slate-200 hover:border-blue-200"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 mb-1 truncate">
            {caseData.title}
          </h3>
          {caseData.client_name && (
            <p className="text-sm text-slate-600">
              Cliente: {caseData.client_name}
            </p>
          )}
          {caseData.case_number && (
            <p className="text-xs text-slate-500 mt-1">
              Nº {caseData.case_number}
            </p>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Folder className="w-4 h-4 mr-2" />
                Mover para pasta
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveToFolder(null);
                  }}
                >
                  Sem pasta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {folders.map(folder => (
                  <DropdownMenuItem 
                    key={folder.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveToFolder(folder.id);
                    }}
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Badge className={statusColors[caseData.status]}>
          {caseData.status === 'new' && 'Novo'}
          {caseData.status === 'in_progress' && 'Em Andamento'}
          {caseData.status === 'waiting' && 'Aguardando'}
          {caseData.status === 'closed' && 'Encerrado'}
          {caseData.status === 'archived' && 'Arquivado'}
        </Badge>
        <Badge className={priorityColors[caseData.priority]}>
          {caseData.priority === 'urgent' && 'Urgente'}
          {caseData.priority === 'high' && 'Alta'}
          {caseData.priority === 'medium' && 'Média'}
          {caseData.priority === 'low' && 'Baixa'}
        </Badge>
        <Badge className={areaColors[caseData.area]} variant="outline">
          {caseData.area}
        </Badge>
      </div>

      {folder && (
        <div className="flex items-center gap-2 mb-2 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded">
          <Folder className="w-3 h-3" />
          <span>{folder.name}</span>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-slate-600">
        {caseData.deadline && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(caseData.deadline), "dd/MM/yyyy", { locale: ptBR })}
          </div>
        )}
        {caseData.value && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            }).format(caseData.value)}
          </div>
        )}
      </div>
    </motion.div>
  );
}
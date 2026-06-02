import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, FolderInput, Folder as FolderIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const areaColors = {
  civil:          "bg-[var(--info-bg)] text-[var(--info)]",
  criminal:       "bg-[var(--danger-bg)] text-[var(--danger)]",
  trabalhista:    "bg-[var(--success-bg)] text-[var(--success)]",
  tributario:     "bg-[var(--warn-bg)] text-[#7a6010]",
  familia:        "bg-[var(--surface)] text-[var(--text-secondary)]",
  empresarial:    "bg-[var(--surface)] text-[var(--text-secondary)]",
  consumidor:     "bg-[var(--surface)] text-[var(--text-secondary)]",
  previdenciario: "bg-[var(--warn-bg)] text-[#7a6010]",
  outros:         "bg-[var(--surface)] text-[var(--text-secondary)]"
};

const statusColors = {
  new:        "bg-[var(--success-bg)] text-[var(--success)]",
  in_progress:"bg-[var(--info-bg)] text-[var(--info)]",
  waiting:    "bg-[var(--warn-bg)] text-[#7a6010]",
  closed:     "bg-[var(--surface)] text-[var(--text-secondary)]",
  archived:   "bg-[var(--surface)] text-[var(--text-muted)]"
};

const priorityColors = {
  low:    "bg-[var(--surface)] text-[var(--text-secondary)]",
  medium: "bg-[var(--info-bg)] text-[var(--info)]",
  high:   "bg-[var(--warn-bg)] text-[#7a6010]",
  urgent: "bg-[var(--danger-bg)] text-[var(--danger)]"
};

export default function CaseCard({ 
  caseItem, 
  isSelected, 
  onClick, 
  folders = [],
  currentFolderId,
  onMoveToFolder 
}) {
  if (!caseItem || !caseItem.title) return null;

  const handleMoveToFolder = (folderId) => {
    onMoveToFolder?.(caseItem.id, folderId);
  };

  const currentFolder = folders.find(f => f.id === caseItem.folder_id);

  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <Card
        onClick={onClick}
        className={cn(
          "p-4 cursor-pointer transition-all",
          isSelected ? "ring-2 ring-[var(--accent)] bg-[var(--surface)]" : "hover:bg-[var(--surface)]"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }} className="truncate">
              {caseItem.title}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }} className="truncate">
              {caseItem.client_name}
            </p>
            {caseItem.case_number && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }} className="font-mono">
                {caseItem.case_number}
              </p>
            )}
          </div>
          <div className="flex items-start gap-2 shrink-0 ml-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <FolderInput className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Mover para pasta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMoveToFolder(null); }}>
                  <FolderIcon className="w-3 h-3 mr-2" /> Sem pasta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={(e) => { e.stopPropagation(); handleMoveToFolder(folder.id); }}
                  >
                    <FolderIcon className="w-3 h-3 mr-2" /> {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
          
          {currentFolder && (
            <Badge variant="outline" style={{ borderColor: 'var(--border)' }}>
              <FolderIcon className="w-3 h-3 mr-1" />
              {currentFolder.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {caseItem.deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(caseItem.deadline), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          )}
          {caseItem.value && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(caseItem.value)}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
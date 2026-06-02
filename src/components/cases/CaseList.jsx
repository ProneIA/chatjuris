import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import PullToRefresh from "@/components/mobile/PullToRefresh";

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

export default function CaseList({ cases, isLoading, onSelectCase, selectedCase, folders = [], onMoveToFolder, onRefresh, isDark }) {
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
        <div style={{ width: 64, height: 64, background: 'var(--surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <FileText className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Nenhum processo encontrado</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Crie um novo processo para começar</p>
      </div>
    );
  }

  const content = (
    <div className="grid gap-4">
      {cases.map((caseItem) => {
        const isSelected = selectedCase?.id === caseItem.id;
        return (
          <motion.div key={caseItem.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Card
              onClick={() => onSelectCase(caseItem)}
              className={cn(
                "p-4 cursor-pointer transition-all",
                isSelected ? "ring-2 ring-[var(--accent)] bg-[var(--surface)]" : "hover:bg-[var(--surface)]"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {caseItem.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {caseItem.client_name}
                  </p>
                  {caseItem.case_number && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }} className="font-mono">
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
      })}
    </div>
  );

  if (onRefresh) {
    return (
      <PullToRefresh onRefresh={onRefresh} isDark={isDark}>
        {content}
      </PullToRefresh>
    );
  }
  return content;
}
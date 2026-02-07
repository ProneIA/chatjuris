import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const eventTypes = [
  { value: "meeting", label: "Reunião" },
  { value: "deadline", label: "Prazo" },
  { value: "research", label: "Pesquisa" },
  { value: "hearing", label: "Audiência" },
  { value: "consultation", label: "Consulta" },
  { value: "team_sync", label: "Sincronização" },
  { value: "personal", label: "Pessoal" },
  { value: "task", label: "Tarefa" },
  { value: "other", label: "Outro" }
];

const priorities = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" }
];

const statuses = [
  { value: "scheduled", label: "Agendado" },
  { value: "completed", label: "Concluído" },
  { value: "cancelled", label: "Cancelado" },
  { value: "overdue", label: "Atrasado" }
];

export default function CalendarFilters({ filters, onChange, onClose, isDark }) {
  const toggleFilter = (category, value) => {
    const current = filters[category] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onChange({ ...filters, [category]: updated });
  };

  const clearAllFilters = () => {
    onChange({ types: [], priorities: [], statuses: [] });
  };

  const hasActiveFilters = filters.types?.length > 0 || filters.priorities?.length > 0 || filters.statuses?.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={`border-b px-6 py-4 ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Filtros</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Limpar todos
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Event Types */}
        <div>
          <p className={`text-sm font-medium mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            Tipo de Evento
          </p>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map(type => (
              <Badge
                key={type.value}
                variant={filters.types?.includes(type.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleFilter('types', type.value)}
              >
                {type.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Priorities */}
        <div>
          <p className={`text-sm font-medium mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            Prioridade
          </p>
          <div className="flex flex-wrap gap-2">
            {priorities.map(priority => (
              <Badge
                key={priority.value}
                variant={filters.priorities?.includes(priority.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleFilter('priorities', priority.value)}
              >
                {priority.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Statuses */}
        <div>
          <p className={`text-sm font-medium mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            Status
          </p>
          <div className="flex flex-wrap gap-2">
            {statuses.map(status => (
              <Badge
                key={status.value}
                variant={filters.statuses?.includes(status.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleFilter('statuses', status.value)}
              >
                {status.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Clock, 
  MapPin, 
  Calendar as CalendarIcon, 
  User, 
  FileText, 
  Edit2, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  Flag
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const priorityConfig = {
  low: { label: "Baixa", color: "bg-blue-100 text-blue-800" },
  medium: { label: "Média", color: "bg-yellow-100 text-yellow-800" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-800" },
  urgent: { label: "Urgente", color: "bg-red-100 text-red-800" }
};

const statusConfig = {
  scheduled: { label: "Agendado", icon: CalendarIcon, color: "text-blue-600" },
  completed: { label: "Concluído", icon: CheckCircle2, color: "text-green-600" },
  cancelled: { label: "Cancelado", icon: AlertCircle, color: "text-red-600" },
  rescheduled: { label: "Reagendado", icon: Clock, color: "text-orange-600" },
  overdue: { label: "Atrasado", icon: AlertCircle, color: "text-red-600" }
};

export default function EventDetailsDialog({ event, onUpdate, onDelete, onEdit, onClose, isDark }) {
  const handleToggleAction = (actionId) => {
    const updatedActions = event.actions.map(action => {
      if (action.id === actionId) {
        return {
          ...action,
          completed: !action.completed,
          completed_at: !action.completed ? new Date().toISOString() : null
        };
      }
      return action;
    });
    
    onUpdate(event.id, { ...event, actions: updatedActions });
  };

  const handleStatusChange = (newStatus) => {
    onUpdate(event.id, { ...event, status: newStatus });
  };

  const StatusIcon = statusConfig[event.status]?.icon || CalendarIcon;
  const completedActions = event.actions?.filter(a => a.completed).length || 0;
  const totalActions = event.actions?.length || 0;
  const progress = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : ''}`}>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{event.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusConfig[event.status]?.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig[event.status]?.label}
                </Badge>
                <Badge className={priorityConfig[event.priority]?.color}>
                  <Flag className="w-3 h-3 mr-1" />
                  {priorityConfig[event.priority]?.label}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={onEdit}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => onDelete(event.id)} className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <Clock className={isDark ? 'text-neutral-400' : 'text-gray-400'} />
            <div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {format(new Date(event.start_time), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                {format(new Date(event.start_time), 'HH:mm')} - {format(new Date(event.end_time), 'HH:mm')}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-3">
              <MapPin className={isDark ? 'text-neutral-400' : 'text-gray-400'} />
              <p className={isDark ? 'text-white' : 'text-gray-900'}>{event.location}</p>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className={isDark ? 'text-neutral-400' : 'text-gray-400'} />
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Descrição</h3>
              </div>
              <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>{event.description}</p>
            </div>
          )}

          {/* Actions/Checklist */}
          {event.actions && event.actions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Ações ({completedActions}/{totalActions})
                </h3>
                <div className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                  {Math.round(progress)}% concluído
                </div>
              </div>
              <div className={`h-2 rounded-full mb-4 ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="space-y-2">
                {event.actions.map(action => (
                  <div
                    key={action.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors",
                      isDark ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-gray-50 hover:bg-gray-100'
                    )}
                  >
                    <Checkbox
                      checked={action.completed}
                      onCheckedChange={() => handleToggleAction(action.id)}
                    />
                    <span className={cn(
                      "flex-1",
                      action.completed && "line-through opacity-60"
                    )}>
                      {action.title}
                    </span>
                    {action.completed && action.completed_at && (
                      <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        {format(new Date(action.completed_at), 'HH:mm')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {event.status === 'scheduled' && (
            <div className="pt-4 border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'}">
              <p className={`text-sm mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Ações rápidas:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('completed')}
                  className="text-green-600"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Marcar como Concluído
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('cancelled')}
                  className="text-red-600"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, CheckSquare, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('due_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const filteredTasks = tasks.filter(task =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingTasks = filteredTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');
  const overdueTasks = pendingTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));

  const getTaskUrgency = (task) => {
    if (!task.due_date) return null;
    const dueDate = new Date(task.due_date);
    if (isPast(dueDate) && !isToday(dueDate)) return 'overdue';
    if (isToday(dueDate)) return 'today';
    if (isTomorrow(dueDate)) return 'tomorrow';
    return 'upcoming';
  };

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800"
  };

  const statusColors = {
    pending: "bg-slate-100 text-slate-800",
    in_progress: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-slate-100 text-slate-800"
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-neutral-950 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white">Tarefas e Prazos</h1>
          <p className="text-gray-500 mt-1">Gerencie suas tarefas e compromissos</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors">
          <p className="text-sm text-gray-500 font-medium">Pendentes</p>
          <p className="text-2xl font-light text-white mt-1">{pendingTasks.length}</p>
        </div>
        <div className="border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors">
          <p className="text-sm text-gray-500 font-medium">Atrasadas</p>
          <p className="text-2xl font-light text-white mt-1">{overdueTasks.length}</p>
        </div>
        <div className="border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors">
          <p className="text-sm text-gray-500 font-medium">Concluídas</p>
          <p className="text-2xl font-light text-white mt-1">{completedTasks.length}</p>
        </div>
        <div className="border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors">
          <p className="text-sm text-gray-500 font-medium">Total</p>
          <p className="text-2xl font-light text-white mt-1">{tasks.length}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Buscar tarefas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-white">Tarefas Pendentes</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl bg-gray-800" />)}
          </div>
        ) : pendingTasks.length === 0 ? (
          <Card className="p-8 text-center bg-black border-gray-800">
            <CheckSquare className="w-12 h-12 mx-auto text-gray-700 mb-3" />
            <p className="text-gray-500">Nenhuma tarefa pendente</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map(task => {
              const urgency = getTaskUrgency(task);
              return (
                <Card 
                  key={task.id} 
                  className={`p-4 bg-black border-gray-800 hover:border-gray-600 transition-all ${
                    urgency === 'overdue' ? 'border-l-4 border-l-red-500' :
                    urgency === 'today' ? 'border-l-4 border-l-orange-500' :
                    urgency === 'tomorrow' ? 'border-l-4 border-l-yellow-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={(e) => {
                          updateMutation.mutate({
                            id: task.id,
                            data: { ...task, status: e.target.checked ? 'completed' : 'pending' }
                          });
                        }}
                        className="mt-1 w-5 h-5 rounded border-gray-700 bg-gray-900"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-white mb-1">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                          {task.due_date && (
                            <div className={`flex items-center gap-1 ${
                              urgency === 'overdue' ? 'text-red-400 font-medium' :
                              urgency === 'today' ? 'text-orange-400 font-medium' :
                              urgency === 'tomorrow' ? 'text-yellow-400 font-medium' :
                              'text-gray-400'
                            }`}>
                              <Calendar className="w-4 h-4" />
                              {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                              {urgency === 'overdue' && ' (Atrasada)'}
                              {urgency === 'today' && ' (Hoje)'}
                              {urgency === 'tomorrow' && ' (Amanhã)'}
                            </div>
                          )}
                          {task.assigned_to && (
                            <span className="text-gray-500">• {task.assigned_to}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className="bg-gray-800 text-gray-300 border border-gray-700">
                        {task.priority === 'urgent' && 'Urgente'}
                        {task.priority === 'high' && 'Alta'}
                        {task.priority === 'medium' && 'Média'}
                        {task.priority === 'low' && 'Baixa'}
                      </Badge>
                      {task.type && (
                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                          {task.type === 'hearing' && 'Audiência'}
                          {task.type === 'deadline' && 'Prazo'}
                          {task.type === 'meeting' && 'Reunião'}
                          {task.type === 'document' && 'Documento'}
                          {task.type === 'research' && 'Pesquisa'}
                          {task.type === 'other' && 'Outro'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">Tarefas Concluídas</h2>
          <div className="space-y-3 opacity-60">
            {completedTasks.slice(0, 5).map(task => (
              <Card key={task.id} className="p-4 bg-black border-gray-800">
                <div className="flex items-start gap-3">
                  <CheckSquare className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-400 line-through">{task.title}</h3>
                    {task.due_date && (
                      <p className="text-sm text-gray-600 mt-1">
                        Concluída em {format(new Date(task.updated_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
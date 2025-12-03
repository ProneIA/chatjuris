import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckSquare, Calendar, Plus, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function Tasks({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    type: "other",
    status: "pending"
  });
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

  const createMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success("Tarefa criada com sucesso!");
      setShowForm(false);
      setNewTask({
        title: "",
        description: "",
        due_date: "",
        priority: "medium",
        type: "other",
        status: "pending"
      });
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

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white">Tarefas e Prazos</h1>
          <p className="text-neutral-500 mt-1">Gerencie suas tarefas e compromissos</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-white text-black hover:bg-gray-100"
        >
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? "Cancelar" : "Nova Tarefa"}
        </Button>
      </div>

      {showForm && (
        <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900 space-y-4">
          <h3 className="text-lg font-medium text-white mb-4">Criar Nova Tarefa</h3>
          <Input
            placeholder="Título da tarefa *"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="bg-black border-neutral-700 text-white placeholder:text-neutral-600"
          />
          <Input
            placeholder="Descrição (opcional)"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="bg-black border-neutral-700 text-white placeholder:text-neutral-600"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-neutral-400 mb-2 block">Data de vencimento *</label>
              <Input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className="bg-black border-neutral-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 mb-2 block">Prioridade</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full p-2 bg-black border border-neutral-700 rounded-md text-white"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-400 mb-2 block">Tipo</label>
              <select
                value={newTask.type}
                onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                className="w-full p-2 bg-black border border-neutral-700 rounded-md text-white"
              >
                <option value="hearing">Audiência</option>
                <option value="deadline">Prazo</option>
                <option value="meeting">Reunião</option>
                <option value="document">Documento</option>
                <option value="research">Pesquisa</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => createMutation.mutate(newTask)}
              disabled={!newTask.title || !newTask.due_date || createMutation.isPending}
              className="bg-white text-black hover:bg-gray-100"
            >
              {createMutation.isPending ? "Criando..." : "Criar Tarefa"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="border-neutral-700 text-white hover:bg-neutral-800"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="border border-neutral-800 rounded-lg p-4 bg-black">
          <p className="text-sm text-neutral-500">Pendentes</p>
          <p className="text-2xl font-light text-white mt-1">{pendingTasks.length}</p>
        </div>
        <div className="border border-neutral-800 rounded-lg p-4 bg-black">
          <p className="text-sm text-red-400">Atrasadas</p>
          <p className="text-2xl font-light text-white mt-1">{overdueTasks.length}</p>
        </div>
        <div className="border border-neutral-800 rounded-lg p-4 bg-black">
          <p className="text-sm text-green-400">Concluídas</p>
          <p className="text-2xl font-light text-white mt-1">{completedTasks.length}</p>
        </div>
        <div className="border border-neutral-800 rounded-lg p-4 bg-black">
          <p className="text-sm text-neutral-500">Total</p>
          <p className="text-2xl font-light text-white mt-1">{tasks.length}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <Input
          placeholder="Buscar tarefas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-white">Tarefas Pendentes</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl bg-neutral-800" />)}
          </div>
        ) : pendingTasks.length === 0 ? (
          <div className="border border-neutral-800 rounded-lg p-8 text-center bg-black">
            <CheckSquare className="w-12 h-12 mx-auto text-neutral-700 mb-3" />
            <p className="text-neutral-500">Nenhuma tarefa pendente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map(task => {
              const urgency = getTaskUrgency(task);
              return (
                <div 
                  key={task.id} 
                  className={`p-4 border border-neutral-800 rounded-lg bg-black hover:border-neutral-700 transition-all ${
                    urgency === 'overdue' ? 'border-l-2 border-l-red-500' :
                    urgency === 'today' ? 'border-l-2 border-l-orange-500' :
                    urgency === 'tomorrow' ? 'border-l-2 border-l-yellow-500' : ''
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
                        className="mt-1 w-5 h-5 rounded border-neutral-700 bg-neutral-900"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-white mb-1">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-neutral-500 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                          {task.due_date && (
                            <div className={`flex items-center gap-1 ${
                              urgency === 'overdue' ? 'text-red-400' :
                              urgency === 'today' ? 'text-orange-400' :
                              urgency === 'tomorrow' ? 'text-yellow-400' :
                              'text-neutral-500'
                            }`}>
                              <Calendar className="w-4 h-4" />
                              {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                              {urgency === 'overdue' && ' (Atrasada)'}
                              {urgency === 'today' && ' (Hoje)'}
                              {urgency === 'tomorrow' && ' (Amanhã)'}
                            </div>
                          )}
                          {task.assigned_to && (
                            <span className="text-neutral-600">• {task.assigned_to}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.priority === 'urgent' ? 'bg-red-500/10 text-red-400' :
                        task.priority === 'high' ? 'bg-orange-500/10 text-orange-400' :
                        task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-neutral-800 text-neutral-400'
                      }`}>
                        {task.priority === 'urgent' && 'Urgente'}
                        {task.priority === 'high' && 'Alta'}
                        {task.priority === 'medium' && 'Média'}
                        {task.priority === 'low' && 'Baixa'}
                      </span>
                      {task.type && (
                        <span className="text-xs px-2 py-1 rounded border border-neutral-800 text-neutral-500">
                          {task.type === 'hearing' && 'Audiência'}
                          {task.type === 'deadline' && 'Prazo'}
                          {task.type === 'meeting' && 'Reunião'}
                          {task.type === 'document' && 'Documento'}
                          {task.type === 'research' && 'Pesquisa'}
                          {task.type === 'other' && 'Outro'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
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
              <div key={task.id} className="p-4 border border-neutral-800 rounded-lg bg-black">
                <div className="flex items-start gap-3">
                  <CheckSquare className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-400 line-through">{task.title}</h3>
                    {task.due_date && (
                      <p className="text-sm text-neutral-600 mt-1">
                        Concluída em {format(new Date(task.updated_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
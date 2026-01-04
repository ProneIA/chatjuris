import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, CheckCircle2, Circle, Clock, AlertCircle, Trash2, Pencil, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CaseTasksSection({ caseData, theme = 'dark' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    assigned_to_name: "",
    due_date: "",
    priority: "medium",
    status: "pending",
    type: "other"
  });

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Buscar tarefas do processo
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['case-tasks', caseData?.id],
    queryFn: async () => {
      if (!caseData?.id) return [];
      return await base44.entities.Task.filter({ case_id: caseData.id }, '-due_date');
    },
    enabled: !!caseData?.id
  });

  // Buscar usuários para atribuição
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        return await base44.entities.User.list();
      } catch (error) {
        return [];
      }
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTask) {
        return await base44.entities.Task.update(editingTask.id, data);
      } else {
        return await base44.entities.Task.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks'] });
      toast.success(editingTask ? "Tarefa atualizada!" : "Tarefa criada!");
      setShowForm(false);
      setEditingTask(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks'] });
      toast.success("Tarefa excluída!");
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }) => {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      return await base44.entities.Task.update(id, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks'] });
    }
  });

  const handleSave = () => {
    if (!formData.title || !formData.due_date) {
      toast.error("Preencha título e prazo");
      return;
    }

    const selectedUser = users.find(u => u.email === formData.assigned_to);
    const dataToSave = {
      ...formData,
      case_id: caseData.id,
      client_id: caseData.client_id,
      assigned_to_name: selectedUser?.full_name || ""
    };

    saveMutation.mutate(dataToSave);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || "",
      description: task.description || "",
      assigned_to: task.assigned_to || "",
      assigned_to_name: task.assigned_to_name || "",
      due_date: task.due_date || "",
      priority: task.priority || "medium",
      status: task.status || "pending",
      type: task.type || "other"
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assigned_to: "",
      assigned_to_name: "",
      due_date: "",
      priority: "medium",
      status: "pending",
      type: "other"
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'cancelled': return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'cancelled');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Tarefas do Processo
          </h3>
          <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            {pendingTasks.length} pendente(s), {completedTasks.length} concluída(s)
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTask(null);
            resetForm();
            setShowForm(true);
          }}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Lista de Tarefas Pendentes */}
      <div className="space-y-3">
        {isLoading ? (
          <p className={isDark ? 'text-neutral-500' : 'text-gray-500'}>Carregando tarefas...</p>
        ) : pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <div className={`text-center py-8 border-2 border-dashed rounded-lg ${isDark ? 'border-neutral-800' : 'border-gray-300'}`}>
            <p className={isDark ? 'text-neutral-500' : 'text-gray-500'}>
              Nenhuma tarefa criada ainda
            </p>
          </div>
        ) : (
          <>
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleStatusMutation.mutate({ id: task.id, currentStatus: task.status })}
                    className="mt-0.5"
                  >
                    {getStatusIcon(task.status)}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(task)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => deleteMutation.mutate(task.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {task.description && (
                      <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority === 'urgent' ? 'Urgente' :
                         task.priority === 'high' ? 'Alta' :
                         task.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(task.due_date), "dd 'de' MMM", { locale: ptBR })}
                      </Badge>
                      {task.assigned_to && (
                        <Badge variant="outline" className="text-xs">
                          <User className="w-3 h-3 mr-1" />
                          {task.assigned_to_name || task.assigned_to}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Tarefas Concluídas */}
            {completedTasks.length > 0 && (
              <details className="mt-4">
                <summary className={`cursor-pointer text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                  Ver tarefas concluídas ({completedTasks.length})
                </summary>
                <div className="space-y-2 mt-3">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border opacity-60 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleStatusMutation.mutate({ id: task.id, currentStatus: task.status })}
                          className="mt-0.5"
                        >
                          {getStatusIcon(task.status)}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium line-through ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {task.title}
                          </h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => deleteMutation.mutate(task.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>

      {/* Dialog de Criação/Edição */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Protocolar petição inicial"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes da tarefa..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prazo *</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hearing">Audiência</SelectItem>
                    <SelectItem value="deadline">Prazo</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                    <SelectItem value="research">Pesquisa</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Atribuir para</Label>
              <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Não atribuído</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.email}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
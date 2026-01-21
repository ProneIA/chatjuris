import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, CheckSquare, Calendar, Plus, X, List, CalendarDays, User, Filter, Briefcase, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isPast, isToday, isTomorrow, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { motion } from "framer-motion";
import BackNavigation from "../components/common/BackNavigation";
import { createPageUrl } from "@/utils";

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
    status: "pending",
    case_id: "",
    client_id: "",
    assigned_to: ""
  });
  const [viewMode, setViewMode] = useState("list");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterAssigned, setFilterAssigned] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('due_date'),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['task-cases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
    initialData: []
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['task-clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
    initialData: []
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['task-teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allTeams = await base44.entities.Team.list();
      return allTeams.filter(t => 
        t.owner_email === user.email || t.members?.includes(user.email)
      );
    },
    enabled: !!user?.email,
    initialData: []
  });

  const allTeamMembers = [...new Set(
    teams.flatMap(t => t.members || [])
  )];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (taskData) => {
      const cleanedData = {
        ...taskData,
        case_id: taskData.case_id && taskData.case_id !== "none" ? taskData.case_id : null,
        client_id: taskData.client_id && taskData.client_id !== "none" ? taskData.client_id : null,
        assigned_to: taskData.assigned_to && taskData.assigned_to !== "none" ? taskData.assigned_to : null,
      };
      return base44.entities.Task.create(cleanedData);
    },
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
        status: "pending",
        case_id: "",
        client_id: "",
        assigned_to: ""
      });
    },
  });

  const filteredTasks = tasks.filter(task => {
    const matchSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchAssigned = filterAssigned === 'all' || task.assigned_to === filterAssigned;
    return matchSearch && matchPriority && matchStatus && matchAssigned;
  });

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

  // Gerar dias do calendário
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const tasksInDay = (date) => {
    return filteredTasks.filter(t => {
      if (!t.due_date) return false;
      return format(new Date(t.due_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <BackNavigation to={createPageUrl("Dashboard")} theme={theme} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Gestão de Tarefas
            </h1>
            <p className={`mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Gerencie tarefas, prazos e responsabilidades
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? "Cancelar" : "Nova Tarefa"}
          </Button>
        </div>

      {showForm && (
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-white' : ''}>Criar Nova Tarefa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className={isDark ? 'text-neutral-300' : ''}>Título *</Label>
              <Input
                placeholder="Ex: Protocolar petição inicial"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label className={isDark ? 'text-neutral-300' : ''}>Descrição</Label>
              <Textarea
                placeholder="Detalhes da tarefa..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className={`h-20 ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : ''}>Data de Vencimento *</Label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : ''}>Prioridade</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}>
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

              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : ''}>Tipo de Tarefa</Label>
                <Select value={newTask.type} onValueChange={(v) => setNewTask({ ...newTask, type: v })}>
                  <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}>
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
                <Label className={isDark ? 'text-neutral-300' : ''}>Atribuir a</Label>
                <Select value={newTask.assigned_to} onValueChange={(v) => setNewTask({ ...newTask, assigned_to: v })}>
                  <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguém</SelectItem>
                    {user?.email && (
                      <SelectItem value={user.email}>{user.full_name || "Eu"}</SelectItem>
                    )}
                    {allTeamMembers.filter(m => m !== user?.email).map(member => (
                      <SelectItem key={member} value={member}>{member}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : ''}>Caso Relacionado</Label>
                <Select value={newTask.case_id} onValueChange={(v) => setNewTask({ ...newTask, case_id: v })}>
                  <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {cases.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : ''}>Cliente Relacionado</Label>
                <Select value={newTask.client_id} onValueChange={(v) => setNewTask({ ...newTask, client_id: v })}>
                  <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => createMutation.mutate(newTask)}
                disabled={!newTask.title || !newTask.due_date || createMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isPending ? "Criando..." : "Criar Tarefa"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setNewTask({
                    title: "",
                    description: "",
                    due_date: "",
                    priority: "medium",
                    type: "other",
                    status: "pending",
                    case_id: "",
                    client_id: "",
                    assigned_to: ""
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardContent className="pt-6">
            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Pendentes</p>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{pendingTasks.length}</p>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardContent className="pt-6">
            <p className="text-sm text-red-500">Atrasadas</p>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{overdueTasks.length}</p>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardContent className="pt-6">
            <p className="text-sm text-green-500">Concluídas</p>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{completedTasks.length}</p>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardContent className="pt-6">
            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Total</p>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tasks.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}
              />
            </div>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className={`w-40 ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className={`w-40 ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAssigned} onValueChange={setFilterAssigned}>
              <SelectTrigger className={`w-40 ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}>
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {user?.email && (
                  <SelectItem value={user.email}>Minhas tarefas</SelectItem>
                )}
                {allTeamMembers.filter(m => m !== user?.email).map(member => (
                  <SelectItem key={member} value={member}>{member}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('calendar')}
              >
                <CalendarDays className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualizações */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Tarefas ({filteredTasks.length})
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className={`h-24 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />)}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardContent className="p-12 text-center">
                <CheckSquare className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-slate-300'}`} />
                <p className={isDark ? 'text-neutral-400' : 'text-slate-500'}>Nenhuma tarefa encontrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => {
                const urgency = getTaskUrgency(task);
                const caseRelated = cases.find(c => c.id === task.case_id);
                const clientRelated = clients.find(c => c.id === task.client_id);
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className={`cursor-pointer transition-all ${
                      isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'hover:shadow-md'
                    } ${urgency === 'overdue' ? 'border-l-4 border-l-red-500' :
                       urgency === 'today' ? 'border-l-4 border-l-orange-500' :
                       urgency === 'tomorrow' ? 'border-l-4 border-l-yellow-500' : ''}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
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
                              className="mt-1 w-5 h-5 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'} ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className={`text-sm mb-3 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                                  {task.description}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap gap-2">
                                {task.due_date && (
                                  <Badge variant="outline" className={
                                    urgency === 'overdue' ? 'border-red-500 text-red-500' :
                                    urgency === 'today' ? 'border-orange-500 text-orange-500' :
                                    urgency === 'tomorrow' ? 'border-yellow-500 text-yellow-500' : ''
                                  }>
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                                    {urgency === 'overdue' && ' • Atrasada'}
                                    {urgency === 'today' && ' • Hoje'}
                                    {urgency === 'tomorrow' && ' • Amanhã'}
                                  </Badge>
                                )}
                                {task.assigned_to && (
                                  <Badge variant="secondary">
                                    <User className="w-3 h-3 mr-1" />
                                    {task.assigned_to.split('@')[0]}
                                  </Badge>
                                )}
                                {caseRelated && (
                                  <Badge variant="outline">
                                    <Briefcase className="w-3 h-3 mr-1" />
                                    {caseRelated.title}
                                  </Badge>
                                )}
                                {clientRelated && (
                                  <Badge variant="outline">
                                    <User className="w-3 h-3 mr-1" />
                                    {clientRelated.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Badge className={
                              task.priority === 'urgent' ? 'bg-red-500' :
                              task.priority === 'high' ? 'bg-orange-500' :
                              task.priority === 'medium' ? 'bg-yellow-500' :
                              'bg-slate-500'
                            }>
                              {task.priority === 'urgent' && 'Urgente'}
                              {task.priority === 'high' && 'Alta'}
                              {task.priority === 'medium' && 'Média'}
                              {task.priority === 'low' && 'Baixa'}
                            </Badge>
                            <Badge variant="outline">
                              {task.type === 'hearing' && '⚖️ Audiência'}
                              {task.type === 'deadline' && '⏰ Prazo'}
                              {task.type === 'meeting' && '👥 Reunião'}
                              {task.type === 'document' && '📄 Documento'}
                              {task.type === 'research' && '🔍 Pesquisa'}
                              {task.type === 'other' && '📌 Outro'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={isDark ? 'text-white' : ''}>
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                >
                  →
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className={`text-center text-sm font-semibold p-2 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  {day}
                </div>
              ))}
              
              {/* Espaços vazios antes do primeiro dia */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {/* Dias do mês */}
              {calendarDays.map(day => {
                const dayTasks = tasksInDay(day);
                const isCurrentDay = isToday(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`aspect-square border rounded-lg p-2 transition-all ${
                      isCurrentDay 
                        ? isDark ? 'bg-blue-500/20 border-blue-500' : 'bg-blue-50 border-blue-300'
                        : isDark ? 'bg-neutral-800 border-neutral-700 hover:border-neutral-600' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentDay 
                        ? 'text-blue-500' 
                        : isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 2).map(task => (
                        <div
                          key={task.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate ${
                            task.priority === 'urgent' ? 'bg-red-500 text-white' :
                            task.priority === 'high' ? 'bg-orange-500 text-white' :
                            isDark ? 'bg-neutral-700 text-neutral-300' : 'bg-slate-100 text-slate-700'
                          }`}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <div className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                          +{dayTasks.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
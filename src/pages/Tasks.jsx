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
import { useDebounce } from "@/components/common/useDebounce";
import PullToRefresh from "@/components/mobile/PullToRefresh";

export default function Tasks({ theme = 'light' }) {
  const isDark = false;
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
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

  const { data: tasks = [], isLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Task.filter({ created_by: user.email }, 'due_date', 200);
    },
    enabled: !!user?.email
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['task-cases', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Case.filter({ created_by: user.email }, '-created_date', 100);
    },
    enabled: !!user?.email,
    initialData: []
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['task-clients', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Client.filter({ created_by: user.email }, '-created_date', 100);
    },
    enabled: !!user?.email,
    initialData: []
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['task-teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Team.filter({ owner_email: user.email }, '-created_date', 50);
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
    mutationFn: async (taskData) => {
      console.log('🔄 DEBUG - Creating task with data:', taskData);
      
      // Validação explícita
      if (!taskData.title?.trim()) {
        throw new Error('Título é obrigatório');
      }
      if (!taskData.due_date) {
        throw new Error('Data de vencimento é obrigatória');
      }
      
      const cleanedData = {
        ...taskData,
        title: taskData.title.trim(),
        description: taskData.description?.trim() || "",
        case_id: taskData.case_id && taskData.case_id !== "none" && taskData.case_id !== "" ? taskData.case_id : null,
        client_id: taskData.client_id && taskData.client_id !== "none" && taskData.client_id !== "" ? taskData.client_id : null,
        assigned_to: taskData.assigned_to && taskData.assigned_to !== "none" && taskData.assigned_to !== "" ? taskData.assigned_to : null,
      };
      
      console.log('✅ DEBUG - Cleaned data:', cleanedData);
      
      const result = await base44.entities.Task.create(cleanedData);
      console.log('✅ DEBUG - Task created successfully:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success("✅ Tarefa criada com sucesso!");
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
    onError: (error) => {
      console.error('❌ DEBUG - Error creating task:', error);
      toast.error(`Erro ao criar tarefa: ${error.message || 'Tente novamente'}`);
    }
  });

  const filteredTasks = tasks.filter(task => {
    const matchSearch = task.title?.toLowerCase().includes(debouncedSearch.toLowerCase());
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
    <div style={{ minHeight: '100vh', background: 'var(--surface)', fontFamily: 'var(--font-sans)' }}>

      {/* ── Cabeçalho editorial ── */}
      <div style={{ background: "var(--white)", borderBottom: "1px solid var(--ink-6)", padding: "28px 32px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 400, marginBottom: 4, letterSpacing: "0.02em" }}>Escritório</p>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, fontSize: 28, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
              Tarefas & Prazos
            </h1>
            <p style={{ marginTop: 6, fontSize: 11, color: "var(--ink-4)" }}>Gerencie tarefas, prazos e responsabilidades</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? "Cancelar" : "Nova Tarefa"}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "var(--ink-6)", gap: 1, borderBottom: "1px solid var(--ink-6)" }} className="lg:grid-cols-4 grid-cols-2">
        {[
          { label: "Pendentes", value: pendingTasks.length, accent: "var(--ink)" },
          { label: "Atrasadas", value: overdueTasks.length, accent: overdueTasks.length > 0 ? "var(--danger)" : "var(--ink-5)" },
          { label: "Concluídas", value: completedTasks.length, accent: "var(--ok)" },
          { label: "Total", value: tasks.length, accent: "var(--ink-5)" },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ background: "var(--white)", padding: "20px 22px 18px", borderBottom: `2px solid ${accent}` }}>
            <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-4)", margin: "0 0 12px" }}>{label}</p>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 600, lineHeight: 1, color: "var(--ink)", letterSpacing: "-0.04em" }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "24px 28px" }}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

      {showForm && (
        <Card style={{ border: "1px solid var(--ink-6)", borderRadius: 0, boxShadow: "none" }}>
          <CardHeader>
            <CardTitle>Criar Nova Tarefa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Protocolar petição inicial"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                style={{ fontSize: 16, minHeight: 44 }}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes da tarefa..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="h-20"
                style={{ fontSize: 16 }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Vencimento *</Label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
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

              <div className="space-y-2">
                <Label>Tipo de Tarefa</Label>
                <Select value={newTask.type} onValueChange={(v) => setNewTask({ ...newTask, type: v })}>
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
                <Label>Atribuir a</Label>
                <Select value={newTask.assigned_to} onValueChange={(v) => setNewTask({ ...newTask, assigned_to: v })}>
                  <SelectTrigger>
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
                <Label>Caso Relacionado</Label>
                <Select value={newTask.case_id} onValueChange={(v) => setNewTask({ ...newTask, case_id: v })}>
                  <SelectTrigger>
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
                <Label>Cliente Relacionado</Label>
                <Select value={newTask.client_id} onValueChange={(v) => setNewTask({ ...newTask, client_id: v })}>
                  <SelectTrigger>
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
                onClick={async (e) => {
                  e.preventDefault();
                  console.log('🚀 DEBUG - Create button clicked, current data:', newTask);
                  
                  // Validação visual
                  if (!newTask.title?.trim()) {
                    toast.error("❌ Título é obrigatório");
                    return;
                  }
                  if (!newTask.due_date) {
                    toast.error("❌ Data de vencimento é obrigatória");
                    return;
                  }
                  
                  try {
                    await createMutation.mutateAsync(newTask);
                  } catch (error) {
                    console.error('❌ DEBUG - Button handler error:', error);
                  }
                }}
                disabled={!newTask.title?.trim() || !newTask.due_date || createMutation.isPending}
                style={{ background: "var(--ink)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 600, padding: "8px 18px", cursor: "pointer" }}
              >
                {createMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Criando...
                  </>
                ) : (
                  "Criar Tarefa"
                )}
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
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Filtros e Busca */}
      <Card style={{ border: "1px solid var(--ink-6)", borderRadius: 0, boxShadow: "none" }}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <Input
                  placeholder="Buscar tarefas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  style={{ fontSize: 16, minHeight: 44 }}
                />
              </div>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                style={{ minHeight: 44, minWidth: 44 }}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('calendar')}
                style={{ minHeight: 44, minWidth: 44 }}
              >
                <CalendarDays className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger style={{ minHeight: 44 }}>
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas prioridades</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger style={{ minHeight: 44 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAssigned} onValueChange={setFilterAssigned}>
                <SelectTrigger style={{ minHeight: 44 }}>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualizações */}
      {viewMode === 'list' ? (
        <PullToRefresh onRefresh={refetchTasks} isDark={isDark}>
        <div className="space-y-4">
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            Tarefas ({filteredTasks.length})
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckSquare className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Nenhuma tarefa encontrada</p>
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
                    <Card
                      className="cursor-pointer transition-all hover:shadow-md"
                      style={{
                        borderLeft: urgency === 'overdue' ? '4px solid var(--danger)' :
                                    urgency === 'today' ? '4px solid var(--warn)' :
                                    urgency === 'tomorrow' ? '4px solid var(--accent)' : undefined
                      }}
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
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
                              style={{ minWidth: 20, minHeight: 20 }}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)', textDecoration: task.status === 'completed' ? 'line-through' : 'none', opacity: task.status === 'completed' ? 0.6 : 1 }}>
                                {task.title}
                              </h3>
                              {task.description && (
                                 <p style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)' }}>
                                  {task.description}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap gap-2">
                                {task.due_date && (
                                  <Badge variant="outline" className={
                                    urgency === 'overdue' ? 'border-[var(--danger)] text-[var(--danger)]' :
                                    urgency === 'today' ? 'border-[var(--warn)] text-[var(--warn)]' :
                                    urgency === 'tomorrow' ? 'border-[var(--accent)] text-[var(--accent)]' : ''
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
                            <Badge style={{
                             background: task.priority === 'urgent' ? 'var(--danger)' :
                                         task.priority === 'high' ? 'var(--warn)' :
                                         task.priority === 'medium' ? 'var(--accent)' : 'var(--text-muted)',
                             color: '#fff'
                            }}>
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
        </PullToRefresh>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
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
                <div key={day} style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, padding: 8, color: 'var(--text-secondary)' }}>
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
                    style={{
                      aspectRatio: '1', border: '1px solid', borderRadius: 'var(--radius-md)', padding: 8, transition: 'all var(--transition)',
                      borderColor: isCurrentDay ? 'var(--accent)' : 'var(--border)',
                      background: isCurrentDay ? 'var(--warn-bg)' : 'var(--main-bg)'
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, color: isCurrentDay ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 2).map(task => (
                        <div
                          key={task.id}
                          style={{
                            fontSize: 10, padding: '1px 4px', borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            background: task.priority === 'urgent' ? 'var(--danger)' :
                                        task.priority === 'high' ? 'var(--warn)' : 'var(--surface)',
                            color: task.priority === 'urgent' || task.priority === 'high' ? '#fff' : 'var(--text-secondary)'
                          }}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
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
    </div>
  );
}
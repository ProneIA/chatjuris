import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, CheckSquare, Calendar, Plus, X, List, CalendarDays,
  User, Briefcase, Filter, Clock,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useDebounce } from "@/components/common/useDebounce";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import { AppPage, PageHeader, StatCard, KPIGrid, AppCard, AppBadge, EmptyState, SearchBar, SectionHeader, LoadingSpinner, AppContent, AppButton, AppField } from "@/components/ds";

const EMPTY_TASK = {
  title: "", description: "", due_date: "", priority: "medium",
  type: "other", status: "pending", case_id: "", client_id: "", assigned_to: "",
};

const PRIORITY_BADGE = {
  urgent: "danger", high: "warning", medium: "info", low: "neutral",
};
const PRIORITY_LABEL = { urgent: "Urgente", high: "Alta", medium: "Média", low: "Baixa" };
const TYPE_LABEL = {
  hearing: "⚖️ Audiência", deadline: "⏰ Prazo", meeting: "👥 Reunião",
  document: "📄 Documento", research: "🔍 Pesquisa", other: "📌 Outro",
};

function getUrgency(task) {
  if (!task.due_date) return null;
  const d = new Date(task.due_date);
  if (isPast(d) && !isToday(d)) return "overdue";
  if (isToday(d))    return "today";
  if (isTomorrow(d)) return "tomorrow";
  return "upcoming";
}

const URGENCY_COLORS = {
  overdue:  "var(--danger)",
  today:    "var(--warning)",
  tomorrow: "var(--accent)",
  upcoming: "var(--border)",
};

export default function Tasks() {
  const [searchTerm, setSearchTerm]     = useState("");
  const debouncedSearch                 = useDebounce(searchTerm, 300);
  const [user, setUser]                 = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [newTask, setNewTask]           = useState({ ...EMPTY_TASK });
  const [viewMode, setViewMode]         = useState("list");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus]     = useState("pending");
  const [filterAssigned, setFilterAssigned] = useState("all");
  const [currentMonth, setCurrentMonth]     = useState(new Date());
  const queryClient                         = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: tasks = [], isLoading, refetch: refetchTasks } = useQuery({
    queryKey: ["tasks", user?.email],
    queryFn: () => base44.entities.Task.filter({ created_by: user.email }, "due_date", 200),
    enabled: !!user?.email,
  });
  const { data: cases = [] } = useQuery({
    queryKey: ["task-cases", user?.email],
    queryFn: () => base44.entities.Case.filter({ created_by: user.email }, "-created_date", 100),
    enabled: !!user?.email,
    initialData: [],
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["task-clients", user?.email],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }, "-created_date", 100),
    enabled: !!user?.email,
    initialData: [],
  });
  const { data: teams = [] } = useQuery({
    queryKey: ["task-teams", user?.email],
    queryFn: () => base44.entities.Team.filter({ owner_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
    initialData: [],
  });

  const allTeamMembers = [...new Set(teams.flatMap((t) => t.members || []))];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const createMutation = useMutation({
    mutationFn: async (taskData) => {
      if (!taskData.title?.trim()) throw new Error("Título é obrigatório");
      if (!taskData.due_date)      throw new Error("Data de vencimento é obrigatória");
      return base44.entities.Task.create({
        ...taskData,
        title: taskData.title.trim(),
        case_id:     taskData.case_id     === "none" ? null : taskData.case_id     || null,
        client_id:   taskData.client_id   === "none" ? null : taskData.client_id   || null,
        assigned_to: taskData.assigned_to === "none" ? null : taskData.assigned_to || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa criada!");
      setShowForm(false);
      setNewTask({ ...EMPTY_TASK });
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const filtered = tasks.filter((t) => {
    const matchSearch   = t.title?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    const matchStatus   = filterStatus   === "all" || t.status   === filterStatus;
    const matchAssigned = filterAssigned === "all" || t.assigned_to === filterAssigned;
    return matchSearch && matchPriority && matchStatus && matchAssigned;
  });

  const pendingTasks   = filtered.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const completedTasks = filtered.filter((t) => t.status === "completed");
  const overdueTasks   = pendingTasks.filter((t) => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));

  const monthStart   = startOfMonth(currentMonth);
  const monthEnd     = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const tasksInDay   = (date) =>
    filtered.filter((t) => t.due_date && format(new Date(t.due_date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"));

  const handleCreate = async () => {
    if (!newTask.title?.trim()) { toast.error("Título é obrigatório"); return; }
    if (!newTask.due_date)      { toast.error("Data de vencimento é obrigatória"); return; }
    await createMutation.mutateAsync(newTask);
  };

  return (
    <AppPage>
      <PageHeader
        title="Tarefas & Prazos"
        subtitle="Gerencie tarefas, prazos e responsabilidades"
        icon={CheckSquare}
        actions={
          <AppButton
            variant={showForm ? "ghost" : "primary"}
            icon={showForm ? X : Plus}
            onClick={() => setShowForm((s) => !s)}
          >
            {showForm ? "Cancelar" : "Nova Tarefa"}
          </AppButton>
        }
      />

      {/* KPI */}
      <KPIGrid cols={4}>
        <StatCard icon={Clock}       label="Pendentes"  value={pendingTasks.length}   sub="a fazer"     color="var(--accent)"  loading={isLoading} />
        <StatCard icon={Clock}       label="Atrasadas"  value={overdueTasks.length}   sub="em atraso"   color="var(--danger)"  loading={isLoading} />
        <StatCard icon={CheckSquare} label="Concluídas" value={completedTasks.length} sub="finalizadas" color="var(--success)" loading={isLoading} />
        <StatCard icon={Filter}      label="Total"      value={tasks.length}          sub="tarefas"     color="var(--text-muted)" loading={isLoading} />
      </KPIGrid>

      <AppContent style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Form */}
        {showForm && (
          <AppCard>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
              Criar Nova Tarefa
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input placeholder="Ex: Protocolar petição inicial" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} style={{ fontSize: 16, minHeight: 44 }} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Detalhes da tarefa..." value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="h-20" style={{ fontSize: 16 }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Vencimento *</Label>
                  <Input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} style={{ minHeight: 44 }} />
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                    <SelectTrigger style={{ minHeight: 44 }}><SelectValue /></SelectTrigger>
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
                    <SelectTrigger style={{ minHeight: 44 }}><SelectValue /></SelectTrigger>
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
                    <SelectTrigger style={{ minHeight: 44 }}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguém</SelectItem>
                      {user?.email && <SelectItem value={user.email}>{user.full_name || "Eu"}</SelectItem>}
                      {allTeamMembers.filter((m) => m !== user?.email).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Caso Relacionado</Label>
                  <Select value={newTask.case_id} onValueChange={(v) => setNewTask({ ...newTask, case_id: v })}>
                    <SelectTrigger style={{ minHeight: 44 }}><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cliente Relacionado</Label>
                  <Select value={newTask.client_id} onValueChange={(v) => setNewTask({ ...newTask, client_id: v })}>
                    <SelectTrigger style={{ minHeight: 44 }}><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <AppButton variant="ghost" onClick={() => { setShowForm(false); setNewTask({ ...EMPTY_TASK }); }}>Cancelar</AppButton>
                <AppButton variant="primary" loading={createMutation.isPending} onClick={handleCreate}>Criar Tarefa</AppButton>
              </div>
            </div>
          </AppCard>
        )}

        {/* Filters + View Toggle */}
        <AppCard noPad>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar tarefas..." style={{ flex: 1, minWidth: 200 }} />
              <AppButton variant={viewMode === "list" ? "primary" : "secondary"} icon={List} onClick={() => setViewMode("list")} />
              <AppButton variant={viewMode === "calendar" ? "primary" : "secondary"} icon={CalendarDays} onClick={() => setViewMode("calendar")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { label: "Prioridade", value: filterPriority, onChange: setFilterPriority, options: [["all","Todas prioridades"],["urgent","Urgente"],["high","Alta"],["medium","Média"],["low","Baixa"]] },
                { label: "Status",     value: filterStatus,   onChange: setFilterStatus,   options: [["all","Todos status"],["pending","Pendentes"],["in_progress","Em Andamento"],["completed","Concluídas"]] },
                { label: "Responsável",value: filterAssigned, onChange: setFilterAssigned, options: [["all","Todos"],["self","Minhas"]] },
              ].map(({ label, value, onChange, options }) => (
                <Select key={label} value={value} onValueChange={onChange}>
                  <SelectTrigger style={{ minHeight: 40 }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    {label === "Responsável" && user?.email && <SelectItem value={user.email}>{user.full_name || "Eu"}</SelectItem>}
                  </SelectContent>
                </Select>
              ))}
            </div>
          </div>
        </AppCard>

        {/* List View */}
        {viewMode === "list" ? (
          <PullToRefresh onRefresh={refetchTasks} isDark={false}>
            {isLoading ? (
              <LoadingSpinner />
            ) : filtered.length === 0 ? (
              <AppCard>
                <EmptyState icon={CheckSquare} title="Nenhuma tarefa encontrada" description="Crie uma nova tarefa usando o botão acima" />
              </AppCard>
            ) : (
              <AppCard noPad>
                {filtered.map((task, i) => {
                  const urgency       = getUrgency(task);
                  const caseRelated   = cases.find((c) => c.id === task.case_id);
                  const clientRelated = clients.find((c) => c.id === task.client_id);
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 20px",
                        borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                        borderLeft: urgency ? `3px solid ${URGENCY_COLORS[urgency]}` : "3px solid transparent",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        onChange={(e) => updateMutation.mutate({ id: task.id, data: { ...task, status: e.target.checked ? "completed" : "pending" } })}
                        style={{ marginTop: 3, width: 18, height: 18, cursor: "pointer", accentColor: "var(--accent)", flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", margin: "0 0 4px", letterSpacing: "-0.01em", textDecoration: task.status === "completed" ? "line-through" : "none", opacity: task.status === "completed" ? 0.5 : 1 }}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p style={{ fontSize: 12, color: "var(--text-2)", margin: "0 0 8px" }}>{task.description}</p>
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {task.due_date && (
                            <AppBadge variant={urgency === "overdue" ? "danger" : urgency === "today" ? "warning" : "neutral"}>
                              <Calendar size={10} />
                              {format(new Date(task.due_date), "dd/MM/yyyy")}
                              {urgency === "overdue" && " · Atrasada"}
                              {urgency === "today" && " · Hoje"}
                              {urgency === "tomorrow" && " · Amanhã"}
                            </AppBadge>
                          )}
                          {task.assigned_to && (
                            <AppBadge variant="neutral"><User size={10} /> {task.assigned_to.split("@")[0]}</AppBadge>
                          )}
                          {caseRelated && (
                            <AppBadge variant="neutral"><Briefcase size={10} /> {caseRelated.title}</AppBadge>
                          )}
                          {clientRelated && (
                            <AppBadge variant="neutral"><User size={10} /> {clientRelated.name}</AppBadge>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                        <AppBadge variant={PRIORITY_BADGE[task.priority] || "neutral"}>
                          {PRIORITY_LABEL[task.priority] || task.priority}
                        </AppBadge>
                        <AppBadge variant="neutral">{TYPE_LABEL[task.type] || task.type}</AppBadge>
                      </div>
                    </div>
                  );
                })}
              </AppCard>
            )}
          </PullToRefresh>
        ) : (
          /* Calendar View */
          <AppCard noPad>
            <SectionHeader
              title={format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              actions={
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn-outline" style={{ padding: "4px 10px", minHeight: 32 }} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>←</button>
                  <button className="btn-outline" style={{ padding: "4px 10px", minHeight: 32 }} onClick={() => setCurrentMonth(new Date())}>Hoje</button>
                  <button className="btn-outline" style={{ padding: "4px 10px", minHeight: 32 }} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>→</button>
                </div>
              }
            />
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
                {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d) => (
                  <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text-2)", padding: "4px 0" }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
                {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={`e-${i}`} />)}
                {calendarDays.map((day) => {
                  const dayTasks = tasksInDay(day);
                  const isCurrent = isToday(day);
                  return (
                    <div key={day.toISOString()} style={{
                      aspectRatio: "1", border: "1px solid", borderRadius: 10, padding: 6,
                      borderColor: isCurrent ? "var(--accent)" : "var(--border)",
                      background: isCurrent ? "var(--accent-light)" : "var(--card)",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3, color: isCurrent ? "var(--accent)" : "var(--text-primary)" }}>
                        {format(day, "d")}
                      </div>
                      {dayTasks.slice(0, 2).map((t) => (
                        <div key={t.id} style={{
                          fontSize: 9, padding: "2px 4px", borderRadius: 4, marginBottom: 2,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          background: t.priority === "urgent" ? "var(--danger)" : t.priority === "high" ? "var(--warning)" : "var(--bg)",
                          color: (t.priority === "urgent" || t.priority === "high") ? "#fff" : "var(--text-secondary)",
                        }}>{t.title}</div>
                      ))}
                      {dayTasks.length > 2 && <div style={{ fontSize: 9, color: "var(--text-3)" }}>+{dayTasks.length - 2}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </AppCard>
        )}
      </AppContent>
    </AppPage>
  );
}
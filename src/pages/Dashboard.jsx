import React, { useState, useEffect, useMemo, memo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users, FolderOpen, FileText, AlertTriangle,
  Calculator, BookOpen, Plus, Scale,
  ArrowRight, Clock, CheckCircle2,
  Zap,
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppPage, PageHeader, StatCard, KPIGrid, AppCard, AppBadge, SectionHeader, AppContent } from "@/components/ds";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getTaskUrgency(task) {
  if (!task.due_date) return { label: "Sem prazo", color: "var(--text-3)", variant: "neutral" };
  const d = new Date(task.due_date);
  if (isPast(d) && !isToday(d)) return { label: "Atrasado", color: "var(--danger)",  variant: "danger"  };
  if (isToday(d))                return { label: "Hoje",    color: "var(--danger)",  variant: "danger"  };
  if (isTomorrow(d))             return { label: "Amanhã",  color: "var(--warning)", variant: "warning" };
  const days = differenceInDays(d, new Date());
  if (days <= 7) return { label: `${days}d`, color: "var(--warning)", variant: "warning" };
  return { label: format(d, "dd/MM"), color: "var(--text-3)", variant: "neutral" };
}

const STATUS_MAP = {
  in_progress: { label: "Em andamento", variant: "success" },
  new:         { label: "Novo",         variant: "info"    },
  waiting:     { label: "Aguardando",   variant: "warning" },
  closed:      { label: "Encerrado",    variant: "neutral" },
  archived:    { label: "Arquivado",    variant: "neutral" },
};

const Dashboard = memo(function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["dashboard-clients", user?.email],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }, "-created_date", 20),
    enabled: !!user?.email, staleTime: 15 * 60 * 1000, gcTime: 30 * 60 * 1000, retry: 1,
  });
  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ["dashboard-cases", user?.email],
    queryFn: () => base44.entities.Case.filter({ created_by: user.email }, "-created_date", 8),
    enabled: !!user?.email, staleTime: 15 * 60 * 1000, gcTime: 30 * 60 * 1000, retry: 1,
  });
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["dashboard-tasks", user?.email],
    queryFn: () => base44.entities.Task.filter({ created_by: user.email, status: "pending" }, "due_date", 10),
    enabled: !!user?.email, staleTime: 10 * 60 * 1000, gcTime: 20 * 60 * 1000, retry: 1,
  });
  const { data: documents = [] } = useQuery({
    queryKey: ["dashboard-documents", user?.email],
    queryFn: () => base44.entities.LegalDocument.filter({ created_by: user.email }, "-created_date", 20),
    enabled: !!user?.email, staleTime: 15 * 60 * 1000, gcTime: 30 * 60 * 1000, retry: 1,
  });

  const activeCases      = useMemo(() => cases.filter(c => c.status === "in_progress").length, [cases]);
  const urgentTasks      = useMemo(() => tasks.filter(t => t.priority === "urgent").length, [tasks]);
  const pendingDocuments = useMemo(() => documents.filter(d => d.status === "draft" || d.status === "review").length, [documents]);
  const upcomingTasks    = useMemo(() => tasks.slice(0, 6), [tasks]);
  const recentCases      = useMemo(() => cases.slice(0, 6), [cases]);

  const quickActions = [
    { icon: Plus,       title: "Novo Processo",  sub: "Cadastrar processo", url: createPageUrl("Cases"),             },
    { icon: Users,      title: "Novo Cliente",   sub: "Cadastrar cliente",  url: createPageUrl("Clients"),           },
    { icon: Zap,        title: "Gerar Peça",     sub: "Gerador de peças",   url: createPageUrl("DocumentGenerator"), },
    { icon: BookOpen,   title: "Jurisprudência", sub: "Pesquisa jurídica",  url: createPageUrl("LegalResearch"),     },
    { icon: Calculator, title: "Calculadora",    sub: "Cálculos jurídicos", url: "/CalculadoraJuridica",             },
    { icon: Scale,      title: "Assistente",     sub: "Consulta jurídica",  url: createPageUrl("AIAssistant"),       },
  ];

  return (
    <AppPage>
      <PageHeader
        title={`${getGreeting()}, ${user?.full_name?.split(" ")[0] || "Advogado"}`}
        subtitle={format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      />

      <AppContent>

        {/* KPI Grid */}
        <KPIGrid cols={4}>
          <StatCard icon={Users}         label="Clientes"        value={clients.length}   sub="cadastrados"           color="var(--accent)"  link={createPageUrl("Clients")}          loading={loadingClients} />
          <StatCard icon={FolderOpen}    label="Processos"       value={cases.length}     sub={`${activeCases} em andamento`} color="var(--success)" link={createPageUrl("Cases")}     loading={loadingCases}   />
          <StatCard icon={FileText}      label="Documentos"      value={pendingDocuments} sub="pendentes de revisão"  color="var(--warning)" link={createPageUrl("DocumentsEnhanced")} loading={false}          />
          <StatCard icon={AlertTriangle} label="Tarefas Urgentes"value={urgentTasks}      sub={`${tasks.length} no total`} color={urgentTasks > 0 ? "var(--danger)" : "var(--text-muted)"} link={createPageUrl("Tasks")} loading={loadingTasks} />
        </KPIGrid>

        {/* Quick Actions */}
        <div style={{ marginBottom: 24 }}>
          <SectionHeader title="Acesso Rápido" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }} className="xl:grid-cols-6 lg:grid-cols-3 grid-cols-2">
            {quickActions.map((action, i) => (
              <Link key={i} to={action.url} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    background: "var(--card)", border: "1px solid var(--border)",                   borderRadius: 8,
                    padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,.04)",
                    transition: "box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
                    cursor: "pointer", textAlign: "center",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.08)"; e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F8FAFC", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                   <action.icon style={{ width: 16, height: 16, color: "#64748B", strokeWidth: 1.75 }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", margin: "0 0 3px", letterSpacing: "-0.01em" }}>{action.title}</p>
                  <p style={{ fontSize: 11, color: "var(--text-2)", margin: 0 }}>{action.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="lg:grid-cols-2 grid-cols-1">

          {/* Tarefas */}
          <AppCard noPad>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(239,68,68,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock style={{ width: 14, height: 14, color: "var(--danger)", strokeWidth: 2 }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em" }}>Prazos & Tarefas</span>
                {urgentTasks > 0 && <AppBadge variant="danger">{urgentTasks} urgente{urgentTasks > 1 ? "s" : ""}</AppBadge>}
              </div>
              <Link to={createPageUrl("Tasks")} style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                Ver todas <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
            </div>
            {loadingTasks ? (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 10 }} />)}
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <CheckCircle2 style={{ width: 32, height: 32, color: "var(--success)", margin: "0 auto 12px", opacity: 0.6 }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", margin: "0 0 4px" }}>Em dia!</p>
                <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>Nenhuma tarefa pendente</p>
              </div>
            ) : upcomingTasks.map((task, i) => {
              const urg = getTaskUrgency(task);
              return (
                <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < upcomingTasks.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.12s ease" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ width: 3, height: 32, background: urg.color, borderRadius: 2, flexShrink: 0 }} />
                  <p style={{ flex: 1, fontSize: 13, color: "var(--text-1)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500, letterSpacing: "-0.01em" }}>
                    {task.title}
                  </p>
                  <AppBadge variant={urg.variant}>{urg.label}</AppBadge>
                </div>
              );
            })}
          </AppCard>

          {/* Processos */}
          <AppCard noPad>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(37,99,235,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FolderOpen style={{ width: 14, height: 14, color: "var(--accent)", strokeWidth: 2 }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em" }}>Processos Recentes</span>
              </div>
              <Link to={createPageUrl("Cases")} style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                Ver todos <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
            </div>
            {loadingCases ? (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
              </div>
            ) : recentCases.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <FolderOpen style={{ width: 32, height: 32, color: "var(--text-3)", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", margin: "0 0 4px" }}>Sem processos</p>
                <p style={{ fontSize: 12, color: "var(--text-2)", margin: "0 0 16px" }}>Nenhum processo cadastrado ainda</p>
                <Link to={createPageUrl("Cases")} className="btn-accent" style={{ textDecoration: "none" }}>+ Criar processo</Link>
              </div>
            ) : recentCases.map((c, i) => {
              const s = STATUS_MAP[c.status] || { label: c.status, variant: "neutral" };
              return (
                <Link key={c.id} to={createPageUrl("Cases")} style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < recentCases.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.12s ease" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--text-2)", flexShrink: 0, fontFamily: "var(--font-mono)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{c.title}</p>
                      <p style={{ fontSize: 12, color: "var(--text-2)", margin: "2px 0 0" }}>{c.client_name}</p>
                    </div>
                    <AppBadge variant={s.variant}>{s.label}</AppBadge>
                  </div>
                </Link>
              );
            })}
          </AppCard>
        </div>

        {/* Status strip */}
        <div style={{ marginTop: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "LGPD", value: "Dados protegidos" },
            { label: "Sistema", value: "Operacional" },
            { label: "Atualizado em", value: format(new Date(), "HH:mm") },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: 6 }}>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</span>
              <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </AppContent>
    </AppPage>
  );
});

export default Dashboard;
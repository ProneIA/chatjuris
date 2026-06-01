import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users, FolderOpen, FileText, CheckSquare,
  AlertTriangle, Clock, ArrowRight, Sparkles,
  Calculator, BookOpen, Plus, TrendingUp,
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = React.memo(function Dashboard() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["dashboard-clients", user?.email],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }, "-created_date", 20),
    enabled: !!user?.email,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    retryDelay: 3000,
  });

  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ["dashboard-cases", user?.email],
    queryFn: () => base44.entities.Case.filter({ created_by: user.email }, "-created_date", 8),
    enabled: !!user?.email,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    retryDelay: 3000,
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["dashboard-tasks", user?.email],
    queryFn: () => base44.entities.Task.filter({ created_by: user.email, status: "pending" }, "due_date", 10),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    retry: 1,
    retryDelay: 3000,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["dashboard-documents", user?.email],
    queryFn: () => base44.entities.LegalDocument.filter({ created_by: user.email }, "-created_date", 20),
    enabled: !!user?.email,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    retryDelay: 3000,
  });

  const activeCases = React.useMemo(() => cases.filter(c => c.status === "in_progress").length, [cases]);
  const totalCases = cases.length;
  const urgentTasks = React.useMemo(() => tasks.filter(t => t.priority === "urgent").length, [tasks]);
  const pendingTasks = tasks.length;
  const pendingDocuments = React.useMemo(() => documents.filter(d => d.status === "draft" || d.status === "review").length, [documents]);
  const upcomingTasks = React.useMemo(() => tasks.slice(0, 6), [tasks]);
  const recentCases = React.useMemo(() => cases.slice(0, 5), [cases]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getTaskUrgency = (task) => {
    if (!task.due_date) return { label: "Sem prazo", color: "var(--ink-4)", badge: "b-neutral" };
    const d = new Date(task.due_date);
    if (isPast(d) && !isToday(d)) return { label: "Atrasado", color: "var(--danger)", badge: "b-danger" };
    if (isToday(d)) return { label: "Hoje", color: "var(--danger)", badge: "b-danger" };
    if (isTomorrow(d)) return { label: "Amanhã", color: "var(--warn)", badge: "b-warn" };
    const days = differenceInDays(d, new Date());
    if (days <= 7) return { label: `${days}d`, color: "var(--warn)", badge: "b-warn" };
    return { label: format(d, "dd/MM"), color: "var(--ink-4)", badge: "b-neutral" };
  };

  const quickActions = [
    { title: "Novo Processo", sub: "Cadastrar caso", icon: Plus, url: createPageUrl("Cases") },
    { title: "Assistente IA", sub: "Redigir peças", icon: Sparkles, url: createPageUrl("AIAssistant") },
    { title: "Calculadora", sub: "Cálculos jurídicos", icon: Calculator, url: createPageUrl("LegalCalculator") },
    { title: "Pesquisa", sub: "Jurisprudência", icon: BookOpen, url: createPageUrl("LegalResearch") },
  ];

  const statCards = [
    {
      title: "Clientes", value: clients.length, sub: "cadastrados",
      icon: Users, link: createPageUrl("Clients"),
      accentColor: "var(--ink)", status: null,
    },
    {
      title: "Processos", value: totalCases, sub: `${activeCases} em andamento`,
      icon: FolderOpen, link: createPageUrl("Cases"),
      accentColor: "var(--ok)", status: activeCases > 0 ? { label: `${activeCases} ativos`, ok: true } : null,
    },
    {
      title: "Documentos", value: pendingDocuments, sub: "pendentes de revisão",
      icon: FileText, link: createPageUrl("DocumentsEnhanced"),
      accentColor: pendingDocuments > 0 ? "var(--warn)" : "var(--ink-5)", status: null,
    },
    {
      title: "Tarefas Urgentes", value: urgentTasks, sub: `${pendingTasks} no total`,
      icon: AlertTriangle, link: createPageUrl("Tasks"),
      accentColor: urgentTasks > 0 ? "var(--danger)" : "var(--ink-5)",
      status: urgentTasks > 0 ? { label: "Ação requerida", danger: true } : { label: "Em dia", ok: true },
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "var(--font-sans)", background: "var(--surface)", minHeight: "100vh" }}>

      {/* ── Cabeçalho editorial ── */}
      <div style={{
        background: "var(--white)",
        borderBottom: "1px solid var(--ink-6)",
        padding: "28px 32px 24px",
      }}>
        <p style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 400, marginBottom: 6, letterSpacing: "0.02em" }}>
          {getGreeting()}, {user?.full_name?.split(" ")[0] || "Advogado"}
        </p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 600, fontSize: 28,
          color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0,
        }}>
          Painel de Controle
        </h1>
        <p style={{ marginTop: 6, fontSize: 11, color: "var(--ink-4)", letterSpacing: "0.01em" }}>
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div style={{ padding: "0 32px 32px" }}>

        {/* ── KPI Grid ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          background: "var(--ink-6)",
          gap: 1, marginTop: 1,
          borderBottom: "1px solid var(--ink-6)",
        }} className="lg:grid-cols-4 grid-cols-2">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Link key={i} to={stat.link} style={{ textDecoration: "none", display: "block" }}>
                <div
                  style={{
                    background: "var(--white)",
                    padding: "20px 22px 18px",
                    transition: "background var(--duration)",
                    position: "relative",
                    cursor: "pointer",
                    borderBottom: `2px solid ${stat.accentColor}`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--ink-7)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--white)"}
                >
                  <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-4)", margin: "0 0 12px", fontFamily: "var(--font-sans)" }}>
                    {stat.title}
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 36, fontWeight: 600, lineHeight: 1,
                      color: "var(--ink)", letterSpacing: "-0.04em",
                    }}>
                      {stat.value}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--ink-4)", fontWeight: 400 }}>
                      {stat.sub}
                    </span>
                  </div>
                  {stat.status && (
                    <p style={{
                      fontSize: 10, fontWeight: 500,
                      color: stat.status.danger ? "var(--danger)" : stat.status.ok ? "var(--ok)" : "var(--ink-4)",
                      margin: 0,
                    }}>
                      {stat.status.label}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Acesso Rápido ── */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 10 }}>
            Acesso Rápido
          </p>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            background: "var(--ink-6)", gap: 1,
            border: "1px solid var(--ink-6)",
          }} className="lg:grid-cols-4 grid-cols-2">
            {quickActions.map(({ title, sub, icon: Icon, url }) => (
              <Link key={url} to={url} style={{ textDecoration: "none" }}>
                <div
                  style={{ background: "var(--white)", padding: "16px 18px", cursor: "pointer", transition: "background var(--duration)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--ink-7)"; e.currentTarget.querySelector(".qa-icon").style.color = "var(--ink)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--white)"; e.currentTarget.querySelector(".qa-icon").style.color = "var(--ink-4)"; }}
                >
                  <Icon className="qa-icon" style={{ width: 16, height: 16, color: "var(--ink-4)", marginBottom: 8, transition: "color var(--duration)", strokeWidth: 1.5 }} />
                  <p style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-2)", margin: "0 0 2px" }}>{title}</p>
                  <p style={{ fontSize: 10, color: "var(--ink-4)", margin: 0, letterSpacing: "0.02em" }}>{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Content Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginTop: 24, background: "var(--ink-6)" }} className="lg:grid-cols-2 grid-cols-1">

          {/* Prazos e Tarefas */}
          <div style={{ background: "var(--white)", border: "1px solid var(--ink-6)" }}>
            <div style={{
              padding: "14px 20px", borderBottom: "1px solid var(--ink-6)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-4)", margin: 0 }}>
                  Prazos & Tarefas
                </p>
                {urgentTasks > 0 && (
                  <span className="badge badge-danger">{urgentTasks} urgente{urgentTasks > 1 ? "s" : ""}</span>
                )}
              </div>
              <Link to={createPageUrl("Tasks")} style={{ fontSize: 11, color: "var(--ink-4)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, transition: "color var(--duration)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--ink)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--ink-4)"}
              >
                Ver todas <ArrowRight style={{ width: 11, height: 11 }} />
              </Link>
            </div>
            {loadingTasks ? (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 38 }} />)}
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--ink-4)", fontSize: 12 }}>
                Nenhuma tarefa pendente
              </div>
            ) : upcomingTasks.map((task, i) => {
              const urg = getTaskUrgency(task);
              return (
                <div key={task.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 20px",
                  borderBottom: i < upcomingTasks.length - 1 ? "1px solid var(--ink-7)" : "none",
                  transition: "background var(--duration)", cursor: "default",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--ink-7)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ width: 2, height: 28, background: urg.color, flexShrink: 0, alignSelf: "stretch" }} />
                  <p style={{ flex: 1, fontSize: 12, color: "var(--ink-2)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</p>
                  <span className={`badge ${urg.badge}`}>
                    {task.due_date && format(new Date(task.due_date), "dd/MM")} · {urg.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Processos Recentes */}
          <div style={{ background: "var(--white)", border: "1px solid var(--ink-6)" }}>
            <div style={{
              padding: "14px 20px", borderBottom: "1px solid var(--ink-6)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-4)", margin: 0 }}>
                Processos Recentes
              </p>
              <Link to={createPageUrl("Cases")} style={{ fontSize: 11, color: "var(--ink-4)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, transition: "color var(--duration)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--ink)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--ink-4)"}
              >
                Ver todos <ArrowRight style={{ width: 11, height: 11 }} />
              </Link>
            </div>
            {loadingCases ? (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 46 }} />)}
              </div>
            ) : recentCases.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "var(--ink-4)", marginBottom: 12 }}>Nenhum processo cadastrado</p>
                <Link to={createPageUrl("Cases")} className="btn-primary">+ Criar processo</Link>
              </div>
            ) : recentCases.map((c, i) => {
              const statusMap = {
                in_progress: { label: "Em andamento", badge: "b-ok" },
                new: { label: "Novo", badge: "b-neutral" },
                waiting: { label: "Aguardando", badge: "b-warn" },
                closed: { label: "Encerrado", badge: "b-neutral" },
                archived: { label: "Arquivado", badge: "b-neutral" },
              };
              const s = statusMap[c.status] || { label: c.status, badge: "b-neutral" };
              return (
                <Link key={c.id} to={createPageUrl("Cases")} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 20px",
                    borderBottom: i < recentCases.length - 1 ? "1px solid var(--ink-7)" : "none",
                    transition: "background var(--duration)",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--ink-7)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: 32, height: 32,
                      background: "var(--ink-7)", border: "1px solid var(--ink-6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 400,
                      color: "var(--ink-4)", flexShrink: 0,
                    }}>
                      {(i + 1).toString().padStart(2, "0")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-2)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</p>
                      <p style={{ fontSize: 10, color: "var(--ink-4)", margin: "2px 0 0" }}>{c.client_name}</p>
                    </div>
                    <span className={`badge ${s.badge}`}>{s.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>

        {/* ── Rodapé do sistema ── */}
        <div style={{
          marginTop: 24,
          border: "1px solid var(--ink-6)",
          background: "var(--white)",
          display: "flex",
          overflow: "hidden",
        }}>
          {[
            { icon: "🔒", label: "LGPD Compliant", value: "Dados protegidos" },
            { icon: "✓", label: "Sistemas", value: "Operacionais" },
            { icon: "↻", label: "Sincronização", value: format(new Date(), "HH:mm 'de hoje'") },
          ].map((item, i) => (
            <div key={i} style={{
              flex: 1,
              padding: "10px 16px",
              borderRight: i < 2 ? "1px solid var(--ink-6)" : "none",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              <div>
                <span style={{ fontSize: 10, color: "var(--ink-4)", fontFamily: "var(--font-sans)" }}>{item.label}: </span>
                <span style={{ fontSize: 10, color: "var(--ink-2)", fontWeight: 500, fontFamily: "var(--font-sans)" }}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
});

export default Dashboard;
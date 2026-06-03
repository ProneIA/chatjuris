import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users, FolderOpen, FileText, AlertTriangle,
  Sparkles, Calculator, BookOpen, Plus,
  ArrowRight, Clock, CheckCircle2, Calendar,
  TrendingUp, Zap,
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Helpers ───────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getTaskUrgency(task) {
  if (!task.due_date) return { label: "Sem prazo", color: "var(--text-muted)", cls: "b-neutral" };
  const d = new Date(task.due_date);
  if (isPast(d) && !isToday(d)) return { label: "Atrasado", color: "var(--danger)", cls: "b-danger" };
  if (isToday(d))    return { label: "Hoje",   color: "var(--danger)",  cls: "b-danger" };
  if (isTomorrow(d)) return { label: "Amanhã", color: "var(--warning)", cls: "b-warn"   };
  const days = differenceInDays(d, new Date());
  if (days <= 7) return { label: `${days}d`, color: "var(--warning)", cls: "b-warn" };
  return { label: format(d, "dd/MM"), color: "var(--text-muted)", cls: "b-neutral" };
}

// ─── Sub-components ────────────────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, sub, accentColor, link, loading }) {
  return (
    <Link to={link} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "20px 24px",
          boxShadow: "0 1px 2px rgba(0,0,0,.04)",
          transition: "box-shadow 0.15s ease, border-color 0.15s ease",
          cursor: "pointer", height: "100%",
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.08)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04)"; e.currentTarget.style.borderColor = "var(--border)"; }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${accentColor}14`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon style={{ width: 18, height: 18, color: accentColor, strokeWidth: 1.75 }} />
          </div>
          <ArrowRight style={{ width: 14, height: 14, color: "var(--text-muted)", strokeWidth: 1.5 }} />
        </div>
        {loading ? (
          <div className="skeleton" style={{ height: 32, width: 64, marginBottom: 8 }} />
        ) : (
          <p style={{
            fontSize: 30, fontWeight: 700, color: "var(--text-primary)",
            letterSpacing: "-0.03em", lineHeight: 1, margin: "0 0 6px",
          }}>{value}</p>
        )}
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 2px", letterSpacing: "-0.01em" }}>
          {label}
        </p>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{sub}</p>
      </div>
    </Link>
  );
}

function QuickActionCard({ icon: Icon, title, sub, url, color = "var(--accent)" }) {
  return (
    <Link to={url} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "20px 20px",
          boxShadow: "0 1px 2px rgba(0,0,0,.04)",
          transition: "box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
          cursor: "pointer", textAlign: "center",
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.08)"; e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${color}14`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px",
        }}>
          <Icon style={{ width: 19, height: 19, color, strokeWidth: 1.75 }} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 3px", letterSpacing: "-0.01em" }}>{title}</p>
        <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>{sub}</p>
      </div>
    </Link>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────
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
  });

  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ["dashboard-cases", user?.email],
    queryFn: () => base44.entities.Case.filter({ created_by: user.email }, "-created_date", 8),
    enabled: !!user?.email,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["dashboard-tasks", user?.email],
    queryFn: () => base44.entities.Task.filter({ created_by: user.email, status: "pending" }, "due_date", 10),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    retry: 1,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["dashboard-documents", user?.email],
    queryFn: () => base44.entities.LegalDocument.filter({ created_by: user.email }, "-created_date", 20),
    enabled: !!user?.email,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  const activeCases      = React.useMemo(() => cases.filter(c => c.status === "in_progress").length, [cases]);
  const urgentTasks      = React.useMemo(() => tasks.filter(t => t.priority === "urgent").length, [tasks]);
  const pendingDocuments = React.useMemo(() => documents.filter(d => d.status === "draft" || d.status === "review").length, [documents]);
  const upcomingTasks    = React.useMemo(() => tasks.slice(0, 6), [tasks]);
  const recentCases      = React.useMemo(() => cases.slice(0, 6), [cases]);

  const kpiCards = [
    {
      icon: Users, label: "Clientes", value: clients.length,
      sub: "cadastrados no sistema",
      accentColor: "#2563EB", link: createPageUrl("Clients"),
      loading: loadingClients,
    },
    {
      icon: FolderOpen, label: "Processos", value: cases.length,
      sub: `${activeCases} em andamento`,
      accentColor: "#22C55E", link: createPageUrl("Cases"),
      loading: loadingCases,
    },
    {
      icon: FileText, label: "Documentos", value: pendingDocuments,
      sub: "pendentes de revisão",
      accentColor: "#F59E0B", link: createPageUrl("DocumentsEnhanced"),
      loading: false,
    },
    {
      icon: AlertTriangle, label: "Tarefas Urgentes", value: urgentTasks,
      sub: `${tasks.length} tarefas no total`,
      accentColor: urgentTasks > 0 ? "#EF4444" : "#94A3B8",
      link: createPageUrl("Tasks"),
      loading: loadingTasks,
    },
  ];

  const quickActions = [
    { icon: Plus,       title: "Novo Processo",  sub: "Cadastrar caso",   url: createPageUrl("Cases"),           color: "#2563EB" },
    { icon: Users,      title: "Novo Cliente",   sub: "Adicionar cliente",url: createPageUrl("Clients"),         color: "#22C55E" },
    { icon: Zap,        title: "Gerar Peça",     sub: "Com IA",           url: createPageUrl("DocumentGenerator"),color: "#8B5CF6" },
    { icon: BookOpen,   title: "Pesquisa",       sub: "Jurisprudência",   url: createPageUrl("LegalResearch"),   color: "#F59E0B" },
    { icon: Calculator, title: "Calculadora",    sub: "Cálculos jurídicos",url: "/CalculadoraJuridica",          color: "#EF4444" },
    { icon: Sparkles,   title: "Assistente IA",  sub: "Chat jurídico",    url: createPageUrl("AIAssistant"),     color: "#2563EB" },
  ];

  const statusMap = {
    in_progress: { label: "Em andamento", cls: "b-ok" },
    new:         { label: "Novo",         cls: "b-info" },
    waiting:     { label: "Aguardando",   cls: "b-warn" },
    closed:      { label: "Encerrado",    cls: "b-neutral" },
    archived:    { label: "Arquivado",    cls: "b-neutral" },
  };

  return (
    <div style={{ fontFamily: "var(--font-body)", background: "var(--bg)", minHeight: "100vh" }}>

      {/* ── Page Header ── */}
      <div style={{
        background: "var(--card)", borderBottom: "1px solid var(--border)",
        padding: "24px 32px",
      }}>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
          {getGreeting()}, {user?.full_name?.split(" ")[0] || "Advogado"} 👋
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: "var(--text-primary)",
            letterSpacing: "-0.025em", lineHeight: 1.25, margin: 0,
          }}>
            Painel de Controle
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1400 }}>

        {/* ── KPI Grid ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16, marginBottom: 24,
        }} className="lg:grid-cols-4 md:grid-cols-2 grid-cols-1">
          {kpiCards.map((card, i) => (
            <KPICard key={i} {...card} />
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.01em" }}>
              Acesso Rápido
            </h2>
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(6, 1fr)",
            gap: 12,
          }} className="xl:grid-cols-6 lg:grid-cols-3 grid-cols-2">
            {quickActions.map((action, i) => (
              <QuickActionCard key={i} {...action} />
            ))}
          </div>
        </div>

        {/* ── Content Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="lg:grid-cols-2 grid-cols-1">

          {/* Tarefas & Prazos */}
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 16, boxShadow: "0 1px 2px rgba(0,0,0,.04)",
            overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "rgba(239,68,68,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Clock style={{ width: 14, height: 14, color: "var(--danger)", strokeWidth: 2 }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                  Prazos & Tarefas
                </span>
                {urgentTasks > 0 && (
                  <span className="badge b-danger">{urgentTasks} urgente{urgentTasks > 1 ? "s" : ""}</span>
                )}
              </div>
              <Link
                to={createPageUrl("Tasks")}
                style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Ver todas <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
            </div>

            {loadingTasks ? (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 10 }} />)}
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <CheckCircle2 style={{ width: 32, height: 32, color: "var(--success)", margin: "0 auto 12px", opacity: 0.6 }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 4px" }}>Em dia!</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>Nenhuma tarefa pendente</p>
              </div>
            ) : upcomingTasks.map((task, i) => {
              const urg = getTaskUrgency(task);
              return (
                <div key={task.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 20px",
                  borderBottom: i < upcomingTasks.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background 0.12s ease",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ width: 3, height: 32, background: urg.color, borderRadius: 2, flexShrink: 0 }} />
                  <p style={{ flex: 1, fontSize: 13, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500, letterSpacing: "-0.01em" }}>
                    {task.title}
                  </p>
                  <span className={`badge ${urg.cls}`}>{urg.label}</span>
                </div>
              );
            })}
          </div>

          {/* Processos Recentes */}
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 16, boxShadow: "0 1px 2px rgba(0,0,0,.04)",
            overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "rgba(37,99,235,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FolderOpen style={{ width: 14, height: 14, color: "var(--accent)", strokeWidth: 2 }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                  Processos Recentes
                </span>
              </div>
              <Link
                to={createPageUrl("Cases")}
                style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Ver todos <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
            </div>

            {loadingCases ? (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
              </div>
            ) : recentCases.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <FolderOpen style={{ width: 32, height: 32, color: "var(--text-muted)", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 4px" }}>Sem processos</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 16px" }}>Nenhum processo cadastrado ainda</p>
                <Link to={createPageUrl("Cases")} className="btn-accent" style={{ textDecoration: "none" }}>+ Criar processo</Link>
              </div>
            ) : recentCases.map((c, i) => {
              const s = statusMap[c.status] || { label: c.status, cls: "b-neutral" };
              return (
                <Link key={c.id} to={createPageUrl("Cases")} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 20px",
                    borderBottom: i < recentCases.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background 0.12s ease",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: "var(--bg)", border: "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
                      flexShrink: 0, fontFamily: "var(--font-mono)",
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
                        {c.title}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>{c.client_name}</p>
                    </div>
                    <span className={`badge ${s.cls}`}>{s.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Footer strip ── */}
        <div style={{
          marginTop: 24,
          display: "flex", gap: 12, flexWrap: "wrap",
        }}>
          {[
            { icon: "🔒", label: "LGPD Compliant", value: "Dados protegidos" },
            { icon: "✓",  label: "Sistemas",       value: "Operacionais" },
            { icon: "↻",  label: "Sincronizado",   value: format(new Date(), "HH:mm 'de hoje'") },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 14px",
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 10,
            }}>
              <span style={{ fontSize: 13 }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{item.label}:</span>
              <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
});

export default Dashboard;
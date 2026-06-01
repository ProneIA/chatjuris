import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users,
  FolderOpen,
  FileText,
  CheckSquare,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  Calculator,
  BookOpen,
  Plus,
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Tokens ──────────────────────────────────────────────────────
const GOLD = "#b8922a";
const GOLD_LIGHT = "rgba(184,146,42,0.08)";
const GOLD_BORDER = "rgba(184,146,42,0.45)";
const BG = "#f7f5f2";
const SURFACE = "#ffffff";
const BORDER = "#ece9e3";
const TEXT = "#1a1a1a";
const MUTED = "#aaa";

const plexBold = "'IBM Plex Sans', system-ui, sans-serif";
const outfit = "'Outfit', system-ui, sans-serif";

// ── Google Fonts injection ───────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("juris-fonts")) {
  const link = document.createElement("link");
  link.id = "juris-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@600;700&family=Outfit:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
}

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
  const pendingTasks = React.useMemo(() => tasks.length, [tasks]);
  const pendingDocuments = React.useMemo(() => documents.filter(d => d.status === "draft" || d.status === "review").length, [documents]);
  const upcomingTasks = React.useMemo(() => tasks.slice(0, 5), [tasks]);
  const recentCases = React.useMemo(() => cases.slice(0, 4), [cases]);

  const getGreeting = React.useCallback(() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom Dia";
    if (h < 18) return "Boa Tarde";
    return "Boa Noite";
  }, []);

  const getTaskUrgency = (task) => {
    if (!task.due_date) return { label: "Sem prazo", color: "#aaa" };
    const d = new Date(task.due_date);
    if (isPast(d) && !isToday(d)) return { label: "Atrasado", color: "#e74c3c" };
    if (isToday(d)) return { label: "Hoje", color: "#e67e22" };
    if (isTomorrow(d)) return { label: "Amanhã", color: "#f1c40f" };
    const days = differenceInDays(d, new Date());
    if (days <= 7) return { label: `${days} dias`, color: GOLD };
    return { label: format(d, "dd/MM"), color: "#aaa" };
  };

  const quickActions = [
    { title: "Novo Processo", icon: Plus, url: createPageUrl("Cases") },
    { title: "Assistente IA", icon: Sparkles, url: createPageUrl("AIAssistant"), badge: "IA" },
    { title: "Calculadora", icon: Calculator, url: createPageUrl("LegalCalculator") },
    { title: "Pesquisa Jurídica", icon: BookOpen, url: createPageUrl("LegalResearch") },
  ];

  const statCards = [
    { title: "Clientes Ativos", value: clients.length, sub: "cadastrados", icon: Users, link: createPageUrl("Clients") },
    { title: "Processos", value: totalCases, extra: activeCases, sub: `${activeCases} em andamento`, icon: FolderOpen, link: createPageUrl("Cases") },
    { title: "Documentos", value: pendingDocuments, sub: "pendentes", icon: FileText, link: createPageUrl("DocumentsEnhanced") },
    { title: "Tarefas", value: urgentTasks, extra: pendingTasks, sub: urgentTasks > 0 ? "urgentes" : "em dia", icon: AlertTriangle, link: createPageUrl("Tasks") },
  ];

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 32px) clamp(16px, 4vw, 40px)', maxWidth: 1280, margin: '0 auto', fontFamily: 'var(--font-sans)' }}>

      {/* ── Greeting ── */}
      <div className="animate-fade-up" style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          {getGreeting()},
        </p>
        <h1 style={{
          fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)',
          color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0,
        }}>
          {user?.full_name?.split(' ')[0] || 'Advogado'}
        </h1>
        <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }} className="lg:grid-cols-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link key={i} to={stat.link} style={{ textDecoration: 'none' }}>
              <div className="card card-interactive animate-fade-up" style={{ padding: '18px 20px', animationDelay: `${i * 60}ms` }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', margin: 0 }}>
                    {stat.title}
                  </p>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 16, height: 16, color: 'var(--gold)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, lineHeight: 1, color: 'var(--text)' }}>
                    {stat.value}
                  </span>
                  {stat.extra !== undefined && (
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ {stat.extra}</span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4, margin: '4px 0 0' }}>{stat.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ marginBottom: 28 }}>
        <p className="text-label" style={{ marginBottom: 12 }}>Acesso Rápido</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {quickActions.map(({ title, url, badge }) => (
            <Link key={url} to={url} className={badge ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: 13 }}>
              {title}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="lg:grid-cols-2">

        {/* Tarefas */}
        <div className="card animate-fade-up delay-2" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock style={{ width: 15, height: 15, color: 'var(--gold)' }} />
              <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: 0 }}>Prazos e Tarefas</h3>
            </div>
            <Link to={createPageUrl("Tasks")} style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Ver todas <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          {loadingTasks ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
            </div>
          ) : upcomingTasks.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              ✅ Nenhuma tarefa pendente
            </div>
          ) : upcomingTasks.map((task, i) => {
            const urg = getTaskUrgency(task);
            return (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 20px',
                borderBottom: i < upcomingTasks.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s', cursor: 'default',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: urg.color, flexShrink: 0 }} />
                <p style={{ flex: 1, fontSize: 13, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: urg.color + '18', color: urg.color, flexShrink: 0,
                }}>
                  {task.due_date && format(new Date(task.due_date), "dd/MM")} · {urg.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Processos Recentes */}
        <div className="card animate-fade-up delay-3" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderOpen style={{ width: 15, height: 15, color: 'var(--gold)' }} />
              <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: 0 }}>Processos Recentes</h3>
            </div>
            <Link to={createPageUrl("Cases")} style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Ver todos <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          {loadingCases ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
            </div>
          ) : recentCases.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <FolderOpen style={{ width: 28, height: 28, color: 'var(--text-muted)', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Nenhum processo cadastrado</p>
              <Link to={createPageUrl("Cases")} className="btn-primary" style={{ fontSize: 13 }}>+ Criar processo</Link>
            </div>
          ) : recentCases.map((c, i) => {
            const statusMap = { in_progress: { label: 'Em andamento', color: 'var(--info)' }, new: { label: 'Novo', color: 'var(--success)' }, waiting: { label: 'Aguardando', color: 'var(--warning)' }, closed: { label: 'Encerrado', color: 'var(--text-muted)' } };
            const s = statusMap[c.status] || { label: c.status, color: 'var(--text-muted)' };
            return (
              <Link key={c.id} to={createPageUrl("Cases")} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 20px',
                  borderBottom: i < recentCases.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'var(--gold-light)', color: 'var(--gold-deep)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>
                    {c.case_number?.slice(-2) || (i + 1).toString().padStart(2, '0')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{c.client_name}</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: s.color + '18', color: s.color, flexShrink: 0,
                  }}>
                    {s.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
});

export default Dashboard;
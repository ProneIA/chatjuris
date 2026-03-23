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
  Calendar,
  ArrowRight,
  Sparkles,
  Calculator,
  BookOpen,
  Scale,
  Clock,
  TrendingUp,
  Plus,
  Zap,
  FileSearch
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DashboardSkeleton from "@/components/common/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

const Dashboard = React.memo(function Dashboard({ theme = 'light' }) {
  const isDark = theme === 'dark';
  
  const [user, setUser] = React.useState(null);
  
  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['dashboard-clients', user?.email],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }, '-created_date', 20),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['dashboard-cases', user?.email],
    queryFn: () => base44.entities.Case.filter({ created_by: user.email }, '-created_date', 8),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['dashboard-tasks', user?.email],
    queryFn: () => base44.entities.Task.filter({ created_by: user.email, status: 'pending' }, 'due_date', 10),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });

  const { data: documents = [], isLoading: loadingDocuments } = useQuery({
    queryKey: ['dashboard-documents', user?.email],
    queryFn: () => base44.entities.LegalDocument.filter({ created_by: user.email }, '-created_date', 20),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const activeCases = React.useMemo(() => cases.filter(c => c.status === 'in_progress').length, [cases]);
  const totalCases = cases.length;
  const urgentTasks = React.useMemo(() => tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length, [tasks]);
  const pendingTasks = React.useMemo(() => tasks.filter(t => t.status !== 'completed').length, [tasks]);
  const pendingDocuments = React.useMemo(() => documents.filter(d => d.status === 'draft' || d.status === 'review').length, [documents]);

  const upcomingTasks = React.useMemo(() =>
    tasks.filter(t => t.status !== 'completed').slice(0, 5),
    [tasks]
  );

  const recentCases = React.useMemo(() => cases.slice(0, 4), [cases]);

  const isLoading = loadingClients || loadingCases || loadingTasks || loadingDocuments;

  const getGreeting = React.useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const getTaskUrgency = (task) => {
    if (!task.due_date) return { label: "Sem prazo", color: "gray" };
    const dueDate = new Date(task.due_date);
    if (isPast(dueDate) && !isToday(dueDate)) return { label: "Atrasado", color: "red" };
    if (isToday(dueDate)) return { label: "Hoje", color: "orange" };
    if (isTomorrow(dueDate)) return { label: "Amanhã", color: "yellow" };
    const days = differenceInDays(dueDate, new Date());
    if (days <= 7) return { label: `${days} dias`, color: "blue" };
    return { label: format(dueDate, "dd/MM"), color: "gray" };
  };

  const quickActions = [
    { title: "Novo Processo", icon: Plus, url: createPageUrl("Cases"), color: "emerald" },
    { title: "Assistente IA", icon: Sparkles, url: createPageUrl("AIAssistant"), color: "purple", badge: "IA" },
    { title: "Calculadora", icon: Calculator, url: createPageUrl("LegalCalculator"), color: "blue" },
    { title: "Pesquisa Jurídica", icon: BookOpen, url: createPageUrl("LegalResearch"), color: "amber" },
  ];

  const statCards = [
    {
      title: "Clientes Ativos",
      value: clients.length,
      icon: Users,
      link: createPageUrl("Clients"),
      color: "blue",
      subtitle: "cadastrados"
    },
    {
      title: "Processos",
      value: totalCases,
      total: activeCases,
      icon: FolderOpen,
      link: createPageUrl("Cases"),
      color: "emerald",
      subtitle: `${activeCases} em andamento`,
      showProgress: false
    },
    {
      title: "Documentos",
      value: pendingDocuments,
      icon: FileText,
      link: createPageUrl("DocumentsEnhanced"),
      color: "purple",
      subtitle: "pendentes"
    },
    {
      title: "Tarefas",
      value: urgentTasks,
      total: pendingTasks,
      icon: AlertTriangle,
      link: createPageUrl("Tasks"),
      color: urgentTasks > 0 ? "red" : "emerald",
      subtitle: urgentTasks > 0 ? "urgentes" : "em dia"
    }
  ];

  const colorClasses = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
    red: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" },
    yellow: { bg: "bg-yellow-500/10", text: "text-yellow-600", border: "border-yellow-500/20" },
    gray: { bg: isDark ? "bg-neutral-800" : "bg-gray-100", text: isDark ? "text-neutral-400" : "text-gray-500", border: isDark ? "border-neutral-700" : "border-gray-200" }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <DashboardSkeleton isDark={isDark} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"var(--app-bg)", fontFamily:"system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap');
        .dash-oswald { font-family: 'Oswald', sans-serif !important; }
        @keyframes dash-fade-up { from { opacity:0; transform:translateY(1.5rem); } to { opacity:1; transform:translateY(0); } }
        .dash-fu { animation: dash-fade-up .6s cubic-bezier(.16,1,.3,1) both; }
        .dash-d1 { animation-delay: 80ms; }
        .dash-d2 { animation-delay: 160ms; }
        .dash-d3 { animation-delay: 240ms; }
        .dash-d4 { animation-delay: 320ms; }
      `}</style>
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Header com saudação */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 dash-fu">
          <div>
            <h1 className="dash-oswald" style={{ fontSize:"clamp(1.8rem,4vw,2.5rem)", fontWeight:700, textTransform:"uppercase", letterSpacing:"-0.02em", lineHeight:1, color:"var(--app-text)", margin:0 }}>
              {getGreeting()}, <span style={{ color:"var(--app-primary)" }}>{user?.full_name?.split(' ')[0] || 'Advogado'}</span>
            </h1>
            <p style={{ marginTop:"0.4rem", fontSize:".72rem", textTransform:"uppercase", letterSpacing:".16em", color:"var(--app-muted)" }}>
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl("AIAssistant")}>
              <button className="dash-oswald" style={{ display:"inline-flex", alignItems:"center", gap:".5rem", padding:".7rem 1.6rem", background:"var(--app-primary)", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:".78rem", textTransform:"uppercase", letterSpacing:".1em" }}>
                <Sparkles style={{ width:15, height:15 }} />
                Assistente IA
              </button>
            </Link>
          </div>
        </div>



        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background:"var(--app-border)" }}>
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={i} to={action.url} style={{ textDecoration:"none" }}>
                <div
                  className={`dash-fu dash-d${i+1}`}
                  style={{ position:"relative", padding:"1.25rem", background:"var(--app-surface)", cursor:"pointer", transition:"border-color .15s, background .15s", borderLeft:"3px solid transparent" }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderLeftColor="var(--app-primary)"; e.currentTarget.style.background="var(--app-surface2)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderLeftColor="transparent"; e.currentTarget.style.background="var(--app-surface)"; }}
                >
                  <div style={{ width:36, height:36, background:"var(--app-primary-dim, rgba(193,35,46,0.1))", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"0.75rem" }}>
                    <Icon style={{ width:18, height:18, color:"var(--app-primary)" }} />
                  </div>
                  <p className="dash-oswald" style={{ fontWeight:600, fontSize:".78rem", textTransform:"uppercase", letterSpacing:".08em", color:"var(--app-text)", margin:0 }}>{action.title}</p>
                  {action.badge && (
                    <span className="dash-oswald" style={{ position:"absolute", top:"0.75rem", right:"0.75rem", fontSize:".6rem", fontWeight:700, padding:"0.2rem 0.4rem", background:"var(--app-primary)", color:"#fff", letterSpacing:".1em" }}>
                      {action.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background:"var(--app-border)" }}>
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link key={index} to={stat.link} style={{ textDecoration:"none" }}>
                <div
                  className={`dash-fu dash-d${index+1}`}
                  style={{ padding:"1.5rem", background:"var(--app-surface)", transition:"border-left .15s, background .15s", borderLeft:"3px solid transparent", height:"100%" }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderLeftColor="var(--app-primary)"; e.currentTarget.style.background="var(--app-surface2)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderLeftColor="transparent"; e.currentTarget.style.background="var(--app-surface)"; }}
                >
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"0.75rem" }}>
                    <p className="dash-oswald" style={{ fontSize:".65rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".16em", color:"var(--app-muted)", margin:0 }}>
                      {stat.title}
                    </p>
                    <div style={{ width:36, height:36, background:"rgba(193,35,46,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Icon style={{ width:18, height:18, color:"var(--app-primary)" }} />
                    </div>
                  </div>
                  {isLoading ? (
                    <Skeleton style={{ height:40, width:60, background:"var(--app-surface2)" }} />
                  ) : (
                    <div style={{ display:"flex", alignItems:"baseline", gap:"0.4rem" }}>
                      <span className="dash-oswald" style={{ fontSize:"2.5rem", fontWeight:700, lineHeight:1, color:"var(--app-text)" }}>{stat.value}</span>
                      {stat.total !== undefined && (
                        <span style={{ fontSize:".875rem", color:"var(--app-muted)" }}>/ {stat.total}</span>
                      )}
                    </div>
                  )}
                  <p style={{ fontSize:".75rem", color:"var(--app-primary)", marginTop:"0.25rem" }}>{stat.subtitle}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Prazos e Tarefas */}
        <div className="dash-fu" style={{ background:"var(--app-surface)", border:"1px solid var(--app-border)" }}>
          <div style={{ padding:"1rem 1.5rem", borderBottom:"1px solid var(--app-border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
              <Clock style={{ width:16, height:16, color:"var(--app-primary)" }} />
              <h2 className="dash-oswald" style={{ fontWeight:600, fontSize:".85rem", textTransform:"uppercase", letterSpacing:".1em", color:"var(--app-text)", margin:0 }}>Prazos e Tarefas</h2>
            </div>
            <Link to={createPageUrl("Tasks")} className="dash-oswald" style={{ fontSize:".72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".1em", color:"var(--app-primary)", textDecoration:"none", display:"flex", alignItems:"center", gap:"0.3rem" }}>
              Ver todas <ArrowRight style={{ width:12, height:12 }} />
            </Link>
          </div>
          <div style={{ padding:"0.5rem 0" }}>
            {loadingTasks ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
                <LoadingSpinner size="default" text="Carregando tarefas..." />
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div style={{ textAlign:"center", padding:"3rem 1rem" }}>
                <CheckSquare style={{ width:32, height:32, color:"var(--app-muted)", margin:"0 auto 0.75rem" }} />
                <p className="dash-oswald" style={{ fontWeight:600, fontSize:".8rem", textTransform:"uppercase", letterSpacing:".08em", color:"var(--app-text)" }}>Tudo em dia!</p>
                <p style={{ fontSize:".8rem", color:"var(--app-muted)", marginTop:"0.25rem" }}>Nenhuma tarefa pendente</p>
              </div>
            ) : (
              upcomingTasks.map(task => {
                const urgency = getTaskUrgency(task);
                const urgencyColor = { red:"#ef4444", orange:"#f97316", yellow:"#eab308", blue:"var(--app-primary)", gray:"var(--app-muted)" }[urgency.color] || "var(--app-muted)";
                return (
                  <div key={task.id} style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"0.85rem 1.5rem", borderBottom:"1px solid var(--app-border)", transition:"background .15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--app-surface2)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{ width:6, height:6, background:urgencyColor, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:500, fontSize:".875rem", color:"var(--app-text)", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{task.title}</p>
                    </div>
                    <span className="dash-oswald" style={{ fontSize:".7rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", color:urgencyColor, flexShrink:0 }}>
                      {task.due_date && format(new Date(task.due_date), "dd/MM")} — {urgency.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Cases */}
        <div className="dash-fu" style={{ background:"var(--app-surface)", border:"1px solid var(--app-border)" }}>
          <div style={{ padding:"1rem 1.5rem", borderBottom:"1px solid var(--app-border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
              <FolderOpen style={{ width:16, height:16, color:"var(--app-primary)" }} />
              <h2 className="dash-oswald" style={{ fontWeight:600, fontSize:".85rem", textTransform:"uppercase", letterSpacing:".1em", color:"var(--app-text)", margin:0 }}>Processos Recentes</h2>
            </div>
            <Link to={createPageUrl("Cases")} className="dash-oswald" style={{ fontSize:".72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".1em", color:"var(--app-primary)", textDecoration:"none", display:"flex", alignItems:"center", gap:"0.3rem" }}>
              Ver todos <ArrowRight style={{ width:12, height:12 }} />
            </Link>
          </div>
          <div style={{ padding:"0.5rem 0" }}>
            {loadingCases ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
                <LoadingSpinner size="default" text="Carregando processos..." />
              </div>
            ) : recentCases.length === 0 ? (
              <div style={{ textAlign:"center", padding:"3rem 1rem" }}>
                <FolderOpen style={{ width:32, height:32, color:"var(--app-muted)", margin:"0 auto 0.75rem" }} />
                <p style={{ fontSize:".875rem", color:"var(--app-muted)" }}>Nenhum processo cadastrado</p>
                <Link to={createPageUrl("Cases")}>
                  <button className="dash-oswald" style={{ marginTop:"1rem", padding:".6rem 1.4rem", background:"var(--app-primary)", color:"#fff", border:"none", cursor:"pointer", fontWeight:600, fontSize:".75rem", textTransform:"uppercase", letterSpacing:".08em" }}>
                    <Plus style={{ width:13, height:13, display:"inline", marginRight:"0.3rem" }} />
                    Criar primeiro processo
                  </button>
                </Link>
              </div>
            ) : (
              recentCases.map(caseItem => {
                const statusLabel = { in_progress:"Em andamento", new:"Novo", waiting:"Aguardando", closed:"Arquivado" }[caseItem.status] || caseItem.status;
                const statusColor = { in_progress:"var(--app-primary)", new:"#16a34a", waiting:"#ca8a04", closed:"var(--app-muted)" }[caseItem.status] || "var(--app-muted)";
                return (
                  <Link key={caseItem.id} to={createPageUrl("Cases")} style={{ textDecoration:"none" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"0.85rem 1.5rem", borderBottom:"1px solid var(--app-border)", transition:"background .15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--app-surface2)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div style={{ width:6, height:6, background:statusColor, flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontWeight:500, fontSize:".875rem", color:"var(--app-text)", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{caseItem.title}</p>
                        <p style={{ fontSize:".75rem", color:"var(--app-muted)", margin:0, marginTop:"0.15rem" }}>{caseItem.client_name}</p>
                      </div>
                      <span className="dash-oswald" style={{ fontSize:".65rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".1em", color:statusColor, flexShrink:0 }}>{statusLabel}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;
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

const cormorant = "'Cormorant Garamond', Georgia, serif";
const outfit = "'Outfit', system-ui, sans-serif";

// ── Google Fonts injection ───────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("juris-fonts")) {
  const link = document.createElement("link");
  link.id = "juris-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@400;500;600;700&display=swap";
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
    staleTime: 5 * 60 * 1000,
  });

  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ["dashboard-cases", user?.email],
    queryFn: () => base44.entities.Case.filter({ created_by: user.email }, "-created_date", 8),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["dashboard-tasks", user?.email],
    queryFn: () => base44.entities.Task.filter({ created_by: user.email, status: "pending" }, "due_date", 10),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["dashboard-documents", user?.email],
    queryFn: () => base44.entities.LegalDocument.filter({ created_by: user.email }, "-created_date", 20),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
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
    <div style={{ minHeight: "100vh", background: BG, fontFamily: outfit, padding: "32px 36px" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: cormorant, fontSize: 34, fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.1 }}>
            {getGreeting()},{" "}
            <span style={{ color: GOLD }}>{user?.full_name?.split(" ")[0] || "Advogado"}</span>
          </h1>
          <p style={{ marginTop: 6, fontSize: 11, textTransform: "uppercase", letterSpacing: "2px", color: MUTED, fontFamily: outfit }}>
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Link to={createPageUrl("AIAssistant")} style={{ textDecoration: "none" }}>
          <button
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 22px",
              background: "transparent",
              border: `1px solid ${GOLD}`,
              borderRadius: 50,
              color: GOLD,
              fontFamily: outfit,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "background 0.2s, box-shadow 0.2s",
              minHeight: 44,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = GOLD_LIGHT; e.currentTarget.style.boxShadow = `0 4px 16px rgba(184,146,42,0.18)`; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <Sparkles style={{ width: 15, height: 15 }} />
            ✦ Assistente IA
          </button>
        </Link>
      </div>

      {/* ── Quick Actions ──────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link key={i} to={action.url} style={{ textDecoration: "none" }}>
              <div
                style={{
                  position: "relative",
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 20,
                  padding: "22px 12px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = GOLD_BORDER;
                  e.currentTarget.style.boxShadow = `0 8px 24px rgba(184,146,42,0.14)`;
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.querySelector(".qa-label").style.color = GOLD;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.querySelector(".qa-label").style.color = MUTED;
                }}
              >
                {action.badge && (
                  <span style={{
                    position: "absolute", top: 12, right: 12,
                    fontSize: 8, fontWeight: 700,
                    padding: "2px 7px",
                    background: GOLD_LIGHT,
                    color: GOLD,
                    borderRadius: 50,
                    fontFamily: outfit,
                  }}>{action.badge}</span>
                )}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                  <Icon style={{ width: 24, height: 24, color: GOLD }} />
                </div>
                <p className="qa-label" style={{
                  fontSize: 10, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "1.5px",
                  color: MUTED, margin: 0, fontFamily: outfit,
                  transition: "color 0.2s",
                }}>
                  {action.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link key={i} to={stat.link} style={{ textDecoration: "none" }}>
              <div
                style={{
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 20,
                  padding: "18px 20px",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px rgba(184,146,42,0.12)`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.8px", color: MUTED, margin: 0, fontFamily: outfit }}>
                    {stat.title}
                  </p>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: GOLD_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon style={{ width: 16, height: 16, color: GOLD }} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontFamily: cormorant, fontSize: 40, fontWeight: 700, lineHeight: 1, color: TEXT }}>
                    {stat.value}
                  </span>
                  {stat.extra !== undefined && (
                    <span style={{ fontSize: 14, color: MUTED, fontFamily: outfit }}>/ {stat.extra}</span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: GOLD, marginTop: 4, fontFamily: outfit }}>{stat.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Prazos e Tarefas + Processos ───────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Prazos */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock style={{ width: 15, height: 15, color: GOLD }} />
              <span style={{ fontFamily: outfit, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "1.5px", color: TEXT }}>
                Prazos e Tarefas
              </span>
            </div>
            <Link to={createPageUrl("Tasks")} style={{ fontFamily: outfit, fontSize: 11, fontWeight: 600, color: GOLD, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, letterSpacing: "0.5px" }}>
              Ver todas <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          <div>
            {loadingTasks ? (
              <div style={{ padding: "2rem", textAlign: "center", color: MUTED, fontSize: 13 }}>Carregando...</div>
            ) : upcomingTasks.length === 0 ? (
              <div style={{ padding: "2.5rem", textAlign: "center" }}>
                <CheckSquare style={{ width: 28, height: 28, color: MUTED, margin: "0 auto 8px" }} />
                <p style={{ fontFamily: outfit, fontSize: 13, color: MUTED }}>Nenhuma tarefa pendente</p>
              </div>
            ) : upcomingTasks.map(task => {
              const urg = getTaskUrgency(task);
              return (
                <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.15s", cursor: "default" }}
                  onMouseEnter={e => e.currentTarget.style.background = GOLD_LIGHT}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ width: 6, height: 6, borderRadius: 2, background: urg.color, flexShrink: 0 }} />
                  <p style={{ flex: 1, fontSize: 13, fontFamily: outfit, color: TEXT, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</p>
                  <span style={{ fontSize: 10, fontFamily: outfit, fontWeight: 600, color: urg.color, letterSpacing: "0.5px", flexShrink: 0 }}>
                    {task.due_date && format(new Date(task.due_date), "dd/MM")} — {urg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Processos Recentes */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FolderOpen style={{ width: 15, height: 15, color: GOLD }} />
              <span style={{ fontFamily: outfit, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "1.5px", color: TEXT }}>
                Processos Recentes
              </span>
            </div>
            <Link to={createPageUrl("Cases")} style={{ fontFamily: outfit, fontSize: 11, fontWeight: 600, color: GOLD, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, letterSpacing: "0.5px" }}>
              Ver todos <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          <div>
            {loadingCases ? (
              <div style={{ padding: "2rem", textAlign: "center", color: MUTED, fontSize: 13 }}>Carregando...</div>
            ) : recentCases.length === 0 ? (
              <div style={{ padding: "2.5rem", textAlign: "center" }}>
                <FolderOpen style={{ width: 28, height: 28, color: MUTED, margin: "0 auto 8px" }} />
                <p style={{ fontFamily: outfit, fontSize: 13, color: MUTED }}>Nenhum processo cadastrado</p>
                <Link to={createPageUrl("Cases")}>
                  <button style={{ marginTop: 12, padding: "8px 20px", background: GOLD, color: "#fff", border: "none", borderRadius: 50, cursor: "pointer", fontFamily: outfit, fontWeight: 600, fontSize: 12 }}>
                    + Criar processo
                  </button>
                </Link>
              </div>
            ) : recentCases.map(c => {
              const statusLabel = { in_progress: "Em andamento", new: "Novo", waiting: "Aguardando", closed: "Arquivado" }[c.status] || c.status;
              const statusColor = { in_progress: GOLD, new: "#27ae60", waiting: "#e67e22", closed: MUTED }[c.status] || MUTED;
              return (
                <Link key={c.id} to={createPageUrl("Cases")} style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = GOLD_LIGHT}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: 2, background: statusColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontFamily: outfit, fontWeight: 500, color: TEXT, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</p>
                      <p style={{ fontSize: 11, fontFamily: outfit, color: MUTED, margin: 0 }}>{c.client_name}</p>
                    </div>
                    <span style={{ fontSize: 10, fontFamily: outfit, fontWeight: 600, color: statusColor, letterSpacing: "0.5px", flexShrink: 0 }}>{statusLabel}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
});

export default Dashboard;
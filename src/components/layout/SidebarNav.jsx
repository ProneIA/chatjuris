import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import Logo from "@/components/common/Logo";
import {
  LayoutDashboard, Activity, CheckSquare,
  FolderOpen, Users, Globe, FileText, Files,
  DollarSign, Sparkles, Zap, Calculator, Newspaper, BookOpen, Scale,
  MessageSquare, MessageCircle, Settings,
  Users2, UserCheck,
  Lock, Shield, Database, BarChart3, ClipboardList, Bot,
  ChevronRight, Crown, Star,
} from "lucide-react";

// ─── Navigation config ─────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Geral",
    items: [
      { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
      { title: "Radar", url: createPageUrl("RadarOportunidades"), icon: Activity },
      { title: "Agenda & Prazos", url: createPageUrl("Tasks"), icon: CheckSquare },
    ],
  },
  {
    label: "Clientes",
    items: [
      { title: "Clientes", url: createPageUrl("Clients"), icon: Users },
      { title: "Portal do Cliente", url: createPageUrl("ClientPortal"), icon: Globe },
    ],
  },
  {
    label: "Processos",
    items: [
      { title: "Processos", url: createPageUrl("Cases"), icon: FileText },
      { title: "Documentos", url: createPageUrl("DocumentsEnhanced"), icon: Files },
      { title: "Monitor de Diários", url: createPageUrl("DiarioMonitor"), icon: Newspaper, badge: "Novo" },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { title: "Assistente IA", url: createPageUrl("AIAssistant"), icon: Sparkles, badge: "IA" },
      { title: "Gerador de Peças", url: createPageUrl("DocumentGenerator"), icon: Zap, badge: "IA" },
      { title: "Pesquisa Jurídica", url: createPageUrl("LegalResearch"), icon: Scale },
      { title: "Modelos de Peças", url: createPageUrl("Templates"), icon: BookOpen },
      { title: "Calculadora", url: "/CalculadoraJuridica", icon: Calculator },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Financeiro", url: createPageUrl("FinancialDashboard"), icon: DollarSign },
    ],
  },
  {
    label: "Configurações",
    items: [
      { title: "Equipe", url: createPageUrl("Teams"), icon: Users2 },
      { title: "Minha Assinatura", url: createPageUrl("MySubscription"), icon: Star },
    ],
  },
];

const ADMIN_ITEMS = [
  { title: "Painel Admin", url: createPageUrl("AdminPanel"), icon: BarChart3 },
  { title: "Admin Master", url: createPageUrl("AdminMaster"), icon: Shield },
  { title: "Afiliados", url: createPageUrl("AffiliatesDashboard"), icon: UserCheck },
  { title: "Assinaturas", url: createPageUrl("AdminSubscriptions"), icon: Crown },
  { title: "Banco de Dados", url: createPageUrl("AdminDatabase"), icon: Database },
  { title: "Auditoria", url: createPageUrl("SystemAudit"), icon: ClipboardList },
  { title: "LGPD", url: createPageUrl("LGPDCompliance"), icon: Shield },
  { title: "WhatsApp Bot", url: createPageUrl("WhatsAppBot"), icon: MessageCircle },
  { title: "WhatsApp Connect", url: createPageUrl("WhatsAppConnect"), icon: Settings },
  { title: "Conversas WA", url: "/conversations", icon: MessageSquare },
  { title: "Config. Agente IA", url: createPageUrl("AgentSettings"), icon: Bot },
  { title: "Webhook Test", url: createPageUrl("WebhookTest"), icon: Zap },
];

// ─── Badge ─────────────────────────────────────────────────────────────────
function NavBadge({ label }) {
  const isAI   = label === "IA";
  const isNew  = label === "Novo";
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 6px",
      borderRadius: 3,
      letterSpacing: "0.03em",
      color: isAI ? "#B8952A" : isNew ? "#B45309" : "rgba(203,213,225,0.7)",
      background: isAI ? "rgba(184,149,42,0.15)" : isNew ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.06)",
      fontFamily: "'Inter', sans-serif",
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ─── Nav Item ──────────────────────────────────────────────────────────────
function NavItem({ item, location, onNavigate }) {
  const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
  return (
    <Link
      to={item.url}
      onClick={onNavigate}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "7px 12px",
        borderRadius: 8,
        fontSize: 13.5, fontWeight: isActive ? 500 : 400,
        color: isActive ? "#FFFFFF" : "#94A3B8",
        background: isActive ? "#1E293B" : "transparent",
        textDecoration: "none",
        transition: "background 0.12s ease, color 0.12s ease",
        margin: "1px 0",
        position: "relative",
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#1E293B"; e.currentTarget.style.color = "#E2E8F0"; } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; } }}
    >
      {isActive && (
        <span style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: 2, height: 18, background: "#B8952A",
          borderRadius: "0 2px 2px 0",
        }} />
      )}
      <item.icon style={{ width: 15, height: 15, flexShrink: 0, strokeWidth: 1.75, color: isActive ? "#B8952A" : "inherit" }} />
      <span style={{ flex: 1, letterSpacing: "-0.01em" }}>{item.title}</span>
      {item.badge && <NavBadge label={item.badge} />}
    </Link>
  );
}

// ─── Section ───────────────────────────────────────────────────────────────
function NavSection({ section, location, onNavigate, isAdmin }) {
  const visibleItems = section.items.filter(i => !i.adminOnly || isAdmin);
  if (visibleItems.length === 0) return null;
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "#475569",
        padding: "16px 12px 6px",
        fontFamily: "'Inter', sans-serif",
      }}>
        {section.label}
      </div>
      {visibleItems.map(item => (
        <NavItem key={item.url + item.title} item={item} location={location} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

// ─── Admin Section ─────────────────────────────────────────────────────────
function AdminSection({ location, onNavigate }) {
  const [open, setOpen] = React.useState(false);
  const hasActive = ADMIN_ITEMS.some(i => location.pathname === i.url);
  React.useEffect(() => { if (hasActive) setOpen(true); }, [location.pathname]);

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(239,68,68,0.15)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 9,
          width: "100%", padding: "7px 12px",
          background: "rgba(239,68,68,0.06)", border: "none",
          borderRadius: 8, cursor: "pointer",
          fontSize: 13.5, fontWeight: 500, color: "#EF4444",
          fontFamily: "'Inter', sans-serif",
          transition: "background 0.12s ease",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
      >
        <Lock style={{ width: 15, height: 15, flexShrink: 0, strokeWidth: 1.75, color: "#EF4444" }} />
        <span style={{ flex: 1, textAlign: "left", letterSpacing: "-0.01em" }}>Administração</span>
        <span style={{
          fontSize: 9, fontWeight: 600, padding: "2px 5px",
          borderRadius: 4, color: "#EF4444",
          background: "rgba(239,68,68,0.12)",
          letterSpacing: "0.06em",
        }}>ADMIN</span>
        <ChevronRight style={{
          width: 13, height: 13, color: "rgba(239,68,68,0.5)",
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.15s ease", flexShrink: 0,
        }} />
      </button>
      <div style={{
        overflow: "hidden",
        maxHeight: open ? `${ADMIN_ITEMS.length * 38}px` : "0px",
        transition: "max-height 0.2s ease",
      }}>
        <div style={{ paddingTop: 4 }}>
          {ADMIN_ITEMS.map(item => (
            <NavItem key={item.url + item.title} item={item} location={location} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function SidebarNav({ user, onNavigate, isMobile = false }) {
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  return (
    <nav style={{ paddingBottom: 16 }}>
      {NAV_SECTIONS.map(section => (
        <NavSection
          key={section.label}
          section={section}
          location={location}
          onNavigate={onNavigate}
          isAdmin={isAdmin}
        />
      ))}
      {isAdmin && (
        <AdminSection location={location} onNavigate={onNavigate} />
      )}
    </nav>
  );
}
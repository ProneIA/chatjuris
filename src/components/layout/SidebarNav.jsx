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
  const isAI  = label === "IA";
  const isNew = label === "Novo";
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 7px",
      borderRadius: 9999,
      letterSpacing: "0.03em",
      color: isAI ? "#63B3ED" : isNew ? "#68D391" : "rgba(160,174,192,0.8)",
      background: isAI ? "rgba(99,179,237,0.12)" : isNew ? "rgba(104,211,145,0.12)" : "rgba(255,255,255,0.06)",
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
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 16px 8px 13px",
        fontSize: 13.5, fontWeight: isActive ? 500 : 400,
        color: isActive ? "#FFFFFF" : "#A0AEC0",
        background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
        textDecoration: "none",
        transition: "all 0.15s ease",
        margin: "1px 0",
        position: "relative",
        borderLeft: isActive ? "3px solid #63B3ED" : "3px solid transparent",
        borderRadius: "0 6px 6px 0",
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#E2E8F0"; } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#A0AEC0"; } }}
    >
      <item.icon style={{ width: 15, height: 15, flexShrink: 0, strokeWidth: 1.75, color: isActive ? "#63B3ED" : "inherit" }} />
      <span style={{ flex: 1 }}>{item.title}</span>
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
        fontSize: 10, fontWeight: 600, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
        padding: "16px 16px 5px",
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
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "rgba(229,62,62,0.6)",
        padding: "8px 16px 5px",
        fontFamily: "'Inter', sans-serif",
      }}>
        Administração
      </div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "8px 16px 8px 13px",
          background: "rgba(229,62,62,0.06)", border: "none",
          borderRadius: "0 6px 6px 0", cursor: "pointer",
          fontSize: 13.5, fontWeight: 500, color: "rgba(252,129,129,0.9)",
          fontFamily: "'Inter', sans-serif",
          transition: "background 0.15s ease",
          borderLeft: "3px solid rgba(229,62,62,0.4)",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(229,62,62,0.1)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(229,62,62,0.06)"}
      >
        <Lock style={{ width: 15, height: 15, flexShrink: 0, strokeWidth: 1.75, color: "rgba(252,129,129,0.8)" }} />
        <span style={{ flex: 1, textAlign: "left" }}>Painel Admin</span>
        <ChevronRight style={{
          width: 13, height: 13, color: "rgba(252,129,129,0.5)",
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
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Activity, CheckSquare,
  FolderOpen, Users, Globe, FileText, Files,
  DollarSign, Sparkles, Zap, Calculator, Newspaper, BookOpen, Scale,
  MessageSquare, MessageCircle, Settings,
  Users2, UserCheck,
  Lock, Shield, Database, BarChart3, ClipboardList, Bot,
  ChevronRight, Crown, Star,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

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
  const isIA  = label === "IA";
  const isNew = label === "Novo";
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 7px",
      borderRadius: "var(--r-full)", letterSpacing: ".03em", flexShrink: 0,
      background: isIA ? "rgba(59,130,246,.2)" : isNew ? "rgba(34,197,94,.15)" : "rgba(255,255,255,.08)",
      color:      isIA ? "#93C5FD"             : isNew ? "#86EFAC"             : "rgba(203,213,225,.7)",
      border:     isIA ? "1px solid rgba(59,130,246,.3)" : isNew ? "1px solid rgba(34,197,94,.2)" : "none",
    }}>{label}</span>
  );
}

// ─── Nav Item ──────────────────────────────────────────────────────────────
function NavItem({ item, location, onNavigate }) {
  const active = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
  return (
    <Link to={item.url} onClick={onNavigate} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 12px", margin: "1px 8px",
          borderRadius: "var(--r-md)",
          background: active ? "rgba(59,130,246,.15)" : "transparent",
          borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
          transition: "all .15s var(--ease)",
          cursor: "pointer",
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,.05)"; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
      >
        <item.icon size={15} style={{ color: active ? "var(--accent)" : "rgba(148,163,184,.7)", flexShrink: 0, strokeWidth: 1.75 }} />
        <span style={{
          flex: 1, fontSize: 13, fontWeight: active ? 500 : 400,
          color: active ? "#fff" : "rgba(148,163,184,.85)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{item.title}</span>
        {item.badge && <NavBadge label={item.badge} />}
      </div>
    </Link>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
      color: "rgba(255,255,255,.2)", padding: "14px 20px 5px", margin: 0,
    }}>{label}</p>
  );
}

// ─── Admin Section ─────────────────────────────────────────────────────────
function AdminSection({ location, onNavigate }) {
  const [open, setOpen] = React.useState(false);
  const hasActive = ADMIN_ITEMS.some(i => location.pathname === i.url);
  React.useEffect(() => { if (hasActive) setOpen(true); }, [location.pathname]);

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.06)" }}>
      <SectionLabel label="Admin" />
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "8px 12px", margin: "1px 8px",
          background: "rgba(239,68,68,.08)", border: "none",
          borderRadius: "var(--r-md)", cursor: "pointer",
          fontSize: 13, fontWeight: 500, color: "rgba(252,129,129,.9)",
          fontFamily: "var(--font-body)",
          transition: "background .15s",
          borderLeft: "3px solid rgba(239,68,68,.4)",
          width: "calc(100% - 16px)",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,.14)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,.08)"}
      >
        <Lock size={15} style={{ color: "rgba(252,129,129,.8)", flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: "left" }}>Painel Admin</span>
        <ChevronRight size={13} style={{
          color: "rgba(252,129,129,.5)",
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform .15s", flexShrink: 0,
        }} />
      </button>
      <div style={{
        overflow: "hidden",
        maxHeight: open ? `${ADMIN_ITEMS.length * 38}px` : "0px",
        transition: "max-height .2s ease",
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
  const [currentUser, setCurrentUser] = React.useState(user || null);

  React.useEffect(() => {
    if (!user) {
      base44.auth.me().then(setCurrentUser).catch(() => {});
    } else {
      setCurrentUser(user);
    }
  }, [user]);

  const isAdmin = currentUser?.role === "admin";

  return (
    <nav style={{ paddingBottom: 16 }}>
      {NAV_SECTIONS.map(section => (
        <div key={section.label} style={{ marginBottom: 2 }}>
          <SectionLabel label={section.label} />
          {section.items.map(item => (
            <NavItem key={item.url + item.title} item={item} location={location} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
      {isAdmin && <AdminSection location={location} onNavigate={onNavigate} />}
    </nav>
  );
}
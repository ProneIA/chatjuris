import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Activity, CheckSquare,
  FolderOpen, Users, Globe, FileText, Files,
  DollarSign, Search, Zap, Calculator, Newspaper, BookOpen, Scale,
  MessageSquare, MessageCircle, Settings,
  Users2, UserCheck,
  Lock, Shield, Database, BarChart3, ClipboardList, Bot,
  ChevronRight, Crown,
  MessagesSquare,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard",          url: createPageUrl("Dashboard"),          icon: LayoutDashboard },
      { title: "Agenda & Prazos",    url: createPageUrl("Tasks"),              icon: CheckSquare },
      { title: "Radar de Marketing", url: createPageUrl("RadarOportunidades"), icon: Activity },
    ],
  },
  {
    label: "Clientes",
    items: [
      { title: "Clientes",       url: createPageUrl("Clients"),     icon: Users },
      { title: "Portal do Cliente", url: createPageUrl("ClientPortal"), icon: Globe },
    ],
  },
  {
    label: "Processos",
    items: [
      { title: "Processos",        url: createPageUrl("Cases"),            icon: FileText },
      { title: "Documentos",       url: createPageUrl("DocumentsEnhanced"), icon: Files },
      { title: "Monitor de Diários", url: createPageUrl("DiarioMonitor"),  icon: Newspaper },
    ],
  },
  {
    label: "Inteligência Jurídica",
    items: [
      { title: "Assistente IA",     url: createPageUrl("AIAssistant"),     icon: MessagesSquare },
      { title: "Gerador de Peças",  url: createPageUrl("DocumentGenerator"), icon: Zap },
      { title: "Pesquisa Jurídica", url: createPageUrl("LegalResearch"),   icon: Search },
      { title: "Modelos de Peças",  url: createPageUrl("Templates"),       icon: BookOpen },
      { title: "Calculadora",       url: "/CalculadoraJuridica",            icon: Calculator },
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
      { title: "Equipe",         url: createPageUrl("Teams"),           icon: Users2 },
      { title: "Assinatura",     url: createPageUrl("MySubscription"),  icon: Crown },
      { title: "Configurações",  url: createPageUrl("Settings"),        icon: Settings },
    ],
  },
];

const ADMIN_ITEMS = [
  { title: "Painel Admin",      url: createPageUrl("AdminPanel"),         icon: BarChart3 },
  { title: "Admin Master",      url: createPageUrl("AdminMaster"),        icon: Shield },
  { title: "Afiliados",         url: createPageUrl("AffiliatesDashboard"), icon: UserCheck },
  { title: "Assinaturas",       url: createPageUrl("AdminSubscriptions"), icon: Crown },
  { title: "Banco de Dados",    url: createPageUrl("AdminDatabase"),      icon: Database },
  { title: "Auditoria",         url: createPageUrl("SystemAudit"),        icon: ClipboardList },
  { title: "LGPD",              url: createPageUrl("LGPDCompliance"),     icon: Shield },
  { title: "WhatsApp Bot",      url: createPageUrl("WhatsAppBot"),        icon: MessageCircle },
  { title: "WhatsApp Connect",  url: createPageUrl("WhatsAppConnect"),    icon: Settings },
  { title: "Conversas WA",      url: "/conversations",                    icon: MessageSquare },
  { title: "Config. Agente IA", url: createPageUrl("AgentSettings"),      icon: Bot },
  { title: "Webhook Test",      url: createPageUrl("WebhookTest"),        icon: Zap },
];

function NavItem({ item, location, onNavigate }) {
  const active = location.pathname === item.url || location.pathname.startsWith(item.url + "/");

  return (
    <Link to={item.url} onClick={onNavigate} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "6px 12px", margin: "1px 8px",
          borderRadius: 6,
          background: active ? "#14362E" : "transparent",
          borderLeft: active ? "2px solid #C5A880" : "2px solid transparent",
          transition: "background .12s ease, border-color .12s ease",
          cursor: "pointer",
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
      >
        <item.icon
          size={14}
          style={{
            color: active ? "#C5A880" : "#5C6662",
            flexShrink: 0,
            strokeWidth: 1.5,
          }}
        />
        <span style={{
          flex: 1, fontSize: 13, fontWeight: active ? 500 : 400,
          color: active ? "#F4F3F1" : "#8A9490",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}>
          {item.title}
        </span>
      </div>
    </Link>
  );
}

function SectionLabel({ label }) {
  return (
    <p style={{
      fontSize: 9.5, fontWeight: 600, letterSpacing: ".10em", textTransform: "uppercase",
      color: "#3A4A45", padding: "14px 20px 4px", margin: 0,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>{label}</p>
  );
}

function AdminSection({ location, onNavigate }) {
  const [open, setOpen] = React.useState(false);
  const hasActive = ADMIN_ITEMS.some(i => location.pathname === i.url);
  React.useEffect(() => { if (hasActive) setOpen(true); }, [location.pathname]);

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <SectionLabel label="Admin" />
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 9,
          width: "calc(100% - 16px)", padding: "6px 12px", margin: "1px 8px",
          background: "rgba(158,63,60,0.10)", border: "none",
          borderRadius: 6, cursor: "pointer",
          fontSize: 13, fontWeight: 500, color: "#D4918E",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          transition: "background .12s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(158,63,60,0.16)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(158,63,60,0.10)"}
      >
        <Lock size={14} style={{ color: "#D4918E", flexShrink: 0, strokeWidth: 1.5 }} />
        <span style={{ flex: 1, textAlign: "left" }}>Área Restrita</span>
        <ChevronRight size={12} style={{
          color: "#D4918E",
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform .15s", flexShrink: 0,
        }} />
      </button>
      <div style={{
        overflow: "hidden",
        maxHeight: open ? `${ADMIN_ITEMS.length * 34}px` : "0px",
        transition: "max-height .2s ease",
      }}>
        <div style={{ paddingTop: 2 }}>
          {ADMIN_ITEMS.map(item => (
            <NavItem key={item.url + item.title} item={item} location={location} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SidebarNav({ user, onNavigate }) {
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
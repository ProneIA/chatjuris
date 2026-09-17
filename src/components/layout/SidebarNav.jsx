import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, CheckSquare,
  FolderOpen, Users, Globe, FileText, Files,
  DollarSign, Search, Zap, Calculator, Newspaper, BookOpen, Scale,
  Settings,
  Users2,
  Crown,
  MessagesSquare,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard",          url: createPageUrl("Dashboard"),          icon: LayoutDashboard },
      { title: "Agenda & Prazos",    url: createPageUrl("Tasks"),              icon: CheckSquare },
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

function NavItem({ item, location, onNavigate }) {
  const active = location.pathname === item.url || location.pathname.startsWith(item.url + "/");

  return (
    <Link to={item.url} onClick={onNavigate} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "6px 12px", margin: "1px 8px",
          borderRadius: 6,
          background: active ? "#1A1A1A" : "transparent",
          borderLeft: active ? "2px solid #FFFFFF" : "2px solid transparent",
          transition: "background .12s ease, border-color .12s ease",
          cursor: "pointer",
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
      >
        <item.icon
          size={14}
          style={{
            color: active ? "#FFFFFF" : "#999999",
            flexShrink: 0,
            strokeWidth: 1.5,
          }}
        />
        <span style={{
          flex: 1, fontSize: 13, fontWeight: active ? 500 : 400,
          color: active ? "#FFFFFF" : "#999999",
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
      color: "#666666", padding: "14px 20px 4px", margin: 0,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>{label}</p>
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
    </nav>
  );
}
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Activity, CheckSquare,
  FolderOpen, Users, Globe, FileText, Files,
  DollarSign,
  Sparkles, Zap, Calculator, Newspaper, BookOpen, Scale,
  MessageSquare, MessageCircle, Settings,
  Users2, UserCheck,
  Lock, Shield, Database, BarChart3, ClipboardList, Bot,
  ChevronDown,
  Crown, Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Grupos de navegação ───────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    id: "painel",
    label: "Painel",
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { title: "Início", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
      { title: "Radar", url: createPageUrl("RadarOportunidades"), icon: Activity },
      { title: "Tarefas e Prazos", url: createPageUrl("Tasks"), icon: CheckSquare },
    ],
  },
  {
    id: "gestao",
    label: "Gestão",
    icon: FolderOpen,
    defaultOpen: false,
    items: [
      { title: "Clientes", url: createPageUrl("Clients"), icon: Users },
      { title: "Portal do Cliente", url: createPageUrl("ClientPortal"), icon: Globe },
      { title: "Processos", url: createPageUrl("Cases"), icon: FileText },
      { title: "Documentos", url: createPageUrl("DocumentsEnhanced"), icon: Files },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: DollarSign,
    defaultOpen: false,
    directLink: true,
    url: createPageUrl("FinancialDashboard"),
    items: [
      { title: "Visão Geral", url: createPageUrl("FinancialDashboard"), icon: DollarSign },
    ],
  },
  {
    id: "ferramentas",
    label: "Ferramentas",
    icon: Zap,
    defaultOpen: false,
    items: [
      { title: "Assistente IA", url: createPageUrl("AIAssistant"), icon: Sparkles, badge: "IA" },
      { title: "Gerador de Peças", url: createPageUrl("DocumentGenerator"), icon: Zap, badge: "IA" },
      { title: "Calculadora Jurídica", url: "/CalculadoraJuridica", icon: Calculator },
      { title: "Monitor de Diários", url: createPageUrl("DiarioMonitor"), icon: Newspaper, badge: "NOVO" },
      { title: "Modelos de Peças", url: createPageUrl("Templates"), icon: BookOpen },
      { title: "Pesquisa Jurídica", url: createPageUrl("LegalResearch"), icon: Scale },
    ],
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageSquare,
    defaultOpen: false,
    adminOnly: true,
    items: [
      { title: "Bot de Atendimento", url: createPageUrl("WhatsAppBot"), icon: MessageCircle },
      { title: "Conversas", url: "/conversations", icon: MessageSquare },
      { title: "Configurações", url: createPageUrl("WhatsAppConnect"), icon: Settings },
    ],
  },
  {
    id: "equipe",
    label: "Equipe",
    icon: Users2,
    defaultOpen: false,
    items: [
      { title: "Membros da Equipe", url: createPageUrl("Teams"), icon: Users2 },
      { title: "Afiliados", url: createPageUrl("AffiliatesDashboard"), icon: UserCheck, adminOnly: true },
    ],
  },
  {
    id: "assinatura",
    label: "Minha Assinatura",
    icon: Star,
    defaultOpen: false,
    directLink: true,
    url: createPageUrl("MySubscription"),
    items: [],
  },
];

const ADMIN_GROUP = {
  id: "admin",
  label: "Administração",
  icon: Lock,
  defaultOpen: false,
  adminOnly: true,
  items: [
    { title: "Painel Admin", url: createPageUrl("AdminPanel"), icon: BarChart3 },
    { title: "Admin Master", url: createPageUrl("AdminMaster"), icon: Shield },
    { title: "Painel de Afiliados", url: createPageUrl("AffiliatesDashboard"), icon: UserCheck },
    { title: "Assinaturas", url: createPageUrl("AdminSubscriptions"), icon: Crown },
    { title: "Banco de Dados", url: createPageUrl("AdminDatabase"), icon: Database },
    { title: "Auditoria do Sistema", url: createPageUrl("SystemAudit"), icon: ClipboardList },
    { title: "LGPD Compliance", url: createPageUrl("LGPDCompliance"), icon: Shield },
    { title: "LGPD Audit", url: createPageUrl("LGPDAudit"), icon: Shield },
    { title: "Teste de Webhook", url: createPageUrl("WebhookTest"), icon: Zap },
    { title: "Config. Agente IA", url: createPageUrl("AgentSettings"), icon: Bot },
  ],
};

// ─── Badge ─────────────────────────────────────────────────────────────────
function NavBadge({ label }) {
  const styles = {
    IA: { bg: "rgba(79,110,247,0.12)", color: "#4F6EF7" },
    NOVO: { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
    RESTRITO: { bg: "rgba(239,68,68,0.12)", color: "#ef4444" },
  };
  const s = styles[label] || styles.RESTRITO;
  return (
    <span style={{
      fontSize: "0.6rem", fontWeight: 700, padding: "1px 5px",
      borderRadius: 3, background: s.bg, color: s.color,
      letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ─── Link direto (sem submenu) ─────────────────────────────────────────────
function NavDirectLink({ group, location, onNavigate, subscriptionExpired }) {
  const isActive = location.pathname === group.url || location.pathname.startsWith(group.url + "/");
  return (
    <button
      onClick={() => { onNavigate?.(); window.location.href = group.url; }}
      style={{
        display: "flex", alignItems: "center", gap: "0.6rem",
        width: "100%", padding: "0.55rem 1.1rem",
        background: "transparent",
        border: "none", cursor: "pointer",
        borderLeft: isActive ? "3px solid var(--primary)" : "3px solid transparent",
        transition: "background 0.15s",
        fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: isActive ? "var(--primary)" : "var(--text-muted)",
        marginBottom: 2,
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--primary-light)"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <group.icon style={{ width: 15, height: 15, flexShrink: 0, color: isActive ? "var(--primary)" : "var(--text-muted)" }} />
      <span style={{ flex: 1, textAlign: "left" }}>{group.label}</span>
      {group.id === "assinatura" && subscriptionExpired && (
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0, display: "inline-block" }} title="Assinatura expirada" />
      )}
    </button>
  );
}

// ─── Grupo colapsável ──────────────────────────────────────────────────────
function NavGroup({ group, isAdmin, location, onNavigate, isMobile }) {
  const STORAGE_KEY = `juris_nav_${group.id}`;

  const [open, setOpen] = React.useState(() => {
    if (isMobile) return true; // mobile: todos abertos
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) return stored === "true";
    } catch {}
    return group.defaultOpen;
  });

  // Auto-expandir se rota filha estiver ativa
  const visibleItems = group.items.filter(i => !i.adminOnly || isAdmin);
  const hasActiveChild = visibleItems.some(i => location.pathname === i.url || location.pathname.startsWith(i.url + "/"));

  React.useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [location.pathname]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
  };

  if (visibleItems.length === 0) return null;

  const isAdminGroup = group.id === "admin";

  return (
    <div style={{ marginBottom: 2 }}>
      {/* Cabeçalho do grupo */}
      <button
        onClick={toggle}
        style={{
          display: "flex", alignItems: "center", gap: "0.6rem",
          width: "100%", padding: "0.55rem 1.1rem",
          background: isAdminGroup
            ? (open ? "rgba(239,68,68,0.08)" : "transparent")
            : "transparent",
          border: "none", cursor: "pointer",
          borderLeft: isAdminGroup ? "3px solid rgba(239,68,68,0.4)" : "3px solid transparent",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => { if (!isAdminGroup) e.currentTarget.style.background = "var(--primary-light)"; }}
        onMouseLeave={e => { if (!isAdminGroup) e.currentTarget.style.background = isAdminGroup && open ? "rgba(239,68,68,0.08)" : "transparent"; }}
      >
        <group.icon style={{
          width: 15, height: 15, flexShrink: 0,
          color: isAdminGroup ? "#c0392b" : "var(--text-muted)",
        }} />
        <span style={{
          flex: 1, textAlign: "left",
          fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: isAdminGroup ? "#c0392b" : "var(--text-muted)",
          fontFamily: "'Outfit', system-ui, sans-serif",
        }}>
          {group.label}
        </span>
        {isAdminGroup && <NavBadge label="RESTRITO" />}
        <ChevronDown style={{
          width: 13, height: 13, color: isAdminGroup ? "#c0392b" : "var(--text-muted)",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
          flexShrink: 0,
        }} />
      </button>

      {/* Itens do grupo */}
      <div style={{
        overflow: "hidden",
        maxHeight: open ? `${visibleItems.length * 44}px` : "0px",
        transition: "max-height 0.2s ease",
      }}>
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <Link
              key={item.url + item.title}
              to={item.url}
              onClick={onNavigate}
              style={{
                display: "flex", alignItems: "center", gap: "0.65rem",
                padding: "0.5rem 1.1rem 0.5rem 2.2rem",
                textDecoration: "none",
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "#fff" : "var(--text-muted)",
                borderLeft: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                fontSize: "0.8rem", fontWeight: isActive ? 600 : 400,
                transition: "background 0.12s, color 0.12s",
                minHeight: 36,
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "var(--primary-light)"; e.currentTarget.style.color = "var(--primary)"; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}}
            >
              <item.icon style={{ width: 14, height: 14, flexShrink: 0, color: isActive ? "#fff" : "inherit" }} />
              <span style={{ flex: 1 }}>{item.title}</span>
              {item.badge && <NavBadge label={item.badge} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function SidebarNav({ user, onNavigate, isMobile = false, subscriptionExpired = false }) {
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  const groups = NAV_GROUPS.filter(g => !g.adminOnly || isAdmin);

  return (
    <nav style={{ paddingTop: "0.5rem", paddingBottom: "1rem" }}>
      {groups.map(group => (
        group.directLink
          ? <NavDirectLink key={group.id} group={group} location={location} onNavigate={onNavigate} subscriptionExpired={subscriptionExpired} />
          : <NavGroup key={group.id} group={group} isAdmin={isAdmin} location={location} onNavigate={onNavigate} isMobile={isMobile} />
      ))}

      {/* Grupo Admin — só para admins */}
      {isAdmin && (
        <>
          <div style={{ height: 1, background: "var(--border)", margin: "0.5rem 1rem" }} />
          <NavGroup
            group={ADMIN_GROUP}
            isAdmin={isAdmin}
            location={location}
            onNavigate={onNavigate}
            isMobile={isMobile}
          />
        </>
      )}
    </nav>
  );
}
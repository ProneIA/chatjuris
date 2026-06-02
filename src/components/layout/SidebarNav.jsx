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
    items: [],
  },
  {
    id: "ferramentas",
    label: "IA & Ferramentas",
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

// ─── Badge de menu ─────────────────────────────────────────────────────────
function NavBadge({ label }) {
  const isNew = label === "NOVO";
  const isDanger = label === "RESTRITO";
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, padding: "2px 6px",
      border: "1px solid",
      borderRadius: 3,
      letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0,
      color: isDanger ? "#EF4444" : isNew ? "#C8B560" : "rgba(255,255,255,0.40)",
      borderColor: isDanger ? "rgba(239,68,68,0.35)" : isNew ? "rgba(200,181,96,0.40)" : "rgba(255,255,255,0.15)",
      background: "transparent",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {label}
    </span>
  );
}

// ─── Estilos compartilhados ────────────────────────────────────────────────
const ITEM_BASE = {
  display: "flex", alignItems: "center", gap: 10,
  width: "100%", padding: "8px 16px",
  background: "transparent", border: "none", cursor: "pointer",
  borderLeft: "2px solid transparent",
  transition: "background 0.1s ease, color 0.1s ease",
  fontSize: 13, fontWeight: 500,
  color: "#888888",
  textDecoration: "none",
  fontFamily: "'Inter', -apple-system, sans-serif",
  borderRadius: 0,
  textAlign: "left",
};

const ITEM_ACTIVE = {
  background: "#2A2A2A",
  color: "#FFFFFF",
  fontWeight: 600,
  borderLeftColor: "#C8B560",
};

// ─── Label de seção ────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
      textTransform: "uppercase", color: "#888888",
      padding: "20px 16px 6px",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {children}
    </div>
  );
}

// ─── Link direto (sem submenu) ─────────────────────────────────────────────
function NavDirectLink({ group, location, onNavigate, subscriptionExpired }) {
  const isActive = location.pathname === group.url || location.pathname.startsWith(group.url + "/");
  return (
    <button
      onClick={() => { onNavigate?.(); window.location.href = group.url; }}
      style={{ ...ITEM_BASE, ...(isActive ? ITEM_ACTIVE : {}) }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#1F1F1F"; e.currentTarget.style.color = "#FFFFFF"; }}}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888888"; }}}
      >
        <group.icon style={{ width: 15, height: 15, flexShrink: 0, strokeWidth: 1.5 }} />
        <span style={{ flex: 1 }}>{group.label}</span>
      {group.id === "assinatura" && subscriptionExpired && (
        <span style={{ width: 6, height: 6, background: "#C0392B", display: "inline-block" }} />
      )}
    </button>
  );
}

// ─── Grupo colapsável ──────────────────────────────────────────────────────
function NavGroup({ group, isAdmin, location, onNavigate, isMobile }) {
  const STORAGE_KEY = `juris_nav_${group.id}`;

  const [open, setOpen] = React.useState(() => {
    if (isMobile) return true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) return stored === "true";
    } catch {}
    return group.defaultOpen;
  });

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
    <div>
      <button
        onClick={toggle}
        style={{
          ...ITEM_BASE,
          borderLeftColor: isAdminGroup ? "rgba(239,68,68,0.5)" : "transparent",
          background: isAdminGroup ? "rgba(239,68,68,0.06)" : "transparent",
          color: isAdminGroup ? "#EF4444" : "#888888",
        }}
        onMouseEnter={e => { if (!isAdminGroup) { e.currentTarget.style.background = "#1F1F1F"; e.currentTarget.style.color = "#FFFFFF"; }}}
        onMouseLeave={e => { if (!isAdminGroup) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888888"; }}}
      >
        <group.icon style={{ width: 14, height: 14, flexShrink: 0, strokeWidth: 1.5 }} />
        <span style={{ flex: 1, textAlign: "left" }}>{group.label}</span>
        {isAdminGroup && <NavBadge label="RESTRITO" />}
        <ChevronDown style={{
          width: 11, height: 11,
          color: isAdminGroup ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.25)",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.15s ease",
          flexShrink: 0,
        }} />
      </button>

      <div style={{
        overflow: "hidden",
        maxHeight: open ? `${visibleItems.length * 36}px` : "0px",
        transition: "max-height 0.18s ease",
      }}>
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <Link
              key={item.url + item.title}
              to={item.url}
              onClick={onNavigate}
              style={{
                ...ITEM_BASE,
                padding: "8px 16px 8px 40px",
                fontSize: 13,
                ...(isActive ? ITEM_ACTIVE : {}),
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#1F1F1F"; e.currentTarget.style.color = "#FFFFFF"; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888888"; }}}
            >
              <item.icon style={{ width: 15, height: 15, flexShrink: 0, strokeWidth: 1.5 }} />
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

  // Agrupa por seções
  const painel = groups.filter(g => ["painel"].includes(g.id));
  const gestao = groups.filter(g => ["gestao", "financeiro"].includes(g.id));
  const ferramentas = groups.filter(g => ["ferramentas"].includes(g.id));
  const outros = groups.filter(g => ["whatsapp", "equipe", "assinatura"].includes(g.id));

  const renderGroup = (g) => g.directLink
    ? <NavDirectLink key={g.id} group={g} location={location} onNavigate={onNavigate} subscriptionExpired={subscriptionExpired} />
    : <NavGroup key={g.id} group={g} isAdmin={isAdmin} location={location} onNavigate={onNavigate} isMobile={isMobile} />;

  return (
    <nav style={{ paddingBottom: 8 }}>
      <SectionLabel>Principal</SectionLabel>
      {painel.map(renderGroup)}

      <SectionLabel>Escritório</SectionLabel>
      {gestao.map(renderGroup)}

      <SectionLabel>Ferramentas</SectionLabel>
      {ferramentas.map(renderGroup)}

      {outros.length > 0 && (
        <>
          <SectionLabel>Configurações</SectionLabel>
          {outros.map(renderGroup)}
        </>
      )}

      {isAdmin && (
        <>
          <div style={{ height: 1, background: "rgba(239,68,68,0.15)", margin: "8px 0" }} />
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
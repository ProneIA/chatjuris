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
  const isIA = label === "IA";
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "2px 5px",
      border: "0.5px solid",
      borderRadius: 4,
      letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0,
      color: isDanger ? "#EF4444" : isNew ? "#C4A44A" : isIA ? "#2D5A27" : "rgba(255,255,255,0.35)",
      borderColor: isDanger ? "rgba(239,68,68,0.4)" : isNew ? "rgba(196,164,74,0.5)" : isIA ? "rgba(45,90,39,0.5)" : "rgba(255,255,255,0.12)",
      background: isDanger ? "rgba(239,68,68,0.08)" : isNew ? "rgba(196,164,74,0.08)" : isIA ? "rgba(45,90,39,0.10)" : "transparent",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      {label}
    </span>
  );
}

// ─── Label de seção ────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: "0.10em",
      textTransform: "uppercase", color: "#666660",
      padding: "18px 12px 5px",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      {children}
    </div>
  );
}

// ─── Estilos base item ─────────────────────────────────────────────────────
const ITEM_BASE = {
  display: "flex", alignItems: "center", gap: 8,
  width: "100%", padding: "7px 10px",
  background: "transparent", border: "none", cursor: "pointer",
  transition: "background 0.12s ease, color 0.12s ease",
  fontSize: 13, fontWeight: 500,
  color: "#BFBFB0",
  textDecoration: "none",
  fontFamily: "'DM Sans', -apple-system, sans-serif",
  borderRadius: 6,
  textAlign: "left",
  margin: "1px 0",
};

const ITEM_ACTIVE = {
  background: "rgba(255,255,255,0.07)",
  color: "#FFFFFF",
  fontWeight: 600,
};

// ─── Link direto ───────────────────────────────────────────────────────────
function NavDirectLink({ group, location, onNavigate, subscriptionExpired }) {
  const isActive = location.pathname === group.url || location.pathname.startsWith(group.url + "/");
  return (
    <button
      onClick={() => { onNavigate?.(); window.location.href = group.url; }}
      style={{ ...ITEM_BASE, ...(isActive ? ITEM_ACTIVE : {}) }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#FFFFFF"; }}}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#BFBFB0"; }}}
    >
      <group.icon style={{ width: 14, height: 14, flexShrink: 0, strokeWidth: 1.5 }} />
      <span style={{ flex: 1 }}>{group.label}</span>
      {group.id === "assinatura" && subscriptionExpired && (
        <span style={{ width: 6, height: 6, background: "#EF4444", display: "inline-block", borderRadius: "50%" }} />
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
          background: isAdminGroup ? "rgba(239,68,68,0.06)" : "transparent",
          color: isAdminGroup ? "#EF4444" : "#BFBFB0",
        }}
        onMouseEnter={e => { if (!isAdminGroup) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#FFFFFF"; }}}
        onMouseLeave={e => { if (!isAdminGroup) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#BFBFB0"; }}}
      >
        <group.icon style={{ width: 14, height: 14, flexShrink: 0, strokeWidth: 1.5 }} />
        <span style={{ flex: 1, textAlign: "left" }}>{group.label}</span>
        {isAdminGroup && <NavBadge label="RESTRITO" />}
        <ChevronDown style={{
          width: 11, height: 11,
          color: isAdminGroup ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.2)",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.15s ease",
          flexShrink: 0,
        }} />
      </button>

      <div style={{
        overflow: "hidden",
        maxHeight: open ? `${visibleItems.length * 34}px` : "0px",
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
                padding: "6px 10px 6px 30px",
                fontSize: 12.5,
                ...(isActive ? ITEM_ACTIVE : {}),
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#FFFFFF"; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#BFBFB0"; }}}
            >
              <item.icon style={{ width: 13, height: 13, flexShrink: 0, strokeWidth: 1.5 }} />
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

  const painel = groups.filter(g => ["painel"].includes(g.id));
  const gestao = groups.filter(g => ["gestao", "financeiro"].includes(g.id));
  const ferramentas = groups.filter(g => ["ferramentas"].includes(g.id));
  const outros = groups.filter(g => ["whatsapp", "equipe", "assinatura"].includes(g.id));

  const renderGroup = (g) => g.directLink
    ? <NavDirectLink key={g.id} group={g} location={location} onNavigate={onNavigate} subscriptionExpired={subscriptionExpired} />
    : <NavGroup key={g.id} group={g} isAdmin={isAdmin} location={location} onNavigate={onNavigate} isMobile={isMobile} />;

  return (
    <nav style={{ paddingBottom: 8, padding: "0 8px 8px" }}>
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
          <div style={{ height: "0.5px", background: "rgba(239,68,68,0.2)", margin: "8px 0" }} />
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
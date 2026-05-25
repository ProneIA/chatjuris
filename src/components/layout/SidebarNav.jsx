import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, FolderOpen, Users, FileText, Scale,
  BookOpen, Calculator, Newspaper, Bot, Zap, Settings,
  BarChart2, CheckSquare, Activity, MessageCircle, Users2,
  UserCheck, Shield, Database, ClipboardList, Lock, Crown,
  ChevronDown,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { to: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "RadarOportunidades", label: "Radar", icon: Activity },
      { to: "Tasks", label: "Tarefas e Prazos", icon: CheckSquare },
    ],
  },
  {
    label: "Gestão",
    items: [
      { to: "Clients", label: "Clientes", icon: Users },
      { to: "ClientPortal", label: "Portal do Cliente", icon: Users2 },
      { to: "Cases", label: "Processos", icon: FolderOpen },
      { to: "DocumentsEnhanced", label: "Documentos", icon: FileText },
    ],
  },
  {
    label: "IA & Ferramentas",
    items: [
      { to: "AIAssistant", label: "Assistente IA", icon: Bot, badge: "IA" },
      { to: "DocumentGenerator", label: "Gerador de Peças", icon: FileText, badge: "IA" },
      { to: "CalculadoraJuridica", label: "Calculadora Jurídica", icon: Calculator, directPath: "/CalculadoraJuridica" },
      { to: "DiarioMonitor", label: "Monitor de Diários", icon: Newspaper, badge: "NOVO" },
      { to: "Templates", label: "Modelos de Peças", icon: BookOpen },
      { to: "LegalResearch", label: "Pesquisa Jurídica", icon: Scale },
    ],
  },
  {
    label: "Financeiro & Análise",
    items: [
      { to: "FinancialDashboard", label: "Financeiro", icon: BarChart2 },
    ],
  },
  {
    label: "Equipe",
    items: [
      { to: "Teams", label: "Membros da Equipe", icon: Users2 },
    ],
  },
  {
    label: "Conta",
    items: [
      { to: "Settings", label: "Preferências", icon: Settings },
      { to: "MySubscription", label: "Minha Assinatura", icon: Zap },
    ],
  },
];

const ADMIN_ITEMS = [
  { to: "AdminPanel", label: "Painel Admin", icon: BarChart2 },
  { to: "AdminMaster", label: "Admin Master", icon: Shield },
  { to: "AdminSubscriptions", label: "Assinaturas", icon: Crown },
  { to: "AdminDatabase", label: "Banco de Dados", icon: Database },
  { to: "SystemAudit", label: "Auditoria", icon: ClipboardList },
  { to: "AffiliatesDashboard", label: "Afiliados", icon: UserCheck },
  { to: "WhatsAppBot", label: "WhatsApp Bot", icon: MessageCircle },
  { to: "LGPDCompliance", label: "LGPD", icon: Shield },
];

function NavBadge({ label }) {
  const colors = {
    IA:   { bg: "rgba(79,110,247,0.12)", color: "#4F6EF7" },
    NOVO: { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
  };
  const s = colors[label] || colors.IA;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "1px 5px",
      borderRadius: 3, background: s.bg, color: s.color,
      letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

export default function SidebarNav({ user, onNavigate, isMobile = false }) {
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  const isActive = (item) => {
    if (item.directPath) return location.pathname === item.directPath;
    const url = createPageUrl(item.to);
    return location.pathname === url || location.pathname.startsWith(url + "/");
  };

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {NAV_SECTIONS.map((section, si) => (
        <div key={si} style={{ marginBottom: 4 }}>
          {section.label && (
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--text-muted)",
              padding: "10px 14px 4px", margin: 0,
            }}>
              {section.label}
            </p>
          )}
          {section.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            const href = item.directPath || createPageUrl(item.to);
            return (
              <Link
                key={item.to}
                to={href}
                onClick={onNavigate}
                className={`sidebar-item${active ? " active" : ""}`}
              >
                <Icon style={{ width: 16, height: 16, flexShrink: 0, color: active ? "var(--gold)" : "var(--text-muted)" }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && <NavBadge label={item.badge} />}
              </Link>
            );
          })}
        </div>
      ))}

      {/* Admin */}
      {isAdmin && (
        <div style={{ marginTop: 8 }}>
          <div style={{ height: 1, background: "var(--border)", margin: "4px 14px 8px" }} />
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#ef4444",
            padding: "4px 14px", margin: 0,
          }}>
            Administração
          </p>
          {ADMIN_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === createPageUrl(item.to);
            return (
              <Link
                key={item.to}
                to={createPageUrl(item.to)}
                onClick={onNavigate}
                className={`sidebar-item${active ? " active" : ""}`}
                style={{ color: active ? "var(--gold-deep)" : "#ef4444", opacity: active ? 1 : 0.75 }}
              >
                <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
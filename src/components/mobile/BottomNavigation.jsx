import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, FolderOpen, Bot, FileText, Settings,
  MoreHorizontal, X, CheckSquare, Scale, BookOpen,
  Calculator, Newspaper, Users, BarChart2, Zap, Shield, LogOut, Crown,
  Activity, Users2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MAIN_ITEMS = [
  { to: "Dashboard",         label: "Início",    icon: LayoutDashboard },
  { to: "Cases",             label: "Processos", icon: FolderOpen },
  { to: "AIAssistant",       label: "IA",        icon: Bot, highlight: true },
  { to: "DocumentGenerator", label: "Peças",     icon: FileText },
  { to: null,                label: "Mais",      icon: MoreHorizontal, isMenu: true },
];

const MORE_ITEMS = [
  { to: "Tasks",              label: "Tarefas",      icon: CheckSquare },
  { to: "Clients",            label: "Clientes",     icon: Users },
  { to: "LegalResearch",      label: "Jurisprudência", icon: Scale },
  { to: "Templates",          label: "Modelos",      icon: BookOpen },
  { to: "CalculadoraJuridica", label: "Calculadora", icon: Calculator, directPath: "/CalculadoraJuridica" },
  { to: "DiarioMonitor",      label: "Diário",       icon: Newspaper },
  { to: "FinancialDashboard", label: "Financeiro",   icon: BarChart2 },
  { to: "Teams",              label: "Equipe",       icon: Users2 },
  { to: "RadarOportunidades", label: "Radar",        icon: Activity },
  { to: "MySubscription",     label: "Assinatura",   icon: Zap },
  { to: "Settings",           label: "Config",       icon: Settings },
];

export default function BottomNavigation({ user, onLogout }) {
  const location = useLocation();
  const [showMore, setShowMore] = React.useState(false);
  const isAdmin = user?.role === "admin";

  const getHref = (item) => item.directPath || (item.to ? createPageUrl(item.to) : "#");

  const isActive = (item) => {
    if (!item.to) return false;
    const href = getHref(item);
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  const allMoreItems = isAdmin
    ? [...MORE_ITEMS, { to: "AdminPanel", label: "Admin", icon: Shield }]
    : MORE_ITEMS;

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        height: "var(--bottom-nav-h)",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid #E2E8F0",
        display: "flex", alignItems: "stretch",
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}>
        {MAIN_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          if (item.isMenu) {
            return (
              <button
                key="more"
                onClick={() => setShowMore(true)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 3,
                  background: "none", border: "none", cursor: "pointer",
                  padding: "6px 0",
                  color: showMore ? "#2B6CB0" : "#718096",
                  transition: "color 0.15s",
                }}
              >
                <div style={{
                  padding: "5px", borderRadius: 8,
                  background: showMore ? "#EBF4FF" : "transparent",
                  transition: "background 0.15s",
                }}>
                  <Icon style={{ width: 20, height: 20 }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 500 }}>Mais</span>
              </button>
            );
          }

          return (
            <Link
              key={item.to}
              to={getHref(item)}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                textDecoration: "none", padding: "6px 0",
                color: active ? "#2B6CB0" : "#718096",
                position: "relative", transition: "color 0.15s ease",
              }}
            >
              {active && (
                <span style={{
                  position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                  width: 28, height: 2.5,
                  background: "#2B6CB0",
                  borderRadius: "0 0 3px 3px",
                }} />
              )}
              {item.highlight ? (
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: active
                    ? "linear-gradient(135deg, #2B6CB0 0%, #1A4F8A 100%)"
                    : "linear-gradient(135deg, #3182CE 0%, #2B6CB0 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: -8, boxShadow: "0 4px 14px rgba(43,108,176,0.4)",
                }}>
                  <Icon style={{ width: 20, height: 20, color: "#fff" }} />
                </div>
              ) : (
                <div style={{
                  padding: "5px", borderRadius: 8,
                  background: active ? "#EBF4FF" : "transparent",
                  transition: "background 0.15s",
                }}>
                  <Icon style={{ width: 20, height: 20, color: active ? "#2B6CB0" : "#718096", transition: "color 0.15s ease" }} />
                </div>
              )}
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 500, letterSpacing: "0.01em", marginTop: item.highlight ? 2 : 0 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* More Menu Sheet */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 55, backdropFilter: "blur(2px)" }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                zIndex: 56,
                background: "var(--surface)",
                borderRadius: "20px 20px 0 0",
                borderTop: "1px solid var(--border)",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
            >
              {/* Handle */}
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-strong)" }} />
              </div>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px" }}>
                <span style={{ fontWeight: 700, fontSize: 17, color: "var(--text)" }}>Menu</span>
                <button
                  onClick={() => setShowMore(false)}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "var(--surface-3)", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-secondary)",
                  }}
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>

              {/* Grid */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                gap: 4, padding: "0 12px 16px",
                maxHeight: "55vh", overflowY: "auto",
              }}>
                {allMoreItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.to}
                      to={getHref(item)}
                      onClick={() => setShowMore(false)}
                      style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        gap: 6, padding: "12px 8px",
                        borderRadius: 12, textDecoration: "none",
                        background: active ? "#EBF4FF" : "transparent",
                        color: active ? "#1A4F8A" : "var(--text-secondary)",
                        transition: "background 0.15s",
                        minHeight: 70,
                      }}
                    >
                      <Icon style={{ width: 22, height: 22, color: active ? "#2B6CB0" : "var(--text-muted)" }} />
                      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, textAlign: "center", lineHeight: 1.2 }}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}

                {/* Sair */}
                <button
                  onClick={() => { setShowMore(false); onLogout?.(); }}
                  style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "12px 8px",
                    borderRadius: 12, border: "none", cursor: "pointer",
                    background: "transparent", color: "var(--error)",
                    minHeight: 70, fontFamily: "var(--font-sans)",
                  }}
                >
                  <LogOut style={{ width: 22, height: 22 }} />
                  <span style={{ fontSize: 10, fontWeight: 500 }}>Sair</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
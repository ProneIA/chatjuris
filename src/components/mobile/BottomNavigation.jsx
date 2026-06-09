import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, FileText, Sparkles, Calculator, Settings,
  MoreHorizontal, X, CheckSquare, Scale, BookOpen,
  Newspaper, Users, BarChart2, Zap, Shield, LogOut, Crown,
  Activity, Users2, FolderOpen, Bot, DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MAIN_ITEMS = [
  { to: "Dashboard",         label: "Início",    icon: LayoutDashboard },
  { to: "Cases",             label: "Processos", icon: FolderOpen },
  { to: "AIAssistant",       label: "IA",        icon: Sparkles, highlight: true },
  { to: "DocumentGenerator", label: "Peças",     icon: FileText },
  { to: null,                label: "Mais",      icon: MoreHorizontal, isMenu: true },
];

const MORE_ITEMS = [
  { to: "Tasks",              label: "Tarefas",        icon: CheckSquare },
  { to: "Clients",            label: "Clientes",       icon: Users },
  { to: "LegalResearch",      label: "Jurisprudência", icon: Scale },
  { to: "Templates",          label: "Modelos",        icon: BookOpen },
  { to: "CalculadoraJuridica", label: "Calculadora",   icon: Calculator, directPath: "/CalculadoraJuridica" },
  { to: "DiarioMonitor",      label: "Diário",         icon: Newspaper },
  { to: "FinancialDashboard", label: "Financeiro",     icon: BarChart2 },
  { to: "Teams",              label: "Equipe",         icon: Users2 },
  { to: "RadarOportunidades", label: "Radar",          icon: Activity },
  { to: "MySubscription",     label: "Assinatura",     icon: Zap },
  { to: "Settings",           label: "Config",         icon: Settings },
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
        height: "var(--bottom-nav-h, 60px)",
        background: "rgba(255,255,255,.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)",
        display: "flex", alignItems: "stretch",
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -2px 16px rgba(0,0,0,.06)",
      }} className="show-on-mobile">
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
                  color: showMore ? "var(--accent)" : "var(--text-3)",
                  transition: "color .15s",
                  minHeight: "unset",
                }}
              >
                <div style={{
                  padding: "5px", borderRadius: 8,
                  background: showMore ? "var(--accent-light)" : "transparent",
                  transition: "background .15s",
                }}>
                  <Icon size={20} />
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
                color: active ? "var(--accent)" : "var(--text-3)",
                position: "relative", transition: "color .15s",
              }}
            >
              {active && (
                <span style={{
                  position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                  width: 24, height: 2.5,
                  background: "var(--accent)",
                  borderRadius: "0 0 3px 3px",
                }} />
              )}
              {item.highlight ? (
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: "var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: -8, boxShadow: "0 4px 14px rgba(59,130,246,.4)",
                }}>
                  <Icon size={20} style={{ color: "#fff" }} />
                </div>
              ) : (
                <div style={{
                  padding: "5px", borderRadius: 8,
                  background: active ? "var(--accent-light)" : "transparent",
                  transition: "background .15s",
                }}>
                  <Icon size={20} />
                </div>
              )}
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, marginTop: item.highlight ? 2 : 0 }}>
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
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 55, backdropFilter: "blur(2px)" }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                zIndex: 56,
                background: "var(--card)",
                borderRadius: "20px 20px 0 0",
                borderTop: "1px solid var(--border)",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-2)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px" }}>
                <span style={{ fontWeight: 700, fontSize: 17, color: "var(--text-1)" }}>Menu</span>
                <button
                  onClick={() => setShowMore(false)}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "var(--surface)", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-2)", minHeight: "unset", minWidth: "unset",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
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
                        background: active ? "var(--accent-light)" : "transparent",
                        color: active ? "var(--accent)" : "var(--text-2)",
                        transition: "background .15s",
                        minHeight: 70,
                      }}
                    >
                      <Icon size={22} style={{ color: active ? "var(--accent)" : "var(--text-3)" }} />
                      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, textAlign: "center", lineHeight: 1.2 }}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
                <button
                  onClick={() => { setShowMore(false); onLogout?.(); }}
                  style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "12px 8px",
                    borderRadius: 12, border: "none", cursor: "pointer",
                    background: "transparent", color: "var(--red)",
                    minHeight: 70, fontFamily: "var(--font-body)",
                  }}
                >
                  <LogOut size={22} />
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
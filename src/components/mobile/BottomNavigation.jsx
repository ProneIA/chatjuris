import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  FolderOpen,
  Sparkles,
  CheckSquare,
  MoreHorizontal,
  DollarSign,
  Scale,
  BookOpen,
  Users2,
  Activity,
  MessageSquare,
  Settings,
  Crown,
  LogOut,
  Shield,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const mainItems = [
  { title: "Painel", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "Processos", url: createPageUrl("Cases"), icon: FolderOpen },
  { title: "IA", url: createPageUrl("AIAssistant"), icon: Sparkles, highlight: true },
  { title: "Tarefas", url: createPageUrl("Tasks"), icon: CheckSquare },
  { title: "Mais", url: null, icon: MoreHorizontal, isMenu: true },
];

const moreItems = [
  { title: "Financeiro", url: createPageUrl("FinancialDashboard"), icon: DollarSign },
  { title: "Radar", url: createPageUrl("RadarOportunidades"), icon: Activity },
  { title: "Pesquisa", url: createPageUrl("LegalResearch"), icon: Scale },
  { title: "Modelos", url: createPageUrl("Templates"), icon: BookOpen },
  { title: "Clientes", url: createPageUrl("Clients"), icon: Users2 },
  { title: "WhatsApp Bot", url: createPageUrl("WhatsAppBot"), icon: MessageSquare },
  { title: "Equipes", url: createPageUrl("Teams"), icon: Users2 },
  { title: "Gestão", url: createPageUrl("GestaoHub"), icon: FolderOpen },
  { title: "Ferramentas", url: createPageUrl("FerramentasHub"), icon: Scale },
  { title: "Assinatura", url: createPageUrl("MySubscription"), icon: Crown },
  { title: "Preferências", url: createPageUrl("Settings"), icon: Settings },
];

// Save / restore scroll per-page using sessionStorage
function useScrollPreservation(pathname) {
  const scrollRef = React.useRef({});

  React.useEffect(() => {
    const key = `scroll_${pathname}`;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      window.scrollTo(0, parseInt(saved, 10));
    }

    const saveScroll = () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };

    window.addEventListener("scroll", saveScroll, { passive: true });
    return () => window.removeEventListener("scroll", saveScroll);
  }, [pathname]);
}

export default function BottomNavigation({ isDark, user, onLogout }) {
  const location = useLocation();
  const [showMore, setShowMore] = React.useState(false);

  useScrollPreservation(location.pathname);

  const adminMoreItems = user?.role === 'admin' 
    ? [...moreItems, { title: "Admin", url: createPageUrl("AdminPanel"), icon: Shield }]
    : moreItems;

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 border-t safe-area-bottom ${
        isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'
      }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {mainItems.map((item) => {
            const isActive = item.url && location.pathname === item.url;
            const Icon = item.icon;

            if (item.isMenu) {
              return (
                <button
                  key="more"
                  onClick={() => setShowMore(true)}
                  className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
                    showMore
                      ? isDark ? 'text-white' : 'text-black'
                      : isDark ? 'text-neutral-500' : 'text-gray-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium">{item.title}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.title}
                to={item.url}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative ${
                  isActive
                    ? isDark ? 'text-white' : 'text-black'
                    : isDark ? 'text-neutral-500' : 'text-gray-400'
                }`}
              >
                {item.highlight ? (
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center -mt-6 shadow-lg ${
                    isActive 
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600' 
                      : 'bg-gradient-to-br from-purple-500 to-indigo-500'
                  }`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Icon className="w-6 h-6" />
                      {isActive && (
                        <motion.div
                          layoutId="bottomNavIndicator"
                          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                            isDark ? 'bg-white' : 'bg-black'
                          }`}
                        />
                      )}
                    </div>
                    <span className="text-[10px] font-medium">{item.title}</span>
                  </>
                )}
                {item.highlight && (
                  <span className="text-[10px] font-medium mt-1">{item.title}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More Menu Overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t ${
                isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-gray-200'
              }`}
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-neutral-700' : 'bg-gray-300'}`} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3">
                <span className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Menu</span>
                <button
                  onClick={() => setShowMore(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-4 gap-1 px-4 pb-4 max-h-[60vh] overflow-y-auto">
                {adminMoreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.url;
                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      onClick={() => setShowMore(false)}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all ${
                        isActive
                          ? isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'
                          : isDark ? 'text-neutral-400 hover:bg-neutral-900' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-[10px] font-medium text-center leading-tight">{item.title}</span>
                    </Link>
                  );
                })}

                {/* Logout */}
                <button
                  onClick={() => { setShowMore(false); onLogout(); }}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl text-red-500 hover:bg-red-50"
                >
                  <LogOut className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Sair</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
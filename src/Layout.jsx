import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Scale, 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  FileText, 
  BookTemplate,
  CheckSquare,
  Sparkles,
  CalendarDays,
  BookOpen,
  LogOut,
  MessageSquare,
  Menu,
  X,
  Settings,
  Crown,
  Users2,
  Moon,
  Sun
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import KeyboardShortcuts from "@/components/common/KeyboardShortcuts";
import NotificationPanel from "@/components/collaboration/NotificationPanel";
import { Button } from "@/components/ui/button";

const navigationSections = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
      { title: "Assistente IA", url: createPageUrl("AIAssistant"), icon: Sparkles },
      { title: "Assinar Pro", url: createPageUrl("Pricing"), icon: Crown },
    ]
  },
  {
    label: "Gestão",
    items: [
      { title: "Clientes", url: createPageUrl("Clients"), icon: Users },
      { title: "Processos", url: createPageUrl("Cases"), icon: FolderOpen },
      { title: "Documentos", url: createPageUrl("DocumentManager"), icon: FileText },
      { title: "Tarefas", url: createPageUrl("Tasks"), icon: CheckSquare },
    ]
  },
  {
    label: "Colaboração",
    items: [
      { title: "Portal do Cliente", url: createPageUrl("ClientPortal"), icon: Users, proBadge: true },
      { title: "Equipes", url: createPageUrl("Teams"), icon: Users2, proBadge: true },
      { title: "Workspace", url: createPageUrl("TeamWorkspace"), icon: FolderOpen, proBadge: true },
    ]
  },
  {
    label: "Recursos",
    items: [
      { title: "Pesquisa IA", url: createPageUrl("LegalResearch"), icon: BookOpen, proBadge: true },
      { title: "Jurisprudência", url: createPageUrl("Jurisprudence"), icon: BookOpen, proBadge: true },
      { title: "Templates", url: createPageUrl("Templates"), icon: BookTemplate, proBadge: true },
      { title: "Calendário", url: createPageUrl("Calendar"), icon: CalendarDays, proBadge: true },
    ]
  },
  {
    label: "Configurações",
    items: [
      { title: "Preferências", url: createPageUrl("Settings"), icon: Settings },
      { title: "Contato", url: createPageUrl("Contact"), icon: MessageSquare },
    ]
  }
];

export default function Layout({ children, currentPageName }) {
    const location = useLocation();
    const [user, setUser] = React.useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [theme, setTheme] = React.useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('juris-theme') || 'light';
      }
      return 'light';
    });

    React.useEffect(() => {
      base44.auth.me().then(setUser).catch(() => {});
    }, []);

    React.useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('juris-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
      setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const isDark = theme === 'dark';

    const handleLogout = () => {
      base44.auth.logout();
    };

    const isOnAIPage = location.pathname === createPageUrl("AIAssistant");
    const isLandingPage = currentPageName === "LandingPage";

    if (isLandingPage) {
      return <>{children}</>;
    }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <KeyboardShortcuts />
      
      {/* Custom Scrollbar */}
      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: ${isDark ? '#0a0a0a' : '#f1f5f9'};
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? '#333' : '#cbd5e1'};
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#444' : '#94a3b8'};
        }
      `}</style>

      {/* Mobile Header */}
      <header className={`lg:hidden fixed top-0 left-0 right-0 h-16 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'} border-b z-50`}>
        <div className="h-full px-4 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-neutral-800 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <Link 
            to={createPageUrl("Dashboard")} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Juris</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={isDark ? 'text-white hover:bg-neutral-800' : 'text-gray-600 hover:bg-gray-100'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            {user && <NotificationPanel user={user} />}
            <Link
              to={createPageUrl("AIAssistant")}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white hover:bg-gray-100' : 'bg-gray-900 hover:bg-gray-800'}`}
            >
              <Sparkles className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`lg:hidden fixed inset-0 ${isDark ? 'bg-black/70' : 'bg-black/50'} z-40`}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30 }}
              className={`lg:hidden fixed top-16 left-0 bottom-0 w-72 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'} border-r z-40 overflow-y-auto`}
            >
              <nav className="p-4 space-y-6">
                {navigationSections.map((section) => (
                  <div key={section.label}>
                    <p className={`text-xs font-medium uppercase tracking-wider mb-3 px-3 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                      {section.label}
                    </p>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <Link
                          key={item.title}
                          to={item.url}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            location.pathname === item.url
                              ? isDark ? 'bg-white text-black font-medium' : 'bg-gray-900 text-white font-medium'
                              : isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" />
                            <span>{item.title}</span>
                          </div>
                          {item.proBadge && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-200 text-gray-500'}`}>PRO</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                <div className={`pt-4 border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sair</span>
                  </button>
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block fixed top-0 left-0 bottom-0 w-64 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'} border-r overflow-y-auto`}>
        <div className={`p-6 border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'} flex items-center justify-between`}>
          <Link 
            to={createPageUrl("Dashboard")} 
            className="hover:opacity-80 transition-opacity"
          >
            <span className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Juris</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={isDark ? 'text-white hover:bg-neutral-800' : 'text-gray-600 hover:bg-gray-100'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="p-4 space-y-6">
          {navigationSections.map((section) => (
            <div key={section.label}>
              <p className={`text-xs font-medium uppercase tracking-wider mb-3 px-3 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      location.pathname === item.url
                        ? isDark ? 'bg-white text-black font-medium' : 'bg-gray-900 text-white font-medium'
                        : isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.title}</span>
                    </div>
                    {item.proBadge && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-200 text-gray-500'}`}>PRO</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={`p-4 border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'} mt-auto`}>
          <div className="flex items-center gap-3 px-3 mb-4">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isDark ? 'bg-white' : 'bg-gray-900'}`}>
              <span className={`font-semibold text-sm ${isDark ? 'text-black' : 'text-white'}`}>
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user?.full_name || 'Usuário'}
              </p>
              <p className={`text-xs truncate ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors ${isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`min-h-screen ${isOnAIPage ? '' : 'pt-16 lg:pt-0 lg:pl-64'}`}>
        <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
          {React.cloneElement(children, { theme })}
        </div>
      </main>
    </div>
  );
}
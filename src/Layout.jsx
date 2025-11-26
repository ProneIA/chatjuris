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
      { title: "Documentos", url: createPageUrl("Documents"), icon: FileText },
      { title: "Tarefas", url: createPageUrl("Tasks"), icon: CheckSquare },
    ]
  },
  {
    label: "Colaboração",
    items: [
      { title: "Equipes", url: createPageUrl("Teams"), icon: Users2, proBadge: true },
      { title: "Workspace", url: createPageUrl("TeamWorkspace"), icon: FolderOpen, proBadge: true },
    ]
  },
  {
    label: "Recursos",
    items: [
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
    <div className="min-h-screen bg-neutral-950">
      <KeyboardShortcuts />
      
      {/* Custom Scrollbar */}
      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black border-b border-neutral-800 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-neutral-800 rounded-lg text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <Link 
            to={createPageUrl("Dashboard")} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-xl font-semibold text-white tracking-tight">Juris</span>
          </Link>

          <div className="flex items-center gap-2">
            {user && <NotificationPanel user={user} />}
            <Link
              to={createPageUrl("AIAssistant")}
              className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Sparkles className="w-5 h-5 text-black" />
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
              className="lg:hidden fixed inset-0 bg-black/70 z-40"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30 }}
              className="lg:hidden fixed top-16 left-0 bottom-0 w-72 bg-black border-r border-neutral-800 z-40 overflow-y-auto"
            >
              <nav className="p-4 space-y-6">
                {navigationSections.map((section) => (
                  <div key={section.label}>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3 px-3">
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
                              ? 'bg-white text-black font-medium'
                              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" />
                            <span>{item.title}</span>
                          </div>
                          {item.proBadge && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded">PRO</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-neutral-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors"
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
      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 w-64 bg-black border-r border-neutral-800 overflow-y-auto">
        <Link 
          to={createPageUrl("Dashboard")} 
          className="block p-6 border-b border-neutral-800 hover:bg-neutral-900 transition-colors"
        >
          <span className="text-2xl font-semibold text-white tracking-tight">Juris</span>
        </Link>

        <nav className="p-4 space-y-6">
          {navigationSections.map((section) => (
            <div key={section.label}>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3 px-3">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      location.pathname === item.url
                        ? 'bg-white text-black font-medium'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.title}</span>
                    </div>
                    {item.proBadge && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded">PRO</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-800 mt-auto">
          <div className="flex items-center gap-3 px-3 mb-4">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
              <span className="text-black font-semibold text-sm">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">
                {user?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`min-h-screen ${isOnAIPage ? '' : 'pt-16 lg:pt-0 lg:pl-64'}`}>
        <div className="min-h-screen bg-neutral-950">
          {children}
        </div>
      </main>
    </div>
  );
}
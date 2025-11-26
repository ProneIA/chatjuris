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
  Home
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import KeyboardShortcuts from "@/components/common/KeyboardShortcuts";
import NotificationPanel from "@/components/collaboration/NotificationPanel";

const navigationSections = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
      { title: "Assistente IA", url: createPageUrl("AIAssistant"), icon: Sparkles },
      { title: "⭐ Assinar Pro", url: createPageUrl("Pricing"), icon: Crown },
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
    label: "Colaboração Pro",
    items: [
      { title: "Equipes", url: createPageUrl("Teams"), icon: Users2, proBadge: true },
      { title: "Workspace", url: createPageUrl("TeamWorkspace"), icon: FolderOpen, proBadge: true },
    ]
  },
  {
    label: "Recursos Pro",
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

    React.useEffect(() => {
      base44.auth.me().then(setUser).catch(() => {});
    }, []);

    const handleLogout = () => {
      base44.auth.logout();
    };

    const isOnAIPage = location.pathname === createPageUrl("AIAssistant");
      const isLandingPage = currentPageName === "LandingPage";

      // Landing page renders without layout (full screen)
      if (isLandingPage) {
        return <>{children}</>;
      }

  return (
    <div className="min-h-screen bg-neutral-950">
      <KeyboardShortcuts />
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black border-b border-gray-800 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <Link 
            to={createPageUrl("Dashboard")} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="font-semibold text-white text-xl tracking-tight">Juris</span>
          </Link>

          <div className="flex items-center gap-2">
            {user && <NotificationPanel user={user} />}
            <Link
              to={createPageUrl("AIAssistant")}
              className="p-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-all"
            >
              <Sparkles className="w-5 h-5" />
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
              className="lg:hidden fixed top-16 left-0 bottom-0 w-72 bg-black border-r border-gray-800 z-40 overflow-y-auto"
            >
              <nav className="p-4 space-y-6">
                {navigationSections.map((section) => (
                  <div key={section.label}>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2 px-2">
                      {section.label}
                    </p>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <Link
                          key={item.title}
                          to={item.url}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === item.url
                              ? 'bg-white text-black font-medium'
                              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" />
                            <span>{item.title}</span>
                          </div>
                          {item.proBadge && (
                            <Crown className="w-4 h-4 text-gray-500" />
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-gray-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors"
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
      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 w-64 bg-black border-r border-gray-800 overflow-y-auto">
        <Link 
          to={createPageUrl("Dashboard")} 
          className="block p-6 border-b border-gray-800 hover:bg-gray-900 transition-colors"
        >
          <span className="text-2xl font-semibold text-white tracking-tight">Juris</span>
        </Link>

        <nav className="p-4 space-y-6">
          {navigationSections.map((section) => (
            <div key={section.label}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2 px-2">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === item.url
                        ? 'bg-white text-black font-medium'
                        : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.title}</span>
                    </div>
                    {item.proBadge && (
                      <Crown className="w-3 h-3 text-gray-500" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 mt-auto">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
              <span className="text-white font-medium text-sm">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">
                {user?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`min-h-screen bg-neutral-950 ${isOnAIPage ? '' : 'pt-16 lg:pt-0 lg:pl-64'}`}>
        {children}
      </main>
    </div>
  );
}
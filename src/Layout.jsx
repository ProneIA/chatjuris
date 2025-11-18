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
  X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

const navigationSections = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
      { title: "Assistente IA", url: createPageUrl("AIAssistant"), icon: Sparkles },
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
    label: "Recursos",
    items: [
      { title: "Jurisprudência", url: createPageUrl("Jurisprudence"), icon: BookOpen },
      { title: "Templates", url: createPageUrl("Templates"), icon: BookTemplate },
      { title: "Calendário", url: createPageUrl("Calendar"), icon: CalendarDays },
    ]
  },
  {
    label: "Suporte",
    items: [
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <Link 
            to={createPageUrl("Dashboard")} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">LegalTech Pro</span>
          </Link>

          <Link
            to={createPageUrl("AIAssistant")}
            className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </Link>
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
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30 }}
              className="lg:hidden fixed top-16 left-0 bottom-0 w-72 bg-white border-r border-slate-200 z-40 overflow-y-auto"
            >
              <nav className="p-4 space-y-6">
                {navigationSections.map((section) => (
                  <div key={section.label}>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2 px-2">
                      {section.label}
                    </p>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <Link
                          key={item.title}
                          to={item.url}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === item.url
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200 overflow-y-auto">
        <Link 
          to={createPageUrl("Dashboard")} 
          className="block p-6 border-b border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">LegalTech Pro</h2>
              <p className="text-xs text-slate-500">Gestão Jurídica</p>
            </div>
          </div>
        </Link>

        <nav className="p-4 space-y-6">
          {navigationSections.map((section) => (
            <div key={section.label}>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2 px-2">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === item.url
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm">{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 mt-auto">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm truncate">
                {user?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`min-h-screen ${isOnAIPage ? '' : 'pt-16 lg:pt-0 lg:pl-64'}`}>
        {children}
      </main>
    </div>
  );
}
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
  Zap,
  Menu,
  X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import FloatingAIButton from "@/components/layout/FloatingAIButton";

const navigationSections = [
  {
    label: "Principal",
    items: [
      {
        title: "Dashboard",
        url: createPageUrl("Dashboard"),
        icon: LayoutDashboard,
        tooltip: "Visão geral e métricas principais"
      },
    ]
  },
  {
    label: "Gestão",
    items: [
      {
        title: "Clientes",
        url: createPageUrl("Clients"),
        icon: Users,
        tooltip: "Gerenciar clientes e contatos"
      },
      {
        title: "Processos",
        url: createPageUrl("Cases"),
        icon: FolderOpen,
        tooltip: "Processos e casos jurídicos"
      },
      {
        title: "Documentos",
        url: createPageUrl("Documents"),
        icon: FileText,
        tooltip: "Documentos e peças jurídicas"
      },
      {
        title: "Tarefas",
        url: createPageUrl("Tasks"),
        icon: CheckSquare,
        tooltip: "Tarefas e prazos importantes"
      },
    ]
  },
  {
    label: "Recursos",
    items: [
      {
        title: "Jurisprudência",
        url: createPageUrl("Jurisprudence"),
        icon: BookOpen,
        tooltip: "Pesquisa de jurisprudência"
      },
      {
        title: "Templates",
        url: createPageUrl("Templates"),
        icon: BookTemplate,
        tooltip: "Modelos de documentos"
      },
      {
        title: "Calendário",
        url: createPageUrl("Calendar"),
        icon: CalendarDays,
        tooltip: "Agenda e compromissos"
      },
    ]
  },
  {
    label: "Suporte",
    items: [
      {
        title: "Contato",
        url: createPageUrl("Contact"),
        icon: MessageSquare,
        tooltip: "Entre em contato conosco"
      },
    ]
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const userPlan = user?.subscription_plan || "free";
  const isPro = userPlan === "pro" || userPlan === "enterprise";

  const isOnAIPage = location.pathname === createPageUrl("AIAssistant");

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-80 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Scale className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">LegalTech Pro</h2>
                    <p className="text-xs text-slate-500">Gestão Jurídica</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* AI Highlight */}
            <div className="p-4 flex-shrink-0">
              <Link to={createPageUrl("AIAssistant")}>
                <button
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:scale-105 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-sm">Assistente IA</p>
                      <p className="text-xs text-white/80">Chat com IA</p>
                    </div>
                  </div>
                </button>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 pb-4">
              {navigationSections.map((section) => (
                <div key={section.label} className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase px-3 mb-2">
                    {section.label}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.url;
                      
                      return (
                        <Link
                          key={item.title}
                          to={item.url}
                          onClick={() => {
                            if (window.innerWidth < 1024) {
                              setIsSidebarOpen(false);
                            }
                          }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                          title={item.tooltip}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Plan Badge */}
              <div className="mt-4 px-3">
                <Link 
                  to={createPageUrl("Pricing")}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                >
                  <div className={`p-3 rounded-xl transition-all ${
                    isPro 
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" 
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-semibold">
                        {isPro ? "Plano Pro ✓" : "Plano Gratuito"}
                      </span>
                    </div>
                    {!isPro && (
                      <p className="text-xs opacity-80">Upgrade para Pro →</p>
                    )}
                  </div>
                </Link>
              </div>
            </nav>

            {/* Footer */}
            <div className="border-t border-slate-200 p-4 flex-shrink-0">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
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
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 lg:hidden flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold text-slate-900">LegalTech Pro</h1>
            </div>
            
            {!isOnAIPage && (
              <Link to={createPageUrl('AIAssistant')}>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <Sparkles className="w-4 h-4 mr-1" />
                  IA
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>

      {/* Floating AI Button - Desktop only, hidden on AI page */}
      {!isOnAIPage && (
        <div className="hidden lg:block">
          <FloatingAIButton onClick={() => window.location.href = createPageUrl('AIAssistant')} />
        </div>
      )}
    </div>
  );
}

function Button({ children, variant = "default", size = "default", className = "", onClick, disabled, title, asChild }) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    ghost: "hover:bg-slate-100 text-slate-700",
  };
  
  const sizes = {
    default: "px-4 py-2",
    sm: "px-3 py-1.5 text-sm",
    icon: "w-10 h-10",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}
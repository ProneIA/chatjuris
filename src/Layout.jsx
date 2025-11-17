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
  Zap
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { base44 } from "@/api/base44Client";
import AIAssistantPanel from "@/components/layout/AIAssistantPanel";
import FloatingAIButton from "@/components/layout/FloatingAIButton";

// Organize navigation items by sections
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

// Page context mapping for AI assistant
const pageContextMap = {
  "Dashboard": "Dashboard - Visão geral do sistema",
  "Clients": "Clientes - Gestão de clientes",
  "Cases": "Processos - Gestão de casos jurídicos",
  "Documents": "Documentos - Gestão de documentos",
  "Tasks": "Tarefas - Gestão de tarefas e prazos",
  "Jurisprudence": "Jurisprudência - Pesquisa jurisprudencial",
  "Templates": "Templates - Modelos de documentos",
  "Calendar": "Calendário - Agenda e compromissos",
  "Contact": "Contato - Suporte ao cliente",
  "Pricing": "Planos - Escolha seu plano",
  "AIAssistant": "Assistente IA - Central de IA"
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [isAIPanelOpen, setIsAIPanelOpen] = React.useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const userPlan = user?.subscription_plan || "free";
  const isPro = userPlan === "pro" || userPlan === "enterprise";

  // Get current page context for AI
  const currentContext = pageContextMap[currentPageName] || currentPageName;

  // Check if on AI Assistant page to hide floating button
  const isOnAIPage = location.pathname === createPageUrl("AIAssistant");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar className="border-r border-slate-200">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl blur-md opacity-30" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">LegalTech Pro</h2>
                <p className="text-xs text-slate-500">Gestão Jurídica Inteligente</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            {/* AI Assistant Highlight - Desktop */}
            <div className="mb-4 px-2 hidden md:block">
              <Link to={createPageUrl("AIAssistant")}>
                <button
                  onClick={(e) => {
                    if (isOnAIPage) {
                      e.preventDefault();
                      setIsAIPanelOpen(true);
                    }
                  }}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:opacity-90 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">Assistente IA</p>
                        <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                          IA
                        </span>
                      </div>
                      <p className="text-xs text-white/80">Converse com a IA agora</p>
                    </div>
                  </div>
                </button>
              </Link>
            </div>

            {/* Navigation Sections */}
            {navigationSections.map((section) => (
              <SidebarGroup key={section.label} className="mb-2">
                <SidebarGroupLabel className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 mb-2">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg mb-1 group ${
                            location.pathname === item.url ? 'bg-blue-50 text-blue-700 font-medium shadow-sm' : ''
                          }`}
                          title={item.tooltip}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}

            {/* Plan Badge */}
            <div className="mt-4 px-2">
              <Link to={createPageUrl("Pricing")}>
                <div className={`p-3 rounded-xl cursor-pointer transition-all hover:scale-105 ${
                  isPro 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" 
                    : "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300 border border-slate-300"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {isPro ? (
                      <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center">
                        <Scale className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <Zap className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="text-xs font-semibold">
                      {isPro ? "Plano Pro ✓" : "Plano Gratuito"}
                    </span>
                  </div>
                  {!isPro && (
                    <p className="text-xs opacity-80">
                      Upgrade para Pro →
                    </p>
                  )}
                </div>
              </Link>
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
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
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden relative">
          <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 md:hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors" />
                <h1 className="text-lg font-semibold text-slate-900">LegalTech Pro</h1>
              </div>
              
              {/* Mobile AI Button */}
              <button
                onClick={() => setIsAIPanelOpen(true)}
                className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-opacity"
                title="Assistente IA"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>

        {/* Floating AI Button - Desktop only, hidden on AI page */}
        {!isOnAIPage && (
          <div className="hidden md:block">
            <FloatingAIButton onClick={() => setIsAIPanelOpen(true)} />
          </div>
        )}

        {/* AI Assistant Panel */}
        <AIAssistantPanel 
          isOpen={isAIPanelOpen} 
          onClose={() => setIsAIPanelOpen(false)}
          currentPageContext={currentContext}
        />
      </div>
    </SidebarProvider>
  );
}
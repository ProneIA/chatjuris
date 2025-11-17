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
  Settings,
  HelpCircle,
  Crown
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
import FloatingAIButton from "@/components/common/FloatingAIButton";

const mainMenuItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    tooltip: "Visão geral do sistema"
  },
  {
    title: "Clientes",
    url: createPageUrl("Clients"),
    icon: Users,
    tooltip: "Gerenciar clientes"
  },
  {
    title: "Processos",
    url: createPageUrl("Cases"),
    icon: FolderOpen,
    tooltip: "Acompanhar processos"
  },
  {
    title: "Documentos",
    url: createPageUrl("Documents"),
    icon: FileText,
    tooltip: "Biblioteca de documentos"
  },
];

const toolsMenuItems = [
  {
    title: "Jurisprudência",
    url: createPageUrl("Jurisprudence"),
    icon: BookOpen,
    tooltip: "Pesquisar jurisprudência"
  },
  {
    title: "Templates",
    url: createPageUrl("Templates"),
    icon: BookTemplate,
    tooltip: "Modelos de documentos"
  },
  {
    title: "Tarefas",
    url: createPageUrl("Tasks"),
    icon: CheckSquare,
    tooltip: "Gerenciar tarefas"
  },
  {
    title: "Calendário",
    url: createPageUrl("Calendar"),
    icon: CalendarDays,
    tooltip: "Agendar compromissos"
  },
];

const aiMenuItem = {
  title: "Assistente IA",
  url: createPageUrl("AIAssistant"),
  icon: Sparkles,
  tooltip: "Converse com a IA para tirar dúvidas e navegar pelo sistema",
  highlight: true
};

const supportMenuItems = [
  {
    title: "Contato",
    url: createPageUrl("Contact"),
    icon: MessageSquare,
    tooltip: "Fale conosco"
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [hoveredItem, setHoveredItem] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const userPlan = user?.subscription_plan || "free";
  const isPro = userPlan === "pro" || userPlan === "enterprise";

  const renderMenuItem = (item) => {
    const isActive = location.pathname === item.url;
    const Icon = item.icon;

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton 
          asChild 
          className="relative group"
          onMouseEnter={() => setHoveredItem(item.title)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <Link 
            to={item.url} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isActive 
                ? item.highlight
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold shadow-lg'
                  : 'bg-blue-50 text-blue-700 font-medium'
                : 'hover:bg-slate-100 hover:translate-x-1'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive && !item.highlight ? 'text-blue-700' : ''}`} />
            <span>{item.title}</span>
            
            {item.highlight && !isActive && (
              <div className="ml-auto">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            )}

            {isActive && item.highlight && (
              <div className="ml-auto">
                <Sparkles className="w-3 h-3 animate-pulse" />
              </div>
            )}

            {/* Tooltip */}
            {hoveredItem === item.title && (
              <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap shadow-xl z-50 pointer-events-none">
                {item.tooltip}
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-slate-900" />
              </div>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar className="border-r border-slate-200 bg-white/80 backdrop-blur-xl">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl blur-md opacity-30" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">LegalTech Pro</h2>
                <p className="text-xs text-slate-500">Gestão Jurídica Inteligente</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            {/* Main Menu */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
                <LayoutDashboard className="w-3 h-3" />
                Principal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* AI Assistant - Highlighted */}
            <SidebarGroup className="mt-1">
              <SidebarGroupContent>
                <SidebarMenu>
                  {renderMenuItem(aiMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Tools Menu */}
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
                <Settings className="w-3 h-3" />
                Ferramentas
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {toolsMenuItems.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Support Menu */}
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
                <HelpCircle className="w-3 h-3" />
                Suporte
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {supportMenuItems.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Plan Badge */}
            <div className="mt-6 px-2">
              <Link to={createPageUrl("Pricing")}>
                <div className={`p-4 rounded-xl cursor-pointer transition-all hover:scale-105 shadow-lg ${
                  isPro 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                    : "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300 border border-slate-300"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isPro ? (
                      <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    )}
                    <span className="text-sm font-bold">
                      {isPro ? "Plano Pro Ativo" : "Plano Gratuito"}
                    </span>
                  </div>
                  {!isPro && (
                    <p className="text-xs opacity-90 font-medium">
                      ✨ Upgrade para Pro →
                    </p>
                  )}
                  {isPro && (
                    <p className="text-xs opacity-90">
                      Uso ilimitado de IA
                    </p>
                  )}
                </div>
              </Link>
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4 bg-slate-50/50">
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">
                    {user?.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all border border-slate-200 hover:border-slate-300"
              >
                <LogOut className="w-4 h-4" />
                Sair da Conta
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 md:hidden shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors" />
                <h1 className="text-lg font-bold text-slate-900">LegalTech Pro</h1>
              </div>
              <Link 
                to={createPageUrl('AIAssistant')}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4" />
                IA
              </Link>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>

        {/* Floating AI Button */}
        <FloatingAIButton />
      </div>
    </SidebarProvider>
  );
}
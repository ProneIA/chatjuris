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
  MessageSquare
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
import ThemeToggle from "@/components/common/ThemeToggle";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Clientes",
    url: createPageUrl("Clients"),
    icon: Users,
  },
  {
    title: "Processos",
    url: createPageUrl("Cases"),
    icon: FolderOpen,
  },
  {
    title: "Documentos",
    url: createPageUrl("Documents"),
    icon: FileText,
  },
  {
    title: "Jurisprudência",
    url: createPageUrl("Jurisprudence"),
    icon: BookOpen,
  },
  {
    title: "Templates",
    url: createPageUrl("Templates"),
    icon: BookTemplate,
  },
  {
    title: "Tarefas",
    url: createPageUrl("Tasks"),
    icon: CheckSquare,
  },
  {
    title: "Calendário",
    url: createPageUrl("Calendar"),
    icon: CalendarDays,
  },
  {
    title: "Assistente IA",
    url: createPageUrl("AIAssistant"),
    icon: Sparkles,
  },
  {
    title: "Contato",
    url: createPageUrl("Contact"),
    icon: MessageSquare,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const userPlan = user?.subscription_plan || "free";
  const isPro = userPlan === "pro" || userPlan === "enterprise";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <Sidebar className="border-r border-slate-200 dark:border-slate-700 dark:bg-slate-900">
          <SidebarHeader className="border-b border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Scale className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl blur-md opacity-30" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">LegalTech Pro</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gestão Jurídica Inteligente</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 mb-2">
                Menu Principal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'dark:text-slate-300'
                        }`}
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

            {/* Plan Badge */}
            <div className="mt-4 px-2">
              <Link to={createPageUrl("Pricing")}>
                <div className={`p-3 rounded-xl cursor-pointer transition-all hover:scale-105 ${
                  isPro 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                    : "bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {isPro ? (
                      <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center">
                        <Scale className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span className="text-xs font-semibold">
                      {isPro ? "Plano Pro" : "Plano Gratuito"}
                    </span>
                  </div>
                  {!isPro && (
                    <p className="text-xs opacity-80">
                      Fazer upgrade →
                    </p>
                  )}
                </div>
              </Link>
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 dark:border-slate-700 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                    {user?.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors" />
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">LegalTech Pro</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
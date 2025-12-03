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
  Sun,
  ChevronDown,
  Calculator,
  Newspaper
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import KeyboardShortcuts from "@/components/common/KeyboardShortcuts";
import NotificationPanel from "@/components/collaboration/NotificationPanel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationItems = [
  { title: "Painel", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "Assistente IA", url: createPageUrl("AIAssistant"), icon: Sparkles },
  { title: "Pesquisa Jurídica", url: createPageUrl("LegalResearchAI"), icon: BookOpen },
  { title: "Gestão", url: createPageUrl("Gestao"), icon: FolderOpen },
  { title: "Ferramentas", url: createPageUrl("Ferramentas"), icon: Scale },
  { title: "Colaboração", url: createPageUrl("Colaboracao"), icon: Users2 },
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
      base44.auth.me().then(u => {
        setUser(u);
        // Check deadlines on initial load
        if (u) {
           base44.functions.invoke('checkDeadlines').catch(() => {});
        }
      }).catch(() => {});
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
    const isQuemSomos = currentPageName === "QuemSomos";
    const isFuncionalidades = currentPageName === "Funcionalidades";
    const isContactPublic = currentPageName === "ContactPublic";

    if (isLandingPage || isQuemSomos || isFuncionalidades || isContactPublic) {
      return <>{children}</>;
    }

    const NavLink = ({ item, mobile = false }) => (
      <Link
        to={item.url}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          location.pathname === item.url
            ? 'text-white font-bold'
            : 'text-neutral-400 hover:text-white'
        }`}
      >
        <item.icon className="w-4 h-4" />
        <span>{item.title}</span>
        {item.proBadge && (
          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
            location.pathname === item.url
              ? 'bg-neutral-800 text-white'
              : 'bg-neutral-800 text-neutral-400'
          }`}>PRO</span>
        )}
        {item.badge && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-600 text-white">
            {item.badge}
          </span>
        )}
      </Link>
    );

    // Dropdown menu removed


  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <KeyboardShortcuts />
      
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${isDark ? '#0a0a0a' : '#f1f5f9'}; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? '#333' : '#cbd5e1'}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#444' : '#94a3b8'}; }
      `}</style>

      {/* Top Navigation Bar */}
              <header className="fixed top-0 left-0 right-0 h-14 bg-black border-b border-neutral-800 z-50">
        <div className="h-full max-w-[1800px] mx-auto px-4 flex items-center justify-between">
          {/* Left - Logo & Nav */}
          <div className="flex items-center gap-6">
            <Link 
                to={createPageUrl("Dashboard")} 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Scale className="w-5 h-5 text-white" />
                <span className="text-lg font-semibold tracking-tight text-white">Juris</span>
              </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-4">
              {navigationItems.map((item) => (
                <NavLink key={item.title} item={item} />
              ))}
            </nav>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                    to={createPageUrl("Pricing")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors text-amber-400 hover:bg-neutral-800"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Pro</span>
                  </Link>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 text-white hover:bg-neutral-800"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

            {user && <NotificationPanel user={user} />}

            {/* User Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-neutral-800">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white">
                      <span className="font-medium text-xs text-black">
                        {user?.full_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 hidden sm:block text-neutral-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-800">
                  <div className="px-3 py-2">
                    <p className="font-medium text-sm text-white">
                      {user?.full_name || 'Usuário'}
                    </p>
                    <p className="text-xs text-neutral-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-neutral-800" />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Settings")} className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      <span>Preferências</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Contact")} className="flex items-center gap-2 cursor-pointer">
                      <MessageSquare className="w-4 h-4" />
                      <span>Contato</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-neutral-800" />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-500">
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-neutral-800 text-white"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40 pt-14"
            />
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="lg:hidden fixed top-14 left-0 right-0 bg-neutral-900 z-40 border-b border-neutral-800 max-h-[80vh] overflow-y-auto"
              >
              <nav className="p-4 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider mb-2 px-3 text-neutral-500">
                  Menu
                </p>
                {navigationItems.map((item) => (
                  <NavLink key={item.title} item={item} mobile />
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="min-h-screen pt-14">
        <div className={`min-h-[calc(100vh-3.5rem)] ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
          {React.cloneElement(children, { theme })}
        </div>
      </main>
    </div>
  );
}
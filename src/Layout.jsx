import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Scale, 
  LayoutDashboard, 
  Sparkles,
  BookOpen,
  LogOut,
  MessageSquare,
  Menu,
  X,
  Settings,
  Crown,
  Moon,
  Sun,
  FolderOpen,
  Users2,
  Download,
  BarChart3
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import KeyboardShortcuts from "@/components/common/KeyboardShortcuts";
import NotificationPanel from "@/components/collaboration/NotificationPanel";
import InstallAppBanner from "@/components/common/InstallAppBanner";
import InstallInstructionsDialog from "@/components/common/InstallInstructionsDialog";
import PWAHead from "@/components/common/PWAHead";
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
  { title: "Biblioteca", url: createPageUrl("Library"), icon: BookOpen },
  { title: "Analytics", url: createPageUrl("Analytics"), icon: BarChart3 },
  { title: "Assistente IA", url: createPageUrl("AIAssistant"), icon: Sparkles },
  { title: "Gestão", url: createPageUrl("GestaoHub"), icon: FolderOpen },
  { title: "Ferramentas", url: createPageUrl("FerramentasHub"), icon: Scale },
  { title: "Colaboração", url: createPageUrl("ColaboracaoHub"), icon: Users2 },
];

export default function Layout({ children, currentPageName }) {
    const location = useLocation();
    const [user, setUser] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [deferredPrompt, setDeferredPrompt] = React.useState(null);
    const [isIOS, setIsIOS] = React.useState(false);
    const [isStandalone, setIsStandalone] = React.useState(false);
    const [showInstallModal, setShowInstallModal] = React.useState(false);
    const [theme, setTheme] = React.useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('juris-theme') || 'light';
      }
      return 'light';
    });

    React.useEffect(() => {
      base44.auth.me()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setIsLoading(false));
    }, []);

    React.useEffect(() => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      setIsStandalone(standalone);

      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(iOS);

      const handleBeforeInstall = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }, []);

    const handleInstallApp = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      } else {
        setShowInstallModal(true);
      }
    };

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

    // Public pages - no layout (always, even if logged in)
    const publicPages = ["LandingPage", "QuemSomos", "Funcionalidades", "ContactPublic", "Pricing"];
    if (publicPages.includes(currentPageName)) {
      return <>{children}</>;
    }

    // If still loading, show nothing
    if (isLoading) {
      return <>{children}</>;
    }

    // If not logged in and not a public page, show without layout
    if (!user) {
      return <>{children}</>;
    }

    const NavLink = ({ item, mobile = false }) => {
      const isActive = location.pathname === item.url;
      return (
        <Link
          to={item.url}
          onClick={() => mobile && setIsMobileMenuOpen(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive
              ? 'text-white font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <item.icon className="w-4 h-4" />
          <span>{item.title}</span>
        </Link>
      );
    };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <PWAHead />
      <KeyboardShortcuts />
      <InstallAppBanner 
        theme={theme} 
        deferredPrompt={deferredPrompt}
        isIOS={isIOS}
        isStandalone={isStandalone}
        onInstall={handleInstallApp}
      />

      <InstallInstructionsDialog 
        open={showInstallModal} 
        onOpenChange={setShowInstallModal} 
        isIOS={isIOS} 
      />
      
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
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <Scale className="w-4 h-4 text-black" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">Juris</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigationItems.map((item) => (
                <NavLink key={item.title} item={item} />
              ))}
            </nav>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              {!isStandalone && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleInstallApp}
                  className="hidden md:flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white mr-2 border border-purple-500/20 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar App</span>
                </Button>
              )}
              <Link
                to={createPageUrl("Pricing")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors text-amber-400 hover:text-amber-300"
              >
                <Crown className="w-4 h-4" />
                <span className="font-bold">Pro</span>
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
                <button className="flex items-center gap-2 px-2 py-1.5 transition-colors hover:opacity-80">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white">
                    <span className="font-medium text-xs text-black">
                      {user?.full_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
                <div className="px-3 py-2">
                  <p className="font-medium text-sm text-gray-900">
                    {user?.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Settings")} className="flex items-center gap-2 cursor-pointer text-gray-700">
                    <Settings className="w-4 h-4" />
                    <span>Preferências</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Contact")} className="flex items-center gap-2 cursor-pointer text-gray-700">
                    <MessageSquare className="w-4 h-4" />
                    <span>Contato</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-600">
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
                {navigationItems.map((item) => (
                  <NavLink key={item.title} item={item} mobile />
                ))}
                {!isStandalone && (
                  <button
                    onClick={() => {
                      handleInstallApp();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 w-full text-left mt-2 border-t border-neutral-800 pt-3"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar Aplicativo</span>
                  </button>
                )}
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
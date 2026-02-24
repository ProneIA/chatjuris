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
  DollarSign,
  Bookmark,
  ArrowLeft,
  History as HistoryIcon,
  Activity,
  Shield
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
const KeyboardShortcuts = React.lazy(() => import("@/components/common/KeyboardShortcuts"));
const NotificationPanel = React.lazy(() => import("@/components/collaboration/NotificationPanel"));
const InstallAppBanner = React.lazy(() => import("@/components/common/InstallAppBanner"));
const InstallInstructionsDialog = React.lazy(() => import("@/components/common/InstallInstructionsDialog"));
const PWAHead = React.lazy(() => import("@/components/common/PWAHead"));
const ConsentModal = React.lazy(() => import("@/components/lgpd/ConsentModal"));
const TrialWelcomeModal = React.lazy(() => import("@/components/subscription/TrialWelcomeModal"));
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/mobile/BottomNavigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationItems = [
  { title: "Painel", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "Radar", url: createPageUrl("RadarOportunidades"), icon: Activity },
  { title: "Financeiro", url: createPageUrl("FinancialDashboard"), icon: DollarSign },
  { title: "Modelos de Peças", url: createPageUrl("Templates"), icon: BookOpen },
  { title: "Assistente IA", url: createPageUrl("AIAssistant"), icon: Sparkles },
  { title: "WhatsApp Bot", url: createPageUrl("WhatsAppBot"), icon: MessageSquare },
  { title: "Pesquisa Jurídica", url: createPageUrl("LegalResearch"), icon: Scale },
  { title: "Gestão", url: createPageUrl("GestaoHub"), icon: FolderOpen },
  { title: "Tarefas", url: createPageUrl("Tasks"), icon: BookOpen },
  { title: "Ferramentas", url: createPageUrl("FerramentasHub"), icon: Scale },
  { title: "Equipes", url: createPageUrl("Teams"), icon: Users2 },
  { title: "Minha Assinatura", url: createPageUrl("MySubscription"), icon: Crown },
  { title: "Auditoria LGPD", url: createPageUrl("LGPDAudit"), icon: Shield },
  { title: "Conformidade LGPD", url: createPageUrl("LGPDCompliance"), icon: Shield },
];

const adminItems = [
  { title: "Admin Panel", url: createPageUrl("AdminPanel"), icon: Shield },
  { title: "Admin Master", url: createPageUrl("AdminMaster"), icon: Shield },
  { title: "Auditoria do Sistema", url: createPageUrl("SystemAudit"), icon: Shield },
  { title: "Banco de Dados", url: createPageUrl("AdminDatabase"), icon: Shield },
];

// Cache busting — força reload quando há nova versão
const APP_VERSION = "2026-02-20-1";
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem("app_version");
  if (stored && stored !== APP_VERSION) {
    localStorage.setItem("app_version", APP_VERSION);
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }
    window.location.reload(true);
  } else if (!stored) {
    localStorage.setItem("app_version", APP_VERSION);
  }
}

// ============================================================
// Cache de acesso com TTL de 5 minutos no localStorage
// Evita chamar canAccessSystem a cada navegação de página
// ============================================================
const ACCESS_CACHE_TTL = 5 * 60 * 1000;

function getAccessCache(userId) {
  try {
    const raw = localStorage.getItem(`juris_access_${userId}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > ACCESS_CACHE_TTL) {
      localStorage.removeItem(`juris_access_${userId}`);
      return null;
    }
    return data;
  } catch { return null; }
}

function setAccessCache(userId, data) {
  try {
    localStorage.setItem(`juris_access_${userId}`, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

const pagesWithoutBackButton = [
  "Dashboard", "LandingPage", "QuemSomos", "Funcionalidades",
  "ContactPublic", "Pricing", "ClientAccess", "AccessDenied", "Checkout"
];

const publicPages = ["LandingPage", "QuemSomos", "Funcionalidades", "ContactPublic", "Pricing", "ClientAccess", "AccessDenied", "Checkout"];

const Layout = React.memo(function Layout({ children, currentPageName }) {
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

    const [showDeleteAccountDialog, setShowDeleteAccountDialog] = React.useState(false);
    const [showConsentModal, setShowConsentModal] = React.useState(false);
    const [hasCheckedConsent, setHasCheckedConsent] = React.useState(false);
    const [consentAccepted, setConsentAccepted] = React.useState(false);
    const [showTrialWelcome, setShowTrialWelcome] = React.useState(false);
    const [trialDaysLeft, setTrialDaysLeft] = React.useState(7);
    const [hasAccess, setHasAccess] = React.useState(true);
    const [accessChecked, setAccessChecked] = React.useState(false);

    React.useEffect(() => {
      base44.auth.me()
        .then(async (u) => {
          setUser(u);
          if (u?.id) {
            try {
              // Criar trial se necessário
              if (!u.trial_start_date && !u.subscription_start_date) {
                const trialResponse = await base44.functions.invoke('createTrialSubscription', {});
                if (trialResponse.data.success) {
                  const updatedUser = trialResponse.data.user;
                  setUser(updatedUser);
                  setTrialDaysLeft(7);
                  const trialWelcomeKey = `trial_welcome_shown_${u.id}`;
                  if (!localStorage.getItem(trialWelcomeKey)) {
                    setShowTrialWelcome(true);
                    localStorage.setItem(trialWelcomeKey, 'true');
                  }
                }
              }

              // Verificar consentimentos LGPD
              const localConsentKey = `consent_accepted_${u.email}`;
              if (localStorage.getItem(localConsentKey) === 'true') {
                setHasCheckedConsent(true);
              } else {
                const consents = await base44.entities.UserConsent.filter({ user_email: u.email });
                const hasTerms = consents.some(c => c.consent_type === 'terms_of_use' && c.accepted);
                const hasPrivacy = consents.some(c => c.consent_type === 'privacy_policy' && c.accepted);
                if (hasTerms && hasPrivacy) {
                  localStorage.setItem(localConsentKey, 'true');
                } else {
                  setShowConsentModal(true);
                }
                setHasCheckedConsent(true);
              }

              // ============================================================
              // Verificar acesso COM CACHE (5 minutos)
              // Evita chamada ao backend a cada navegação
              // ============================================================
              const cached = getAccessCache(u.id);
              if (cached) {
                setHasAccess(cached.canAccess);
                setAccessChecked(true);
                if (!cached.canAccess && cached.redirectToPricing) {
                  const cp = window.location.pathname;
                  if (!publicPages.some(p => cp.includes(p))) {
                    window.location.href = '/Pricing';
                  }
                }
              } else {
                const { data } = await base44.functions.invoke('canAccessSystem', {});
                setHasAccess(data.canAccess);
                setAccessCache(u.id, data);
                setAccessChecked(true);
                if (!data.canAccess && data.redirectToPricing) {
                  const cp = window.location.pathname;
                  if (!publicPages.some(p => cp.includes(p))) {
                    window.location.href = '/Pricing';
                  }
                }
              }

            } catch (err) {
              console.error("Erro ao processar acesso:", err);
              setHasCheckedConsent(true);
              setHasAccess(true); // fallback seguro
              setAccessChecked(true);
            }
          } else {
            setAccessChecked(true);
          }
        })
        .catch(() => {
          setUser(null);
          setAccessChecked(true);
        })
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
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }, []);

    React.useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('juris-theme', theme);
    }, [theme]);

    const toggleTheme = React.useCallback(() => {
      setTheme(t => t === 'light' ? 'dark' : 'light');
    }, []);

    const isDark = theme === 'dark';

    const handleLogout = React.useCallback(() => {
      base44.auth.logout("/LandingPage");
    }, []);

    const handleDeleteAccount = React.useCallback(async () => {
      try { await base44.functions.invoke('deleteUserAccount', {}); } catch {}
      base44.auth.logout("/LandingPage");
    }, []);

    const handleInstallApp = React.useCallback(async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setDeferredPrompt(null);
      } else {
        setShowInstallModal(true);
      }
    }, [deferredPrompt]);

    const visibleNavItems = React.useMemo(() =>
      user?.role === 'admin' ? [...navigationItems, ...adminItems] : navigationItems,
      [user?.role]
    );

    // Public pages - no layout
    if (publicPages.includes(currentPageName)) {
      return <>{children}</>;
    }

    if (isLoading) return <>{children}</>;
    if (!user) return <>{children}</>;
    if (!accessChecked && user) return <>{children}</>;

    const showBackButton = !pagesWithoutBackButton.includes(currentPageName);

    return (
      <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
        <React.Suspense fallback={null}><PWAHead /></React.Suspense>
        <React.Suspense fallback={null}><KeyboardShortcuts /></React.Suspense>
        <React.Suspense fallback={null}>
          <InstallAppBanner 
            theme={theme} 
            deferredPrompt={deferredPrompt}
            isIOS={isIOS}
            isStandalone={isStandalone}
            onInstall={handleInstallApp}
          />
        </React.Suspense>
        <React.Suspense fallback={null}>
          <InstallInstructionsDialog 
            open={showInstallModal} 
            onOpenChange={setShowInstallModal} 
            isIOS={isIOS} 
          />
        </React.Suspense>

        <style>{`
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: ${isDark ? '#0a0a0a' : '#f1f5f9'}; }
          ::-webkit-scrollbar-thumb { background: ${isDark ? '#333' : '#cbd5e1'}; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#444' : '#94a3b8'}; }
        `}</style>

        {/* Top Bar */}
        <header className={`fixed top-0 left-0 right-0 h-14 border-b z-50 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
          <div className="h-full px-4 flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-800 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link 
              to={createPageUrl("Dashboard")} 
              className="lg:hidden flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-white' : 'bg-black'}`}>
                <Scale className={`w-4 h-4 ${isDark ? 'text-black' : 'text-white'}`} />
              </div>
              <span className={`text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Juris</span>
            </Link>

            <div className="flex items-center gap-2">
              {!isStandalone && (
                <Button variant="ghost" size="sm" onClick={handleInstallApp} className="hidden md:flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span className="hidden xl:inline">Instalar App</span>
                </Button>
              )}

              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {user && (
                <React.Suspense fallback={<div className="w-9 h-9" />}>
                  <NotificationPanel user={user} />
                </React.Suspense>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 transition-colors hover:opacity-80">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isDark ? 'bg-white' : 'bg-black'}`}>
                      <span className={`font-medium text-xs ${isDark ? 'text-black' : 'text-white'}`}>
                        {user?.full_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={`w-56 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                  <div className="px-3 py-2">
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.full_name || 'Usuário'}</p>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className={isDark ? 'bg-neutral-800' : 'bg-gray-200'} />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Settings")} className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      <Settings className="w-4 h-4" /><span>Preferências</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("MyData")} className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      <Bookmark className="w-4 h-4" /><span>Meus Dados</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Contact")} className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      <MessageSquare className="w-4 h-4" /><span>Contato</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("PrivacyPolicy")} className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      <Bookmark className="w-4 h-4" /><span>Política de Privacidade</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={isDark ? 'bg-neutral-800' : 'bg-gray-200'} />
                  <DropdownMenuItem onClick={() => setShowDeleteAccountDialog(true)} className="flex items-center gap-2 cursor-pointer text-red-500">
                    <Shield className="w-4 h-4" /><span>Excluir Conta</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-600">
                    <LogOut className="w-4 h-4" /><span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Sidebar - Desktop */}
        <aside className={`hidden lg:block fixed left-0 top-14 bottom-0 w-64 border-r overflow-y-auto ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
          <div className="p-4 space-y-2">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3 px-3 py-3 mb-2 hover:opacity-80 transition-opacity">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-white' : 'bg-black'}`}>
                <Scale className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
              </div>
              <span className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Juris</span>
            </Link>
            <nav className="space-y-1">
              {visibleNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                        : isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/50 z-40 pt-14"
              />
              <motion.div
                initial={{ x: -280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -280, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`lg:hidden fixed top-14 left-0 bottom-0 w-72 z-40 border-r overflow-y-auto ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}
              >
                <nav className="p-4 space-y-1">
                  {visibleNavItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                            : isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                  {!isStandalone && (
                    <button
                      onClick={() => { handleInstallApp(); setIsMobileMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 w-full mt-4"
                    >
                      <Download className="w-5 h-5" />
                      <span>Instalar Aplicativo</span>
                    </button>
                  )}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Bottom Navigation - Mobile */}
        {user && !publicPages.includes(currentPageName) && (
          <div className="lg:hidden">
            <BottomNavigation isDark={isDark} user={user} onLogout={handleLogout} />
          </div>
        )}

        {/* Main Content */}
        <main className={`min-h-screen pt-14 lg:pl-64 ${user && !publicPages.includes(currentPageName) ? 'pb-20 lg:pb-0' : ''}`}>
          {showBackButton && (
            <div className={`border-b ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
              <div className="px-6 py-3 flex items-center justify-between">
                <Link 
                  to={createPageUrl("Dashboard")}
                  className={`inline-flex items-center gap-2 text-sm transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </Link>
                {currentPageName === "AIAssistant" && (
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openAIHistory'))}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                      isDark ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <HistoryIcon className="w-4 h-4" />
                    <span>Histórico</span>
                  </button>
                )}
              </div>
            </div>
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentPageName}
              initial={{ x: 18, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -18, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className={`min-h-[calc(100vh-3.5rem)] ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}
            >
              {React.cloneElement(children, { theme })}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Consent Modal */}
        {hasCheckedConsent && !consentAccepted && (
          <React.Suspense fallback={null}>
            <ConsentModal 
              open={showConsentModal} 
              onAccept={() => {
                setShowConsentModal(false);
                setConsentAccepted(true);
                if (user?.email) localStorage.setItem(`consent_accepted_${user.email}`, 'true');
              }} 
            />
          </React.Suspense>
        )}

        {/* Delete Account Dialog */}
        <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. Todos os seus dados, processos, documentos e configurações serão permanentemente excluídos. Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white">
                Excluir permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Trial Welcome Modal */}
        <React.Suspense fallback={null}>
          <TrialWelcomeModal
            open={showTrialWelcome}
            onClose={() => setShowTrialWelcome(false)}
            daysLeft={trialDaysLeft}
          />
        </React.Suspense>
      </div>
    );
});

export default Layout;
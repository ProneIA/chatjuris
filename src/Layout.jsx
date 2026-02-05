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
import KeyboardShortcuts from "@/components/common/KeyboardShortcuts";
import NotificationPanel from "@/components/collaboration/NotificationPanel";
import InstallAppBanner from "@/components/common/InstallAppBanner";
import InstallInstructionsDialog from "@/components/common/InstallInstructionsDialog";
import PWAHead from "@/components/common/PWAHead";
import ConsentModal from "@/components/lgpd/ConsentModal";
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
];

const adminItems = [
  { title: "Admin Panel", url: createPageUrl("AdminPanel"), icon: Shield },
];

export default function Layout({ children, currentPageName }) {
    const location = useLocation();
    const [user, setUser] = React.useState(null);
    const [subscription, setSubscription] = React.useState(null);
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

    const [showConsentModal, setShowConsentModal] = React.useState(false);
    const [hasCheckedConsent, setHasCheckedConsent] = React.useState(false);
    const [consentAccepted, setConsentAccepted] = React.useState(false);

    React.useEffect(() => {
      base44.auth.me()
        .then(async (u) => {
          setUser(u);
          if (u?.id) {
            try {
              const today = new Date().toISOString().split('T')[0];
              const userCreatedDate = u.created_date ? new Date(u.created_date).toISOString().split('T')[0] : null;
              const isOldUser = userCreatedDate && userCreatedDate < today;
              
              console.log('🔍 DEBUG - User Check:', {
                userId: u.id,
                email: u.email,
                createdDate: userCreatedDate,
                today: today,
                isOldUser: isOldUser,
                hasUsedTrial: u.has_used_trial,
                trialStatus: u.trial_status
              });

              let subs = await base44.entities.Subscription.filter({ user_id: u.id });
              console.log('📊 DEBUG - Subscriptions found:', subs.length > 0 ? subs[0] : 'none');

              // REGRA 1: Usuários antigos (criados antes de hoje) recebem Pro automático
              if (isOldUser && subs.length > 0) {
                console.log('✅ DEBUG - Old user with subscription, ensuring Pro access');
                if (subs[0].status !== 'active') {
                  await base44.entities.Subscription.update(subs[0].id, {
                    status: 'active',
                    daily_actions_limit: 999999
                  });
                  subs = await base44.entities.Subscription.filter({ user_id: u.id });
                  console.log('✅ DEBUG - Updated to active');
                }
                setSubscription(subs[0]);
              } else if (isOldUser && subs.length === 0) {
                console.log('✅ DEBUG - Old user without subscription, creating Pro');
                const newSub = await base44.entities.Subscription.create({
                  user_id: u.id,
                  plan: 'pro',
                  status: 'active',
                  daily_actions_limit: 999999,
                  daily_actions_used: 0,
                  last_reset_date: today,
                  price: 0,
                  payment_method: 'manual',
                  start_date: today
                });
                subs = [newSub];
                setSubscription(newSub);
              } else if (!isOldUser && subs.length > 0) {
                console.log('🆕 DEBUG - New user with existing subscription');
                setSubscription(subs[0]);
              } else {
                // Novo usuário sem subscription
                const urlParams = new URLSearchParams(window.location.search);
                const hasTrialParam = urlParams.get('trial') === 'true';
                console.log('🆕 DEBUG - New user without subscription, trial param:', hasTrialParam);

                if (hasTrialParam && !u.has_used_trial) {
                  console.log('🎁 DEBUG - Starting 7-day trial');
                  const trialStartDate = new Date();
                  const trialEndDate = new Date();
                  trialEndDate.setDate(trialEndDate.getDate() + 7);

                  await base44.auth.updateMe({
                    trial_start_date: trialStartDate.toISOString().split('T')[0],
                    trial_end_date: trialEndDate.toISOString().split('T')[0],
                    trial_status: 'active',
                    has_used_trial: true
                  });

                  const newSub = await base44.entities.Subscription.create({
                    user_id: u.id,
                    plan: 'pro',
                    status: 'trial',
                    daily_actions_limit: 999999,
                    daily_actions_used: 0,
                    last_reset_date: today,
                    price: 0,
                    payment_method: 'manual',
                    start_date: trialStartDate.toISOString().split('T')[0],
                    end_date: trialEndDate.toISOString().split('T')[0]
                  });

                  urlParams.delete('trial');
                  const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
                  window.history.replaceState({}, '', newUrl);

                  setSubscription(newSub);

                  const updatedUser = await base44.auth.me();
                  setUser(updatedUser);
                  console.log('✅ DEBUG - Trial created successfully');
                } else {
                  console.log('🔒 DEBUG - Creating pending subscription (blocked)');
                  const newSub = await base44.entities.Subscription.create({
                    user_id: u.id,
                    plan: 'pro',
                    status: 'pending',
                    daily_actions_limit: 0,
                    daily_actions_used: 0,
                    last_reset_date: today,
                    price: 0,
                    payment_method: 'manual',
                    start_date: today
                  });
                  setSubscription(newSub);
                }
              }

              // REGRA 2: Verificar se teste expirou
              if (u.trial_status === 'active' && u.trial_end_date) {
                if (today > u.trial_end_date) {
                  console.log('⏰ DEBUG - Trial expired, blocking access');
                  await base44.auth.updateMe({
                    trial_status: 'expired'
                  });

                  const currentSubs = await base44.entities.Subscription.filter({ user_id: u.id });
                  if (currentSubs.length > 0 && currentSubs[0].status === 'trial') {
                    await base44.entities.Subscription.update(currentSubs[0].id, {
                      status: 'expired',
                      daily_actions_limit: 0
                    });
                  }

                  const updatedUser = await base44.auth.me();
                  setUser(updatedUser);
                }
                }

                // Verificar consentimentos LGPD
              const localConsentKey = `consent_accepted_${u.email}`;
              const localConsent = localStorage.getItem(localConsentKey);

              if (localConsent === 'true') {
                // Usuário já aceitou antes (verificação rápida)
                setHasCheckedConsent(true);
                return;
              }

              const consents = await base44.entities.UserConsent.filter({ user_email: u.email });
              const hasTermsConsent = consents.some(c => c.consent_type === 'terms_of_use' && c.accepted);
              const hasPrivacyConsent = consents.some(c => c.consent_type === 'privacy_policy' && c.accepted);

              if (hasTermsConsent && hasPrivacyConsent) {
                // Salvar no localStorage para não verificar novamente
                localStorage.setItem(localConsentKey, 'true');
              } else {
                setShowConsentModal(true);
              }
              setHasCheckedConsent(true);
            } catch (err) {
              console.error("Erro ao buscar assinatura:", err);
              setHasCheckedConsent(true);
            }
          }
        })
        .catch(() => {
          setUser(null);
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
    const publicPages = ["LandingPage", "QuemSomos", "Funcionalidades", "ContactPublic", "Pricing", "ClientAccess", "AccessDenied", "Checkout"];
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

    // BLOQUEIO: Verificar se usuário tem acesso
    const hasActiveSubscription = subscription && subscription.status === 'active';
    const isLifetimePlan = subscription && subscription.plan_type === 'lifetime';
    const isInValidTrial = user && user.trial_status === 'active' && subscription && subscription.status === 'trial';
    const hasAccess = hasActiveSubscription || isLifetimePlan || isInValidTrial;
    
    console.log('🔐 DEBUG - Access Check:', {
      hasActiveSubscription,
      isLifetimePlan,
      isInValidTrial,
      hasAccess,
      subscriptionStatus: subscription?.status,
      subscriptionPlanType: subscription?.plan_type,
      userTrialStatus: user?.trial_status
    });
    
    if (!hasAccess) {
      console.log('❌ DEBUG - Access DENIED, redirecting to Pricing');
      if (typeof window !== 'undefined' && window.location.pathname !== '/Pricing') {
        window.location.href = '/Pricing';
        return null;
      }
    } else {
      console.log('✅ DEBUG - Access GRANTED');
    }



  const visibleNavItems = user?.role === 'admin' 
    ? [...navigationItems, ...adminItems] 
    : navigationItems;

  // Páginas que NÃO devem mostrar o botão Voltar
  const pagesWithoutBackButton = [
    "Dashboard",
    "LandingPage",
    "QuemSomos",
    "Funcionalidades",
    "ContactPublic",
    "Pricing",
    "ClientAccess",
    "AccessDenied",
    "Checkout"
  ];
  
  const showBackButton = !pagesWithoutBackButton.includes(currentPageName);

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

      {/* Top Bar - Minimalista */}
      <header className={`fixed top-0 left-0 right-0 h-14 border-b z-50 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left - Mobile Menu */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-800 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Center - Logo (mobile) */}
          <Link 
            to={createPageUrl("Dashboard")} 
            className="lg:hidden flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-white' : 'bg-black'}`}>
              <Scale className={`w-4 h-4 ${isDark ? 'text-black' : 'text-white'}`} />
            </div>
            <span className={`text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Juris</span>
          </Link>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            {!isStandalone && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleInstallApp}
                className="hidden md:flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden xl:inline">Instalar App</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {user && <NotificationPanel user={user} />}

            {/* User Menu */}
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
                  <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {user?.full_name || 'Usuário'}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{user?.email}</p>
                </div>
                <DropdownMenuSeparator className={isDark ? 'bg-neutral-800' : 'bg-gray-200'} />
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Settings")} className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    <Settings className="w-4 h-4" />
                    <span>Preferências</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("MyData")} className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    <Bookmark className="w-4 h-4" />
                    <span>Meus Dados</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Contact")} className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    <MessageSquare className="w-4 h-4" />
                    <span>Contato</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("PrivacyPolicy")} className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    <Bookmark className="w-4 h-4" />
                    <span>Política de Privacidade</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className={isDark ? 'bg-neutral-800' : 'bg-gray-200'} />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-600">
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:block fixed left-0 top-14 bottom-0 w-64 border-r overflow-y-auto ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
        <div className="p-4 space-y-2">
          {/* Logo */}
          <Link 
            to={createPageUrl("Dashboard")} 
            className="flex items-center gap-3 px-3 py-3 mb-2 hover:opacity-80 transition-opacity"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-white' : 'bg-black'}`}>
              <Scale className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
            </div>
            <span className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Juris</span>
          </Link>

          {/* Navigation */}
          <nav className="space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? isDark 
                        ? 'bg-neutral-800 text-white' 
                        : 'bg-gray-100 text-gray-900'
                      : isDark
                        ? 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40 pt-14"
            />
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
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
                          ? isDark 
                            ? 'bg-neutral-800 text-white' 
                            : 'bg-gray-100 text-gray-900'
                          : isDark
                            ? 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
                {!isStandalone && (
                  <button
                    onClick={() => {
                      handleInstallApp();
                      setIsMobileMenuOpen(false);
                    }}
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

      {/* Main Content */}
      <main className="min-h-screen pt-14 lg:pl-64">
        {showBackButton && (
          <div className={`border-b ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
            <div className="px-6 py-3 flex items-center justify-between">
              <Link 
                to={createPageUrl("Dashboard")}
                className={`inline-flex items-center gap-2 text-sm transition-colors ${
                  isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </Link>
              
              {currentPageName === "AIAssistant" && (
                <button
                  onClick={() => {
                    const event = new CustomEvent('openAIHistory');
                    window.dispatchEvent(event);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                    isDark 
                      ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <HistoryIcon className="w-4 h-4" />
                  <span>Histórico</span>
                </button>
              )}
            </div>
          </div>
        )}
        <div className={`min-h-[calc(100vh-3.5rem)] ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
          {React.cloneElement(children, { theme })}
        </div>
      </main>

      {/* Consent Modal */}
      {hasCheckedConsent && !consentAccepted && (
        <ConsentModal 
          open={showConsentModal} 
          onAccept={() => {
            setShowConsentModal(false);
            setConsentAccepted(true);
            // Salvar no localStorage
            if (user?.email) {
              localStorage.setItem(`consent_accepted_${user.email}`, 'true');
            }
          }} 
        />
      )}
    </div>
  );
}
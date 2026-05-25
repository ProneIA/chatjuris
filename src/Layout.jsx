import React from "react";
import { Link, useLocation } from "react-router-dom";
const GoogleMigrationModal = React.lazy(() => import("@/components/auth/GoogleMigrationModal"));
import { createPageUrl } from "@/utils";
import { 
  LogOut,
  Menu,
  X,
  Settings,
  Moon,
  Sun,
  Download,
  Bookmark,
  ArrowLeft,
  History as HistoryIcon,
  Shield,
  MessageSquare,
} from "lucide-react";
import SidebarNav from "@/components/layout/SidebarNav";
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


    const [showDeleteAccountDialog, setShowDeleteAccountDialog] = React.useState(false);
    const [showConsentModal, setShowConsentModal] = React.useState(false);
    const [hasCheckedConsent, setHasCheckedConsent] = React.useState(false);
    const [consentAccepted, setConsentAccepted] = React.useState(false);
    const [showTrialWelcome, setShowTrialWelcome] = React.useState(false);
    const [trialDaysLeft, setTrialDaysLeft] = React.useState(7);
    const [hasAccess, setHasAccess] = React.useState(true);
    const [accessChecked, setAccessChecked] = React.useState(false);
    const [showGoogleMigration, setShowGoogleMigration] = React.useState(false);
    const isDark = false; // Always light mode

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

              // Verificar migração Google → senha
              if (!u.has_password) {
                setShowGoogleMigration(true);
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

    // Public pages - no layout
    if (publicPages.includes(currentPageName)) {
      return <>{children}</>;
    }

    if (isLoading) return <>{children}</>;
    if (!user) return <>{children}</>;
    if (!accessChecked && user) return <>{children}</>;

    const showBackButton = !pagesWithoutBackButton.includes(currentPageName);

    return (
      <div style={{ minHeight: "100vh", background: "#F5F3EE", fontFamily: "'Outfit', system-ui, sans-serif" }}>
        <React.Suspense fallback={null}><PWAHead /></React.Suspense>
        <React.Suspense fallback={null}><KeyboardShortcuts /></React.Suspense>
        <React.Suspense fallback={null}>
          <InstallAppBanner 
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

        {/* ── HEADER ── */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 'var(--header-h)',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          zIndex: 50,
          display: 'flex', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="btn-ghost lg:hidden"
                style={{ padding: '8px', minWidth: 'unset', borderRadius: 'var(--radius-sm)' }}
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <Link to={createPageUrl("Dashboard")} className="lg:hidden" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/render/image/public/base44-prod/public/690e408daf48e0f633c6cf3a/5c0116596_LOGO2.png"
                  alt="Juris.IA"
                  style={{ height: 28, objectFit: 'contain' }}
                />
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {!isStandalone && (
                <button
                  onClick={handleInstallApp}
                  className="btn-ghost hidden md:inline-flex"
                  style={{ fontSize: 13, padding: '7px 12px' }}
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden xl:inline">Instalar App</span>
                </button>
              )}

              {user && (
                <React.Suspense fallback={<div style={{ width: 36, height: 36 }} />}>
                  <NotificationPanel user={user} />
                </React.Suspense>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 10px 5px 5px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-full)',
                      cursor: 'pointer',
                      transition: 'all var(--duration) var(--ease)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold-border)'; e.currentTarget.style.background = 'var(--gold-light)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-deep) 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                        {user?.full_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="hidden sm:block" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.full_name?.split(' ')[0] || 'Usuário'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" style={{ width: 230, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-xl)', padding: 6 }}>
                  <div style={{ padding: '10px 12px 8px' }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{user?.full_name || 'Usuário'}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator style={{ background: 'var(--border)', margin: '4px 0' }} />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Settings")} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none', cursor: 'pointer' }}>
                      <Settings className="w-4 h-4" /> Preferências
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("MyData")} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none', cursor: 'pointer' }}>
                      <Bookmark className="w-4 h-4" /> Meus Dados
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Contact")} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none', cursor: 'pointer' }}>
                      <MessageSquare className="w-4 h-4" /> Suporte
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("PrivacyPolicy")} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none', cursor: 'pointer' }}>
                      <Bookmark className="w-4 h-4" /> Privacidade
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{ background: 'var(--border)', margin: '4px 0' }} />
                  <DropdownMenuItem onClick={() => setShowDeleteAccountDialog(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--error)', fontSize: 13, cursor: 'pointer' }}>
                    <Shield className="w-4 h-4" /> Excluir Conta
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                    <LogOut className="w-4 h-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* ── SIDEBAR DESKTOP ── */}
        <aside style={{
          position: 'fixed', left: 0, top: 'var(--header-h)', bottom: 0,
          width: 'var(--sidebar-w)',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          overflowY: 'auto', overflowX: 'hidden',
          zIndex: 40,
          display: 'flex', flexDirection: 'column',
        }} className="hidden lg:flex">
          <div style={{ padding: '16px 16px 8px' }}>
            <Link to={createPageUrl("Dashboard")} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/render/image/public/base44-prod/public/690e408daf48e0f633c6cf3a/5c0116596_LOGO2.png"
                alt="Juris.IA"
                style={{ height: 30, objectFit: 'contain' }}
              />
            </Link>
          </div>
          <div className="divider" style={{ margin: '0 16px 4px' }} />
          <div style={{ flex: 1, padding: '0 8px 16px' }}>
            <SidebarNav user={user} isMobile={false} />
          </div>
        </aside>

        {/* ── MOBILE DRAWER ── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  position: 'fixed', inset: 0,
                  background: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(2px)',
                  zIndex: 45,
                  paddingTop: 'var(--header-h)',
                }}
                className="lg:hidden"
              />
              <motion.div
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                style={{
                  position: 'fixed', top: 'var(--header-h)', left: 0, bottom: 0,
                  width: 272,
                  background: 'var(--surface)',
                  borderRight: '1px solid var(--border)',
                  zIndex: 46,
                  overflowY: 'auto',
                  display: 'flex', flexDirection: 'column',
                }}
                className="lg:hidden"
              >
                <div style={{ padding: '12px 8px 80px' }}>
                  <SidebarNav user={user} onNavigate={() => setIsMobileMenuOpen(false)} isMobile={true} />
                  {!isStandalone && (
                    <div style={{ padding: '12px 8px 0' }}>
                      <button
                        onClick={() => { handleInstallApp(); setIsMobileMenuOpen(false); }}
                        className="btn-secondary"
                        style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
                      >
                        <Download className="w-4 h-4" />
                        Instalar Aplicativo
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Bottom Navigation - Mobile */}
        {user && !publicPages.includes(currentPageName) && (
          <div className="lg:hidden">
            <BottomNavigation user={user} onLogout={handleLogout} />
          </div>
        )}

        {/* ── MAIN ── */}
        <main style={{
          minHeight: '100vh',
          background: 'var(--bg-app)',
          paddingTop: 'var(--header-h)',
        }} className="lg:pl-[240px]">
          {showBackButton && (
            <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              <div className="px-6 py-3 flex items-center justify-between">
                <Link
                  to={createPageUrl("Dashboard")}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </Link>
                {currentPageName === "AIAssistant" && (
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openAIHistory'))}
                    className="btn-ghost"
                    style={{ padding: '6px 12px', fontSize: 12 }}
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                minHeight: 'calc(100vh - var(--header-h))',
                paddingBottom: user && !publicPages.includes(currentPageName) ? 'calc(var(--bottom-nav-h) + 16px)' : 0,
              }}
              className="lg:pb-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Google Migration Modal */}
        {showGoogleMigration && !publicPages.includes(currentPageName) && (
          <React.Suspense fallback={null}>
            <GoogleMigrationModal onDismiss={() => setShowGoogleMigration(false)} />
          </React.Suspense>
        )}

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
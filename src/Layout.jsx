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
      <div style={{ minHeight: "100vh", background: "var(--surface)", fontFamily: "var(--font-sans)" }}>
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

        {/* ── TOPBAR ── */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 'var(--header-h)',
          background: 'var(--card-bg)',
          borderBottom: '0.5px solid var(--border)',
          zIndex: 50,
          display: 'flex', alignItems: 'center',
          padding: '0 28px 0 0',
        }}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: 'var(--ink-3)',
              transition: 'color var(--duration)',
            }}
            aria-label="Menu"
            onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-3)'}
          >
            {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          {/* Breadcrumb — desktop */}
          <div className="hidden lg:flex items-center" style={{
            flex: 1, paddingLeft: 'calc(var(--sidebar-w) + 28px)',
            gap: 6, fontSize: 12, color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 13 }}>Juris.IA</span>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{currentPageName}</span>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginLeft: 'auto' }}>
            {/* Data */}
            <span className="hidden md:block" style={{
              fontSize: 11, color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)', paddingRight: 16,
            }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            {/* Divisor */}
            <div className="hidden md:block" style={{ width: '0.5px', height: 20, background: 'var(--border)', marginRight: 12 }} />

            {/* Notifications */}
            {user && (
              <React.Suspense fallback={<div style={{ width: 30, height: 30 }} />}>
                <NotificationPanel user={user} />
              </React.Suspense>
            )}

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0 0 0 12px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    transition: 'opacity var(--duration)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: 'var(--accent-green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                      {user?.full_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:block" style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.full_name?.split(' ')[0] || 'Usuário'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={{ width: 220, background: 'var(--card-bg)', border: '0.5px solid var(--border)', borderRadius: 10, boxShadow: 'none', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px 10px', borderBottom: '0.5px solid var(--border)' }}>
                  <p style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)', marginBottom: 2, fontFamily: 'var(--font-body)' }}>{user?.full_name || 'Usuário'}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{user?.email}</p>
                </div>
                {[
                  { to: createPageUrl("Settings"), icon: Settings, label: 'Preferências' },
                  { to: createPageUrl("MyData"), icon: Bookmark, label: 'Meus Dados' },
                  { to: createPageUrl("Contact"), icon: MessageSquare, label: 'Suporte' },
                  { to: createPageUrl("PrivacyPolicy"), icon: Bookmark, label: 'Privacidade' },
                ].map(({ to, icon: Icon, label }) => (
                  <DropdownMenuItem key={label} asChild>
                    <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', color: 'var(--text-secondary)', fontSize: 12, textDecoration: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.12s ease, color 0.12s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      <Icon size={12} /> {label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <div style={{ borderTop: '0.5px solid var(--border)' }}>
                  <DropdownMenuItem onClick={() => setShowDeleteAccountDialog(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', color: 'var(--danger)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.12s ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Shield size={12} /> Excluir Conta
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.12s ease, color 0.12s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <LogOut size={12} /> Sair
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── SIDEBAR (Desktop sempre visível, Mobile toggle) ── */}
        <AnimatePresence initial={false}>
          {(isMobileMenuOpen) && (
            <>
              {/* Overlay mobile */}
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
            </>
          )}
        </AnimatePresence>
        <aside
          className={isMobileMenuOpen ? 'sidebar-open' : 'sidebar-closed'}
          style={{
            position: 'fixed', left: 0, top: 'var(--header-h)', bottom: 0,
            width: 'var(--sidebar-w)',
            background: 'var(--sidebar-bg)',
            borderRight: '0.5px solid rgba(255,255,255,0.06)',
            overflowY: 'auto', overflowX: 'hidden',
            zIndex: 46,
            display: 'flex', flexDirection: 'column',
            transition: 'transform 0.2s ease',
          }}
        >
          {/* Logo area */}
          <div style={{ padding: '20px 20px 0' }}>
            <Link to={createPageUrl("Dashboard")} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 20,
                color: '#FFFFFF',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                }}>
                Juris<span style={{ fontStyle: 'normal', fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, letterSpacing: 0 }}>.IA</span>
                </div>
                <div style={{
                fontSize: 8, fontWeight: 600, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.20)',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                marginTop: 4,
                }}>
                O futuro da advocacia
              </div>
            </Link>
          </div>
          <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.07)', margin: '14px 0 4px' }} />
          <div style={{ flex: 1, paddingBottom: 16 }}>
            <SidebarNav user={user} onNavigate={() => setIsMobileMenuOpen(false)} isMobile={false} />
          </div>
          {/* User footer */}
          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)', padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6, background: 'var(--accent-green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.75)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
                  {user?.full_name?.split(' ')[0] || 'Usuário'}
                </p>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', margin: '1px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                  {user?.role === 'admin' ? 'Administrador' : 'Advogado'}
                </p>
              </div>
              <Link to={createPageUrl("Settings")} style={{ color: 'rgba(255,255,255,0.25)', transition: 'color 0.12s ease', display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
              >
                <Settings size={12} />
              </Link>
            </div>
          </div>
        </aside>

        {/* Bottom Navigation - Mobile */}
        {user && !publicPages.includes(currentPageName) && (
          <div className="lg:hidden">
            <BottomNavigation user={user} onLogout={handleLogout} />
          </div>
        )}

        {/* ── MAIN ── */}
        <main style={{
          minHeight: '100vh',
          background: 'var(--page-bg)',
          paddingTop: 'var(--header-h)',
        }} className="lg:pl-[160px] pl-0">
          {showBackButton && (
            <div style={{ background: 'var(--card-bg)', borderBottom: '0.5px solid var(--border)' }}>
              <div style={{ padding: '9px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link
                  to={createPageUrl("Dashboard")}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.12s ease', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <ArrowLeft size={12} />
                  <span>Início</span>
                </Link>
                {currentPageName === "AIAssistant" && (
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openAIHistory'))}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '0.5px solid var(--border)', padding: '5px 12px', fontSize: 11, cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', transition: 'all 0.12s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <HistoryIcon size={12} />
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
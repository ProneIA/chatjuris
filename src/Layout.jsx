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
      <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
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

        <style>{`
          :root {
            --app-bg: #F9FAFB; --app-surface: #FFFFFF; --app-surface2: #F3F4F6;
            --app-border: rgba(201,168,76,0.15); --app-text: #0D0F1A; --app-muted: #6B7280;
          }
        `}</style>

        {/* Top Bar */}
        <header style={{ background:"#FFFFFF", borderBottom:"1px solid rgba(201,168,76,0.15)" }} className="fixed top-0 left-0 right-0 h-14 z-50">
          <div className="h-full px-4 flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ background:"none", border:"none", cursor:"pointer", color:"#0D0F1A", padding:"0.5rem" }}
              className="lg:hidden"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link 
              to={createPageUrl("Dashboard")} 
              className="lg:hidden flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/render/image/public/base44-prod/public/690e408daf48e0f633c6cf3a/5c0116596_LOGO2.png" alt="ChatJuris" style={{ height:24, objectFit:"contain" }} />
            </Link>

            <div className="flex items-center gap-2">
              {!isStandalone && (
                <Button variant="ghost" size="sm" onClick={handleInstallApp} className="hidden md:flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span className="hidden xl:inline">Instalar App</span>
                </Button>
              )}



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
                <DropdownMenuContent align="end" style={{ width:220, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:0 }}>
                  <div className="px-3 py-2">
                    <p style={{ fontFamily:"'Oswald',sans-serif", fontWeight:600, fontSize:".85rem", textTransform:"uppercase", color:"var(--text)" }}>{user?.full_name || 'Usuário'}</p>
                    <p style={{ fontSize:".75rem", color:"var(--text-muted)" }}>{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator style={{ background:"var(--border)" }} />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Settings")} style={{ color:"var(--text-muted)", fontSize:".85rem" }} className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" /><span>Preferências</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("MyData")} style={{ color:"var(--text-muted)", fontSize:".85rem" }} className="flex items-center gap-2 cursor-pointer">
                      <Bookmark className="w-4 h-4" /><span>Meus Dados</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Contact")} style={{ color:"var(--text-muted)", fontSize:".85rem" }} className="flex items-center gap-2 cursor-pointer">
                      <MessageSquare className="w-4 h-4" /><span>Contato</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("PrivacyPolicy")} style={{ color:"var(--text-muted)", fontSize:".85rem" }} className="flex items-center gap-2 cursor-pointer">
                      <Bookmark className="w-4 h-4" /><span>Política de Privacidade</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{ background:"var(--border)" }} />
                  <DropdownMenuItem onClick={() => setShowDeleteAccountDialog(true)} className="flex items-center gap-2 cursor-pointer" style={{ color:"var(--primary)", fontSize:".85rem" }}>
                    <Shield className="w-4 h-4" /><span>Excluir Conta</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer" style={{ color:"var(--primary)", fontSize:".85rem" }}>
                    <LogOut className="w-4 h-4" /><span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Sidebar - Desktop */}
        <aside style={{ background:"var(--surface)", borderRight:"1px solid var(--border)" }} className="hidden lg:block fixed left-0 top-14 bottom-0 w-64 overflow-y-auto">
          <div className="py-4">
            <Link to={createPageUrl("Dashboard")} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.75rem 1.25rem", marginBottom:"0.5rem", textDecoration:"none" }}>
              <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:"1.4rem", textTransform:"uppercase", letterSpacing:"-0.02em", color:"var(--text)" }}>Juris</span>
              <div style={{ display:"flex", gap:3 }}>
                {[0,1,2].map((i)=>(
                  <div key={i} style={{ width:5, height:5, background: i < 2 ? "var(--primary)" : "var(--border)" }} />
                ))}
              </div>
            </Link>
            <div style={{ height:1, background:"var(--border)", margin:"0 0 0.5rem" }} />
            <SidebarNav user={user} isMobile={false} />
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
                style={{ background:"var(--surface)", borderRight:"1px solid var(--border)" }}
                className="lg:hidden fixed top-14 left-0 bottom-0 w-72 z-40 overflow-y-auto"
              >
                <SidebarNav user={user} onNavigate={() => setIsMobileMenuOpen(false)} isMobile={true} />
                {!isStandalone && (
                  <div style={{ padding: "0.5rem 1rem" }}>
                    <button
                      onClick={() => { handleInstallApp(); setIsMobileMenuOpen(false); }}
                      className="btn-primary"
                      style={{ width:"100%", justifyContent:"flex-start", padding:"0.65rem 1.25rem" }}
                    >
                      <Download style={{ width:16, height:16 }} />
                      <span>Instalar Aplicativo</span>
                    </button>
                  </div>
                )}
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

        {/* Main Content */}
        <main style={{ background:"var(--bg)" }} className={`min-h-screen pt-14 lg:pl-64 ${user && !publicPages.includes(currentPageName) ? 'pb-20 lg:pb-0' : ''}`}>
          {showBackButton && (
            <div style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)" }}>
              <div className="px-6 py-3 flex items-center justify-between">
                <Link 
                  to={createPageUrl("Dashboard")}
                  style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", fontSize:".75rem", fontFamily:"'Oswald',sans-serif", fontWeight:600, textTransform:"uppercase", letterSpacing:".1em", color:"var(--text-muted)", textDecoration:"none" }}
                  onMouseEnter={e=>e.currentTarget.style.color="var(--primary)"}
                  onMouseLeave={e=>e.currentTarget.style.color="var(--text-muted)"}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </Link>
                {currentPageName === "AIAssistant" && (
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openAIHistory'))}
                    className="btn-ghost"
                    style={{ padding:"0.4rem 1rem", fontSize:".72rem" }}
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
              style={{ minHeight:"calc(100vh - 3.5rem)", background:"var(--bg)" }}
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
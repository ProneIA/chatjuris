import React from "react";
import { Link, useLocation } from "react-router-dom";
const GoogleMigrationModal = React.lazy(() => import("@/components/auth/GoogleMigrationModal"));
import { createPageUrl } from "@/utils";
import {
  LogOut, Menu, X, Settings, Scale,
  Bell, Search, ChevronRight,
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
import BottomNavigation from "@/components/mobile/BottomNavigation";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Cache busting ──────────────────────────────────────────────────────────
const APP_VERSION = "2026-02-20-1";
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("app_version");
  if (stored && stored !== APP_VERSION) {
    localStorage.setItem("app_version", APP_VERSION);
    if ("caches" in window) caches.keys().then(ns => ns.forEach(n => caches.delete(n)));
    window.location.reload(true);
  } else if (!stored) {
    localStorage.setItem("app_version", APP_VERSION);
  }
}

// ── Access cache (5 min TTL) ───────────────────────────────────────────────
const ACCESS_CACHE_TTL = 5 * 60 * 1000;
function getAccessCache(userId) {
  try {
    const raw = localStorage.getItem(`juris_access_${userId}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > ACCESS_CACHE_TTL) { localStorage.removeItem(`juris_access_${userId}`); return null; }
    return data;
  } catch { return null; }
}
function setAccessCache(userId, data) {
  try { localStorage.setItem(`juris_access_${userId}`, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

const pagesWithoutBackButton = [
  "Dashboard", "LandingPage", "QuemSomos", "Funcionalidades",
  "ContactPublic", "Pricing", "ClientAccess", "AccessDenied", "Checkout",
];
const publicPages = [
  "LandingPage", "QuemSomos", "Funcionalidades", "ContactPublic",
  "Pricing", "ClientAccess", "AccessDenied", "Checkout",
];

const Layout = React.memo(function Layout({ children, currentPageName }) {
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

  React.useEffect(() => {
    base44.auth.me()
      .then(async (u) => {
        setUser(u);
        if (u?.id) {
          try {
            if (!u.trial_start_date && !u.subscription_start_date) {
              const trialResponse = await base44.functions.invoke("createTrialSubscription", {});
              if (trialResponse.data.success) {
                setUser(trialResponse.data.user);
                setTrialDaysLeft(7);
                const key = `trial_welcome_shown_${u.id}`;
                if (!localStorage.getItem(key)) { setShowTrialWelcome(true); localStorage.setItem(key, "true"); }
              }
            }
            if (!u.has_password) setShowGoogleMigration(true);
            const localConsentKey = `consent_accepted_${u.email}`;
            if (localStorage.getItem(localConsentKey) === "true") {
              setHasCheckedConsent(true);
            } else {
              const consents = await base44.entities.UserConsent.filter({ user_email: u.email });
              const hasTerms = consents.some(c => c.consent_type === "terms_of_use" && c.accepted);
              const hasPrivacy = consents.some(c => c.consent_type === "privacy_policy" && c.accepted);
              if (hasTerms && hasPrivacy) localStorage.setItem(localConsentKey, "true");
              else setShowConsentModal(true);
              setHasCheckedConsent(true);
            }
            const cached = getAccessCache(u.id);
            if (cached) {
              setHasAccess(cached.canAccess);
              setAccessChecked(true);
              if (!cached.canAccess && cached.redirectToPricing) {
                const cp = window.location.pathname;
                if (!publicPages.some(p => cp.includes(p))) window.location.href = "/Pricing";
              }
            } else {
              const { data } = await base44.functions.invoke("canAccessSystem", {});
              setHasAccess(data.canAccess);
              setAccessCache(u.id, data);
              setAccessChecked(true);
              if (!data.canAccess && data.redirectToPricing) {
                const cp = window.location.pathname;
                if (!publicPages.some(p => cp.includes(p))) window.location.href = "/Pricing";
              }
            }
          } catch {
            setHasCheckedConsent(true);
            setHasAccess(true);
            setAccessChecked(true);
          }
        } else {
          setAccessChecked(true);
        }
      })
      .catch(() => { setUser(null); setAccessChecked(true); })
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    setIsStandalone(standalone);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const handleBeforeInstall = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleLogout = React.useCallback(() => base44.auth.logout("/LandingPage"), []);

  const handleDeleteAccount = React.useCallback(async () => {
    try { await base44.functions.invoke("deleteUserAccount", {}); } catch {}
    base44.auth.logout("/LandingPage");
  }, []);

  const handleInstallApp = React.useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  }, [deferredPrompt]);

  // ── Public pages — no layout ────────────────────────────────────────────
  if (publicPages.includes(currentPageName)) return <>{children}</>;

  if (isLoading) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      </div>
    );
  }

  if (!user) return <>{children}</>;
  if (!accessChecked && user) return <>{children}</>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <React.Suspense fallback={null}><PWAHead /></React.Suspense>
      <React.Suspense fallback={null}><KeyboardShortcuts /></React.Suspense>
      <React.Suspense fallback={null}>
        <InstallAppBanner deferredPrompt={deferredPrompt} isIOS={isIOS} isStandalone={isStandalone} onInstall={handleInstallApp} />
      </React.Suspense>
      <React.Suspense fallback={null}>
        <InstallInstructionsDialog open={showInstallModal} onOpenChange={setShowInstallModal} isIOS={isIOS} />
      </React.Suspense>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(2px)", zIndex: 45 }}
            className="lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={isMobileMenuOpen ? "sidebar-open" : "sidebar-closed"}
        style={{
          width: "var(--sidebar-w)", flexShrink: 0,
          background: "#0F172A",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "none",
          display: "flex", flexDirection: "column",
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 46,
          transition: "transform .25s var(--ease)",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "transparent" }}>
          <Link to={createPageUrl("Dashboard")} onClick={() => setIsMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 7,
              background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Scale size={16} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#F1F5F9", letterSpacing: "-0.02em" }}>
                JURIS
              </span>
              <p style={{ fontSize: 10, color: "#475569", margin: 0, letterSpacing: ".06em", textTransform: "uppercase" }}>
                Software Jurídico
              </p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          <SidebarNav user={user} onNavigate={() => setIsMobileMenuOpen(false)} />
        </div>

        {/* User footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "transparent" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "#1E3A5F", border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 600, color: "#93C5FD", flexShrink: 0,
            }}>
              {user?.full_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#E2E8F0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.full_name || "Usuário"}
              </p>
              <p style={{ fontSize: 11, color: "#475569", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email || ""}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#475569", transition: "color .15s", minHeight: "unset", minWidth: "unset" }}
              onMouseEnter={e => e.currentTarget.style.color = "#94A3B8"}
              onMouseLeave={e => e.currentTarget.style.color = "#475569"}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, marginLeft: "var(--sidebar-w)", display: "flex", flexDirection: "column", minHeight: "100vh" }} className="lg:ml-[256px] ml-0">

        {/* Topbar */}
        <header style={{
          height: "var(--header-h)", background: "#FFFFFF",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", position: "sticky", top: 0, zIndex: 30,
        }}>
          {/* Mobile hamburger + breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 4, display: "flex", alignItems: "center", minHeight: "unset" }}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <span style={{ color: "var(--text-3)" }} className="hidden lg:inline">Juris.IA</span>
              <ChevronRight size={14} style={{ color: "var(--text-3)" }} className="hidden lg:inline" />
              <span style={{ fontWeight: 500, color: "var(--text-1)" }}>{currentPageName}</span>
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Notifications */}
            {user && (
              <React.Suspense fallback={<div style={{ width: 30 }} />}>
                <NotificationPanel user={user} />
              </React.Suspense>
            )}

            {/* Avatar */}
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "#0F172A", color: "#93C5FD",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
              border: "1px solid #E2E8F0",
            }}>
              {user?.full_name?.[0]?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "24px", overflowX: "hidden", paddingBottom: "calc(var(--bottom-nav-h, 60px) + 24px)" }} className="lg:pb-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentPageName}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {user && !publicPages.includes(currentPageName) && (
        <BottomNavigation user={user} onLogout={handleLogout} />
      )}

      {/* ── Modais ──────────────────────────────────────────────────────── */}
      {showGoogleMigration && !publicPages.includes(currentPageName) && (
        <React.Suspense fallback={null}>
          <GoogleMigrationModal onDismiss={() => setShowGoogleMigration(false)} />
        </React.Suspense>
      )}

      {hasCheckedConsent && !consentAccepted && (
        <React.Suspense fallback={null}>
          <ConsentModal
            open={showConsentModal}
            onAccept={() => {
              setShowConsentModal(false);
              setConsentAccepted(true);
              if (user?.email) localStorage.setItem(`consent_accepted_${user.email}`, "true");
            }}
          />
        </React.Suspense>
      )}

      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos. Deseja continuar?
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

      <React.Suspense fallback={null}>
        <TrialWelcomeModal open={showTrialWelcome} onClose={() => setShowTrialWelcome(false)} daysLeft={trialDaysLeft} />
      </React.Suspense>
    </div>
  );
});

export default Layout;
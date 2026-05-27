import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const UserContext = createContext(null);

// Cache key para localStorage
const ACCESS_CACHE_KEY = "juris_access_cache";
const ACCESS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getAccessCache(userId) {
  try {
    const raw = localStorage.getItem(`${ACCESS_CACHE_KEY}_${userId}`);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > ACCESS_CACHE_TTL) {
      localStorage.removeItem(`${ACCESS_CACHE_KEY}_${userId}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setAccessCache(userId, data) {
  try {
    localStorage.setItem(`${ACCESS_CACHE_KEY}_${userId}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {}
}

function clearAccessCache(userId) {
  try {
    localStorage.removeItem(`${ACCESS_CACHE_KEY}_${userId}`);
  } catch {}
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [hasAccess, setHasAccess] = useState(true);
  const [accessChecked, setAccessChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAccess = useCallback(async (userId) => {
    // Verificar cache primeiro
    const cached = getAccessCache(userId);
    if (cached) {
      setHasAccess(cached.canAccess);
      setAccessChecked(true);
      return cached;
    }

    try {
      const { data } = await base44.functions.invoke('canAccessSystem', {});
      setHasAccess(data.canAccess);
      setAccessCache(userId, data);
      setAccessChecked(true);

      if (!data.canAccess) {
        const publicPages = ["/Pricing", "/LandingPage", "/QuemSomos", "/Funcionalidades", "/ContactPublic", "/login", "/cadastro"];
        const isPublic = publicPages.some(p => window.location.pathname.startsWith(p));
        if (!isPublic) {
          if (data.reason === 'account_deleted' || data.redirectToLogin) {
            window.location.href = '/LandingPage';
          } else if (data.redirectToPricing) {
            // Passar o motivo do bloqueio como query param para exibir mensagem na página /Pricing
            const msg = encodeURIComponent(data.reason || 'blocked');
            window.location.href = `/Pricing?blocked=${msg}`;
          }
        }
      }
      return data;
    } catch {
      console.error('[UserContext] Falha ao verificar acesso — negando por segurança');
      setHasAccess(false);
      setAccessChecked(true);
      return { canAccess: false, reason: 'network_error' };
    }
  }, []);

  // Forçar refresh do cache de acesso (ex: após pagamento)
  const refreshAccess = useCallback(async () => {
    if (user?.id) {
      clearAccessCache(user.id);
      await checkAccess(user.id);
    }
  }, [user, checkAccess]);

  useEffect(() => {
    base44.auth.me()
      .then(async (u) => {
        setUser(u);
        if (u?.id) {
          // Buscar subscription e verificar acesso em paralelo
          const [subs] = await Promise.all([
            base44.entities.Subscription.filter({ user_id: u.id }),
            checkAccess(u.id)
          ]);
          setSubscription(subs[0] || null);
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

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      subscription,
      setSubscription,
      hasAccess,
      accessChecked,
      isLoading,
      refreshAccess
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
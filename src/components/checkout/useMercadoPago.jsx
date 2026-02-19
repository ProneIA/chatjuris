/**
 * Hook para inicializar o SDK MercadoPago.js V2.
 * - PUBLIC KEY: apenas no frontend (via função backend getMercadoPagoKeys)
 * - ACCESS TOKEN: apenas no backend (nunca exposto aqui)
 * - Gera Device ID automaticamente para antifraude
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useMercadoPago() {
  const [mp, setMp] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 1. Garantir que o script SDK está carregado
        await loadSdkScript();

        // 2. Buscar PUBLIC KEY no backend (nunca hardcoded no frontend)
        const res = await base44.functions.invoke("getMercadoPagoKeys");
        const publicKey = res.data?.publicKey;
        if (!publicKey || cancelled) return;

        // 3. Inicializar instância MP (gera Device ID automaticamente)
        const mpInstance = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        window._mpInstance = mpInstance;

        // 4. Capturar Device ID gerado pelo SDK
        // O SDK injeta automaticamente o fingerprint via cookies/headers
        // Mas também podemos capturar via getDeviceId se disponível
        let dId = null;
        if (typeof mpInstance.getDeviceId === "function") {
          dId = await mpInstance.getDeviceId();
        } else {
          // Fallback: ler do cookie _deviceId que o SDK injeta
          dId = getCookieDeviceId() || generateFallbackDeviceId();
        }

        if (!cancelled) {
          setMp(mpInstance);
          setDeviceId(dId);
          setReady(true);
          // Disponibilizar globalmente para o backend receber
          window.__MP_DEVICE_ID__ = dId;
        }
      } catch (err) {
        console.error("[MP] Falha ao inicializar SDK:", err.message);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  return { mp, deviceId, ready };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadSdkScript() {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) return resolve();
    if (document.getElementById("mp-sdk-v2")) {
      // Script já existe mas ainda carregando
      const existing = document.getElementById("mp-sdk-v2");
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.id = "mp-sdk-v2";
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function getCookieDeviceId() {
  const match = document.cookie.match(/_deviceId=([^;]+)/);
  return match ? match[1] : null;
}

function generateFallbackDeviceId() {
  // Fallback determinístico baseado em fingerprint do browser
  const nav = navigator;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || 0
  ].join("|");

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return `fp_${Math.abs(hash).toString(16)}_${Date.now().toString(36)}`;
}
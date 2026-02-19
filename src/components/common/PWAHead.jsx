import React, { useEffect } from "react";

export default function PWAHead() {
  useEffect(() => {
    // ── MercadoPago SDK V2 (Device ID antifraude) ──────────────────────────
    // PUBLIC KEY apenas no frontend - Access Token NUNCA exposto aqui
    if (!document.getElementById('mp-sdk-v2')) {
      const mpScript = document.createElement('script');
      mpScript.id = 'mp-sdk-v2';
      mpScript.src = 'https://sdk.mercadopago.com/js/v2';
      mpScript.async = true;
      mpScript.onload = () => {
        // Buscar public key do backend para inicializar Device ID antifraude
        fetch('/api/functions/getMercadoPagoKeys', { credentials: 'include' })
          .then(r => r.json())
          .then(data => {
            const publicKey = data?.publicKey;
            if (publicKey && window.MercadoPago) {
              window._mpInstance = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
              window.__MP_PUBLIC_KEY__ = publicKey;
              console.log('[MP] SDK V2 inicializado - Device ID ativo');
            }
          })
          .catch(() => {
            // Silencioso - o CardForm fará sua própria inicialização
          });
      };
      document.head.appendChild(mpScript);
    }

    // Inject manifest dynamically
    const manifestData = {
      name: "JURIS - Gestão Jurídica",
      short_name: "JURIS",
      description: "Plataforma jurídica inteligente com IA para advogados",
      start_url: "/Dashboard",
      display: "standalone",
      background_color: "#000000",
      theme_color: "#000000",
      orientation: "portrait-primary",
      scope: "/",
      lang: "pt-BR",
      categories: ["productivity", "business"],
      icons: [
        {
          src: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect fill="#000" width="512" height="512" rx="112"/><text x="256" y="320" font-family="serif" font-size="280" fill="#fff" text-anchor="middle" font-weight="bold">J</text></svg>`),
          sizes: "512x512",
          type: "image/svg+xml",
          purpose: "any maskable"
        }
      ],
      shortcuts: [
        { name: "Novo Processo", url: "/Cases", description: "Criar novo processo" },
        { name: "Assistente IA", url: "/AIAssistant", description: "Abrir assistente IA" },
        { name: "Tarefas", url: "/Tasks", description: "Ver tarefas" }
      ]
    };

    let existingManifest = document.querySelector('link[rel="manifest"]');
    if (!existingManifest) {
      const blob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = url;
      document.head.appendChild(link);
    }

    // Apple splash screens meta
    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };

    setMeta('apple-mobile-web-app-capable', 'yes');
    setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    setMeta('apple-mobile-web-app-title', 'JURIS');
    setMeta('mobile-web-app-capable', 'yes');
    setMeta('application-name', 'JURIS');
    setMeta('theme-color', '#000000');
    setMeta('msapplication-TileColor', '#000000');
    setMeta('msapplication-tap-highlight', 'no');
    setMeta('format-detection', 'telephone=no');
    setMeta('google-site-verification', 'e3ZZsYNt9S84TDP_bU1zX8I4L_Nzag8-6CSHc1888lI');

    // Register service worker (prepared for future)
    if ('serviceWorker' in navigator) {
      // SW registration ready - can be enabled when sw.js is deployed
      // navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

  }, []);

  return null;
}
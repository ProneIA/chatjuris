import React, { useEffect } from "react";

/**
 * PWAHead - Injeta todas as meta tags necessárias para PWA/Mobile via JS.
 * Compatível com instalação no Android (Chrome) e iOS (Safari).
 * Registra Service Worker quando disponível.
 */
export default function PWAHead() {
  useEffect(() => {
    const setMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const setLink = (rel, href, extras = {}) => {
      const selector = extras.sizes
        ? `link[rel="${rel}"][sizes="${extras.sizes}"]`
        : `link[rel="${rel}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
      Object.entries(extras).forEach(([k, v]) => (el[k] = v));
    };

    // ── Título e Descrição ──────────────────────────
    document.title = "Juris – Plataforma Jurídica Inteligente";

    // ── Viewport mobile-first ───────────────────────
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp) {
      vp.content =
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }

    // ── Meta tags PWA ───────────────────────────────
    setMeta('description', 'Gerencie processos, clientes e documentos jurídicos com IA.');
    setMeta('application-name', 'Juris');
    setMeta('theme-color', '#000000');
    setMeta('msapplication-TileColor', '#000000');
    setMeta('msapplication-tap-highlight', 'no');
    setMeta('format-detection', 'telephone=no');
    setMeta('mobile-web-app-capable', 'yes');

    // ── Apple PWA ───────────────────────────────────
    setMeta('apple-mobile-web-app-capable', 'yes');
    setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    setMeta('apple-mobile-web-app-title', 'Juris');

    // ── Open Graph ──────────────────────────────────
    setMeta('og:title', 'Juris – Plataforma Jurídica Inteligente', true);
    setMeta('og:description', 'Gerencie seu escritório jurídico com inteligência artificial.', true);
    setMeta('og:type', 'website', true);
    setMeta('og:locale', 'pt_BR', true);

    // ── Google Search Console ───────────────────────
    setMeta('google-site-verification', 'e3ZZsYNt9S84TDP_bU1zX8I4L_Nzag8-6CSHc1888lI');

    // ── App Icon SVG inline ─────────────────────────
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
      <rect fill="#000" width="192" height="192" rx="48"/>
      <path fill="#fff" d="M96 40c-30.9 0-56 25.1-56 56s25.1 56 56 56 56-25.1 56-56-25.1-56-56-56zm0 88c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z"/>
      <circle fill="#fff" cx="96" cy="96" r="16"/>
    </svg>`;
    const blob = new Blob([iconSvg], { type: 'image/svg+xml' });
    const iconUrl = URL.createObjectURL(blob);

    setLink('icon', iconUrl, { type: 'image/svg+xml' });
    setLink('apple-touch-icon', iconUrl);

    // ── Manifest PWA ────────────────────────────────
    // Injeta manifest dinâmico para garantir instalabilidade
    const manifest = {
      name: 'Juris – Plataforma Jurídica',
      short_name: 'Juris',
      description: 'Gerencie seu escritório jurídico com inteligência artificial.',
      start_url: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#ffffff',
      theme_color: '#000000',
      lang: 'pt-BR',
      categories: ['productivity', 'business'],
      icons: [
        { src: iconUrl, sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
        { src: iconUrl, sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
      ],
      shortcuts: [
        {
          name: 'Assistente IA',
          short_name: 'IA',
          url: '/AIAssistant',
          description: 'Abrir assistente jurídico com IA'
        },
        {
          name: 'Processos',
          short_name: 'Processos',
          url: '/Cases',
          description: 'Gerenciar processos'
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);
    setLink('manifest', manifestUrl);

    // ── Safe area CSS ───────────────────────────────
    const safeAreaStyle = document.getElementById('safe-area-style') || document.createElement('style');
    safeAreaStyle.id = 'safe-area-style';
    safeAreaStyle.textContent = `
      :root {
        --sat: env(safe-area-inset-top, 0px);
        --sab: env(safe-area-inset-bottom, 0px);
        --sal: env(safe-area-inset-left, 0px);
        --sar: env(safe-area-inset-right, 0px);
      }
      body {
        overscroll-behavior: none;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
      }
    `;
    if (!document.getElementById('safe-area-style')) {
      document.head.appendChild(safeAreaStyle);
    }

    // ── Service Worker ──────────────────────────────
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // SW não disponível - silencioso
        });
      });
    }

    return () => {
      URL.revokeObjectURL(iconUrl);
      URL.revokeObjectURL(manifestUrl);
    };
  }, []);

  return null;
}
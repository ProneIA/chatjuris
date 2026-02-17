import React, { useEffect } from "react";

// PWAHead: injeta meta tags dinâmicas e registra o Service Worker
export default function PWAHead() {
  useEffect(() => {
    // Registrar Service Worker para PWA/offline
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // SW não disponível em dev - silencioso
        });
      });
    }
  }, []);

  return null;
}
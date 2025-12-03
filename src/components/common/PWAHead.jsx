import React, { useEffect } from "react";

export default function PWAHead() {
  useEffect(() => {
    // Add PWA meta tags dynamically
    const addMetaTag = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const addLinkTag = (rel, href, options = {}) => {
      let link = document.querySelector(`link[rel="${rel}"]${options.sizes ? `[sizes="${options.sizes}"]` : ''}`);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
      if (options.sizes) link.sizes = options.sizes;
      if (options.type) link.type = options.type;
    };

    // PWA Meta Tags
    addMetaTag('theme-color', '#000000');
    addMetaTag('apple-mobile-web-app-capable', 'yes');
    addMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    addMetaTag('apple-mobile-web-app-title', 'Juris');
    addMetaTag('mobile-web-app-capable', 'yes');
    addMetaTag('application-name', 'Juris');
    addMetaTag('msapplication-TileColor', '#000000');
    addMetaTag('msapplication-tap-highlight', 'no');
    addMetaTag('format-detection', 'telephone=no');

    // Viewport for mobile
    let viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    }

    // Apple touch icon (using a data URI for a simple icon)
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect fill="#000" width="180" height="180" rx="40"/><path fill="#fff" d="M90 40c-27.6 0-50 22.4-50 50s22.4 50 50 50 50-22.4 50-50-22.4-50-50-50zm0 80c-16.5 0-30-13.5-30-30s13.5-30 30-30 30 13.5 30 30-13.5 30-30 30z"/><circle fill="#fff" cx="90" cy="90" r="15"/></svg>`;
    const iconBlob = new Blob([iconSvg], { type: 'image/svg+xml' });
    const iconUrl = URL.createObjectURL(iconBlob);
    
    addLinkTag('apple-touch-icon', iconUrl);
    addLinkTag('icon', iconUrl, { type: 'image/svg+xml' });

    return () => {
      URL.revokeObjectURL(iconUrl);
    };
  }, []);

  return null;
}
import React, { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallAppBanner({ theme = 'light', deferredPrompt, isIOS, isStandalone, onInstall }) {
  const isDark = theme === 'dark';
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isStandalone) {
      setShowBanner(false);
      return;
    }

    // Check if banner was dismissed recently
    const dismissed = localStorage.getItem('install-banner-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Show banner if prompt is available or if iOS
    if (deferredPrompt) {
      setShowBanner(true);
    } else if (isIOS) {
      // Delay for iOS to not be intrusive immediately
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt, isIOS, isStandalone]);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('install-banner-dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 rounded-xl shadow-2xl border ${
          isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className="p-4">
          <button
            onClick={handleDismiss}
            className={`absolute top-2 right-2 p-1 rounded-full ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-indigo-500'
            }`}>
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Instalar Juris
              </h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                {isIOS 
                  ? 'Instale o app para acesso rápido'
                  : 'Instale o app para acesso rápido no seu dispositivo'
                }
              </p>
            </div>
          </div>

          {!isIOS && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="flex-1"
              >
                Agora não
              </Button>
              <Button
                size="sm"
                onClick={onInstall}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar
              </Button>
            </div>
          )}

          {isIOS && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-600'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4" />
                <span className="font-medium">Como instalar no iOS:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Toque no ícone de compartilhar (□↑)</li>
                <li>Role e toque em "Adicionar à Tela de Início"</li>
                <li>Toque em "Adicionar"</li>
              </ol>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
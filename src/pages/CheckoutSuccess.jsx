import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle, Sparkles, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { base44 } from "@/api/base44Client";

export default function CheckoutSuccess({ theme = 'light' }) {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    // Efeito de confete na confirmação
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => {});
  }, []);

  const handleGoToDashboard = () => {
    navigate(createPageUrl("Dashboard"));
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-neutral-950' : 'bg-gradient-to-br from-purple-50 via-white to-indigo-50'}`}>
      <div className="max-w-2xl mx-auto px-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            🎉 Pagamento Confirmado!
          </h1>
          
          <p className={`text-xl mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Bem-vindo ao <span className="font-bold text-purple-600">Juris Pro</span>
          </p>
          
          <p className={`text-base mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Sua assinatura foi ativada com sucesso!
          </p>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200'} shadow-xl mb-8`}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Acesso Liberado
              </h2>
            </div>
            
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Assistente Jurídico IA com uso <strong>ilimitado</strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Todos os recursos premium desbloqueados
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Suporte prioritário 24/7
                </p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'} mb-8`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                Confirmação enviada por email
              </p>
            </div>
            <p className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
              Enviamos todos os detalhes da sua assinatura para <strong>{user?.email}</strong>
            </p>
          </div>

          <Button
            onClick={handleGoToDashboard}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-14 px-8 text-base font-semibold"
          >
            Começar Agora
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className={`text-xs mt-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Dúvidas? Entre em contato com nosso suporte
          </p>
        </motion.div>
      </div>
    </div>
  );
}
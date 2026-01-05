import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredAffiliateCode } from './AffiliateTracker';
import { base44 } from "@/api/base44Client";

export default function CaktoCheckoutModal({ monthlyCheckoutUrl, annualCheckoutUrl, onClose }) {
  const [planType, setPlanType] = useState('annual'); // 'monthly' ou 'annual'
  const [finalCheckoutUrl, setFinalCheckoutUrl] = useState(annualCheckoutUrl);

  useEffect(() => {
    // Previne scroll da página de fundo
    document.body.style.overflow = 'hidden';
    
    const baseUrl = planType === 'monthly' ? monthlyCheckoutUrl : annualCheckoutUrl;
    
    // Capturar código de afiliado e adicionar ao localStorage da subscription
    const affiliateCode = getStoredAffiliateCode();
    if (affiliateCode) {
      // Salvar no localStorage para ser usado após o webhook
      localStorage.setItem('pending_affiliate_code', affiliateCode);
      
      // Tentar adicionar à URL do Cakto se possível
      try {
        const url = new URL(baseUrl);
        url.searchParams.set('ref', affiliateCode);
        setFinalCheckoutUrl(url.toString());
      } catch (e) {
        setFinalCheckoutUrl(baseUrl);
      }
    } else {
      setFinalCheckoutUrl(baseUrl);
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [monthlyCheckoutUrl, annualCheckoutUrl, planType]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header com identidade visual do site */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Juris IA - Checkout Seguro</h2>
                <p className="text-sm text-white/80">Finalize sua assinatura</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-xl"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          
          {/* Plan Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setPlanType('monthly')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                planType === 'monthly'
                  ? 'bg-white text-gray-900'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Mensal - R$ 109,90/mês
            </button>
            <button
              onClick={() => setPlanType('annual')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                planType === 'annual'
                  ? 'bg-white text-gray-900'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Anual - R$ 99,90/mês
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                +1 MÊS GRÁTIS
              </span>
            </button>
          </div>
        </div>

        {/* Iframe do Checkout da Cakto */}
        <div className="relative" style={{ height: 'calc(90vh - 140px)' }}>
          <iframe
            src={finalCheckoutUrl}
            className="w-full h-full border-none"
            title="Checkout Seguro"
            allow="payment"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
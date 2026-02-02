import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Scale, Lock, CheckCircle, ArrowRight, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function AccessDenied() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        if (userData) {
          const subs = await base44.entities.Subscription.filter({ user_id: userData.id });
          setSubscription(subs[0] || null);
        }
      } catch (e) {
        console.error('Erro ao carregar dados:', e);
      }
    };
    loadData();
  }, []);

  const features = [
    "Assistente Jurídico com IA Avançada",
    "10+ Calculadoras Jurídicas Especializadas",
    "Gerador Automático de Documentos",
    "Gestão Completa de Processos e Clientes",
    "Pesquisa Inteligente de Jurisprudência",
    "Monitor de Diário Oficial",
    "Portal do Cliente Personalizado",
    "Controle Financeiro Completo",
    "Colaboração em Equipe",
    "Suporte Prioritário"
  ];

  const handleCheckout = () => {
    const hotmartCheckoutUrl = "https://pay.hotmart.com/Q104225643H";
    
    // Adicionar email do usuário no checkout se disponível
    if (user?.email) {
      window.location.href = `${hotmartCheckoutUrl}?email=${encodeURIComponent(user.email)}`;
    } else {
      window.location.href = hotmartCheckoutUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Acesso Restrito
            </h1>
            <p className="text-purple-100 text-lg">
              Assine agora e tenha acesso completo à plataforma
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* User Info */}
            {user && (
              <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
                <p className="text-sm text-slate-600">Olá, <span className="font-semibold text-slate-900">{user.full_name}</span></p>
                <p className="text-xs text-slate-500">{user.email}</p>
                {subscription && (
                  <p className="text-xs text-slate-500 mt-1">
                    Status: <span className="font-medium text-orange-600">
                      {subscription.status === 'trial' ? 'Período de Trial Expirado' : 'Assinatura Inativa'}
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Features Grid */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                O que você terá acesso:
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-sm">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Plano PRO</h3>
                  <p className="text-slate-600">Acesso ilimitado a todas as funcionalidades</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-slate-600">R$</span>
                    <span className="text-4xl font-bold text-purple-600">97</span>
                    <span className="text-slate-600">/mês</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-purple-700 mb-4">
                <Zap className="w-4 h-4" />
                <span className="font-medium">Ativação Imediata • Cancele Quando Quiser</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleCheckout}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Assinar Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button
                onClick={() => base44.auth.logout()}
                variant="outline"
                className="sm:w-auto h-14 border-2"
              >
                Sair
              </Button>
            </div>

            <p className="text-center text-xs text-slate-500 mt-4">
              Pagamento 100% seguro via Hotmart • Garantia de 7 dias
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-slate-400 text-sm">
            Dúvidas? Entre em contato: suporte@juris.com
          </p>
        </div>
      </div>
    </div>
  );
}
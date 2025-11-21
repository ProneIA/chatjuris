import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, Zap, Crown, Star, ArrowRight, CreditCard, QrCode, Barcode } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PaymentModal from "../components/subscription/PaymentModal";
import { toast } from "sonner";

const plans = [
  {
    id: "free",
    name: "Gratuito",
    icon: Star,
    price: 0,
    period: "/sempre",
    description: "Para começar sua jornada",
    gradient: "from-slate-500 to-slate-700",
    popular: false,
    features: [
      { text: "5 ações de IA por dia", included: true, highlight: true },
      { text: "Até 3 clientes", included: true },
      { text: "Até 3 processos", included: true },
      { text: "Até 3 documentos", included: true },
      { text: "Até 3 tarefas", included: true },
      { text: "Modo Assistente Básico", included: true },
      { text: "Equipes e Workspace", included: false },
      { text: "Jurisprudência", included: false },
      { text: "Templates avançados", included: false },
      { text: "Calendário inteligente", included: false },
      { text: "Análise de documentos LEXIA", included: false },
      { text: "Uso ilimitado", included: false }
    ],
    limits: {
      daily_actions_limit: 5,
      daily_actions_used: 0
    }
  },
  {
    id: "pro",
    name: "Profissional",
    icon: Zap,
    price: 49.99,
    period: "/mês",
    description: "Poder total sem limites",
    gradient: "from-blue-500 via-purple-500 to-pink-500",
    popular: true,
    features: [
      { text: "Ações de IA ILIMITADAS", included: true, highlight: true },
      { text: "Clientes ILIMITADOS", included: true, highlight: true },
      { text: "Processos ILIMITADOS", included: true, highlight: true },
      { text: "Documentos ILIMITADOS", included: true, highlight: true },
      { text: "Tarefas ILIMITADAS", included: true, highlight: true },
      { text: "Equipes e Workspace", included: true },
      { text: "Jurisprudência completa", included: true },
      { text: "Templates avançados", included: true },
      { text: "Calendário inteligente", included: true },
      { text: "Análise de documentos LEXIA", included: true },
      { text: "Todos os modos de IA", included: true },
      { text: "Suporte prioritário", included: true }
    ],
    limits: {
      daily_actions_limit: 999999,
      daily_actions_used: 0
    }
  }
];

export default function Pricing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0] || null;
    },
    enabled: !!user?.id
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId) => {
      const planData = plans.find(p => p.id === planId);
      
      if (subscription) {
        return base44.entities.Subscription.update(subscription.id, {
          plan: planId,
          status: "active",
          ...planData.limits,
          price: planData.price,
          start_date: new Date().toISOString().split('T')[0],
          last_reset_date: new Date().toISOString().split('T')[0]
        });
      } else {
        return base44.entities.Subscription.create({
          user_id: user.id,
          plan: planId,
          status: "active",
          ...planData.limits,
          price: planData.price,
          start_date: new Date().toISOString().split('T')[0],
          last_reset_date: new Date().toISOString().split('T')[0]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      alert('Plano ativado com sucesso! 🎉');
      navigate(createPageUrl('AIAssistant'));
    }
  });



  const handleSelectPlan = (planId) => {
    const plan = plans.find(p => p.id === planId);
    
    if (planId === "free") {
      subscribeMutation.mutate(planId);
      return;
    }

    if (planId === "pro") {
      const callbackUrl = `${window.location.origin}${createPageUrl('PaymentSuccess')}`;
      const caktoUrl = `https://pay.cakto.com.br/3ek2n8h_660515?redirect_url=${encodeURIComponent(callbackUrl)}`;
      window.location.href = caktoUrl;
      return;
    }

    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = (paymentData) => {
    subscribeMutation.mutate(selectedPlan.id);
    setShowPaymentModal(false);
  };

  const currentPlan = subscription?.plan || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Escolha Seu Plano
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-6">
            Comece grátis com 5 ações por dia ou tenha acesso ilimitado por apenas R$ 49,99/mês
          </p>

          {/* Payment Methods */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Cartão</span>
            </div>
            <div className="w-1 h-1 bg-slate-400 rounded-full" />
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-green-600" />
              <span>PIX</span>
            </div>
            <div className="w-1 h-1 bg-slate-400 rounded-full" />
            <div className="flex items-center gap-2">
              <Barcode className="w-4 h-4 text-orange-600" />
              <span>Boleto</span>
            </div>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -8 }}
                className={`relative bg-white rounded-3xl p-8 border-2 shadow-xl ${
                  plan.popular 
                    ? "border-purple-500 ring-4 ring-purple-200 md:scale-105" 
                    : "border-slate-200"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 text-sm font-bold shadow-lg">
                      ⭐ MAIS POPULAR
                    </Badge>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge className="bg-green-600 text-white px-4 py-1.5 text-xs font-bold shadow-lg">
                      ✓ Plano Atual
                    </Badge>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-20 h-20 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg mx-auto`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>

                {/* Plan Info */}
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-slate-600 mb-4">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-black text-slate-900">
                        R$ {plan.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-slate-600 text-lg">{plan.period}</span>
                    </div>
                    {plan.price > 0 && (
                      <p className="text-sm text-slate-500 mt-2">
                        💳 Cartão, PIX ou Boleto
                      </p>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                    onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan || subscribeMutation.isPending}
                    className={`w-full py-7 text-lg font-bold rounded-xl ${
                      isCurrentPlan
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : plan.id === "pro"
                        ? `bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white shadow-lg`
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {isCurrentPlan ? (
                      "✓ Plano Ativo"
                    ) : (
                      <>
                        {plan.id === "pro" ? "Assinar Plano Pro" : "Começar Grátis"}
                        <ArrowRight className="w-5 h-5 ml-2 inline" />
                      </>
                    )}
                  </Button>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                        feature.included 
                          ? "bg-green-100" 
                          : "bg-slate-100"
                      }`}>
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <span className={`text-sm ${
                        feature.highlight && feature.included
                          ? "font-bold text-slate-900"
                          : feature.included 
                          ? "text-slate-700" 
                          : "text-slate-400 line-through"
                      }`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          <div className="bg-white rounded-2xl p-6 border-2 border-blue-200 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Pagamento Seguro</h3>
            <p className="text-sm text-slate-600">
              Processamento 100% seguro com criptografia SSL
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-green-200 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">PIX Instantâneo</h3>
            <p className="text-sm text-slate-600">
              Aprovação imediata com pagamento via PIX
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Cancele Quando Quiser</h3>
            <p className="text-sm text-slate-600">
              Sem contratos ou taxas de cancelamento
            </p>
          </div>
        </motion.div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setShowPaymentModal(false)}
          onComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
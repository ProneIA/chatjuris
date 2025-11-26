import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Sparkles, Zap, Crown, Star, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PaymentModal from "../components/subscription/PaymentModal";
import CaktoCheckoutModal from "../components/subscription/CaktoCheckoutModal";

const plans = [
  {
    id: "free",
    name: "Gratuito",
    icon: Star,
    price: 0,
    period: "/sempre",
    description: "Para começar sua jornada",
    popular: false,
    features: [
      { text: "5 ações de IA por dia", included: true, highlight: true },
      { text: "Até 3 clientes", included: true, highlight: true },
      { text: "Até 3 processos", included: true, highlight: true },
      { text: "Até 3 documentos", included: true, highlight: true },
      { text: "Até 3 tarefas", included: true, highlight: true },
      { text: "Modo Assistente Geral", included: true },
      { text: "Suporte por email", included: true },
      { text: "Equipes e Workspace", included: false },
      { text: "Jurisprudência", included: false },
      { text: "Templates", included: false },
      { text: "Calendário", included: false },
      { text: "Análise de documentos LEXIA", included: false },
      { text: "Sem limites de uso", included: false }
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
    description: "Uso ilimitado para profissionais",
    popular: true,
    features: [
      { text: "Ações de IA ILIMITADAS", included: true, highlight: true },
      { text: "Clientes ILIMITADOS", included: true, highlight: true },
      { text: "Processos ILIMITADOS", included: true, highlight: true },
      { text: "Documentos ILIMITADOS", included: true, highlight: true },
      { text: "Tarefas ILIMITADAS", included: true, highlight: true },
      { text: "Todos os modos de IA", included: true },
      { text: "Equipes e Workspace", included: true },
      { text: "Jurisprudência completa", included: true },
      { text: "Templates ilimitados", included: true },
      { text: "Calendário inteligente", included: true },
      { text: "Análise de documentos LEXIA", included: true },
      { text: "Gerador de imagens", included: true },
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
  const [showCaktoCheckout, setShowCaktoCheckout] = useState(false);
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
    if (planId === "free") {
      subscribeMutation.mutate(planId);
      return;
    }

    if (planId === "pro") {
      setShowCaktoCheckout(true);
      return;
    }

    const plan = plans.find(p => p.id === planId);
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    subscribeMutation.mutate(selectedPlan.id);
    setShowPaymentModal(false);
  };

  const currentPlan = subscription?.plan || 'free';

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 border border-neutral-800 rounded-lg flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
            Escolha Seu Plano
          </h1>
          <p className="text-lg text-neutral-500 max-w-xl mx-auto">
            Comece grátis com 5 ações por dia ou tenha acesso ilimitado por apenas R$ 49,99/mês
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative border rounded-lg p-8 transition-all ${
                  plan.popular 
                    ? "border-white bg-neutral-900" 
                    : "border-neutral-800 bg-black hover:border-neutral-700"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-white text-black text-xs font-medium px-4 py-1 rounded-full">
                      MAIS POPULAR
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500/20 text-green-400 text-xs font-medium px-3 py-1 rounded-full border border-green-500/30">
                      Plano Atual
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="w-12 h-12 border border-neutral-800 rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Plan Info */}
                <div className="mb-6">
                  <h3 className="text-2xl font-medium text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-neutral-500 mb-4">{plan.description}</p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-light text-white">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-neutral-500">{plan.period}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)}
                  disabled={isCurrentPlan || subscribeMutation.isPending}
                  className={`w-full py-6 text-base font-medium rounded-lg mb-8 ${
                    isCurrentPlan
                      ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                      : plan.popular
                      ? "bg-white text-black hover:bg-gray-100"
                      : "bg-neutral-900 text-white border border-neutral-800 hover:bg-neutral-800"
                  }`}
                >
                  {isCurrentPlan ? (
                    "Plano Ativo"
                  ) : (
                    <>
                      {plan.id === "pro" ? "Assinar Pro" : "Começar Grátis"}
                      <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </>
                  )}
                </Button>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                        feature.included 
                          ? "bg-white/10" 
                          : "bg-neutral-900"
                      }`}>
                        {feature.included ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <X className="w-3 h-3 text-neutral-600" />
                        )}
                      </div>
                      <span className={`text-sm ${
                        feature.highlight && feature.included
                          ? "font-medium text-white"
                          : feature.included 
                          ? "text-neutral-400" 
                          : "text-neutral-600 line-through"
                      }`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="border border-neutral-800 rounded-lg p-6 text-center bg-neutral-900">
            <p className="font-medium text-white mb-1">Pagamento Seguro</p>
            <p className="text-sm text-neutral-500">
              Processamento 100% seguro
            </p>
          </div>

          <div className="border border-neutral-800 rounded-lg p-6 text-center bg-neutral-900">
            <p className="font-medium text-white mb-1">PIX Instantâneo</p>
            <p className="text-sm text-neutral-500">
              Aprovação imediata
            </p>
          </div>

          <div className="border border-neutral-800 rounded-lg p-6 text-center bg-neutral-900">
            <p className="font-medium text-white mb-1">Cancele Quando Quiser</p>
            <p className="text-sm text-neutral-500">
              Sem taxas ou contratos
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setShowPaymentModal(false)}
          onComplete={handlePaymentComplete}
        />
      )}

      {/* Cakto Checkout Modal */}
      {showCaktoCheckout && (
        <CaktoCheckoutModal
          checkoutUrl="https://pay.cakto.com.br/8nuuzas_661861"
          onClose={() => setShowCaktoCheckout(false)}
        />
      )}
    </div>
  );
}
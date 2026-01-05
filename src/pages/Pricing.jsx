import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Zap, Crown, Star, ArrowRight, Shield, Clock, Users, Scale } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import PaymentModal from "@/components/subscription/PaymentModal";
import CaktoCheckoutModal from "@/components/subscription/CaktoCheckoutModal";
import AffiliateTracker from "@/components/subscription/AffiliateTracker";

const plans = [
  {
    id: "free",
    name: "Gratuito",
    icon: Star,
    price: 0,
    period: "/sempre",
    description: "Ideal para conhecer a plataforma",
    popular: false,
    features: [
      { text: "5 ações de IA por dia", included: true, highlight: true },
      { text: "Até 3 clientes", included: true },
      { text: "Até 3 processos", included: true },
      { text: "Até 3 documentos", included: true },
      { text: "Modo Assistente Geral", included: true },
      { text: "Suporte por email", included: true },
      { text: "Equipes e Workspace", included: false },
      { text: "Jurisprudência", included: false },
      { text: "Templates", included: false },
      { text: "Análise LEXIA", included: false },
    ],
    limits: {
      daily_actions_limit: 5,
      daily_actions_used: 0
    }
  },
  {
    id: "pro_monthly",
    name: "Profissional Mensal",
    icon: Zap,
    price: 119.90,
    period: "/mês",
    billingType: "monthly",
    description: "Tudo ilimitado com renovação mensal",
    popular: false,
    features: [
      { text: "IA ILIMITADA - sem restrições", included: true, highlight: true },
      { text: "Clientes ILIMITADOS", included: true, highlight: true },
      { text: "Processos ILIMITADOS", included: true, highlight: true },
      { text: "Documentos ILIMITADOS", included: true, highlight: true },
      { text: "Todos os modos de IA", included: true },
      { text: "Equipes e Workspace", included: true },
      { text: "Jurisprudência completa", included: true },
      { text: "Templates ilimitados", included: true },
      { text: "Calendário inteligente", included: true },
      { text: "Análise de documentos LEXIA", included: true },
      { text: "Gerador de imagens IA", included: true },
      { text: "Suporte prioritário 24/7", included: true },
    ],
    limits: {
      daily_actions_limit: 999999,
      daily_actions_used: 0
    }
  },
  {
    id: "pro_yearly",
    name: "Profissional Anual",
    icon: Crown,
    price: 99.90,
    originalPrice: 119.90,
    period: "/mês",
    billingType: "yearly",
    annualTotal: 1198.80,
    description: "Melhor valor - pague anualmente e economize",
    popular: true,
    discount: 9,
    features: [
      { text: "IA ILIMITADA - sem restrições", included: true, highlight: true },
      { text: "Clientes ILIMITADOS", included: true, highlight: true },
      { text: "Processos ILIMITADOS", included: true, highlight: true },
      { text: "Documentos ILIMITADOS", included: true, highlight: true },
      { text: "Todos os modos de IA", included: true },
      { text: "Equipes e Workspace", included: true },
      { text: "Jurisprudência completa", included: true },
      { text: "Templates ilimitados", included: true },
      { text: "Calendário inteligente", included: true },
      { text: "Análise de documentos LEXIA", included: true },
      { text: "Gerador de imagens IA", included: true },
      { text: "Suporte prioritário 24/7", included: true },
    ],
    limits: {
      daily_actions_limit: 999999,
      daily_actions_used: 0
    },
    savingsText: "Economize R$ 240/ano - 2 meses grátis!"
  }
];

const testimonials = [
  { name: "Dr. Ricardo M.", role: "Advogado Criminalista", text: "Economizo 3 horas por dia com o Juris. A IA é impressionante." },
  { name: "Dra. Carla S.", role: "Advogada Trabalhista", text: "A melhor ferramenta que já usei. Indico para todos os colegas." },
  { name: "Dr. Fernando L.", role: "Advogado Empresarial", text: "O ROI foi imediato. Paga-se sozinho no primeiro mês." },
];

export default function Pricing({ theme = 'light' }) {
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
      alert('Plano ativado com sucesso!');
      navigate(createPageUrl('AIAssistant'));
    }
  });

  const handleSelectPlan = async (planId) => {
    const isAuthenticated = await base44.auth.isAuthenticated();
    
    if (!isAuthenticated) {
      base44.auth.redirectToLogin(createPageUrl("Pricing"));
      return;
    }

    if (planId === "free") {
      subscribeMutation.mutate(planId);
      return;
    }

    // Plano mensal usa Mercado Pago checkout
    if (planId === "pro_monthly") {
      try {
        const response = await base44.functions.invoke('createMercadoPagoCheckout', { 
          planId,
          paymentMethod: 'all' // aceita cartão e PIX
        });
        
        if (response.data.success && response.data.checkout_url) {
          window.location.href = response.data.checkout_url;
        } else {
          alert('Erro ao criar checkout. Tente novamente.');
        }
      } catch (error) {
        alert('Erro ao processar checkout: ' + error.message);
      }
      return;
    }

    // Plano anual usa Cakto
    if (planId === "pro_yearly") {
      const plan = plans.find(p => p.id === planId);
      setSelectedPlan(plan);
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
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      <AffiliateTracker />
      
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-16">
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-16"
        >
          <p className="text-gray-500 uppercase tracking-widest text-xs mb-4">Planos e Preços</p>
          
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-light mb-4 sm:mb-6 text-gray-900 leading-tight px-2">
            Transforme sua Advocacia<br className="hidden sm:block" />
            <span className="font-semibold">com Inteligência Artificial</span>
          </h1>

          <div className="w-16 h-0.5 bg-gray-900 mx-auto mb-6" />
          
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            Junte-se a <span className="font-semibold text-gray-900">+500 advogados</span> que já economizam 
            <span className="font-semibold text-gray-900"> 2 dias de trabalho por semana</span> com o Juris
          </p>

          {/* Social Proof Stats */}
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-semibold text-gray-900">500+</div>
              <div className="text-xs sm:text-sm text-gray-500">Advogados Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-semibold text-gray-900">10.000+</div>
              <div className="text-xs sm:text-sm text-gray-500">Documentos Gerados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-semibold text-gray-900">4.9/5</div>
              <div className="text-xs sm:text-sm text-gray-500">Avaliação Média</div>
            </div>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto mb-12 sm:mb-20">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;
            const isPro = plan.id === "pro";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-none ${
                  isPro 
                    ? "bg-gray-900 text-white border-2 border-gray-900" 
                    : "bg-white border border-gray-200"
                }`}
              >
                {/* Discount Badge */}
                {plan.discount && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gray-700 text-white text-xs font-medium px-4 py-2">
                      -{plan.discount}% OFF
                    </div>
                  </div>
                )}

                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-white text-gray-900 text-xs font-medium px-3 py-1 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      RECOMENDADO
                    </span>
                  </div>
                )}

                <div className="p-5 sm:p-8">
                  {/* Plan Header */}
                  <div className="mb-4 sm:mb-6 mt-2 sm:mt-4">
                    <div className={`w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center mb-3 sm:mb-4 ${
                      isPro ? "bg-white" : "bg-gray-100"
                    }`}>
                      <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${isPro ? "text-gray-900" : "text-gray-700"}`} />
                    </div>
                    
                    <h3 className={`text-xl sm:text-2xl font-semibold mb-1 sm:mb-2 ${isPro ? "text-white" : "text-gray-900"}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm sm:text-base ${isPro ? "text-gray-400" : "text-gray-600"}`}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 sm:mb-8">
                   <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                     {plan.originalPrice && (
                       <span className={`text-sm sm:text-lg line-through ${isPro ? "text-gray-500" : "text-gray-400"}`}>
                         R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                       </span>
                     )}
                     <span className={`text-3xl sm:text-5xl font-semibold ${isPro ? "text-white" : "text-gray-900"}`}>
                       R$ {plan.price.toFixed(2).replace('.', ',')}
                     </span>
                     <span className={`text-sm sm:text-base ${isPro ? "text-gray-400" : "text-gray-500"}`}>
                       {plan.period}
                     </span>
                   </div>
                   {plan.savingsText && (
                     <p className={`text-xs sm:text-sm mt-2 font-semibold ${isPro ? "text-green-400" : "text-green-600"}`}>
                       {plan.savingsText}
                     </p>
                   )}
                   {plan.annualTotal && (
                     <p className="text-xs sm:text-sm text-gray-400 mt-1">
                       R$ {plan.annualTotal.toFixed(2).replace('.', ',')} cobrado anualmente
                     </p>
                   )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan || subscribeMutation.isPending}
                    className={`w-full py-4 sm:py-5 text-sm sm:text-base font-medium mb-6 sm:mb-8 transition-all flex items-center justify-center gap-2 rounded-none border-0 ${
                      isCurrentPlan
                        ? isPro ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : isPro
                        ? "bg-white text-gray-900 hover:bg-gray-100"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    {isCurrentPlan ? (
                      <>
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        Plano Atual
                      </>
                    ) : (
                     <>
                       {plan.id === "free" ? "Começar Grátis" : "Assinar Agora"}
                       <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                     </>
                    )}
                  </button>

                  {/* Features List */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <p className={`text-xs sm:text-sm font-medium uppercase tracking-wider mb-3 sm:mb-4 ${
                      isPro ? "text-gray-400" : "text-gray-500"
                    }`}>
                      {isPro ? "Tudo incluso:" : "Inclui:"}
                    </p>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 sm:gap-3">
                        <div className={`shrink-0 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center mt-0.5 ${
                          feature.included 
                            ? isPro ? "bg-white/10" : "bg-gray-100"
                            : isPro ? "bg-gray-800" : "bg-gray-50"
                        }`}>
                          {feature.included ? (
                            <Check className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isPro ? "text-white" : "text-gray-700"}`} />
                          ) : (
                            <X className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isPro ? "text-gray-600" : "text-gray-400"}`} />
                          )}
                        </div>
                        <span className={`text-xs sm:text-sm ${
                          feature.highlight && feature.included
                            ? "font-bold"
                            : feature.included 
                            ? "font-medium" 
                            : "line-through opacity-50"
                        } ${isPro ? (feature.included ? "text-white" : "text-gray-500") : (feature.included ? "text-gray-700" : "text-gray-400")}`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Testimonials */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12 sm:mb-20"
        >
          <h2 className="text-xl sm:text-2xl font-light text-center mb-2">
            O que dizem nossos usuários
          </h2>
          <div className="w-12 h-0.5 bg-gray-900 mx-auto mb-10" />
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="border border-gray-200 p-4 sm:p-6 rounded-none">
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-gray-900 text-gray-900" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">{t.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mb-10 sm:mb-16"
        >
          <div className="border border-gray-200 p-4 sm:p-5 text-center rounded-none">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 mx-auto mb-2 sm:mb-3" />
            <p className="font-medium text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1">100% Seguro</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Dados criptografados</p>
          </div>

          <div className="border border-gray-200 p-4 sm:p-5 text-center rounded-none">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 mx-auto mb-2 sm:mb-3" />
            <p className="font-medium text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1">PIX Instantâneo</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Aprovação imediata</p>
          </div>

          <div className="border border-gray-200 p-4 sm:p-5 text-center rounded-none">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 mx-auto mb-2 sm:mb-3" />
            <p className="font-medium text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1">7 Dias Grátis</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Teste sem compromisso</p>
          </div>

          <div className="border border-gray-200 p-4 sm:p-5 text-center rounded-none">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 mx-auto mb-2 sm:mb-3" />
            <p className="font-medium text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1">Suporte 24/7</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Equipe especializada</p>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center bg-gray-900 text-white p-6 sm:p-10 max-w-3xl mx-auto rounded-none"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light mb-3 sm:mb-4">
            Pronto para Revolucionar sua Prática?
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mb-5 sm:mb-6 px-2">
            Comece hoje e veja a diferença em minutos. Sem cartão de crédito necessário.
          </p>
          <button
            onClick={() => handleSelectPlan("pro_yearly")}
            className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-8 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-medium transition-all flex items-center justify-center gap-2 mx-auto rounded-none border-0"
          >
            Começar com o Plano Anual - Economize R$ 240
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-3 sm:mt-4">
            Cancele a qualquer momento. Sem taxas ocultas.
          </p>
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

      {/* Cakto Checkout Modal */}
      {showCaktoCheckout && selectedPlan && (
        <CaktoCheckoutModal
          checkoutUrl={selectedPlan.id === "pro_yearly" 
            ? "https://pay.cakto.com.br/bk2kqs4_710675" 
            : "https://pay.cakto.com.br/8nuuzas_661861"}
          onClose={() => setShowCaktoCheckout(false)}
        />
      )}
    </div>
  );
}
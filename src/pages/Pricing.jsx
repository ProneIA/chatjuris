import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Sparkles, Zap, Crown, Star, ArrowRight, Shield, Clock, Users, Rocket, Gift, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import PaymentModal from "@/components/subscription/PaymentModal";
import CaktoCheckoutModal from "@/components/subscription/CaktoCheckoutModal";

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
    id: "pro",
    name: "Profissional",
    icon: Zap,
    price: 49.99,
    originalPrice: 99.99,
    period: "/mês",
    description: "Tudo ilimitado para advogados sérios",
    popular: true,
    discount: 50,
    features: [
      { text: "IA ILIMITADA - sem restrições", included: true, highlight: true, bold: true },
      { text: "Clientes ILIMITADOS", included: true, highlight: true, bold: true },
      { text: "Processos ILIMITADOS", included: true, highlight: true, bold: true },
      { text: "Documentos ILIMITADOS", included: true, highlight: true, bold: true },
      { text: "Todos os modos de IA", included: true, bold: true },
      { text: "Equipes e Workspace", included: true, bold: true },
      { text: "Jurisprudência completa", included: true, bold: true },
      { text: "Templates ilimitados", included: true, bold: true },
      { text: "Calendário inteligente", included: true, bold: true },
      { text: "Análise de documentos LEXIA", included: true, bold: true },
      { text: "Gerador de imagens IA", included: true, bold: true },
      { text: "Suporte prioritário 24/7", included: true, bold: true },
    ],
    limits: {
      daily_actions_limit: 999999,
      daily_actions_used: 0
    }
  }
];

const testimonials = [
  { name: "Dr. Ricardo M.", role: "Advogado Criminalista", text: "Economizo 3 horas por dia com o Juris. A IA é impressionante." },
  { name: "Dra. Carla S.", role: "Advogada Trabalhista", text: "A melhor ferramenta que já usei. Indico para todos os colegas." },
  { name: "Dr. Fernando L.", role: "Advogado Empresarial", text: "O ROI foi imediato. Paga-se sozinho no primeiro mês." },
];

export default function Pricing({ theme = 'light' }) {
  const isDark = theme === 'dark';
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

  const handleSelectPlan = async (planId) => {
    // Verifica se o usuário está logado
    const isAuthenticated = await base44.auth.isAuthenticated();
    
    if (!isAuthenticated) {
      // Redireciona para login e volta para Pricing
      base44.auth.redirectToLogin(createPageUrl("Pricing"));
      return;
    }

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
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-16">
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6">
            <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
            <span className="text-xs sm:text-sm text-purple-300">Oferta limitada: 50% OFF no Pro</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent leading-tight px-2">
            Transforme sua Advocacia<br className="hidden sm:block" />
            <span className="sm:hidden"> </span>com Inteligência Artificial
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            Junte-se a <span className="text-white font-semibold">+500 advogados</span> que já economizam 
            <span className="text-green-400 font-semibold"> 15+ horas por semana</span> com o Juris
          </p>

          {/* Social Proof Stats */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-8 sm:mb-12">
            <div className="text-center min-w-[80px]">
              <div className="text-2xl sm:text-3xl font-bold text-white">500+</div>
              <div className="text-xs sm:text-sm text-neutral-500">Advogados Ativos</div>
            </div>
            <div className="text-center min-w-[80px]">
              <div className="text-2xl sm:text-3xl font-bold text-white">10.000+</div>
              <div className="text-xs sm:text-sm text-neutral-500">Documentos Gerados</div>
            </div>
            <div className="text-center min-w-[80px]">
              <div className="text-2xl sm:text-3xl font-bold text-white">4.9/5</div>
              <div className="text-xs sm:text-sm text-neutral-500">Avaliação Média</div>
            </div>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto mb-12 sm:mb-20">
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
                className={`relative rounded-2xl overflow-hidden ${
                  isPro 
                    ? "bg-gradient-to-b from-purple-900/50 to-black border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20" 
                    : "bg-neutral-900/80 border border-neutral-800"
                }`}
              >
                {/* Discount Badge */}
                {plan.discount && (
                  <div className="absolute -top-1 -right-1 z-10">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-bl-xl rounded-tr-xl shadow-lg">
                      -{plan.discount}% OFF
                    </div>
                  </div>
                )}

                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      RECOMENDADO
                    </span>
                  </div>
                )}

                <div className="p-5 sm:p-8">
                  {/* Plan Header */}
                  <div className="mb-4 sm:mb-6 mt-2 sm:mt-4">
                    <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${
                      isPro ? "bg-gradient-to-br from-purple-500 to-blue-500" : "bg-neutral-800"
                    }`}>
                      <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">{plan.name}</h3>
                    <p className="text-sm sm:text-base text-neutral-400">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                      {plan.originalPrice && (
                        <span className="text-sm sm:text-lg text-neutral-500 line-through">
                          R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      <span className={`text-3xl sm:text-5xl font-bold ${isPro ? "text-white" : "text-white"}`}>
                        R$ {plan.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-neutral-500 text-sm sm:text-base">{plan.period}</span>
                    </div>
                    {isPro && (
                      <p className="text-xs sm:text-sm text-green-400 mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        Economia de R$ 600/ano
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan || subscribeMutation.isPending}
                    className={`w-full py-5 sm:py-7 text-base sm:text-lg font-semibold rounded-xl mb-6 sm:mb-8 transition-all transform active:scale-95 hover:scale-[1.02] ${
                      isCurrentPlan
                        ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                        : isPro
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/30"
                        : "bg-white text-black hover:bg-gray-100"
                    }`}
                  >
                    {isCurrentPlan ? (
                      <span className="flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        Plano Atual
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {isPro ? "Começar Agora" : "Começar Grátis"}
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </span>
                    )}
                  </Button>

                  {/* Features List */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <p className="text-xs sm:text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3 sm:mb-4">
                      {isPro ? "Tudo incluso:" : "Inclui:"}
                    </p>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 sm:gap-3">
                        <div className={`shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          feature.included 
                            ? isPro ? "bg-purple-500/20" : "bg-green-500/20"
                            : "bg-neutral-800"
                        }`}>
                          {feature.included ? (
                            <Check className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isPro ? "text-purple-400" : "text-green-400"}`} />
                          ) : (
                            <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-600" />
                          )}
                        </div>
                        <span className={`text-xs sm:text-sm ${
                          feature.highlight && feature.included
                            ? "font-semibold text-white"
                            : feature.included 
                            ? feature.bold ? "text-white font-semibold" : "text-neutral-300"
                            : "text-neutral-600 line-through"
                        }`}>
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
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-10">
            O que dizem nossos usuários
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 sm:p-6">
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-neutral-300 mb-3 sm:mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-white text-sm sm:text-base">{t.name}</p>
                  <p className="text-xs sm:text-sm text-neutral-500">{t.role}</p>
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
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 sm:p-5 text-center">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mx-auto mb-2 sm:mb-3" />
            <p className="font-semibold text-white text-sm sm:text-base mb-0.5 sm:mb-1">100% Seguro</p>
            <p className="text-[10px] sm:text-xs text-neutral-500">Dados criptografados</p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 sm:p-5 text-center">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mx-auto mb-2 sm:mb-3" />
            <p className="font-semibold text-white text-sm sm:text-base mb-0.5 sm:mb-1">PIX Instantâneo</p>
            <p className="text-[10px] sm:text-xs text-neutral-500">Aprovação imediata</p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 sm:p-5 text-center">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-2 sm:mb-3" />
            <p className="font-semibold text-white text-sm sm:text-base mb-0.5 sm:mb-1">7 Dias Grátis</p>
            <p className="text-[10px] sm:text-xs text-neutral-500">Teste sem compromisso</p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 sm:p-5 text-center">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-2 sm:mb-3" />
            <p className="font-semibold text-white text-sm sm:text-base mb-0.5 sm:mb-1">Suporte 24/7</p>
            <p className="text-[10px] sm:text-xs text-neutral-500">Equipe especializada</p>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-2xl p-6 sm:p-10 max-w-3xl mx-auto"
        >
          <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 px-2">
            Pronto para Revolucionar sua Prática?
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 mb-5 sm:mb-6 px-2">
            Comece hoje e veja a diferença em minutos. Sem cartão de crédito necessário.
          </p>
          <Button
            onClick={() => handleSelectPlan("pro")}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/30 transform active:scale-95 hover:scale-105 transition-all"
          >
            Começar com o Pro - 50% OFF
          </Button>
          <p className="text-[10px] sm:text-xs text-neutral-500 mt-3 sm:mt-4">
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
      {showCaktoCheckout && (
        <CaktoCheckoutModal
          checkoutUrl="https://pay.cakto.com.br/8nuuzas_661861"
          onClose={() => setShowCaktoCheckout(false)}
        />
      )}
    </div>
  );
}
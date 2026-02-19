import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Zap, Crown, Star, ArrowRight, Shield, Clock, Users, Sparkles, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import AffiliateTracker from "@/components/subscription/AffiliateTracker";
import CheckoutModal from "@/components/checkout/CheckoutModal";

const plans = [
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
      { text: "Modelos de Peças ilimitados", included: true },
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
    popular: false,
    discount: 17,
    features: [
      { text: "IA ILIMITADA - sem restrições", included: true, highlight: true },
      { text: "Clientes ILIMITADOS", included: true, highlight: true },
      { text: "Processos ILIMITADOS", included: true, highlight: true },
      { text: "Documentos ILIMITADOS", included: true, highlight: true },
      { text: "Todos os modos de IA", included: true },
      { text: "Equipes e Workspace", included: true },
      { text: "Jurisprudência completa", included: true },
      { text: "Modelos de Peças ilimitados", included: true },
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
  },
];

const testimonials = [
  { name: "Dr. Ricardo M.", role: "Advogado Criminalista", text: "Economizo 3 horas por dia com o Juris. A IA é impressionante." },
  { name: "Dra. Carla S.", role: "Advogada Trabalhista", text: "A melhor ferramenta que já usei. Indico para todos os colegas." },
];

export default function Pricing({ theme = 'light' }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState(null);
  const [checkoutModal, setCheckoutModal] = useState({ open: false, plan: null });
  const [trialDaysLeft, setTrialDaysLeft] = React.useState(0);

  React.useEffect(() => {
    base44.auth.me()
      .then(async (u) => {
        setUser(u);
        
        // Calcular dias restantes do trial
        if (u?.trial_status === 'active' && u?.trial_end_date) {
          const today = new Date();
          const endDate = new Date(u.trial_end_date);
          const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          setTrialDaysLeft(daysLeft > 0 ? daysLeft : 0);
        }
      })
      .catch(() => {});
  }, []);

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0] || null;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000
  });



  const handleSelectPlan = async (planId) => {
    const isAuthenticated = await base44.auth.isAuthenticated();
    
    if (!isAuthenticated) {
      // Guardar plano selecionado no localStorage para usar após login
      localStorage.setItem('selected_plan', planId);
      base44.auth.redirectToLogin(createPageUrl("Pricing"));
      return;
    }

    // Redirecionar para links de assinatura Mercado Pago (preapproval)
    const mpLinks = {
      pro_monthly: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=36824280f92847a4a060dbe2b3745836&payer_email=",
      pro_yearly: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=38b87d14e172478fb9c94f3dc6984b61&payer_email="
    };

    if (mpLinks[planId]) {
      const url = mpLinks[planId] + encodeURIComponent(user.email);
      window.open(url, '_blank');
    }
  };

  // Verificar se há um plano selecionado após login
  React.useEffect(() => {
    const selectedPlan = localStorage.getItem('selected_plan');
    if (selectedPlan && user) {
      localStorage.removeItem('selected_plan');
      // Abrir checkout automaticamente com o plano selecionado
      if (selectedPlan === "pro_lifetime") {
        const lifetimePlan = plans.find(p => p.id === "pro_lifetime");
        if (lifetimePlan?.lifetimeUrl) {
          window.open(lifetimePlan.lifetimeUrl, '_blank');
        }
      } else {
        setCheckoutModal({ open: true, plan: selectedPlan });
      }
    }
  }, [user]);

  // Removido: lógica antiga que causava bug (marcava todos como assinados)

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      <AffiliateTracker />
      
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-16">
        {/* Back Button - only show if user is logged in */}
        {user && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link 
              to={createPageUrl("Dashboard")} 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Voltar ao Painel
            </Link>
          </motion.div>
        )}
      
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-16"
        >
          {user && user.trial_status === 'active' && trialDaysLeft > 0 ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-800 font-semibold mb-4">
                <Sparkles className="w-5 h-5" />
                <span>Período de Teste: {trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'} restantes</span>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-light mb-4 sm:mb-6 text-gray-900 leading-tight px-2">
                Aproveite seu Teste Grátis<br className="hidden sm:block" />
                <span className="font-semibold">Continue com Acesso Completo</span>
              </h1>
            </>
          ) : user && user.trial_status === 'expired' ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-800 font-semibold mb-4">
                <AlertTriangle className="w-5 h-5" />
                <span>Período de Teste Expirado</span>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-light mb-4 sm:mb-6 text-gray-900 leading-tight px-2">
                Assine para Continuar<br className="hidden sm:block" />
                <span className="font-semibold">Seu teste de 7 dias terminou</span>
              </h1>
            </>
          ) : (
            <>
              <p className="text-gray-500 uppercase tracking-widest text-xs mb-4">Planos e Preços</p>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-light mb-4 sm:mb-6 text-gray-900 leading-tight px-2">
                Transforme sua Advocacia<br className="hidden sm:block" />
                <span className="font-semibold">com Inteligência Artificial</span>
              </h1>
            </>
          )}

          <div className="w-16 h-0.5 bg-gray-900 mx-auto mb-6" />
          
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            Junte-se a <span className="font-semibold text-gray-900">+80 advogados</span> que já economizam 
            <span className="font-semibold text-gray-900"> 2 dias de trabalho por semana</span> com o Juris
          </p>

          {/* Social Proof Stats */}
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-semibold text-gray-900">80+</div>
              <div className="text-xs sm:text-sm text-gray-500">Advogados Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-semibold text-gray-900">1.200+</div>
              <div className="text-xs sm:text-sm text-gray-500">Documentos Gerados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-semibold text-gray-900">4.9/5</div>
              <div className="text-xs sm:text-sm text-gray-500">Avaliação Média</div>
            </div>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto mb-12 sm:mb-20">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            
            // LÓGICA CORRETA: Verificar plano ativo do usuário
            const isCurrentPlan = (() => {
              if (!subscription) return false;
              
              const today = new Date().toISOString().split('T')[0];
              const isExpired = subscription.end_date && today > subscription.end_date;
              const isActive = subscription.status === 'active' || subscription.status === 'trial';
              
              // Se expirado ou não ativo, nenhum plano é "atual"
              if (isExpired || !isActive) return false;
              
              // Mapear plan_type da subscription para o plan.id
              const planTypeToId = {
                'monthly': 'pro_monthly',
                'annual': 'pro_yearly',
                'lifetime': 'pro_lifetime'
              };
              
              // Se está em trial, nenhum plano pago é marcado como atual
              if (subscription.status === 'trial') return false;
              
              // Verificar se este plano específico é o ativo
              return planTypeToId[subscription.plan_type] === plan.id;
            })();
            
            const isPro = plan.id.startsWith('pro_');

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-none ${
                  plan.popular
                    ? "bg-gray-900 text-white border-2 border-gray-900" 
                    : "bg-white border border-gray-200"
                }`}
              >
                {/* Discount Badge */}
                {plan.discount && (
                  <div className="absolute top-0 right-0">
                    <div className={`${plan.popular ? 'bg-red-600' : 'bg-gray-700'} text-white text-xs font-bold px-4 py-2 animate-pulse`}>
                      🔥 {plan.discount}% OFF
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
                      plan.popular ? "bg-white" : "bg-gray-100"
                    }`}>
                      <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${plan.popular ? "text-gray-900" : "text-gray-700"}`} />
                    </div>
                    
                    <h3 className={`text-xl sm:text-2xl font-semibold mb-1 sm:mb-2 ${plan.popular ? "text-white" : "text-gray-900"}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm sm:text-base ${plan.popular ? "text-gray-400" : "text-gray-600"}`}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 sm:mb-8">
                   <div className="flex flex-col gap-2">
                     {plan.originalPrice && (
                       <div className="flex items-center gap-2">
                         <span className={`text-lg sm:text-2xl line-through ${plan.popular ? "text-red-400" : "text-gray-400"} font-medium`}>
                           De R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                         </span>
                         {plan.isLifetime && (
                           <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 animate-pulse">
                             -50%
                           </span>
                         )}
                       </div>
                     )}
                     <div className="flex items-baseline gap-2 flex-wrap">
                       <span className={`text-4xl sm:text-6xl font-bold ${plan.popular ? "text-white" : "text-gray-900"}`}>
                         R$ {plan.price.toFixed(2).replace('.', ',')}
                       </span>
                       <span className={`text-sm sm:text-base ${plan.popular ? "text-gray-400" : "text-gray-500"}`}>
                         {plan.period}
                       </span>
                     </div>
                   </div>
                   {plan.savingsText && (
                     <p className={`text-xs sm:text-sm mt-2 font-semibold ${plan.popular ? "text-green-400" : "text-green-600"}`}>
                       {plan.savingsText}
                     </p>
                   )}
                   {plan.annualTotal && (
                     <p className="text-xs sm:text-sm text-gray-400 mt-1">
                       R$ {plan.annualTotal.toFixed(2).replace('.', ',')} cobrado anualmente
                     </p>
                   )}
                   {plan.installments && (
                     <p className={`text-xs sm:text-sm mt-1 ${plan.popular ? "text-gray-400" : "text-gray-500"}`}>
                       {plan.installments}
                     </p>
                   )}
                  </div>

                  {/* CTA Button */}
                  <button
                   onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)}
                   disabled={isCurrentPlan}
                   className={`w-full py-4 sm:py-5 text-sm sm:text-base font-medium mb-6 sm:mb-8 transition-all flex items-center justify-center gap-2 rounded-none border-0 ${
                     isCurrentPlan
                       ? plan.popular ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                       : plan.popular
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
                       Assinar Agora
                       <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                     </>
                    )}
                  </button>

                  {/* Features List */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <p className={`text-xs sm:text-sm font-medium uppercase tracking-wider mb-3 sm:mb-4 ${
                      plan.popular ? "text-gray-400" : "text-gray-500"
                    }`}>
                      {isPro ? "Tudo incluso:" : "Inclui:"}
                    </p>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 sm:gap-3">
                        <div className={`shrink-0 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center mt-0.5 ${
                          feature.included 
                            ? plan.popular ? "bg-white/10" : "bg-gray-100"
                            : plan.popular ? "bg-gray-800" : "bg-gray-50"
                        }`}>
                          {feature.included ? (
                            <Check className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${plan.popular ? "text-white" : "text-gray-700"}`} />
                          ) : (
                            <X className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${plan.popular ? "text-gray-600" : "text-gray-400"}`} />
                          )}
                        </div>
                        <span className={`text-xs sm:text-sm ${
                          feature.highlight && feature.included
                            ? "font-bold"
                            : feature.included 
                            ? "font-medium" 
                            : "line-through opacity-50"
                        } ${plan.popular ? (feature.included ? "text-white" : "text-gray-500") : (feature.included ? "text-gray-700" : "text-gray-400")}`}>
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
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className="border border-gray-200 p-4 sm:p-6 rounded-none w-full sm:w-auto sm:max-w-md">
                <div className="flex gap-1 mb-3 sm:mb-4 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-gray-900 text-gray-900" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 italic text-center">"{t.text}"</p>
                <div className="text-center">
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
            <p className="font-medium text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1">Pagamento Seguro</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Mercado Pago</p>
          </div>

          <div className="border border-gray-200 p-4 sm:p-5 text-center rounded-none">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 mx-auto mb-2 sm:mb-3" />
            <p className="font-medium text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1">Cancele Quando Quiser</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Sem compromisso</p>
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
            Comece hoje e veja a diferença em minutos.
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

      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutModal.open}
        onClose={() => setCheckoutModal({ open: false, plan: null })}
        plan={checkoutModal.plan}
        userEmail={user?.email}
      />
    </div>
  );
}
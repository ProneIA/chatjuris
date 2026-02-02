import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Zap, Crown, Star, ArrowRight, Shield, Clock, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import AffiliateTracker from "@/components/subscription/AffiliateTracker";
import CheckoutModal from "@/components/checkout/CheckoutModal";

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
      { text: "Modelos de Peças", included: false },
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
    popular: true,
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
  const [checkoutStep, setCheckoutStep] = useState(0); // 0 = plans, 1 = checkout step 1, 2 = checkout step 2
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: ""
  });

  React.useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setFormData(prev => ({ ...prev, email: u?.email || "", name: u?.full_name || "" }));
    }).catch(() => {});
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
          plan: planId === 'free' ? 'free' : 'pro',
          status: "active",
          ...planData.limits,
          price: planData.price,
          start_date: new Date().toISOString().split('T')[0],
          last_reset_date: new Date().toISOString().split('T')[0]
        });
      } else {
        return base44.entities.Subscription.create({
          user_id: user.id,
          plan: planId === 'free' ? 'free' : 'pro',
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

    // Planos pagos - ir para checkout integrado
    setSelectedPlan(planId);
    setCheckoutStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckoutContinue = () => {
    if (checkoutStep === 1) {
      setCheckoutStep(2);
    } else if (checkoutStep === 2) {
      const hotmartUrls = {
        'pro_monthly': 'https://pay.hotmart.com/Q104225643H',
        'pro_yearly': 'https://pay.hotmart.com/T104226080W'
      };
      
      const checkoutUrl = new URL(hotmartUrls[selectedPlan]);
      if (formData.email) checkoutUrl.searchParams.set('email', formData.email);
      if (formData.name) checkoutUrl.searchParams.set('name', formData.name);
      window.location.href = checkoutUrl.toString();
    }
  };

  const handleBackToPlans = () => {
    setCheckoutStep(0);
    setSelectedPlan(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const currentPlan = subscription?.plan || 'free';
  
  const selectedPlanDetails = selectedPlan ? plans.find(p => p.id === selectedPlan) : null;
  const isStep1Valid = formData.name && formData.email;
  const isStep2Valid = formData.cpf && formData.phone;

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      <AffiliateTracker />
      
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-16">
        {/* Back Button */}
        {user && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            {checkoutStep > 0 ? (
              <button
                onClick={handleBackToPlans}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Voltar aos Planos
              </button>
            ) : (
              <Link 
                to={createPageUrl("Dashboard")} 
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Voltar ao Painel
              </Link>
            )}
          </motion.div>
        )}
        
        {/* Checkout Integrado */}
        {checkoutStep > 0 && selectedPlanDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-16"
          >
            {checkoutStep === 1 ? (
              <div className="bg-white border border-gray-200 p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Complete sua assinatura
                </h2>
                <p className="text-gray-600 mb-8">
                  Você está a poucos passos de ter acesso completo à plataforma
                </p>

                {/* Plan Summary */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 mb-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-purple-600" />
                        <h3 className="text-xl font-semibold text-gray-900">{selectedPlanDetails.name}</h3>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">
                          R$ {selectedPlanDetails.price.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-gray-600">{selectedPlanDetails.period}</span>
                      </div>
                      {selectedPlanDetails.annualTotal && (
                        <p className="text-sm text-purple-700 font-medium mt-1">
                          R$ {selectedPlanDetails.annualTotal.toFixed(2).replace('.', ',')} cobrado anualmente
                        </p>
                      )}
                      {selectedPlanDetails.savingsText && (
                        <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          {selectedPlanDetails.savingsText}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-purple-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">Incluído no plano:</p>
                    <div className="grid gap-2">
                      {selectedPlanDetails.features.filter(f => f.included).slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600 shrink-0" />
                          <span>{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-5 mb-8">
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Nome completo *</label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Seu nome completo"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-900 font-medium mb-2">E-mail *</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <button
                  onClick={handleCheckoutContinue}
                  disabled={!isStep1Valid}
                  className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-xs text-center text-gray-500 mt-4">
                  Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Finalize sua assinatura
                </h2>
                <p className="text-gray-600 mb-8">
                  Mais alguns dados para garantir a segurança da sua compra
                </p>

                {/* Form Step 2 */}
                <div className="space-y-5 mb-8">
                  <div>
                    <label className="block text-gray-900 font-medium mb-2">CPF *</label>
                    <input
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-900 font-medium mb-2">Telefone/WhatsApp *</label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Security badges */}
                <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 mb-8">
                  <div className="flex items-start gap-3 mb-4">
                    <Shield className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Pagamento 100% seguro</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Processado pela Hotmart, a maior plataforma de produtos digitais da América Latina
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 mb-4">
                    <Shield className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Dados criptografados</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Certificado SSL e conformidade com LGPD
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Múltiplas formas de pagamento</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Cartão de crédito, PIX, boleto e mais
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setCheckoutStep(1)}
                    className="flex-1 h-14 border-2 border-gray-300 text-gray-900 hover:bg-gray-50 font-semibold text-lg rounded-lg transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleCheckoutContinue}
                    disabled={!isStep2Valid}
                    className="flex-1 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    Ir para pagamento
                    <Shield className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-center text-gray-500 mt-4">
                  Você será redirecionado para o ambiente seguro de pagamento
                </p>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Hero Header - Hide when in checkout */}
        {checkoutStep === 0 && (
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
        )}

        {/* Plans Grid - Hide when in checkout */}
        {checkoutStep === 0 && (
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto mb-12 sm:mb-20">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id || (currentPlan === 'pro' && plan.id.startsWith('pro_'));
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
                   <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                     {plan.originalPrice && (
                       <span className={`text-sm sm:text-lg line-through ${plan.popular ? "text-gray-500" : "text-gray-400"}`}>
                         R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                       </span>
                     )}
                     <span className={`text-3xl sm:text-5xl font-semibold ${plan.popular ? "text-white" : "text-gray-900"}`}>
                       R$ {plan.price.toFixed(2).replace('.', ',')}
                     </span>
                     <span className={`text-sm sm:text-base ${plan.popular ? "text-gray-400" : "text-gray-500"}`}>
                       {plan.period}
                     </span>
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
                    disabled={isCurrentPlan || subscribeMutation.isPending}
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
                       {plan.id === "free" ? "Começar Grátis" : "Assinar Agora"}
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
        )}

        {/* Testimonials - Hide when in checkout */}
        {checkoutStep === 0 && (
        <>
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
        </>
        )}
      </div>
    </div>
  );
}
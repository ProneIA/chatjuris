import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Crown, Star, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const plans = [
  {
    id: "free",
    name: "Gratuito",
    icon: Star,
    price: 0,
    period: "para sempre",
    description: "Perfeito para começar",
    gradient: "from-slate-500 to-slate-700",
    popular: false,
    features: [
      { text: "5 conversas por mês", included: true },
      { text: "Modo Assistente Geral", included: true },
      { text: "2 buscas de jurisprudência", included: true },
      { text: "Suporte básico", included: true },
      { text: "Todos os modos de IA", included: false },
      { text: "Documentos ilimitados", included: false },
      { text: "Análise de documentos", included: false },
      { text: "Suporte prioritário", included: false }
    ],
    limits: {
      conversations_limit: 5,
      documents_limit: 2,
      jurisprudence_searches_limit: 2
    }
  },
  {
    id: "pro",
    name: "Profissional",
    icon: Zap,
    price: 97,
    period: "/mês",
    description: "Para advogados sérios",
    gradient: "from-blue-500 via-purple-500 to-pink-500",
    popular: true,
    features: [
      { text: "Conversas ilimitadas", included: true },
      { text: "Todos os modos de IA", included: true },
      { text: "50 buscas de jurisprudência", included: true },
      { text: "20 documentos gerados/mês", included: true },
      { text: "Análise de documentos", included: true },
      { text: "Suporte prioritário", included: true },
      { text: "Analytics avançado", included: true },
      { text: "Sem marca d'água", included: true }
    ],
    limits: {
      conversations_limit: 999999,
      documents_limit: 20,
      jurisprudence_searches_limit: 50
    },
    featuresAccess: {
      all_ai_modes: true,
      priority_support: true,
      advanced_analytics: true
    }
  },
  {
    id: "enterprise",
    name: "Escritório",
    icon: Crown,
    price: 297,
    period: "/mês",
    description: "Para equipes grandes",
    gradient: "from-amber-500 to-orange-600",
    popular: false,
    features: [
      { text: "Tudo do Pro +", included: true },
      { text: "Usuários ilimitados", included: true },
      { text: "Jurisprudência ilimitada", included: true },
      { text: "Documentos ilimitados", included: true },
      { text: "Colaboração em equipe", included: true },
      { text: "API dedicada", included: true },
      { text: "Treinamento personalizado", included: true },
      { text: "Gerente de conta dedicado", included: true }
    ],
    limits: {
      conversations_limit: 999999,
      documents_limit: 999999,
      jurisprudence_searches_limit: 999999
    },
    featuresAccess: {
      all_ai_modes: true,
      priority_support: true,
      advanced_analytics: true,
      team_collaboration: true,
      api_access: true
    }
  }
];

export default function Pricing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState(null);

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
        // Update existing subscription
        return base44.entities.Subscription.update(subscription.id, {
          plan: planId,
          status: "active",
          ...planData.limits,
          features: planData.featuresAccess || {},
          price: planData.price,
          start_date: new Date().toISOString().split('T')[0],
          billing_cycle: "monthly"
        });
      } else {
        // Create new subscription
        return base44.entities.Subscription.create({
          user_id: user.id,
          plan: planId,
          status: "active",
          conversations_used: 0,
          documents_used: 0,
          jurisprudence_searches_used: 0,
          ...planData.limits,
          features: planData.featuresAccess || {},
          price: planData.price,
          start_date: new Date().toISOString().split('T')[0],
          billing_cycle: "monthly"
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      alert('Plano ativado com sucesso! 🎉');
      navigate(createPageUrl('AIAssistant'));
    }
  });

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
              Planos e Preços
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Escolha o plano ideal para potencializar sua advocacia com IA
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -8 }}
                className={`relative bg-white rounded-3xl p-8 border-2 shadow-xl ${
                  plan.popular 
                    ? "border-purple-500 ring-4 ring-purple-200" 
                    : "border-slate-200"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 text-sm font-bold shadow-lg">
                      ⭐ MAIS POPULAR
                    </Badge>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge className="bg-green-600 text-white px-3 py-1 text-xs font-bold shadow-lg">
                      ✓ Plano Atual
                    </Badge>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Plan Info */}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-slate-600 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900">
                      R$ {plan.price}
                    </span>
                    <span className="text-slate-600 text-lg">{plan.period}</span>
                  </div>
                  {plan.price > 0 && (
                    <p className="text-sm text-slate-500 mt-1">
                      Cancele quando quiser
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => !isCurrentPlan && subscribeMutation.mutate(plan.id)}
                  disabled={isCurrentPlan || subscribeMutation.isPending}
                  className={`w-full py-6 text-lg font-bold rounded-xl mb-8 ${
                    plan.popular
                      ? `bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white shadow-lg`
                      : isCurrentPlan
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {isCurrentPlan ? (
                    "✓ Plano Ativo"
                  ) : (
                    <>
                      {plan.price === 0 ? "Começar Grátis" : "Assinar Agora"}
                      <ArrowRight className="w-5 h-5 ml-2 inline" />
                    </>
                  )}
                </Button>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                        feature.included 
                          ? "bg-green-100" 
                          : "bg-slate-100"
                      }`}>
                        <Check className={`w-3 h-3 ${
                          feature.included 
                            ? "text-green-600" 
                            : "text-slate-400"
                        }`} />
                      </div>
                      <span className={`text-sm ${
                        feature.included 
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

        {/* FAQ/Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl p-8 border-2 border-slate-200 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Perguntas Frequentes
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-slate-900 mb-2">
                💳 Como funciona o pagamento?
              </h3>
              <p className="text-sm text-slate-600">
                Os pagamentos são processados de forma segura. Você pode cancelar sua assinatura a qualquer momento.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">
                🔄 Posso mudar de plano?
              </h3>
              <p className="text-sm text-slate-600">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">
                🎁 Existe período de teste?
              </h3>
              <p className="text-sm text-slate-600">
                O plano gratuito não expira e você pode experimentar antes de assinar.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">
                💼 Precisa de mais?
              </h3>
              <p className="text-sm text-slate-600">
                Entre em contato para planos corporativos personalizados com volumes maiores.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
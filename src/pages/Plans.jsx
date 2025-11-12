import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  Check, 
  X, 
  Sparkles, 
  Crown, 
  Rocket,
  MessageSquare,
  FileText,
  Scale,
  Users,
  Zap,
  Shield,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    id: "free",
    name: "Gratuito",
    icon: Sparkles,
    price: "R$ 0",
    period: "/mês",
    description: "Para advogados iniciantes",
    color: "from-slate-500 to-slate-600",
    features: [
      { text: "10 conversas IA por mês", included: true },
      { text: "5 análises de documentos", included: true },
      { text: "Pesquisa de jurisprudência básica", included: true },
      { text: "Até 5 processos", included: true },
      { text: "Até 3 clientes", included: true },
      { text: "Suporte por email", included: true },
      { text: "Geração de documentos", included: false },
      { text: "Templates ilimitados", included: false },
      { text: "Integração de calendário", included: false },
      { text: "Relatórios avançados", included: false }
    ],
    cta: "Plano Atual",
    popular: false
  },
  {
    id: "pro",
    name: "Profissional",
    icon: Crown,
    price: "R$ 97",
    period: "/mês",
    description: "Para escritórios em crescimento",
    color: "from-blue-500 via-purple-500 to-pink-500",
    features: [
      { text: "500 conversas IA por mês", included: true },
      { text: "Análises de documentos ilimitadas", included: true },
      { text: "Pesquisa avançada de jurisprudência", included: true },
      { text: "Processos ilimitados", included: true },
      { text: "Clientes ilimitados", included: true },
      { text: "Geração de documentos com IA", included: true },
      { text: "Templates personalizados ilimitados", included: true },
      { text: "Integração Google Calendar e Outlook", included: true },
      { text: "Agendamento inteligente com IA", included: true },
      { text: "Suporte prioritário", included: true }
    ],
    cta: "Fazer Upgrade",
    popular: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Rocket,
    price: "Personalizado",
    period: "",
    description: "Para grandes escritórios",
    color: "from-purple-600 to-pink-600",
    features: [
      { text: "IA ilimitada", included: true },
      { text: "Tudo do plano Pro", included: true },
      { text: "Usuários ilimitados", included: true },
      { text: "API dedicada", included: true },
      { text: "Integração com sistemas legados", included: true },
      { text: "Treinamento personalizado da IA", included: true },
      { text: "Gerente de conta dedicado", included: true },
      { text: "SLA garantido", included: true },
      { text: "Backup e segurança avançados", included: true },
      { text: "Suporte 24/7", included: true }
    ],
    cta: "Entrar em Contato",
    popular: false
  }
];

const stats = [
  {
    icon: Users,
    value: "2.500+",
    label: "Advogados",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Scale,
    value: "50.000+",
    label: "Processos",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: FileText,
    value: "100.000+",
    label: "Documentos Gerados",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: TrendingUp,
    value: "98%",
    label: "Satisfação",
    color: "from-orange-500 to-red-500"
  }
];

export default function Plans() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (planId) => {
      await base44.auth.updateMe({ subscription_plan: planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success("Plano atualizado com sucesso!");
    },
  });

  const handleSelectPlan = (planId) => {
    if (planId === "enterprise") {
      toast.info("Entre em contato conosco para planos Enterprise!");
      return;
    }
    
    if (planId === user?.subscription_plan) {
      toast.info("Este já é seu plano atual!");
      return;
    }

    if (planId === "free") {
      toast.info("Você já pode usar o plano gratuito!");
      return;
    }

    updatePlanMutation.mutate(planId);
  };

  const currentPlan = user?.subscription_plan || "free";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Badge className="bg-white/20 text-white border-white/30 mb-6 text-sm px-4 py-1.5">
              <Sparkles className="w-4 h-4 mr-2" />
              Planos e Preços
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              Escolha o Plano Ideal
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Potencialize sua advocacia com IA. Comece grátis e faça upgrade quando precisar.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none shadow-lg px-4 py-1.5">
                      <Crown className="w-3 h-3 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <Card className={`p-8 h-full flex flex-col relative overflow-hidden ${
                  plan.popular 
                    ? "ring-2 ring-purple-500 shadow-2xl scale-105" 
                    : "shadow-lg"
                }`}>
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-5`} />

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                        <p className="text-sm text-slate-600">{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-8">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-slate-900">{plan.price}</span>
                        {plan.period && (
                          <span className="text-slate-600">{plan.period}</span>
                        )}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrentPlan || updatePlanMutation.isPending}
                      className={`w-full mb-8 ${
                        isCurrentPlan
                          ? "bg-slate-200 text-slate-600"
                          : plan.popular
                          ? `bg-gradient-to-r ${plan.color} text-white hover:opacity-90`
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                      size="lg"
                    >
                      {isCurrentPlan ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Plano Atual
                        </>
                      ) : (
                        <>
                          {plan.id === "enterprise" ? (
                            <>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              {plan.cta}
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              {plan.cta}
                            </>
                          )}
                        </>
                      )}
                    </Button>

                    {/* Features */}
                    <div className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          {feature.included ? (
                            <div className="shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                          ) : (
                            <div className="shrink-0 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center mt-0.5">
                              <X className="w-3 h-3 text-slate-400" />
                            </div>
                          )}
                          <span className={`text-sm ${
                            feature.included ? "text-slate-700" : "text-slate-400"
                          }`}>
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-white rounded-2xl p-8 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Garantia de 30 Dias
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Experimente o plano Pro sem riscos. Se não ficar satisfeito, devolvemos 100% do seu dinheiro 
                nos primeiros 30 dias. Sem perguntas, sem complicações.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Star,
  Zap,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

export default function MySubscription({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => {});
  }, []);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['my-subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0] || null;
    },
    enabled: !!user?.id
  });

  // Calcular dias restantes do trial baseado na assinatura
  const trialDaysLeft = React.useMemo(() => {
    if (subscription?.status === 'trial' && subscription?.end_date) {
      const today = new Date();
      const endDate = new Date(subscription.end_date);
      const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 ? daysLeft : 0;
    }
    return 0;
  }, [subscription]);

  // Determinar configuração do plano
  const planConfig = React.useMemo(() => {
    if (!subscription) return null;

    const configs = {
      trial: {
        name: "Teste Gratuito",
        badge: "Teste 7 dias",
        color: "green",
        icon: Sparkles,
        description: "Período de avaliação gratuito",
        bgClass: "bg-green-50 border-green-200",
        textClass: "text-green-800",
        iconBg: "bg-green-100",
        iconColor: "text-green-600"
      },
      monthly: {
        name: "Plano Mensal",
        badge: "Plano Mensal",
        color: "blue",
        icon: Zap,
        description: "Renovação mensal automática",
        bgClass: "bg-blue-50 border-blue-200",
        textClass: "text-blue-800",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        isRecurrent: true
      },
      annual: {
        name: "Plano Anual",
        badge: "Plano Anual",
        color: "purple",
        icon: Crown,
        description: "Renovação anual automática",
        bgClass: "bg-purple-50 border-purple-200",
        textClass: "text-purple-800",
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
        isRecurrent: true
      },
      lifetime: {
        name: "Plano Vitalício",
        badge: "Plano Vitalício",
        color: "amber",
        icon: Star,
        description: "Acesso permanente — sem expiração",
        bgClass: "bg-amber-50 border-amber-200",
        textClass: "text-amber-800",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        isPermanent: true
      }
    };

    const planType = subscription.status === 'trial' ? 'trial' : (subscription.plan_type || 'monthly');
    return configs[planType] || configs.monthly;
  }, [subscription]);

  // Status da assinatura
  const statusConfig = React.useMemo(() => {
    if (!subscription) return null;

    const today = new Date().toISOString().split('T')[0];
    const isExpired = subscription.end_date && today > subscription.end_date;

    if (isExpired) {
      return {
        label: "Expirado",
        icon: AlertCircle,
        color: "text-red-600",
        bgColor: "bg-red-100"
      };
    }

    if (subscription.status === 'trial') {
      return {
        label: `Em Teste (${trialDaysLeft} dias restantes)`,
        icon: Clock,
        color: "text-blue-600",
        bgColor: "bg-blue-100"
      };
    }

    if (subscription.status === 'active') {
      return {
        label: "Ativo",
        icon: CheckCircle2,
        color: "text-green-600",
        bgColor: "bg-green-100"
      };
    }

    return {
      label: subscription.status,
      icon: AlertCircle,
      color: "text-gray-600",
      bgColor: "bg-gray-100"
    };
  }, [subscription, trialDaysLeft]);

  if (isLoading || !user) {
    return (
      <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <CardContent className="p-8">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto">
          <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Minha Assinatura
          </h1>
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <CardContent className="p-8 text-center">
              <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`} />
              <p className={`text-lg mb-4 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                Você não possui uma assinatura ativa
              </p>
              <Button 
                onClick={() => window.location.href = '/Pricing'}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Ver Planos Disponíveis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const Icon = planConfig.icon;
  const StatusIcon = statusConfig.icon;
  const isExpired = subscription.end_date && new Date().toISOString().split('T')[0] > subscription.end_date;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Minha Assinatura
          </h1>

          {/* Card Principal do Plano */}
          <Card className={`mb-6 border-2 ${planConfig.bgClass} ${isDark ? 'bg-neutral-900' : 'bg-white'}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl ${planConfig.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-8 h-8 ${planConfig.iconColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {planConfig.name}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${planConfig.bgClass} ${planConfig.textClass}`}>
                        {planConfig.badge}
                      </span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      {planConfig.description}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                  <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                </div>
                <div>
                  <p className={`text-xs font-medium ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Status
                  </p>
                  <p className={`font-semibold ${statusConfig.color}`}>
                    {statusConfig.label}
                  </p>
                </div>
              </div>

              {/* Informações do Plano */}
              <div className={`grid md:grid-cols-2 gap-6 pt-6 border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                {/* Data de Início */}
                <div className="flex items-start gap-3">
                  <Calendar className={`w-5 h-5 mt-0.5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-xs font-medium ${isDark ? 'text-neutral-500' : 'text-gray-500'} mb-1`}>
                      Data de Início
                    </p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {subscription.start_date ? new Date(subscription.start_date).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Data de Expiração (apenas se não for vitalício) */}
                {!planConfig.isPermanent && (
                  <div className="flex items-start gap-3">
                    <Calendar className={`w-5 h-5 mt-0.5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                    <div>
                      <p className={`text-xs font-medium ${isDark ? 'text-neutral-500' : 'text-gray-500'} mb-1`}>
                        {subscription.status === 'trial' ? 'Teste termina em' : 'Próxima Renovação'}
                      </p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Provedor de Pagamento */}
                <div className="flex items-start gap-3">
                  <CreditCard className={`w-5 h-5 mt-0.5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-xs font-medium ${isDark ? 'text-neutral-500' : 'text-gray-500'} mb-1`}>
                      Provedor de Pagamento
                    </p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {subscription.payment_method === 'hotmart' ? 'Hotmart' : subscription.payment_method || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Tipo de Cobrança */}
                <div className="flex items-start gap-3">
                  <Clock className={`w-5 h-5 mt-0.5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-xs font-medium ${isDark ? 'text-neutral-500' : 'text-gray-500'} mb-1`}>
                      Tipo de Cobrança
                    </p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {planConfig.isPermanent ? 'Pagamento Único' : planConfig.isRecurrent ? 'Recorrente' : 'Teste Gratuito'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Aviso de Renovação Automática (apenas para planos recorrentes) */}
              {planConfig.isRecurrent && !isExpired && (
                <div className={`p-4 rounded-lg border-2 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        ⚠️ Plano recorrente
                      </p>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        Sua assinatura será renovada automaticamente conforme o período contratado.
                        {subscription.next_billing_date && (
                          <> Próxima cobrança em <strong>{new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')}</strong>.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Destaque para Plano Vitalício */}
              {planConfig.isPermanent && (
                <div className={`p-4 rounded-lg border-2 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        ✨ Acesso Permanente
                      </p>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        Você possui acesso vitalício ao ChatJuris. Sem renovações, sem cobranças futuras. 
                        Use para sempre! 🎉
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso de Expiração */}
              {isExpired && (
                <div className={`p-4 rounded-lg border-2 ${isDark ? 'bg-neutral-800 border-red-700' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Assinatura Expirada
                      </p>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        Sua assinatura expirou. Renove agora para continuar usando todas as funcionalidades do ChatJuris.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className={`pt-6 border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                {subscription.status === 'trial' && (
                  <Button 
                    onClick={() => window.location.href = '/Pricing'}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    Assinar um Plano
                  </Button>
                )}

                {planConfig.isRecurrent && !isExpired && (
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open('https://app-vlc.hotmart.com/login', '_blank')}
                  >
                    Gerenciar Assinatura na Hotmart
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {isExpired && (
                  <Button 
                    onClick={() => window.location.href = '/Pricing'}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    Renovar Assinatura
                  </Button>
                )}

                {planConfig.isPermanent && (
                  <div className={`text-center py-4 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                    <CheckCircle2 className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-neutral-600' : 'text-green-500'}`} />
                    <p className="text-sm">
                      Você está com acesso vitalício. Aproveite! 🎉
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
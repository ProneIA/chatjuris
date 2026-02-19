import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    id: "monthly",
    planType: "monthly",
    name: "Mensal",
    icon: Zap,
    price: 119.90,
    period: "/mês",
    description: "Renovação mensal automática",
    color: "blue",
    checkoutUrl: "https://pay.hotmart.com/Q104225643H"
  },
  {
    id: "annual",
    planType: "annual",
    name: "Anual",
    icon: Crown,
    price: 99.90,
    originalPrice: 119.90,
    period: "/mês",
    annualTotal: 1198.80,
    description: "Economize R$ 240/ano",
    color: "purple",
    popular: true,
    checkoutUrl: "https://pay.hotmart.com/T104226080W"
  },
];

export default function UpgradePlansSection({ 
  subscription, 
  onSelectPlan, 
  theme = 'light' 
}) {
  const isDark = theme === 'dark';
  
  // Determinar status atual
  const currentPlanType = subscription?.plan_type;
  const isInTrial = subscription?.status === 'trial';
  const isActive = subscription?.status === 'active';
  const isExpired = subscription?.status === 'expired';
  
  // Calcular dias restantes do trial
  const trialDaysLeft = React.useMemo(() => {
    if (isInTrial && subscription?.end_date) {
      const today = new Date();
      const endDate = new Date(subscription.end_date);
      const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 ? daysLeft : 0;
    }
    return 0;
  }, [subscription, isInTrial]);

  const handleSelectPlan = (plan) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    } else {
      window.open(plan.checkoutUrl, '_blank');
    }
  };

  const colorClasses = {
    blue: {
      bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-100 text-blue-600',
      badge: 'bg-blue-100 text-blue-700'
    },
    purple: {
      bg: isDark ? 'bg-purple-900/20' : 'bg-purple-50',
      border: 'border-purple-300',
      icon: 'bg-purple-100 text-purple-600',
      badge: 'bg-purple-100 text-purple-700'
    },
    amber: {
      bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'bg-amber-100 text-amber-600',
      badge: 'bg-amber-100 text-amber-700'
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {isInTrial && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-blue-900">
                Período de Teste Ativo
              </p>
              <p className="text-sm text-blue-700">
                {trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'} restantes. 
                Assine agora para não perder o acesso!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {isExpired && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-900">
                Assinatura Expirada
              </p>
              <p className="text-sm text-red-700">
                Assine um plano para recuperar seu acesso completo.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Título da seção */}
      <div>
        <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {isInTrial || isExpired ? 'Escolha seu Plano' : 'Planos Disponíveis'}
        </h3>
        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
          {isInTrial 
            ? 'Continue com acesso ilimitado após o teste'
            : isExpired
            ? 'Recupere seu acesso escolhendo um plano'
            : 'Faça upgrade ou troque seu plano atual'
          }
        </p>
      </div>

      {/* Grid de Planos */}
      <div className="grid md:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const colors = colorClasses[plan.color];
          const isCurrentPlan = isActive && currentPlanType === plan.planType;
          const isLifetimeUser = currentPlanType === 'lifetime';
          
          // Bloquear se já tem vitalício ou se é o plano atual
          const isDisabled = isLifetimeUser || isCurrentPlan;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative rounded-xl border-2 p-5 transition-all ${
                plan.popular 
                  ? `${colors.border} ${colors.bg}` 
                  : isDark 
                    ? 'border-neutral-700 bg-neutral-800' 
                    : 'border-gray-200 bg-white'
              } ${!isDisabled && 'hover:shadow-lg hover:scale-[1.02]'}`}
            >
              {/* Badge Popular */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-semibold bg-purple-600 text-white rounded-full">
                    MAIS POPULAR
                  </span>
                </div>
              )}

              {/* Plano Atual Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 text-xs font-semibold bg-green-600 text-white rounded-full">
                    PLANO ATUAL
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                </div>
              </div>

              {/* Preço */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  {plan.originalPrice && (
                    <span className={`text-sm line-through ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                      R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                  <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    {plan.period}
                  </span>
                </div>
                {plan.annualTotal && (
                  <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    R$ {plan.annualTotal.toFixed(2).replace('.', ',')} cobrado anualmente
                  </p>
                )}
              </div>

              {/* Botão */}
              <Button
                onClick={() => handleSelectPlan(plan)}
                disabled={isDisabled}
                className={`w-full ${
                  isCurrentPlan
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : isLifetimeUser
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {isCurrentPlan ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Plano Atual
                  </>
                ) : isLifetimeUser ? (
                  'Você já tem acesso vitalício'
                ) : isInTrial ? (
                  'Assinar Agora'
                ) : (
                  'Fazer Upgrade'
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Nota sobre vitalício */}
      {currentPlanType === 'lifetime' && (
        <p className={`text-sm text-center ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
          ✨ Você possui acesso vitalício. Aproveite todas as funcionalidades sem preocupações!
        </p>
      )}
    </div>
  );
}
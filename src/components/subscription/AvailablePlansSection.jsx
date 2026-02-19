import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Crown, 
  Check, 
  ArrowRight,
  Clock,
  AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const availablePlans = [
  {
    id: "monthly",
    name: "Mensal",
    price: 119.90,
    period: "/mês",
    icon: Zap,
    color: "blue",
    description: "Renovação automática mensal",
    planType: "monthly"
  },
  {
    id: "annual",
    name: "Anual",
    price: 99.90,
    originalPrice: 119.90,
    period: "/mês",
    icon: Crown,
    color: "purple",
    description: "Economize R$ 240/ano",
    discount: "17% OFF",
    planType: "annual",
    popular: true
  },
  {
    id: "lifetime",
    name: "Vitalício",
    price: 1299.90,
    period: "à vista",
    icon: Star,
    color: "amber",
    description: "Pague uma vez, use para sempre",
    planType: "lifetime"
  }
];

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    iconBg: "bg-blue-100",
    button: "bg-blue-600 hover:bg-blue-700"
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    iconBg: "bg-purple-100",
    button: "bg-purple-600 hover:bg-purple-700"
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    iconBg: "bg-amber-100",
    button: "bg-amber-600 hover:bg-amber-700"
  }
};

export default function AvailablePlansSection({ 
  subscription, 
  theme = 'light',
  trialDaysLeft = 0
}) {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const isInTrial = subscription?.status === 'trial';
  const currentPlanType = subscription?.plan_type;
  const isExpired = subscription?.status === 'expired';
  const isActive = subscription?.status === 'active';

  const handleSelectPlan = (planType) => {
    navigate(createPageUrl("Pricing"));
  };

  return (
    <Card className={`mt-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            {isInTrial ? 'Fazer Upgrade' : isExpired ? 'Escolha um Plano' : 'Planos Disponíveis'}
          </CardTitle>
          {isInTrial && trialDaysLeft > 0 && (
            <Badge className="bg-blue-100 text-blue-700 border-0">
              <Clock className="w-3 h-3 mr-1" />
              {trialDaysLeft} dias de teste
            </Badge>
          )}
        </div>
        {isInTrial && (
          <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            Assine agora e continue com acesso completo após o período de teste
          </p>
        )}
        {isExpired && (
          <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
            <AlertTriangle className="w-4 h-4" />
            Seu período de teste expirou. Assine para continuar.
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {availablePlans.map((plan) => {
            const Icon = plan.icon;
            const colors = colorMap[plan.color];
            const isCurrentPlan = isActive && currentPlanType === plan.planType;
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border-2 p-4 transition-all ${
                  isCurrentPlan 
                    ? `${colors.border} ${colors.bg}` 
                    : isDark 
                      ? 'border-neutral-700 hover:border-neutral-600' 
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Popular badge */}
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white border-0 text-xs">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={`${colors.bg} ${colors.text} border-0 text-xs`}>
                      <Check className="w-3 h-3 mr-1" />
                      Plano Atual
                    </Badge>
                  </div>
                )}

                {/* Discount badge */}
                {plan.discount && !isCurrentPlan && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      {plan.discount}
                    </Badge>
                  </div>
                )}

                <div className="text-center pt-2">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg ${colors.iconBg} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>

                  {/* Name */}
                  <h3 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-2">
                    {plan.originalPrice && (
                      <span className={`text-sm line-through ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                        R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        R$ {plan.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-xs mb-4 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>

                  {/* Button */}
                  {isCurrentPlan ? (
                    <Button disabled className="w-full" variant="outline">
                      <Check className="w-4 h-4 mr-2" />
                      Plano Ativo
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSelectPlan(plan.planType)}
                      className={`w-full text-white ${colors.button}`}
                    >
                      {isInTrial ? 'Fazer Upgrade' : 'Assinar'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info adicional */}
        <div className={`mt-4 p-3 rounded-lg text-center text-sm ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-50 text-gray-600'}`}>
          Todos os planos incluem acesso completo a todos os recursos. 
          {isInTrial && " Seu período de teste será substituído pelo plano escolhido."}
        </div>
      </CardContent>
    </Card>
  );
}
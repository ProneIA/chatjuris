import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Building2, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import CheckoutModal from "@/components/subscription/CheckoutModal";

const MONTHLY_PLANS = [
  {
    id: "basic_monthly",
    planType: "monthly",
    name: "Básico",
    icon: Zap,
    price: 89.90,
    amount: 89.90,
    period: "/mês",
    billingLabel: "Cobrança mensal",
    installments: 1,
    description: "Ideal para advogados iniciantes",
    features: ["30 documentos/mês", "300 créditos de IA"],
    color: "blue",
    popular: false,
  },
  {
    id: "adv_monthly",
    planType: "monthly",
    name: "Advogado",
    icon: Crown,
    price: 119.90,
    amount: 119.90,
    period: "/mês",
    billingLabel: "Cobrança mensal",
    installments: 1,
    description: "Melhor custo-benefício",
    features: ["60 documentos/mês", "600 créditos de IA", "Suporte prioritário"],
    color: "purple",
    popular: true,
  },
  {
    id: "empresa_monthly",
    planType: "monthly",
    name: "Empresas",
    icon: Building2,
    price: 219.90,
    amount: 219.90,
    period: "/mês",
    billingLabel: "Cobrança mensal",
    installments: 1,
    description: "Para escritórios em crescimento",
    features: ["Documentos ilimitados", "IA ilimitada*", "Prioridade na geração"],
    color: "amber",
    popular: false,
  },
];

const ANNUAL_PLANS = [
  {
    id: "adv_yearly",
    planType: "annual",
    name: "Advogado Anual",
    icon: Crown,
    price: 1197.00,
    monthlyEq: 99.75,
    amount: 1197.00,
    period: "/ano",
    billingLabel: "Cobrança anual · até 12x sem juros",
    installments: 12,
    description: "Economize R$ 241,80/ano",
    savings: "R$ 241,80",
    features: ["60 documentos/mês", "600 créditos de IA", "Prioridade leve", "Suporte prioritário"],
    color: "purple",
    popular: true,
    badge: "Mais escolhido 🔥",
  },
  {
    id: "empresa_yearly",
    planType: "annual",
    name: "Empresas Anual",
    icon: Building2,
    price: 2197.00,
    monthlyEq: 183.08,
    amount: 2197.00,
    period: "/ano",
    billingLabel: "Cobrança anual · até 12x sem juros",
    installments: 12,
    description: "Economize R$ 441,80/ano",
    savings: "R$ 441,80",
    features: ["Documentos ilimitados", "IA ilimitada*", "Prioridade máxima", "Suporte rápido"],
    color: "amber",
    popular: false,
    badge: "Para escritórios 🚀",
  },
];

const colorClasses = {
  blue:   { border: "border-blue-300",   bg: "bg-blue-50",   icon: "bg-blue-100 text-blue-600",   btn: "bg-blue-700 hover:bg-blue-800" },
  purple: { border: "border-purple-300", bg: "bg-purple-50", icon: "bg-purple-100 text-purple-600", btn: "bg-purple-700 hover:bg-purple-800" },
  amber:  { border: "border-amber-300",  bg: "bg-amber-50",  icon: "bg-amber-100 text-amber-600",  btn: "bg-amber-700 hover:bg-amber-800" },
};

export default function UpgradePlansSection({ subscription, theme = "light" }) {
  const isDark = theme === "dark";
  const [billing, setBilling] = useState("monthly");
  const [checkoutPlan, setCheckoutPlan] = useState(null);

  const isInTrial  = subscription?.status === "trial";
  const isExpired  = subscription?.status === "expired";
  const isActive   = subscription?.status === "active";
  const currentPlanType = subscription?.plan_type; // "monthly" | "annual"
  const currentPlanId   = subscription?.payment_external_id || "";

  const trialDaysLeft = React.useMemo(() => {
    if (isInTrial && subscription?.end_date) {
      const d = Math.ceil((new Date(subscription.end_date) - new Date()) / 864e5);
      return d > 0 ? d : 0;
    }
    return 0;
  }, [subscription, isInTrial]);

  const plans = billing === "monthly" ? MONTHLY_PLANS : ANNUAL_PLANS;

  const isCurrentPlan = (plan) => {
    if (!isActive) return false;
    // Verifica pelo id do plano no campo payment_external_id ou pelo plan_type genérico
    if (currentPlanId && currentPlanId.includes(plan.id)) return true;
    // Fallback: plano mensal/anual genérico antigo
    if (plan.id === "adv_monthly" && currentPlanType === "monthly") return true;
    if (plan.id === "adv_yearly"  && currentPlanType === "annual")  return true;
    return false;
  };

  return (
    <div className="space-y-5">

      {/* Banners de status */}
      {isInTrial && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 text-sm">Período de Teste Ativo</p>
            <p className="text-xs text-blue-700">{trialDaysLeft} dias restantes. Assine para manter o acesso!</p>
          </div>
        </div>
      )}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="font-semibold text-red-900 text-sm">Assinatura Expirada</p>
            <p className="text-xs text-red-700">Escolha um plano para recuperar seu acesso.</p>
          </div>
        </div>
      )}

      {/* Título + Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
            {isInTrial || isExpired ? "Escolha seu Plano" : "Planos Disponíveis"}
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
            {isInTrial ? "Continue com acesso após o teste" : isExpired ? "Recupere seu acesso" : "Faça upgrade ou troque seu plano"}
          </p>
        </div>

        {/* Toggle mensal / anual */}
        <div style={{ display: "inline-flex", border: "1px solid #e0e0ea", overflow: "hidden" }}>
          {[["monthly", "Mensal"], ["yearly", "Anual"]].map(([b, label]) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: ".4rem 1.1rem",
                background: billing === b ? "#191970" : "#fff",
                color: billing === b ? "#fff" : "#6b6b80",
                border: "none", cursor: "pointer",
                fontFamily: "'Oswald', sans-serif", fontWeight: 600,
                fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".08em",
              }}
            >
              {label}
              {b === "yearly" && (
                <span style={{ marginLeft: ".35rem", background: "#4ade80", color: "#000", fontSize: ".55rem", padding: ".1rem .3rem", fontWeight: 700 }}>
                  -17%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de planos */}
      <div className={`grid gap-4 ${plans.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {plans.map((plan) => {
          const Icon = plan.icon;
          const colors = colorClasses[plan.color];
          const isCurrent = isCurrentPlan(plan);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative border-2 p-4 transition-all ${
                plan.popular
                  ? `${colors.border} ${colors.bg}`
                  : isDark ? "border-neutral-700 bg-neutral-800" : "border-gray-200 bg-white"
              } ${!isCurrent ? "hover:shadow-md" : ""}`}
              style={{ borderRadius: 0 }}
            >
              {/* Badges */}
              {plan.badge && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-black whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-3">
                  <span className="px-2 py-0.5 text-xs font-bold bg-green-600 text-white">PLANO ATUAL</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3 mt-1">
                <div className={`w-9 h-9 flex items-center justify-center ${colors.icon}`} style={{ borderRadius: 0 }}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{plan.name}</p>
                  <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{plan.description}</p>
                </div>
              </div>

              {/* Preço */}
              <div className="mb-3">
                {plan.monthlyEq && (
                  <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-400"}`}>
                    ~R$ {plan.monthlyEq.toFixed(2).replace(".", ",")}/mês
                  </p>
                )}
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    R$ {plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{plan.period}</span>
                </div>
                {plan.savings && (
                  <p className="text-xs text-green-600 font-semibold mt-0.5">✓ Economize {plan.savings}</p>
                )}
                {plan.installments > 1 && (
                  <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-400"}`}>até {plan.installments}x sem juros</p>
                )}
              </div>

              {/* Features */}
              <ul className="mb-4 space-y-1">
                {plan.features.map((f, i) => (
                  <li key={i} className={`flex items-center gap-1.5 text-xs ${isDark ? "text-neutral-300" : "text-gray-600"}`}>
                    <Check className="w-3 h-3 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Botão */}
              <button
                onClick={() => !isCurrent && setCheckoutPlan(plan)}
                disabled={isCurrent}
                className={`w-full py-2.5 text-xs font-bold uppercase tracking-wider transition-opacity ${
                  isCurrent ? "bg-green-100 text-green-700 cursor-not-allowed" : `${colors.btn} text-white cursor-pointer`
                }`}
                style={{ border: "none", borderRadius: 0, fontFamily: "'Oswald', sans-serif", letterSpacing: ".1em" }}
              >
                {isCurrent ? "✓ Plano Atual" : isInTrial ? "Assinar Agora" : "Fazer Upgrade"}
              </button>
            </motion.div>
          );
        })}
      </div>

      <p className={`text-xs text-center ${isDark ? "text-neutral-500" : "text-gray-400"}`}>
        Pagamento seguro via cartão de crédito · Mercado Pago
      </p>

      {/* Modal de checkout inline */}
      {checkoutPlan && (
        <CheckoutModal plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />
      )}
    </div>
  );
}
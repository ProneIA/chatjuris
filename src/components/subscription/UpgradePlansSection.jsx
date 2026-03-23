import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Building2, Clock, AlertTriangle, Star } from "lucide-react";
import { motion } from "framer-motion";
import CheckoutModal from "@/components/subscription/CheckoutModal";

// ─── Planos atualizados (espelho de pages/Pricing) ────────────────────────────
const MONTHLY_PLANS = [
  {
    id: "basic_monthly",
    planType: "basic_monthly",
    name: "Básico",
    icon: Zap,
    price: 89.90,
    amount: 89.90,
    period: "/mês",
    billingType: "monthly",
    billingLabel: "Cobrança mensal",
    installments: 1,
    description: "30 docs · 300 créditos IA",
    color: "blue",
    features: ["30 documentos/mês", "300 créditos de IA", "Gestão de processos"],
  },
  {
    id: "adv_monthly",
    planType: "adv_monthly",
    name: "Advogado",
    icon: Crown,
    price: 119.90,
    amount: 119.90,
    period: "/mês",
    billingType: "monthly",
    billingLabel: "Cobrança mensal",
    installments: 1,
    description: "60 docs · 600 créditos IA",
    color: "purple",
    popular: true,
    features: ["60 documentos/mês", "600 créditos de IA", "Todos os modos de IA", "Suporte prioritário"],
  },
  {
    id: "empresa_monthly",
    planType: "empresa_monthly",
    name: "Empresas",
    icon: Building2,
    price: 219.90,
    amount: 219.90,
    period: "/mês",
    billingType: "monthly",
    billingLabel: "Cobrança mensal",
    installments: 1,
    description: "Ilimitado · Suporte prioritário",
    color: "amber",
    features: ["Documentos ilimitados", "IA ilimitada*", "Prioridade na geração", "Suporte prioritário"],
  },
];

const ANNUAL_PLANS = [
  {
    id: "adv_yearly",
    planType: "adv_yearly",
    name: "Advogado Anual",
    icon: Crown,
    price: 1197.00,
    monthlyEq: 99.75,
    amount: 1197.00,
    period: "/ano",
    billingType: "yearly",
    billingLabel: "Cobrança anual · até 12x sem juros",
    installments: 12,
    description: "Economize R$ 241,80/ano",
    savings: "R$ 241,80/ano",
    color: "purple",
    popular: true,
    badge: "Mais escolhido 🔥",
    features: ["60 docs/mês", "600 créditos IA", "Prioridade leve", "Suporte prioritário"],
  },
  {
    id: "empresa_yearly",
    planType: "empresa_yearly",
    name: "Empresas Anual",
    icon: Building2,
    price: 2197.00,
    monthlyEq: 183.08,
    amount: 2197.00,
    period: "/ano",
    billingType: "yearly",
    billingLabel: "Cobrança anual · até 12x sem juros",
    installments: 12,
    description: "Economize R$ 441,80/ano",
    savings: "R$ 441,80/ano",
    color: "amber",
    badge: "Para escritórios 🚀",
    features: ["Documentos ilimitados", "IA ilimitada*", "Prioridade máxima", "Suporte + rápido"],
  },
];

const colorClasses = {
  blue:   { border: "border-blue-300",   bg: "bg-blue-50",   icon: "bg-blue-100 text-blue-600",   badge: "bg-blue-600" },
  purple: { border: "border-purple-300", bg: "bg-purple-50", icon: "bg-purple-100 text-purple-600", badge: "bg-purple-600" },
  amber:  { border: "border-amber-300",  bg: "bg-amber-50",  icon: "bg-amber-100 text-amber-600",  badge: "bg-amber-600" },
};

function PlanCard({ plan, isCurrentPlan, isInTrial, isDark, onSelect }) {
  const Icon = plan.icon;
  const colors = colorClasses[plan.color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative border-2 p-4 transition-all ${
        plan.popular
          ? `${colors.border} ${colors.bg}`
          : isDark
            ? "border-neutral-700 bg-neutral-800"
            : "border-gray-200 bg-white"
      } ${!isCurrentPlan ? "hover:shadow-md" : ""}`}
      style={{ borderRadius: 0 }}
    >
      {/* Badge */}
      {(plan.badge || plan.popular) && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className={`px-3 py-1 text-xs font-semibold text-white ${colors.badge}`}>
            {plan.badge || "MAIS POPULAR"}
          </span>
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="px-3 py-1 text-xs font-semibold bg-green-600 text-white">PLANO ATUAL</span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 flex items-center justify-center ${colors.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{plan.name}</h4>
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
          <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-gray-400"}`}>
            até {plan.installments}x sem juros
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="mb-4 space-y-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <Check className={`w-3 h-3 shrink-0 ${colors.icon.split(" ")[1]}`} />
            <span className={isDark ? "text-neutral-300" : "text-gray-600"}>{f}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => !isCurrentPlan && onSelect(plan)}
        disabled={isCurrentPlan}
        className={`w-full text-sm ${
          isCurrentPlan
            ? "bg-green-100 text-green-700 cursor-not-allowed"
            : plan.popular
            ? `${colors.badge} hover:opacity-90 text-white`
            : isDark ? "bg-white text-black hover:bg-gray-100" : "bg-gray-900 hover:bg-gray-800 text-white"
        }`}
        style={{ borderRadius: 0 }}
      >
        {isCurrentPlan ? (
          <><Check className="w-4 h-4 mr-1" /> Plano Atual</>
        ) : isInTrial ? "Assinar Agora" : "Fazer Upgrade"}
      </Button>
    </motion.div>
  );
}

export default function UpgradePlansSection({ subscription, onSelectPlan, theme = "light" }) {
  const isDark = theme === "dark";
  const [billing, setBilling] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const isInTrial = subscription?.status === "trial";
  const isExpired = subscription?.status === "expired";
  const isActive = subscription?.status === "active";
  const currentPlanType = subscription?.plan_type;

  const trialDaysLeft = React.useMemo(() => {
    if (isInTrial && subscription?.end_date) {
      const days = Math.ceil((new Date(subscription.end_date) - new Date()) / 864e5);
      return days > 0 ? days : 0;
    }
    return 0;
  }, [subscription, isInTrial]);

  const handleSelect = (plan) => {
    if (onSelectPlan) { onSelectPlan(plan); return; }
    setSelectedPlan(plan);
  };

  const plans = billing === "monthly" ? MONTHLY_PLANS : ANNUAL_PLANS;

  return (
    <div className="space-y-5">
      {/* Banners de status */}
      {isInTrial && (
        <div className="bg-blue-50 border border-blue-200 p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 text-sm">Período de Teste Ativo</p>
            <p className="text-xs text-blue-700">{trialDaysLeft} {trialDaysLeft === 1 ? "dia" : "dias"} restantes. Assine para não perder o acesso!</p>
          </div>
        </div>
      )}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="font-semibold text-red-900 text-sm">Assinatura Expirada</p>
            <p className="text-xs text-red-700">Assine um plano para recuperar seu acesso.</p>
          </div>
        </div>
      )}

      {/* Título + Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
            {isInTrial || isExpired ? "Escolha seu Plano" : "Planos Disponíveis"}
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
            {isInTrial ? "Continue com acesso completo após o teste" : isExpired ? "Recupere seu acesso" : "Faça upgrade ou troque seu plano atual"}
          </p>
        </div>
        {/* Toggle mensal/anual */}
        <div style={{ display: "inline-flex", border: "1px solid #e0e0ea", overflow: "hidden" }}>
          {["monthly", "yearly"].map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: ".4rem 1rem",
                background: billing === b ? "#191970" : "#fff",
                color: billing === b ? "#fff" : "#6b6b80",
                border: "none", cursor: "pointer",
                fontFamily: "'Oswald', sans-serif", fontWeight: 600,
                fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".1em",
                transition: "background .2s, color .2s",
              }}
            >
              {b === "monthly" ? "Mensal" : <>Anual <span style={{ fontSize: ".55rem", background: "#4ade80", color: "#000", padding: "0 .3rem" }}>-17%</span></>}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de planos */}
      <div className={`grid gap-3 ${plans.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={isActive && currentPlanType === plan.planType}
            isInTrial={isInTrial}
            isDark={isDark}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {billing === "yearly" && (
        <p className={`text-center text-xs ${isDark ? "text-neutral-500" : "text-gray-400"}`}>
          🔒 Planos anuais: parcelamento em até 12x sem juros — os juros são absorvidos pelo Juris.
        </p>
      )}

      {/* Modal de Checkout */}
      {selectedPlan && (
        <CheckoutModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  );
}
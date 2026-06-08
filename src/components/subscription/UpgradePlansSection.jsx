import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Building2, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import CheckoutModal from "@/components/subscription/CheckoutModal";

const PLANS_MONTHLY = [
  {
    id: "starter_monthly",
    planType: "monthly",
    name: "Starter",
    icon: Zap,
    price: 79.00,
    amount: 79.00,
    period: "/mês",
    billingLabel: "Cobrança mensal",
    installments: 1,
    description: "Para quem está começando",
    features: ["1 usuário", "50 documentos/mês", "Gestão de clientes", "Suporte por e-mail"],
    color: "blue",
    popular: false,
  },
  {
    id: "pro_monthly",
    planType: "monthly",
    name: "Profissional",
    icon: Crown,
    price: 149.00,
    amount: 149.00,
    period: "/mês",
    billingLabel: "Cobrança mensal",
    installments: 1,
    description: "Para advogados autônomos ativos",
    features: ["Até 3 usuários", "Documentos ilimitados", "Portal do cliente", "Suporte prioritário"],
    color: "purple",
    popular: true,
    badge: "Mais escolhido",
  },
  {
    id: "escritorio_monthly",
    planType: "monthly",
    name: "Escritório",
    icon: Building2,
    price: 299.00,
    amount: 299.00,
    period: "/mês",
    billingLabel: "Cobrança mensal",
    installments: 1,
    description: "Para equipes e sócios",
    features: ["Usuários ilimitados", "Relatórios avançados", "Conformidade LGPD", "Onboarding assistido"],
    color: "amber",
    popular: false,
  },
];

const PLANS_YEARLY = [
  {
    id: "starter_yearly",
    planType: "yearly",
    name: "Starter Anual",
    icon: Zap,
    price: 708.00,
    amount: 708.00,
    monthlyEq: 59.00,
    period: "/ano",
    billingLabel: "Cobrança anual única · até 12x",
    installments: 12,
    description: "R$ 59/mês — economize R$ 240",
    features: ["1 usuário", "50 documentos/mês", "Gestão de clientes", "Suporte por e-mail"],
    color: "blue",
    popular: false,
  },
  {
    id: "pro_yearly",
    planType: "yearly",
    name: "Profissional Anual",
    icon: Crown,
    price: 1428.00,
    amount: 1428.00,
    monthlyEq: 119.00,
    period: "/ano",
    billingLabel: "Cobrança anual única · até 12x",
    installments: 12,
    description: "R$ 119/mês — economize R$ 360",
    features: ["Até 3 usuários", "Documentos ilimitados", "Portal do cliente", "Suporte prioritário"],
    color: "purple",
    popular: true,
    badge: "Mais escolhido",
  },
  {
    id: "escritorio_yearly",
    planType: "yearly",
    name: "Escritório Anual",
    icon: Building2,
    price: 3108.00,
    amount: 3108.00,
    monthlyEq: 259.00,
    period: "/ano",
    billingLabel: "Cobrança anual única · até 12x",
    installments: 12,
    description: "R$ 259/mês — economize R$ 480",
    features: ["Usuários ilimitados", "Relatórios avançados", "Conformidade LGPD", "Onboarding assistido"],
    color: "amber",
    popular: false,
  },
];

const colorClasses = {
  blue:   { border: "border-blue-300",   bg: "bg-blue-50",   icon: "bg-blue-100 text-blue-600",   btn: "bg-blue-700 hover:bg-blue-800" },
  purple: { border: "border-purple-300", bg: "bg-purple-50", icon: "bg-purple-100 text-purple-600", btn: "bg-purple-700 hover:bg-purple-800" },
  amber:  { border: "border-amber-300",  bg: "bg-amber-50",  icon: "bg-amber-100 text-amber-600",  btn: "bg-amber-700 hover:bg-amber-800" },
};

export default function UpgradePlansSection({ subscription, theme = "light" }) {
  const isDark = theme === "dark";
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [billing, setBilling] = useState("monthly");

  const plans = billing === "yearly" ? PLANS_YEARLY : PLANS_MONTHLY;

  const isInTrial  = subscription?.status === "trial";
  const isExpired  = subscription?.status === "expired";
  const isActive   = subscription?.status === "active";
  const currentPlanId = subscription?.payment_external_id || "";

  const trialDaysLeft = React.useMemo(() => {
    if (isInTrial && subscription?.end_date) {
      const d = Math.ceil((new Date(subscription.end_date) - new Date()) / 864e5);
      return d > 0 ? d : 0;
    }
    return 0;
  }, [subscription, isInTrial]);

  const isCurrentPlan = (plan) => {
    if (!isActive) return false;
    if (currentPlanId && currentPlanId.includes(plan.id)) return true;
    if (plan.id === "pro_monthly" && subscription?.plan_type === "monthly") return true;
    return false;
  };

  return (
    <div className="space-y-5">
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

      <div>
        <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
          {isInTrial || isExpired ? "Escolha seu Plano" : "Planos Disponíveis"}
        </h3>
        <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
          {isInTrial ? "Continue com acesso após o teste" : isExpired ? "Recupere seu acesso" : "Faça upgrade ou troque seu plano"}
        </p>
      </div>

      {/* Toggle Mensal / Anual */}
      <div style={{ display: "flex", gap: 0, marginBottom: "1rem", border: "1px solid #e0e0ea", width: "fit-content" }}>
        {["monthly", "yearly"].map((b) => (
          <button
            key={b}
            onClick={() => setBilling(b)}
            style={{
              padding: ".5rem 1.2rem",
              background: billing === b ? "#C8A84B" : "transparent",
              color: billing === b ? "#000" : "#6b6b80",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 600,
              fontSize: ".72rem",
              textTransform: "uppercase",
              letterSpacing: ".1em",
              transition: "background .2s, color .2s",
            }}
          >
            {b === "monthly" ? "Mensal" : <span>Anual <span style={{ marginLeft: 4, background: "#4ade80", color: "#000", fontSize: ".55rem", padding: ".1rem .35rem", fontWeight: 700 }}>-20%</span></span>}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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

              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    R$ {plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{plan.period}</span>
                </div>
                {plan.monthlyEq && (
                  <p style={{ fontSize: ".7rem", color: isDark ? "rgba(255,255,255,.4)" : "#999", marginTop: 2 }}>
                    ≈ R$ {plan.monthlyEq.toFixed(2).replace(".", ",")}/mês
                  </p>
                )}
              </div>

              <ul className="mb-4 space-y-1">
                {plan.features.map((f, i) => (
                  <li key={i} className={`flex items-center gap-1.5 text-xs ${isDark ? "text-neutral-300" : "text-gray-600"}`}>
                    <Check className="w-3 h-3 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

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

      {checkoutPlan && (
        <CheckoutModal plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />
      )}
    </div>
  );
}
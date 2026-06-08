import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shield, CheckCircle2 } from "lucide-react";
import TransparentCheckout from "@/components/checkout/TransparentCheckout";

const PLANS = {
  starter_monthly: {
    name: "Starter — Mensal",
    price: 79.00,
    amount: 79.00,
    period: "/mês",
    billingType: "monthly",
    description: "Acesso à plataforma, renovação mensal",
    features: ["1 usuário", "50 documentos/mês", "Gestão de clientes", "Suporte por e-mail"],
  },
  pro_monthly: {
    name: "Profissional — Mensal",
    price: 149.00,
    amount: 149.00,
    period: "/mês",
    billingType: "monthly",
    description: "Acesso completo à plataforma, renovação mensal",
    features: ["Até 3 usuários", "Documentos ilimitados", "Portal do cliente", "Suporte prioritário"],
  },
  escritorio_monthly: {
    name: "Escritório — Mensal",
    price: 299.00,
    amount: 299.00,
    period: "/mês",
    billingType: "monthly",
    description: "Para equipes e sócios, renovação mensal",
    features: ["Usuários ilimitados", "Relatórios avançados", "Conformidade LGPD", "Onboarding assistido"],
  },
  starter_yearly: {
    name: "Starter — Anual",
    price: 708.00,
    amount: 708.00,
    pricePerMonth: 59.00,
    period: "/ano",
    billingType: "yearly",
    description: "Cobrança única anual — economize R$ 240",
    savingsText: "Economize R$ 240/ano vs. mensal",
    features: ["1 usuário", "50 documentos/mês", "Gestão de clientes", "Parcelamento em até 12x sem juros"],
  },
  pro_yearly: {
    name: "Profissional — Anual",
    price: 1428.00,
    amount: 1428.00,
    pricePerMonth: 119.00,
    period: "/ano",
    billingType: "yearly",
    description: "Cobrança única anual — economize R$ 360",
    savingsText: "Economize R$ 360/ano vs. mensal",
    features: ["Até 3 usuários", "Documentos ilimitados", "Portal do cliente", "Parcelamento em até 12x sem juros"],
  },
  escritorio_yearly: {
    name: "Escritório — Anual",
    price: 3108.00,
    amount: 3108.00,
    pricePerMonth: 259.00,
    period: "/ano",
    billingType: "yearly",
    description: "Cobrança única anual — economize R$ 480",
    savingsText: "Economize R$ 480/ano vs. mensal",
    features: ["Usuários ilimitados", "Relatórios avançados", "Conformidade LGPD", "Parcelamento em até 12x sem juros"],
  },
};

export default function Checkout({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const planId = searchParams.get('plan');
  const plan = PLANS[planId];

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  useEffect(() => {
    if (planId && !PLANS[planId]) {
      navigate(createPageUrl('Pricing'));
    }
  }, [planId, navigate]);

  if (!user || !plan) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Back */}
        <button
          onClick={() => navigate(createPageUrl('Pricing'))}
          className={`inline-flex items-center gap-2 mb-8 text-sm transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Planos
        </button>

        <div className="grid md:grid-cols-5 gap-8">

          {/* Coluna esquerda — resumo do plano */}
          <div className="md:col-span-2 space-y-4">
            <div className={`p-5 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>Você está assinando</p>
              <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h2>
              <p className={`text-sm mb-4 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>{plan.description}</p>

              {plan.savingsText && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-xs font-medium text-green-500">{plan.savingsText}</p>
                </div>
              )}

              <div className={`pt-4 border-t ${isDark ? 'border-neutral-800' : 'border-gray-100'}`}>
                {plan.pricePerMonth && (
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    R$ {plan.pricePerMonth.toFixed(2).replace('.', ',')} /mês
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{plan.period}</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className={`p-5 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>Incluído no plano:</p>
              <ul className="space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Segurança */}
            <div className={`flex items-center gap-2 p-3 rounded-lg ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-gray-50 border border-gray-200'}`}>
              <Shield className="w-4 h-4 text-green-500" />
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                Pagamento 100% seguro via Mercado Pago · SSL · Antifraude
              </p>
            </div>
          </div>

          {/* Coluna direita — checkout transparente */}
          <div className="md:col-span-3">
            <h1 className={`text-xl font-bold mb-5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Completar Pagamento
            </h1>
            <TransparentCheckout
              planId={planId}
              user={user}
              theme={theme}
              onSuccess={() => navigate(createPageUrl('CheckoutSuccess'))}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
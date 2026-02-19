import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import MercadoPagoCheckout from "@/components/checkout/MercadoPagoCheckout";

const PLANS = {
  pro_monthly: {
    name: 'Juris Pro - Plano Mensal',
    price: 119.90,
    period: '/mês',
    description: 'Renovação mensal automática'
  },
  pro_yearly: {
    name: 'Juris Pro - Plano Anual',
    price: 99.90,
    period: '/mês',
    originalPrice: 119.90,
    annualTotal: 1198.80,
    description: 'Melhor valor - pague anualmente e economize',
    savingsText: 'Economize R$ 240/ano - 2 meses grátis!'
  }
};

export default function Checkout({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const planId = searchParams.get('plan');

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => navigate(createPageUrl('Pricing')));
  }, [navigate]);

  useEffect(() => {
    if (planId && PLANS[planId]) {
      setPlan(PLANS[planId]);
    } else {
      navigate(createPageUrl('Pricing'));
    }
  }, [planId, navigate]);

  if (!user || !plan) {
    return null;
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(createPageUrl('Pricing'))}
          className={`inline-flex items-center gap-2 mb-8 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos Planos</span>
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Resumo do Plano */}
          <div className={`md:col-span-1 p-6 rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Resumo do Pedido
            </h2>

            <div className="space-y-4 mb-6 pb-6 border-b border-neutral-700">
              <div>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Plano</p>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</p>
              </div>

              <div>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Descrição</p>
                <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{plan.description}</p>
              </div>

              {plan.originalPrice && (
                <div>
                  <p className={`text-xs line-through ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    De R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                  </p>
                  <p className={`text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    {plan.savingsText}
                  </p>
                </div>
              )}

              {plan.annualTotal && (
                <div>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                    Total anual: R$ {plan.annualTotal.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Subtotal</span>
                <span className={isDark ? 'text-white' : 'text-gray-900'}>
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-neutral-700">
                <span className={isDark ? 'text-white' : 'text-gray-900'}>Total</span>
                <span className="text-purple-600">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <p className={`text-xs mt-4 text-center ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              ✅ Pagamento seguro via Mercado Pago
            </p>
          </div>

          {/* Formulário de Checkout */}
          <div className="md:col-span-2">
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Completar Pagamento
            </h2>
            <MercadoPagoCheckout
              planId={planId}
              theme={theme}
              onSuccess={() => navigate(createPageUrl('Dashboard'))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
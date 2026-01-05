import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Check, CreditCard, QrCode, Shield, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const plans = {
  pro_monthly: {
    name: "Profissional Mensal",
    price: 119.90,
    period: "mês",
    features: ["IA Ilimitada", "Todos os recursos", "Suporte prioritário"]
  },
  pro_yearly: {
    name: "Profissional Anual",
    price: 1198.80,
    priceMonthly: 99.90,
    period: "ano",
    savings: "Economize R$ 240/ano",
    features: ["IA Ilimitada", "Todos os recursos", "Suporte prioritário", "2 meses grátis"]
  }
};

export default function Checkout({ theme = 'light' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  
  const planId = new URLSearchParams(location.search).get("plan");
  const plan = plans[planId];

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => navigate(createPageUrl("Pricing")))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const response = await base44.functions.invoke('createMercadoPagoCheckout', { 
        planId,
        paymentMethod: paymentMethod === "pix" ? "pix" : "credit_card"
      });
      
      if (response.data.success && response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        alert('Erro ao processar pagamento. Tente novamente.');
        setProcessing(false);
      }
    } catch (error) {
      alert('Erro: ' + error.message);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!plan) {
    navigate(createPageUrl("Pricing"));
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'} py-12`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate(createPageUrl("Pricing"))}
          className={`flex items-center gap-2 mb-8 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para planos
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Plan Summary */}
          <div>
            <div className={`rounded-lg ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'} border p-8`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Resumo do Pedido
              </h2>

              <div className="mb-6">
                <div className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Plano Selecionado
                </div>
                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Price */}
              <div className={`border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'} pt-6`}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                  <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                {plan.priceMonthly && (
                  <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    R$ {plan.priceMonthly.toFixed(2).replace('.', ',')} por mês
                  </div>
                )}
                {plan.savings && (
                  <div className="text-sm text-green-500 font-medium mt-1">
                    {plan.savings}
                  </div>
                )}
                <div className="flex justify-between items-baseline mt-4 pt-4 border-t border-dashed border-gray-300">
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Total</span>
                  <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Badges */}
            <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'} border`}>
              <div className="flex items-center gap-3 mb-3">
                <Shield className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Pagamento 100% Seguro
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Lock className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Dados Criptografados
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Method */}
          <div>
            <div className={`rounded-lg ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'} border p-8`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Método de Pagamento
              </h2>

              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-4">
                  {/* PIX */}
                  <label
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentMethod === "pix"
                        ? isDark 
                          ? 'border-white bg-white/5' 
                          : 'border-gray-900 bg-gray-50'
                        : isDark
                        ? 'border-neutral-800 hover:border-neutral-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="pix" id="pix" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isDark ? 'bg-neutral-800' : 'bg-gray-100'
                      }`}>
                        <QrCode className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                      </div>
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          PIX
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Aprovação instantânea
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Credit Card */}
                  <label
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentMethod === "credit_card"
                        ? isDark 
                          ? 'border-white bg-white/5' 
                          : 'border-gray-900 bg-gray-50'
                        : isDark
                        ? 'border-neutral-800 hover:border-neutral-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="credit_card" id="credit_card" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isDark ? 'bg-neutral-800' : 'bg-gray-100'
                      }`}>
                        <CreditCard className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                      </div>
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Cartão de Crédito
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Parcelamento em até 12x
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </RadioGroup>

              {/* User Info */}
              <div className={`mt-6 pt-6 border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Email</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className={`mt-2 ${isDark ? 'bg-neutral-800 border-neutral-700 text-gray-300' : 'bg-gray-50'}`}
                />
              </div>

              <div className="mt-6">
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Nome Completo</Label>
                <Input
                  value={user?.full_name || ''}
                  disabled
                  className={`mt-2 ${isDark ? 'bg-neutral-800 border-neutral-700 text-gray-300' : 'bg-gray-50'}`}
                />
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={processing}
                className="w-full mt-8 h-12 text-base font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  `Finalizar Pagamento - R$ ${plan.price.toFixed(2).replace('.', ',')}`
                )}
              </Button>

              <p className={`text-xs text-center mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Ao finalizar, você será redirecionado para completar o pagamento de forma segura.
                Cancele a qualquer momento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
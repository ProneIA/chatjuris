import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Check, Shield, Lock, ArrowLeft, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);
  const [mpLoaded, setMpLoaded] = React.useState(false);
  const [brickReady, setBrickReady] = React.useState(false);

  const planId = new URLSearchParams(location.search).get("plan");
  const plan = plans[planId];

  React.useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => navigate(createPageUrl("Pricing")))
      .finally(() => setLoading(false));
  }, [navigate]);

  React.useEffect(() => {
    if (!loading && !plan) {
      navigate(createPageUrl("Pricing"));
    }
  }, [loading, plan, navigate]);

  // Carregar SDK do Mercado Pago
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => setMpLoaded(true);
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Inicializar Brick do Mercado Pago quando tudo estiver pronto
  useEffect(() => {
    if (!mpLoaded || !user || !plan || brickReady) return;

    const initializeBrick = async () => {
      try {
        // Buscar a public key
        const { data: keysData } = await base44.functions.invoke('getMercadoPagoKeys');
        
        const mp = new window.MercadoPago(keysData.publicKey);
        const bricksBuilder = mp.bricks();

        await bricksBuilder.create('cardPayment', 'cardPaymentBrick_container', {
          initialization: {
            amount: plan.price,
            payer: {
              email: user.email,
            },
          },
          callbacks: {
            onReady: () => {
              setBrickReady(true);
              setProcessing(false);
            },
            onSubmit: async (formData) => {
              setProcessing(true);
              try {
                const response = await base44.functions.invoke('processMercadoPagoPayment', {
                  planId,
                  paymentData: formData,
                  successUrl: window.location.origin + createPageUrl("PaymentSuccess") + "?status=success",
                  failureUrl: window.location.origin + createPageUrl("Pricing") + "?status=failed"
                });

                if (response.data?.success) {
                  window.location.href = window.location.origin + createPageUrl("PaymentSuccess") + "?status=success";
                } else {
                  throw new Error(response.data?.error || 'Erro ao processar pagamento');
                }
              } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao processar pagamento. Tente novamente.');
                setProcessing(false);
                return;
              }
            },
            onError: (error) => {
              console.error('Brick error:', error);
              alert('Erro ao carregar formulário de pagamento.');
              setProcessing(false);
            },
          },
          customization: {
            visual: {
              style: {
                theme: isDark ? 'dark' : 'default'
              }
            }
          },
        });
      } catch (error) {
        console.error('Erro ao inicializar brick:', error);
        alert('Erro ao carregar formulário de pagamento.');
      }
    };

    initializeBrick();
  }, [mpLoaded, user, plan, planId, brickReady]);

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const response = await base44.functions.invoke('createMercadoPagoCheckout', {
        planId,
        successUrl: window.location.origin + createPageUrl("PaymentSuccess") + "?status=success",
        failureUrl: window.location.origin + createPageUrl("Pricing") + "?status=failed",
        pendingUrl: window.location.origin + createPageUrl("PaymentSuccess") + "?status=pending"
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      console.error('Response completa:', error.response);
      const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
      const errorDetails = error.response?.data?.details || '';
      alert(`Erro ao processar pagamento: ${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}. Tente novamente.`);
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

  if (!loading && !plan) {
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
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total</span>
                  <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                {plan.priceMonthly && (
                  <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    R$ {plan.priceMonthly.toFixed(2).replace('.', ',')} por mês
                  </div>
                )}
                {planId === 'pro_yearly' && (
                  <div className={`text-sm mt-2 p-3 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                    <div className={`${isDark ? 'text-blue-400' : 'text-blue-700'} font-medium`}>
                      💳 Parcelamento disponível
                    </div>
                    <div className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-600'} mt-1`}>
                      Até 12x de R$ {(plan.price / 12).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                )}
                {plan.savings && (
                  <div className="text-sm text-green-500 font-medium mt-1">
                    {plan.savings}
                  </div>
                )}
              </div>
            </div>

            {/* Security Badges */}
            <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'} border`}>
              <div className="flex items-center gap-3 mb-3">
                <Shield className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Pagamento 100% Seguro via Mercado Pago
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

          {/* Right Column - User Info & Checkout */}
          <div>
            <div className={`rounded-lg ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'} border p-8`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Informações
              </h2>

              <div className="space-y-4 mb-8">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800 text-gray-300' : 'bg-gray-50 text-gray-900'}`}>
                    {user?.email}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nome
                  </label>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800 text-gray-300' : 'bg-gray-50 text-gray-900'}`}>
                    {user?.full_name || 'Não informado'}
                  </div>
                </div>
              </div>

              {/* Formulário de Pagamento Mercado Pago */}
              <div className={`mb-6 ${!brickReady ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Dados do Cartão
                  </h3>
                </div>
                <div id="cardPaymentBrick_container"></div>
              </div>

              {!brickReady && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              )}

              <p className={`text-xs text-center mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Pagamento 100% seguro processado pelo Mercado Pago
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
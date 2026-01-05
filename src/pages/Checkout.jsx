import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Check, CreditCard, QrCode, Shield, Lock, ArrowLeft, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';

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
  const [paymentMethod, setPaymentMethod] = React.useState("credit_card");
  const [showPaymentForm, setShowPaymentForm] = React.useState(false);
  const [mpPublicKey, setMpPublicKey] = React.useState(null);
  const [preferenceId, setPreferenceId] = React.useState(null);
  const [pixCode, setPixCode] = React.useState(null);
  const [pixQrCode, setPixQrCode] = React.useState(null);
  
  const planId = new URLSearchParams(location.search).get("plan");
  const plan = plans[planId];

  React.useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => navigate(createPageUrl("Pricing")))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    // Inicializar MercadoPago com a chave pública
    const publicKey = 'APP_USR-0e2e6f23-8e07-45a5-ae3f-b6e71bec0c19';
    setMpPublicKey(publicKey);
    initMercadoPago(publicKey);
  }, []);

  const handleInitiateCheckout = async () => {
    setProcessing(true);
    try {
      const response = await base44.functions.invoke('createMercadoPagoCheckout', { 
        planId,
        paymentMethod: paymentMethod === "pix" ? "pix" : "credit_card"
      });
      
      if (response.data.success) {
        if (paymentMethod === "pix" && response.data.pix_code) {
          setPixCode(response.data.pix_code);
          setPixQrCode(response.data.pix_qr_code);
          setShowPaymentForm(true);
        } else if (paymentMethod === "credit_card" && response.data.preference_id) {
          setPreferenceId(response.data.preference_id);
          setShowPaymentForm(true);
        }
      } else {
        alert('Erro ao processar pagamento. Tente novamente.');
      }
      setProcessing(false);
    } catch (error) {
      alert('Erro: ' + error.message);
      setProcessing(false);
    }
  };

  const onSubmit = async (formData) => {
    setProcessing(true);
    try {
      const response = await base44.functions.invoke('processMercadoPagoPayment', {
        formData,
        planId,
        userId: user.id
      });

      if (response.data.success) {
        navigate(createPageUrl("PaymentSuccess") + "?status=success");
      } else {
        alert(response.data.error || 'Erro ao processar pagamento');
        setProcessing(false);
      }
    } catch (error) {
      alert('Erro ao processar pagamento: ' + error.message);
      setProcessing(false);
    }
  };

  const onError = (error) => {
    console.error('Erro no pagamento:', error);
    alert('Erro ao processar pagamento. Tente novamente.');
    setProcessing(false);
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    alert('Código PIX copiado!');
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
              {!showPaymentForm ? (
                <>
                  <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Método de Pagamento
                  </h2>

                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-4">
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
                    onClick={handleInitiateCheckout}
                    disabled={processing}
                    className="w-full mt-8 h-12 text-base font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      `Continuar para Pagamento - R$ ${plan.price.toFixed(2).replace('.', ',')}`
                    )}
                  </Button>

                  <p className={`text-xs text-center mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Pagamento 100% seguro processado pelo Mercado Pago. Cancele a qualquer momento.
                  </p>
                </>
              ) : (
                <>
                  {/* Payment Form */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {paymentMethod === "pix" ? "Pagamento via PIX" : "Dados do Cartão"}
                    </h2>
                    <button
                      onClick={() => setShowPaymentForm(false)}
                      className={`p-2 rounded-lg hover:bg-gray-100 ${isDark ? 'hover:bg-neutral-800' : ''}`}
                    >
                      <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                    </button>
                  </div>

                  {paymentMethod === "pix" && pixCode ? (
                    <div className="space-y-6">
                      <div className={`p-6 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'} text-center`}>
                        {pixQrCode && (
                          <img src={pixQrCode} alt="QR Code PIX" className="w-64 h-64 mx-auto mb-4" />
                        )}
                        <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          Escaneie o QR Code com o app do seu banco ou copie o código PIX abaixo:
                        </p>
                        <div className={`p-3 rounded border ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'} mb-3`}>
                          <code className={`text-xs break-all ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {pixCode}
                          </code>
                        </div>
                        <Button onClick={copyPixCode} variant="outline" className="w-full">
                          Copiar Código PIX
                        </Button>
                      </div>
                      <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Após o pagamento, você será redirecionado automaticamente ou pode fechar esta janela.
                      </p>
                    </div>
                  ) : paymentMethod === "credit_card" && preferenceId && mpPublicKey ? (
                    <div className="space-y-4">
                      <CardPayment
                        initialization={{ 
                          amount: plan.price,
                          payer: {
                            email: user?.email
                          }
                        }}
                        onSubmit={onSubmit}
                        onError={onError}
                        customization={{
                          visual: {
                            style: {
                              theme: isDark ? 'dark' : 'default'
                            }
                          },
                          paymentMethods: {
                            maxInstallments: 12
                          }
                        }}
                      />
                      {processing && (
                        <div className="flex items-center justify-center gap-2 py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            Processando pagamento...
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
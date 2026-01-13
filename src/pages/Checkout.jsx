import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Check, CreditCard, QrCode, Shield, Lock, ArrowLeft, Loader2, Copy } from "lucide-react";
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
  const [mpPublicKey, setMpPublicKey] = React.useState(null);
  const [mpReady, setMpReady] = React.useState(false);
  const [showPaymentForm, setShowPaymentForm] = React.useState(false);
  const [couponCode, setCouponCode] = React.useState('');
  const [couponApplied, setCouponApplied] = React.useState(null);
  const [validatingCoupon, setValidatingCoupon] = React.useState(false);
  const [couponError, setCouponError] = React.useState('');

  
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

  React.useEffect(() => {
    const loadMercadoPago = async () => {
      try {
        console.log('Buscando public key...');
        const response = await base44.functions.invoke('getMercadoPagoPublicKey');
        const publicKey = response.data.publicKey;
        
        console.log('Public key recebida:', publicKey);
        
        if (!publicKey || (!publicKey.startsWith('TEST-') && !publicKey.startsWith('APP_USR-'))) {
          console.error('Public Key inválida:', publicKey);
          alert('Erro na configuração do Mercado Pago. Contate o suporte.');
          return;
        }
        
        console.log('Inicializando Mercado Pago SDK...');
        setMpPublicKey(publicKey);
        
        try {
          initMercadoPago(publicKey, { locale: 'pt-BR' });
          console.log('SDK inicializado');
          
          // Aguardar SDK estar pronto
          setTimeout(() => {
            console.log('SDK pronto para uso');
            setMpReady(true);
          }, 1000);
        } catch (sdkError) {
          console.error('Erro ao inicializar SDK:', sdkError);
          alert('Erro ao inicializar sistema de pagamento.');
        }
      } catch (error) {
        console.error('Erro ao carregar Mercado Pago:', error);
        alert('Erro ao carregar sistema de pagamento. Tente novamente.');
      }
    };
    
    if (user) {
      loadMercadoPago();
    }
  }, [user]);



  const handleInitiateCheckout = async () => {
    if (!mpReady) {
      alert('Sistema de pagamento ainda carregando. Aguarde...');
      return;
    }
    setShowPaymentForm(true);
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Digite um cupom');
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');

    try {
      const response = await base44.functions.invoke('validateCoupon', {
        plano: planId,
        cupom: couponCode.toUpperCase()
      });

      if (response.data.valid) {
        setCouponApplied(response.data);
        setCouponError('');
      }
    } catch (error) {
      setCouponError(error.response?.data?.message || 'Cupom inválido');
      setCouponApplied(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponApplied(null);
    setCouponError('');
  };

  const onSubmit = async (formData) => {
    setProcessing(true);
    console.log('Dados do formulário Mercado Pago:', formData);
    
    // Recuperar código de afiliado do localStorage
    const getAffiliateCode = () => {
      try {
        const stored = localStorage.getItem('affiliate_ref');
        if (!stored) return null;
        const data = JSON.parse(stored);
        if (new Date().getTime() > data.expires) {
          localStorage.removeItem('affiliate_ref');
          return null;
        }
        return data.code;
      } catch (error) {
        return null;
      }
    };

    const affiliateCode = getAffiliateCode();
    
    try {
      const response = await base44.functions.invoke('processDirectPayment', {
        formData,
        planId,
        userEmail: user.email,
        affiliateCode,
        couponCode: couponApplied ? couponCode.toUpperCase() : null,
        finalPrice: couponApplied ? couponApplied.precoFinal : null
      });

      console.log('Resposta do pagamento:', response.data);

      if (response.data?.status === 'approved') {
        navigate(createPageUrl("PaymentSuccess") + "?status=success");
      } else if (response.data?.status === 'pending') {
        navigate(createPageUrl("PaymentSuccess") + "?status=pending");
      } else {
        setProcessing(false);
        alert(response.data?.error || 'Pagamento não aprovado. Verifique os dados e tente novamente.');
      }
    } catch (error) {
      setProcessing(false);
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento: ' + error.message);
    }
  };

  const onError = (error) => {
    console.error('Erro no pagamento:', error);
    alert('Erro ao processar pagamento. Verifique os dados e tente novamente.');
    setProcessing(false);
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

              {/* Coupon Input */}
              <div className={`border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'} pt-6 mb-6`}>
                <Label className={`mb-2 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Cupom de Desconto
                </Label>
                {!couponApplied ? (
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Digite o cupom"
                      disabled={validatingCoupon}
                      className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                    />
                    <Button
                      onClick={handleValidateCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      {validatingCoupon ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Aplicar'
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                        {couponCode} aplicado (-{couponApplied.percentual}%)
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className={`text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      Remover
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-sm text-red-500 mt-2">{couponError}</p>
                )}
              </div>

              {/* Price */}
              <div className={`border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'} pt-6`}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                  <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    R$ {(couponApplied?.precoBase || plan.price).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-green-600 font-medium">Desconto ({couponApplied.percentual}%)</span>
                    <span className="text-green-600 font-bold">
                      - R$ {couponApplied.desconto.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
                {plan.priceMonthly && !couponApplied && (
                  <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    R$ {plan.priceMonthly.toFixed(2).replace('.', ',')} por mês
                  </div>
                )}
                {plan.savings && !couponApplied && (
                  <div className="text-sm text-green-500 font-medium mt-1">
                    {plan.savings}
                  </div>
                )}
                <div className="flex justify-between items-baseline mt-4 pt-4 border-t border-dashed border-gray-300">
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Total</span>
                  <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    R$ {(couponApplied?.precoFinal || plan.price).toFixed(2).replace('.', ',')}
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

                  <div className="space-y-4">
                    {/* Credit Card */}
                    <div className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                      isDark 
                        ? 'border-white bg-white/5' 
                        : 'border-gray-900 bg-gray-50'
                    }`}>
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
                    </div>
                  </div>

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
                    disabled={processing || !mpReady}
                    className="w-full mt-8 h-12 text-base font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : !mpPublicKey ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Carregando sistema de pagamento...
                      </>
                    ) : (
                      `Continuar para Pagamento - R$ ${(couponApplied?.precoFinal || plan.price).toFixed(2).replace('.', ',')}`
                    )}
                  </Button>

                  <p className={`text-xs text-center mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Pagamento 100% seguro processado pelo Mercado Pago
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <button
                      onClick={() => setShowPaymentForm(false)}
                      className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar
                    </button>
                  </div>
                  
                  <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Dados do Cartão
                  </h2>

                  {mpReady ? (
                    <div className="space-y-4">
                      {console.log('Renderizando CardPayment com:', { amount: couponApplied?.precoFinal || plan.price, email: user?.email, mpReady })}
                      <CardPayment
                        initialization={{ 
                          amount: couponApplied?.precoFinal || plan.price,
                          payer: {
                            email: user?.email
                          }
                        }}
                        onSubmit={onSubmit}
                        onError={onError}
                        onReady={() => console.log('CardPayment pronto')}
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
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Carregando formulário de pagamento...
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        mpPublicKey: {mpPublicKey ? 'OK' : 'Carregando...'} | mpReady: {mpReady ? 'Sim' : 'Não'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
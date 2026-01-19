import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Check, CreditCard, Shield, Lock, Sparkles, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import SubscriptionRegulation from "@/components/subscription/SubscriptionRegulation";

export default function OfertaEspecial({ theme = 'light' }) {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);
  const [mpPublicKey, setMpPublicKey] = React.useState(null);
  const [mpReady, setMpReady] = React.useState(false);
  const [showPaymentForm, setShowPaymentForm] = React.useState(false);
  const [regulationAccepted, setRegulationAccepted] = React.useState(false);

  const offerPrice = 599.40;
  const originalPrice = 1198.80;
  const monthlyEquivalent = 49.95;

  React.useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => navigate(createPageUrl("LandingPage")))
      .finally(() => setLoading(false));
  }, [navigate]);

  React.useEffect(() => {
    const loadMercadoPago = async () => {
      try {
        const response = await base44.functions.invoke('getMercadoPagoPublicKey');
        const publicKey = response.data.publicKey;
        
        if (!publicKey || (!publicKey.startsWith('TEST-') && !publicKey.startsWith('APP_USR-'))) {
          console.error('Public Key inválida:', publicKey);
          alert('Erro na configuração do Mercado Pago. Contate o suporte.');
          return;
        }
        
        setMpPublicKey(publicKey);
        
        try {
          initMercadoPago(publicKey, { locale: 'pt-BR' });
          setTimeout(() => {
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

  const onSubmit = async (formData) => {
    setProcessing(true);
    
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
        planId: 'pro_yearly_oferta',
        userEmail: user.email,
        affiliateCode,
        couponCode: null,
        finalPrice: offerPrice
      });

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

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'} py-12`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header com Badge de Oferta */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="font-bold text-sm">OFERTA ESPECIAL LIMITADA</span>
          </div>
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Oferta Exclusiva Juris Pro
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            50% de desconto no plano anual
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Offer Details */}
          <div>
            <div className={`rounded-lg ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'} border p-8`}>
              <div className="flex items-center gap-2 mb-6">
                <Crown className="w-6 h-6 text-amber-500" />
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Plano Anual - Oferta
                </h2>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className={`text-2xl line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    R$ {originalPrice.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                    -50%
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-green-600">
                    R$ {offerPrice.toFixed(2).replace('.', ',')}
                  </span>
                  <span className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    /ano
                  </span>
                </div>
                <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Equivalente a R$ {monthlyEquivalent.toFixed(2).replace('.', ',')} por mês
                </p>
                <p className="text-sm text-green-600 font-medium mt-1">
                  Economize R$ {(originalPrice - offerPrice).toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {[
                  "IA Ilimitada - sem limites de uso",
                  "Todos os recursos premium",
                  "Suporte prioritário",
                  "Atualizações gratuitas",
                  "Acesso por 12 meses completos",
                  "Parcelamento em até 12x"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{feature}</span>
                  </div>
                ))}
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

          {/* Right Column - Payment */}
          <div>
            <div className={`rounded-lg ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'} border p-8`}>
              {!showPaymentForm ? (
                <>
                  <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Garantir Minha Oferta
                  </h2>

                  <div className={`flex items-center gap-4 p-4 rounded-lg border-2 mb-6 ${
                    isDark ? 'border-white bg-white/5' : 'border-gray-900 bg-gray-50'
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

                  <div className={`pt-6 border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
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

                  <div className="mt-6">
                    <SubscriptionRegulation
                      accepted={regulationAccepted}
                      onAcceptChange={setRegulationAccepted}
                      isDark={isDark}
                    />
                  </div>

                  <Button
                    onClick={handleInitiateCheckout}
                    disabled={processing || !mpReady || !regulationAccepted}
                    className="w-full mt-8 h-12 text-base font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : !mpPublicKey ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      `Garantir Oferta - R$ ${offerPrice.toFixed(2).replace('.', ',')}`
                    )}
                  </Button>

                  <p className={`text-xs text-center mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Oferta válida apenas para novos assinantes
                  </p>
                </>
              ) : (
                <>
                  <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Dados do Cartão
                  </h2>

                  {mpReady ? (
                    <div className="space-y-4">
                      <div id="cardPaymentBrick_container"></div>
                      <CardPayment
                        initialization={{ 
                          amount: offerPrice,
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
                            creditCard: 'all',
                            debitCard: 'all',
                            maxInstallments: 12,
                            minInstallments: 1
                          }
                        }}
                      />
                      {processing && (
                        <div className="flex items-center justify-center gap-2 py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            Processando pagamento...
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Carregando formulário de pagamento...
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
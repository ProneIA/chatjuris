import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Shield, Lock, CreditCard, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CheckoutModal({ open, onClose, plan, userEmail }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: userEmail || "",
    cpf: "",
    phone: ""
  });

  const planDetails = {
    pro_monthly: {
      name: "Profissional Mensal",
      price: "R$ 119,90",
      period: "/mês",
      checkout: "https://pay.hotmart.com/Q104225643H",
      features: [
        "Assistente Jurídico IA ilimitado",
        "Análise de documentos com IA",
        "Geração de peças jurídicas",
        "Pesquisa de jurisprudência",
        "Calculadoras jurídicas avançadas",
        "Gestão completa de casos",
        "Suporte prioritário 24/7"
      ]
    },
    pro_yearly: {
      name: "Profissional Anual",
      price: "R$ 1.198,80",
      period: "/ano",
      monthly: "R$ 99,90/mês",
      discount: "17% de economia",
      checkout: "https://pay.hotmart.com/T104226080W",
      features: [
        "Tudo do plano mensal",
        "2 meses grátis no plano anual",
        "Economia de R$ 240/ano",
        "Acesso vitalício a atualizações",
        "Treinamento exclusivo",
        "API de integração",
        "Consultoria técnica mensal"
      ]
    }
  };

  const currentPlan = planDetails[plan];

  if (!currentPlan) {
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else {
      // Redirecionar para Hotmart com dados pré-preenchidos
      const checkoutUrl = new URL(currentPlan.checkout);
      if (formData.email) {
        checkoutUrl.searchParams.set('email', formData.email);
      }
      if (formData.name) {
        checkoutUrl.searchParams.set('name', formData.name);
      }
      window.location.href = checkoutUrl.toString();
    }
  };

  const isStep1Valid = formData.name && formData.email;
  const isStep2Valid = formData.cpf && formData.phone;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Complete sua assinatura
                </DialogTitle>
                <p className="text-gray-600 mt-2">
                  Você está a poucos passos de ter acesso completo à plataforma
                </p>
              </DialogHeader>

              {/* Plan Summary */}
              <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{currentPlan.name}</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">{currentPlan.price}</span>
                      <span className="text-gray-600">{currentPlan.period}</span>
                    </div>
                    {currentPlan.monthly && (
                      <p className="text-sm text-purple-700 font-medium mt-1">{currentPlan.monthly}</p>
                    )}
                    {currentPlan.discount && (
                      <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        {currentPlan.discount}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-purple-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Incluído no plano:</p>
                  <div className="grid gap-2">
                    {currentPlan.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-900 font-medium">Nome completo *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    className="mt-1.5"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-900 font-medium">E-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    className="mt-1.5"
                    required
                  />
                </div>
              </div>

              <Button
                onClick={handleContinue}
                disabled={!isStep1Valid}
                className="w-full mt-6 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-base"
              >
                Continuar
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4">
                Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Finalize sua assinatura
                </DialogTitle>
                <p className="text-gray-600 mt-2">
                  Mais alguns dados para garantir a segurança da sua compra
                </p>
              </DialogHeader>

              {/* Form Step 2 */}
              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="cpf" className="text-gray-900 font-medium">CPF *</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="mt-1.5"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-900 font-medium">Telefone/WhatsApp *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="mt-1.5"
                    required
                  />
                </div>
              </div>

              {/* Security badges */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3 mb-3">
                  <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Pagamento 100% seguro</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Processado pela Hotmart, a maior plataforma de produtos digitais da América Latina
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mb-3">
                  <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Dados criptografados</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Certificado SSL e conformidade com LGPD
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Múltiplas formas de pagamento</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Cartão de crédito, PIX, boleto e mais
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 h-12 font-semibold"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={!isStep2Valid}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-base"
                >
                  Ir para pagamento
                  <Lock className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-4">
                Você será redirecionado para o ambiente seguro de pagamento
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
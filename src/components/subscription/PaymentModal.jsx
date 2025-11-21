import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  X, 
  CreditCard, 
  QrCode, 
  Barcode, 
  Check, 
  Copy,
  Shield,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function PaymentModal({ plan, onClose, onComplete }) {
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixCode, setPixCode] = useState("");
  const [boletoCode, setBoletoCode] = useState("");

  // Simula geração de PIX
  const generatePixCode = () => {
    return "00020126580014br.gov.bcb.pix0136" + Math.random().toString(36).substring(2, 15);
  };

  // Simula geração de Boleto
  const generateBoletoCode = () => {
    return "23791.12345 60001.012345 67890.101234 5 12340000" + (plan.price * 100).toFixed(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simula processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (paymentMethod === "pix") {
      const code = generatePixCode();
      setPixCode(code);
      toast.info("💡 Após pagar, você receberá um código de ativação por email");
    } else if (paymentMethod === "boleto") {
      const code = generateBoletoCode();
      setBoletoCode(code);
      toast.info("💡 Após pagar, você receberá um código de ativação por email");
    } else {
      // Cartão - redireciona para link externo
      toast.info("💡 Você será redirecionado para finalizar o pagamento. Após confirmar, receberá um código de ativação.");
      // Aqui seria o link real do gateway
      // window.open('URL_DO_GATEWAY', '_blank');
      setTimeout(() => {
        toast.success("Pagamento processado! Verifique seu email para o código de ativação.");
        onClose();
      }, 3000);
    }

    setIsProcessing(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para área de transferência!");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6 rounded-t-3xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Finalizar Assinatura</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">
                R$ {plan.price.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-lg opacity-90">/mês</span>
            </div>
            <p className="text-white/90 mt-2">Plano {plan.name}</p>
          </div>

          <div className="p-6">
            {/* Payment Methods */}
            {!pixCode && !boletoCode && (
              <>
                <div className="mb-6">
                  <Label className="text-lg font-semibold mb-4 block">
                    Escolha a forma de pagamento
                  </Label>
                  <div className="grid gap-3">
                    <button
                      onClick={() => setPaymentMethod("credit_card")}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === "credit_card"
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        paymentMethod === "credit_card"
                          ? "bg-blue-500"
                          : "bg-slate-100"
                      }`}>
                        <CreditCard className={`w-6 h-6 ${
                          paymentMethod === "credit_card" ? "text-white" : "text-slate-600"
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-slate-900">Cartão de Crédito</p>
                        <p className="text-sm text-slate-600">Aprovação instantânea</p>
                      </div>
                      {paymentMethod === "credit_card" && (
                        <Check className="w-6 h-6 text-blue-500" />
                      )}
                    </button>

                    <button
                      onClick={() => setPaymentMethod("debit_card")}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === "debit_card"
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        paymentMethod === "debit_card"
                          ? "bg-blue-500"
                          : "bg-slate-100"
                      }`}>
                        <CreditCard className={`w-6 h-6 ${
                          paymentMethod === "debit_card" ? "text-white" : "text-slate-600"
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-slate-900">Cartão de Débito</p>
                        <p className="text-sm text-slate-600">Débito em conta corrente</p>
                      </div>
                      {paymentMethod === "debit_card" && (
                        <Check className="w-6 h-6 text-blue-500" />
                      )}
                    </button>

                    <button
                      onClick={() => setPaymentMethod("pix")}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === "pix"
                          ? "border-green-500 bg-green-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        paymentMethod === "pix"
                          ? "bg-green-500"
                          : "bg-slate-100"
                      }`}>
                        <QrCode className={`w-6 h-6 ${
                          paymentMethod === "pix" ? "text-white" : "text-slate-600"
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-slate-900">PIX</p>
                        <p className="text-sm text-slate-600">Pagamento instantâneo</p>
                      </div>
                      {paymentMethod === "pix" && (
                        <Check className="w-6 h-6 text-green-500" />
                      )}
                    </button>

                    <button
                      onClick={() => setPaymentMethod("boleto")}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === "boleto"
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        paymentMethod === "boleto"
                          ? "bg-orange-500"
                          : "bg-slate-100"
                      }`}>
                        <Barcode className={`w-6 h-6 ${
                          paymentMethod === "boleto" ? "text-white" : "text-slate-600"
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-slate-900">Boleto Bancário</p>
                        <p className="text-sm text-slate-600">Vence em 3 dias úteis</p>
                      </div>
                      {paymentMethod === "boleto" && (
                        <Check className="w-6 h-6 text-orange-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Form */}
                {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="card_number">Número do Cartão</Label>
                      <Input
                        id="card_number"
                        placeholder="0000 0000 0000 0000"
                        required
                        maxLength={19}
                      />
                    </div>
                    <div>
                      <Label htmlFor="card_name">Nome no Cartão</Label>
                      <Input
                        id="card_name"
                        placeholder="Como está no cartão"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Validade</Label>
                        <Input
                          id="expiry"
                          placeholder="MM/AA"
                          required
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          required
                          maxLength={4}
                          type="password"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <p className="text-xs text-blue-900">
                        Seus dados estão protegidos com criptografia SSL de 256 bits
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-6 text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>Confirmar Pagamento</>
                      )}
                    </Button>
                  </form>
                )}

                {/* PIX/Boleto Button */}
                {(paymentMethod === "pix" || paymentMethod === "boleto") && (
                  <Button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className={`w-full py-6 text-lg font-bold ${
                      paymentMethod === "pix"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-orange-600 hover:bg-orange-700"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>Gerar {paymentMethod === "pix" ? "Código PIX" : "Boleto"}</>
                    )}
                  </Button>
                )}
              </>
            )}

            {/* PIX Code Display */}
            {pixCode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    PIX Gerado com Sucesso!
                  </h3>
                  <p className="text-slate-600">
                    Copie o código abaixo e cole no seu app de pagamento
                  </p>
                </div>

                <Card className="p-4 bg-green-50 border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-green-900">CÓDIGO PIX:</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white p-3 rounded border border-green-300 break-all">
                      {pixCode}
                    </code>
                    <Button
                      size="icon"
                      onClick={() => copyToClipboard(pixCode)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-900 font-semibold mb-2">
                    📧 Próximos passos:
                  </p>
                  <ol className="text-xs text-blue-900 space-y-1 ml-4">
                    <li>1. Pague o PIX no seu banco</li>
                    <li>2. Receba o código de ativação por email (até 5 min)</li>
                    <li>3. Ative seu plano na área de configurações</li>
                  </ol>
                </div>

                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full"
                >
                  Fechar
                </Button>
              </motion.div>
            )}

            {/* Boleto Code Display */}
            {boletoCode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Barcode className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Boleto Gerado!
                  </h3>
                  <p className="text-slate-600">
                    Pague até a data de vencimento em qualquer banco
                  </p>
                </div>

                <Card className="p-4 bg-orange-50 border-2 border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-orange-900">CÓDIGO DE BARRAS:</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white p-3 rounded border border-orange-300 break-all font-mono">
                      {boletoCode}
                    </code>
                    <Button
                      size="icon"
                      onClick={() => copyToClipboard(boletoCode)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-900">
                    📅 Vencimento: {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-blue-900 mt-2 font-semibold">
                    📧 Entre em contato para ativar seu plano após o pagamento.
                  </p>
                </div>

                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full"
                >
                  Fechar
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
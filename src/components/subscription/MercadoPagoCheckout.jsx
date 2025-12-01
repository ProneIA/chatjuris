import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function MercadoPagoCheckout({ 
  open, 
  onOpenChange, 
  planName = "Juris Pro",
  amount = 49.90,
  onSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('mercadopagoSubscription', {
        action: "create",
        plan_name: planName,
        amount: amount,
        back_url: `${window.location.origin}/PaymentSuccess`
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const checkoutUrl = response.data.init_point || response.data.sandbox_init_point;
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("URL de checkout não disponível");
      }

    } catch (err) {
      console.error("Erro ao criar assinatura:", err);
      setError(err.message || "Erro ao processar pagamento");
      toast.error("Erro ao iniciar pagamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Assinar {planName}
          </DialogTitle>
          <DialogDescription>
            Pagamento seguro via Mercado Pago
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900">{planName}</span>
              <span className="text-2xl font-bold text-blue-600">
                R$ {amount.toFixed(2)}
                <span className="text-sm font-normal text-gray-500">/mês</span>
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Cobrança mensal recorrente. Cancele quando quiser.
            </p>
          </div>

          <div className="space-y-2">
            {[
              "IA ilimitada para documentos",
              "Pesquisa jurisprudencial avançada",
              "Templates profissionais",
              "Suporte prioritário"
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {benefit}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-[#009ee3] hover:bg-[#008ed0] text-white h-12"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              "Pagar com Mercado Pago"
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Ao assinar, você concorda com nossos termos de uso e política de privacidade.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
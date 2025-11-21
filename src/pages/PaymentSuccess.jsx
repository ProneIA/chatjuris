import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing"); // processing, success, error

  useEffect(() => {
    const activatePro = async () => {
      try {
        const user = await base44.auth.me();
        const orderId = searchParams.get('order_id') || searchParams.get('transaction_id') || `CAKTO_${Date.now()}`;
        
        // Buscar subscription existente
        let subs = await base44.entities.Subscription.filter({ user_id: user.id });
        if (subs.length === 0) {
          subs = await base44.entities.Subscription.filter({ user_id: user.email });
        }

        const data = {
          plan: "pro",
          status: "active",
          daily_actions_limit: 999999,
          daily_actions_used: 0,
          payment_status: "paid",
          payment_method: "external",
          payment_external_url: "https://pay.cakto.com.br/3ek2n8h_660515",
          cakto_order_id: orderId,
          price: 49.99,
          start_date: new Date().toISOString().split('T')[0],
          last_reset_date: new Date().toISOString().split('T')[0],
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };

        if (subs.length > 0) {
          await base44.entities.Subscription.update(subs[0].id, data);
        } else {
          await base44.entities.Subscription.create({
            user_id: user.id,
            ...data
          });
        }

        setStatus("success");
        setTimeout(() => {
          navigate(createPageUrl('AIAssistant'));
        }, 3000);
      } catch (error) {
        console.error("Erro ao ativar plano:", error);
        setStatus("error");
      }
    };

    activatePro();
  }, []);

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Erro ao Ativar
            </h2>
            <p className="text-slate-600 mb-6">
              Entre em contato com o suporte
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <Card className="max-w-md border-2 border-green-500 shadow-2xl">
            <CardContent className="pt-12 pb-12 text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 360, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                🎉 Pagamento Confirmado!
              </h2>
              
              <p className="text-lg text-slate-700 mb-6">
                Seu <strong>Plano PRO</strong> está ativo
              </p>

              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-bold text-lg">Acesso Total Liberado</span>
                </div>
                <p className="text-sm opacity-90">
                  Ações Ilimitadas • Todos os Recursos • Suporte Priority
                </p>
              </div>

              <p className="text-sm text-slate-500">
                Redirecionando para o Assistente IA em 3 segundos...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="max-w-md">
        <CardContent className="pt-12 pb-12 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Loader2 className="w-10 h-10 text-blue-600" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Ativando seu Plano PRO
          </h2>
          
          <p className="text-slate-600">
            Aguarde enquanto processamos sua assinatura...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
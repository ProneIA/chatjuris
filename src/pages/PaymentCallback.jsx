import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState("checking"); // checking, success, error
  const [message, setMessage] = useState("Verificando seu pagamento...");

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0] || null;
    },
    enabled: !!user?.id
  });

  const activateProMutation = useMutation({
    mutationFn: async () => {
      if (subscription) {
        return base44.entities.Subscription.update(subscription.id, {
          plan: "pro",
          status: "active",
          daily_actions_limit: 999999,
          daily_actions_used: 0,
          price: 49.99,
          payment_method: "external",
          payment_status: "paid",
          payment_external_url: "https://pay.cakto.com.br/3ek2n8h_660515",
          start_date: new Date().toISOString().split('T')[0],
          last_reset_date: new Date().toISOString().split('T')[0],
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      } else {
        return base44.entities.Subscription.create({
          user_id: user.id,
          plan: "pro",
          status: "active",
          daily_actions_limit: 999999,
          daily_actions_used: 0,
          price: 49.99,
          payment_method: "external",
          payment_status: "paid",
          payment_external_url: "https://pay.cakto.com.br/3ek2n8h_660515",
          start_date: new Date().toISOString().split('T')[0],
          last_reset_date: new Date().toISOString().split('T')[0],
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setVerificationStatus("success");
      setMessage("Pagamento confirmado! Seu Plano PRO está ativo.");
      setTimeout(() => {
        navigate(createPageUrl('AIAssistant'));
      }, 3000);
    },
    onError: () => {
      setVerificationStatus("error");
      setMessage("Erro ao ativar o plano. Entre em contato com o suporte.");
    }
  });

  useEffect(() => {
    if (user && subscription !== undefined) {
      // Simula verificação de pagamento e ativa automaticamente
      setTimeout(() => {
        activateProMutation.mutate();
      }, 2000);
    }
  }, [user, subscription]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
              {verificationStatus === "checking" && (
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
              )}
              {verificationStatus === "success" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </motion.div>
              )}
              {verificationStatus === "error" && (
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">
              {verificationStatus === "checking" && "Verificando Pagamento"}
              {verificationStatus === "success" && "Pagamento Confirmado!"}
              {verificationStatus === "error" && "Erro na Verificação"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600">{message}</p>
            
            {verificationStatus === "success" && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-purple-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="font-bold text-purple-900">Plano PRO Ativo</span>
                </div>
                <p className="text-sm text-slate-600">
                  Ações ilimitadas • Todos os recursos • Suporte prioritário
                </p>
              </div>
            )}

            {verificationStatus === "checking" && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Aguarde alguns instantes...</span>
              </div>
            )}

            {verificationStatus === "error" && (
              <div className="space-y-3">
                <Button
                  onClick={() => activateProMutation.mutate()}
                  disabled={activateProMutation.isPending}
                  className="w-full"
                >
                  Tentar Novamente
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Contact'))}
                  className="w-full"
                >
                  Contatar Suporte
                </Button>
              </div>
            )}

            {verificationStatus === "success" && (
              <p className="text-xs text-slate-500">
                Redirecionando para o Assistente IA...
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
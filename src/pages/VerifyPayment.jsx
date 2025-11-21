import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, AlertCircle, Crown, Mail, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function VerifyPayment() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setEmail(u.email);
    });
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

  const activatePlanMutation = useMutation({
    mutationFn: async (orderData) => {
      const data = {
        plan: "pro",
        status: "active",
        daily_actions_limit: 999999,
        daily_actions_used: 0,
        payment_status: "paid",
        payment_method: "external",
        payment_external_url: "https://pay.cakto.com.br/3ek2n8h_660515",
        cakto_order_id: orderData.order_id,
        price: 49.99,
        start_date: new Date().toISOString().split('T')[0],
        last_reset_date: new Date().toISOString().split('T')[0],
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      if (subscription) {
        return base44.entities.Subscription.update(subscription.id, data);
      } else {
        return base44.entities.Subscription.create({
          user_id: user.id,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('✨ Plano Pro ativado com sucesso!');
      setTimeout(() => {
        navigate(createPageUrl('AIAssistant'));
      }, 2000);
    },
    onError: () => {
      toast.error('Erro ao ativar o plano');
    }
  });

  const verifyPayment = async () => {
    if (!email) {
      toast.error('Digite seu email');
      return;
    }

    setChecking(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você precisa verificar se existe um pagamento APROVADO na API Cakto.

IMPORTANTE: Você DEVE retornar payment_confirmed = true SOMENTE se conseguir:
1. Obter token OAuth2 válido da API Cakto (usando CAKTO_CLIENT_ID e CAKTO_CLIENT_SECRET)
2. Fazer requisição GET em https://api.cakto.com.br/api/orders/
3. Encontrar um pedido com status "paid" ou "approved" para o email: ${email}
4. O pedido deve ser recente (últimas 48 horas)

Se NÃO conseguir acessar a API ou NÃO encontrar pagamento aprovado, retorne payment_confirmed = false.

NÃO INVENTE dados. NÃO retorne true se não conseguir verificar.`,
        response_json_schema: {
          type: "object",
          properties: {
            payment_confirmed: { type: "boolean" },
            order_id: { type: "string" },
            message: { type: "string" }
          },
          required: ["payment_confirmed"]
        }
      });

      if (result?.payment_confirmed === true && result?.order_id) {
        await activatePlanMutation.mutateAsync({
          order_id: result.order_id
        });
      } else {
        toast.error(result?.message || 'Nenhum pagamento aprovado encontrado. Aguarde alguns minutos após o pagamento ou entre em contato com o suporte.');
      }
    } catch (error) {
      toast.error('Erro ao verificar pagamento. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  // Ativação manual com ID do pedido
  const activateManual = async () => {
    if (!orderId) {
      toast.error('Digite o ID do pedido');
      return;
    }

    try {
      await activatePlanMutation.mutateAsync({ order_id: orderId });
    } catch (error) {
      toast.error('Erro ao ativar manualmente');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Verificar Pagamento</CardTitle>
          <CardDescription>
            Confirme seu pagamento para ativar o Plano PRO
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 mb-2">
              ℹ️ <strong>Como funciona:</strong>
            </p>
            <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Complete o pagamento no link da Cakto</li>
              <li>Aguarde 1-2 minutos para processamento</li>
              <li>Volte aqui e clique em "Verificar Pagamento"</li>
              <li>Seu plano será ativado automaticamente</li>
            </ol>
          </div>

          {/* Link para pagamento */}
          <Button
            variant="outline"
            onClick={() => window.open('https://pay.cakto.com.br/3ek2n8h_660515', '_blank')}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Link de Pagamento
          </Button>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-slate-900 mb-4">Verificação Automática</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email usado no pagamento
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                onClick={verifyPayment}
                disabled={checking || !email}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white py-6 text-lg"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verificando pagamento...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Verificar Pagamento
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Ativação manual */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-slate-900 mb-2">Ativação Manual</h3>
            <p className="text-xs text-slate-600 mb-4">
              Se a verificação automática não funcionar, digite o ID do seu pedido Cakto
            </p>
            
            <div className="space-y-3">
              <Input
                placeholder="ID do pedido (ex: ORD123456)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
              <Button
                onClick={activateManual}
                disabled={activatePlanMutation.isPending || !orderId}
                variant="outline"
                className="w-full"
              >
                Ativar com ID do Pedido
              </Button>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-amber-900 font-medium mb-1">
                  Aguarde alguns minutos
                </p>
                <p className="text-xs text-amber-800">
                  Após o pagamento, pode levar alguns minutos para o sistema processar. 
                  Se não funcionar após 10 minutos, entre em contato com o suporte.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
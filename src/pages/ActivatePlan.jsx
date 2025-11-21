import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, AlertCircle, Crown, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ActivatePlan() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [paymentFound, setPaymentFound] = useState(false);
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

  const checkPayment = async () => {
    if (!email) {
      toast.error('Digite seu email');
      return;
    }

    setChecking(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `TAREFA CRÍTICA - VERIFICAÇÃO DE PAGAMENTO CAKTO

Você DEVE verificar OBRIGATORIAMENTE se existe um pagamento real e aprovado:

1. OBTENHA o token OAuth2:
   POST https://api.cakto.com.br/oauth/token/
   Headers: Content-Type: application/x-www-form-urlencoded
   Body: grant_type=client_credentials&client_id={CAKTO_CLIENT_ID}&client_secret={CAKTO_CLIENT_SECRET}

2. BUSQUE pedidos do email "${email}":
   GET https://api.cakto.com.br/api/orders/?customer_email=${email}
   Headers: Authorization: Bearer {access_token}

3. VERIFIQUE se existe pedido com:
   - status = "paid" OU "approved" OU "completed"
   - created_at nas últimas 48 horas
   - amount = 4999 ou 5098 (R$ 49,99 ou R$ 50,98)

4. Retorne:
   - payment_found: true APENAS se encontrou pagamento válido e aprovado
   - payment_found: false se NÃO encontrou ou API falhou
   - order_id: o ID do pedido se encontrado

CRÍTICO: Se a API falhar ou não responder, retorne payment_found=false.
NÃO ATIVE sem confirmação real do pagamento.`,
        response_json_schema: {
          type: "object",
          properties: {
            payment_found: { type: "boolean" },
            order_id: { type: "string" },
            error_message: { type: "string" }
          }
        }
      });

      if (result?.payment_found === true) {
        // Atualizar subscription com dados do pedido
        if (subscription) {
          await base44.entities.Subscription.update(subscription.id, {
            plan: "pro",
            status: "active",
            daily_actions_limit: 999999,
            daily_actions_used: 0,
            payment_status: "paid",
            payment_method: "external",
            price: 49.99,
            cakto_order_id: result.order_id || null,
            start_date: new Date().toISOString().split('T')[0],
            last_reset_date: new Date().toISOString().split('T')[0],
            next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
        } else {
          await base44.entities.Subscription.create({
            user_id: user.id,
            plan: "pro",
            status: "active",
            daily_actions_limit: 999999,
            daily_actions_used: 0,
            payment_status: "paid",
            payment_method: "external",
            price: 49.99,
            cakto_order_id: result.order_id || null,
            start_date: new Date().toISOString().split('T')[0],
            last_reset_date: new Date().toISOString().split('T')[0],
            next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
        }
        
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        setPaymentFound(true);
        toast.success('✨ Plano Pro ativado com sucesso!');
        setTimeout(() => {
          navigate(createPageUrl('AIAssistant'));
        }, 2000);
      } else {
        const errorMsg = result?.error_message || 'Nenhum pagamento encontrado';
        toast.error(`${errorMsg}. Aguarde alguns minutos após o pagamento ou entre em contato.`);
      }
    } catch (error) {
      toast.error('Erro ao verificar pagamento. Tente novamente ou contate o suporte.');
    } finally {
      setChecking(false);
    }
  };

  if (paymentFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <Card className="max-w-lg border-2 border-green-500">
            <CardContent className="pt-12 pb-12 text-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                🎉 Plano Pro Ativado!
              </h2>
              <p className="text-slate-600 mb-4">
                Você agora tem acesso ilimitado a todos os recursos
              </p>
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg inline-block">
                <p className="text-sm font-semibold">Ações Ilimitadas • Todos os Modos • Sem Limites</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Ativar Plano Pro</CardTitle>
          <CardDescription>
            Confirme seu pagamento para ativar o acesso ilimitado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 mb-2">
              ℹ️ <strong>Como funciona:</strong>
            </p>
            <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Complete o pagamento no link da Cakto</li>
              <li>Volte aqui e clique em "Verificar Pagamento"</li>
              <li>Seu plano será ativado automaticamente</li>
            </ol>
          </div>

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
            onClick={checkPayment}
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

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-slate-600 mb-3">
              Ainda não pagou?
            </p>
            <Button
              variant="outline"
              onClick={() => window.open('https://pay.cakto.com.br/3ek2n8h_660515', '_blank')}
              className="w-full"
            >
              Ir para Pagamento
            </Button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm text-amber-900 font-medium mb-1">
                  Aguarde alguns minutos
                </p>
                <p className="text-xs text-amber-800">
                  Após o pagamento, pode levar alguns minutos para aparecer no sistema. 
                  Se não funcionar, entre em contato com o suporte.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
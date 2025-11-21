import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Key, Check, AlertCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ActivationCodeModal({ onClose, user }) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const queryClient = useQueryClient();

  const activateMutation = useMutation({
    mutationFn: async (activationCode) => {
      // Buscar código de ativação válido
      const subscriptions = await base44.entities.Subscription.filter({
        activation_code: activationCode,
        activation_code_used: false
      });

      if (subscriptions.length === 0) {
        throw new Error("Código inválido ou já utilizado");
      }

      const activationSub = subscriptions[0];

      // Buscar assinatura do usuário atual
      const userSubs = await base44.entities.Subscription.filter({
        user_id: user.id
      });

      if (userSubs.length > 0) {
        // Atualizar assinatura existente
        await base44.entities.Subscription.update(userSubs[0].id, {
          plan: activationSub.plan,
          status: "active",
          payment_status: "paid",
          payment_method: "activation_code",
          daily_actions_limit: activationSub.daily_actions_limit,
          daily_actions_used: 0,
          start_date: new Date().toISOString().split('T')[0],
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          last_reset_date: new Date().toISOString().split('T')[0]
        });
      } else {
        // Criar nova assinatura
        await base44.entities.Subscription.create({
          user_id: user.id,
          plan: activationSub.plan,
          status: "active",
          payment_status: "paid",
          payment_method: "activation_code",
          daily_actions_limit: activationSub.daily_actions_limit,
          daily_actions_used: 0,
          start_date: new Date().toISOString().split('T')[0],
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          last_reset_date: new Date().toISOString().split('T')[0]
        });
      }

      // Marcar código como usado
      await base44.entities.Subscription.update(activationSub.id, {
        activation_code_used: true
      });

      return activationSub;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success(`🎉 Plano ${data.plan.toUpperCase()} ativado com sucesso!`);
      setTimeout(() => onClose(), 1500);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao ativar código");
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsValidating(true);
    await activateMutation.mutateAsync(code.trim().toUpperCase());
    setIsValidating(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl max-w-md w-full shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6 rounded-t-3xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Ativar Plano</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-white/90 text-sm">
              Insira o código de ativação recebido após o pagamento
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="activation_code" className="text-base font-semibold mb-2 block">
                  Código de Ativação
                </Label>
                <Input
                  id="activation_code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="text-lg font-mono text-center h-14"
                  maxLength={19}
                  required
                  disabled={isValidating}
                />
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Digite o código exatamente como recebeu
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Onde encontro meu código?</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Email de confirmação de pagamento</li>
                      <li>• Painel do administrador</li>
                      <li>• Suporte (caso não tenha recebido)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!code.trim() || isValidating}
                className="w-full py-6 text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Ativar Plano
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-600">
                Problemas com o código?{" "}
                <a href="mailto:suporte@legaltech.com" className="text-blue-600 hover:underline font-semibold">
                  Fale com o suporte
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Crown, AlertCircle, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UsageLimits({ subscription }) {
  const navigate = useNavigate();

  if (!subscription) return null;

  const isPro = subscription.plan === "pro";
  const used = subscription.daily_actions_used || 0;
  const limit = subscription.daily_actions_limit || 5;
  const remaining = Math.max(0, limit - used);
  const percentage = isPro ? 0 : Math.min((used / limit) * 100, 100);
  
  const isLow = remaining <= 1 && !isPro;
  const isOut = remaining === 0 && !isPro;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 border-2 ${
        isOut 
          ? "bg-red-50 border-red-200" 
          : isLow 
          ? "bg-orange-50 border-orange-200"
          : isPro
          ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
          : "bg-blue-50 border-blue-200"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isPro ? (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isOut ? "bg-red-100" : isLow ? "bg-orange-100" : "bg-blue-100"
            }`}>
              {isOut ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <Sparkles className="w-5 h-5 text-blue-600" />
              )}
            </div>
          )}
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {isPro ? "Plano Profissional" : "Plano Gratuito"}
            </h3>
            <p className={`text-xs ${isOut ? "text-red-600 font-semibold" : "text-slate-600"}`}>
              {isPro ? "Uso ilimitado" : isOut ? "Limite diário atingido" : `${remaining} de ${limit} ações hoje`}
            </p>
          </div>
        </div>

        {!isPro && (
          <Button
            onClick={() => navigate(createPageUrl('Pricing'))}
            size="sm"
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:opacity-90 text-white text-xs px-3 py-2 h-auto"
          >
            <Zap className="w-3 h-3 mr-1" />
            Pro
          </Button>
        )}
      </div>

      {/* Progress Bar for Free Plan */}
      {!isPro && (
        <div className="space-y-2">
          <Progress 
            value={percentage} 
            className={`h-3 ${
              isOut 
                ? "[&>div]:bg-red-500" 
                : isLow 
                ? "[&>div]:bg-orange-500" 
                : "[&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-500"
            }`}
          />
          
          {isOut && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3">
              <p className="text-xs text-red-900 leading-relaxed">
                <strong>🚫 Você usou todas as {limit} ações de hoje!</strong>
                <br />
                Volte amanhã ou faça upgrade para uso ilimitado.
              </p>
            </div>
          )}

          {isLow && !isOut && (
            <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
              <p className="text-xs text-orange-900 leading-relaxed">
                ⚠️ Apenas {remaining} {remaining === 1 ? 'ação restante' : 'ações restantes'} hoje!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Unlimited Badge for Pro */}
      {isPro && (
        <div className="bg-white/50 backdrop-blur-sm border-2 border-purple-200 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-purple-900 text-sm">Ações Ilimitadas</span>
          </div>
          <p className="text-xs text-purple-700">
            Use quantas vezes quiser, sem limites!
          </p>
        </div>
      )}

      {/* Upgrade CTA for Free Users */}
      {!isPro && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <Button
            onClick={() => navigate(createPageUrl('Pricing'))}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-semibold"
            size="sm"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade para Ilimitado - R$ 49,99/mês
          </Button>
        </div>
      )}
    </motion.div>
  );
}
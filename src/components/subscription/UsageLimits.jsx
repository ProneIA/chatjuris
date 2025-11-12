import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Crown, TrendingUp, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UsageLimits({ subscription }) {
  const navigate = useNavigate();

  if (!subscription) return null;

  const planNames = {
    free: "Gratuito",
    pro: "Profissional",
    enterprise: "Escritório"
  };

  const planColors = {
    free: "from-slate-500 to-slate-700",
    pro: "from-blue-500 via-purple-500 to-pink-500",
    enterprise: "from-amber-500 to-orange-600"
  };

  const usageItems = [
    {
      name: "Conversas",
      used: subscription.conversations_used || 0,
      limit: subscription.conversations_limit || 5,
      icon: "💬"
    },
    {
      name: "Documentos",
      used: subscription.documents_used || 0,
      limit: subscription.documents_limit || 2,
      icon: "📄"
    },
    {
      name: "Jurisprudência",
      used: subscription.jurisprudence_searches_used || 0,
      limit: subscription.jurisprudence_searches_limit || 2,
      icon: "⚖️"
    }
  ];

  const isLimitReached = usageItems.some(item => item.used >= item.limit && item.limit < 999999);
  const isNearLimit = usageItems.some(item => {
    const percentage = (item.used / item.limit) * 100;
    return percentage >= 80 && percentage < 100 && item.limit < 999999;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {subscription.plan === 'free' ? (
            <Sparkles className="w-6 h-6 text-slate-600" />
          ) : subscription.plan === 'enterprise' ? (
            <Crown className="w-6 h-6 text-amber-500" />
          ) : (
            <TrendingUp className="w-6 h-6 text-purple-600" />
          )}
          <div>
            <h3 className="font-bold text-slate-900">
              Plano {planNames[subscription.plan]}
            </h3>
            <p className="text-xs text-slate-500">Uso mensal</p>
          </div>
        </div>
        
        {subscription.plan === 'free' && (
          <Button
            onClick={() => navigate(createPageUrl('Pricing'))}
            size="sm"
            className={`bg-gradient-to-r ${planColors.pro} text-white hover:opacity-90`}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Upgrade
          </Button>
        )}
      </div>

      {/* Warning Banner */}
      {(isLimitReached || isNearLimit) && subscription.plan === 'free' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-4 p-4 rounded-xl border-2 ${
            isLimitReached 
              ? "bg-red-50 border-red-200" 
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
              isLimitReached ? "text-red-600" : "text-yellow-600"
            }`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold mb-1 ${
                isLimitReached ? "text-red-900" : "text-yellow-900"
              }`}>
                {isLimitReached 
                  ? "🚫 Limite Atingido!" 
                  : "⚠️ Limite Quase Atingido"}
              </p>
              <p className={`text-xs ${
                isLimitReached ? "text-red-700" : "text-yellow-700"
              }`}>
                {isLimitReached
                  ? "Faça upgrade para continuar usando todos os recursos."
                  : "Você está próximo do seu limite mensal. Considere fazer upgrade."}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Usage Bars */}
      <div className="space-y-4">
        {usageItems.map((item, index) => {
          const percentage = item.limit < 999999 
            ? Math.min((item.used / item.limit) * 100, 100)
            : 0;
          const isUnlimited = item.limit >= 999999;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">
                  {item.icon} {item.name}
                </span>
                {isUnlimited ? (
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                    ∞ Ilimitado
                  </Badge>
                ) : (
                  <span className={`text-sm font-bold ${
                    percentage >= 100 
                      ? "text-red-600" 
                      : percentage >= 80 
                      ? "text-yellow-600" 
                      : "text-slate-600"
                  }`}>
                    {item.used} / {item.limit}
                  </span>
                )}
              </div>
              
              {!isUnlimited && (
                <Progress 
                  value={percentage} 
                  className={`h-2 ${
                    percentage >= 100 
                      ? "[&>div]:bg-red-500" 
                      : percentage >= 80 
                      ? "[&>div]:bg-yellow-500" 
                      : "[&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-500"
                  }`}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      {subscription.plan === 'free' && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-600 text-center mb-3">
            🚀 Desbloqueie recursos ilimitados
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Pricing'))}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:opacity-90 text-white"
          >
            Ver Planos Premium
          </Button>
        </div>
      )}
    </motion.div>
  );
}
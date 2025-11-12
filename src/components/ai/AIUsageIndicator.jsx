import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Crown, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const planLimits = {
  free: 10,
  pro: 500,
  enterprise: Infinity
};

export default function AIUsageIndicator({ compact = false }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const plan = user?.subscription_plan || "free";
  const count = user?.ai_requests_count || 0;
  const limit = planLimits[plan];

  if (limit === Infinity) {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
          <Crown className="w-3 h-3 mr-1" />
          Pro • IA Ilimitada
        </Badge>
      </div>
    );
  }

  const percentage = (count / limit) * 100;
  const remaining = limit - count;
  const isLow = remaining <= 2;
  const isOut = remaining === 0;

  if (compact) {
    return (
      <Badge variant={isOut ? "destructive" : isLow ? "warning" : "secondary"}>
        <Sparkles className="w-3 h-3 mr-1" />
        {remaining} de {limit} restantes
      </Badge>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 ${
        isOut 
          ? "bg-red-50 border-2 border-red-200" 
          : isLow 
          ? "bg-orange-50 border-2 border-orange-200"
          : "bg-blue-50 border-2 border-blue-200"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isOut ? (
              <AlertCircle className="w-4 h-4 text-red-600" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-600" />
            )}
            <span className="text-sm font-semibold text-slate-900">
              Uso de IA - Plano {plan === "free" ? "Gratuito" : "Pro"}
            </span>
          </div>
          <p className={`text-xs ${isOut ? "text-red-600" : "text-slate-600"}`}>
            {isOut 
              ? "Limite mensal atingido" 
              : `${remaining} de ${limit} requisições restantes`
            }
          </p>
        </div>

        {(isOut || isLow) && (
          <Link to={createPageUrl("Plans")}>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Upgrade
            </Button>
          </Link>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`absolute inset-y-0 left-0 rounded-full ${
            isOut 
              ? "bg-red-500" 
              : isLow 
              ? "bg-orange-500"
              : "bg-gradient-to-r from-blue-500 to-purple-500"
          }`}
        />
      </div>

      {isOut && (
        <p className="text-xs text-slate-600 mt-3">
          💡 Faça upgrade para o plano Pro e tenha 500 requisições por mês!
        </p>
      )}
    </motion.div>
  );
}
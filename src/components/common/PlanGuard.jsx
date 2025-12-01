import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Crown, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const planLimits = {
  free: {
    ai_requests: 10,
    document_analysis: 5,
    processes: 5,
    clients: 3
  },
  pro: {
    ai_requests: 500,
    document_analysis: Infinity,
    processes: Infinity,
    clients: Infinity
  },
  enterprise: {
    ai_requests: Infinity,
    document_analysis: Infinity,
    processes: Infinity,
    clients: Infinity
  }
};

export function usePlanAccess() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const plan = user?.subscription_plan || "free";

  const checkFeatureAccess = (feature, currentCount = 0) => {
    const limits = planLimits[plan];
    const limit = limits[feature];
    
    if (limit === Infinity) return { allowed: true };
    
    return {
      allowed: currentCount < limit,
      limit,
      current: currentCount,
      remaining: Math.max(0, limit - currentCount)
    };
  };

  const canUseAI = () => {
    const aiCount = user?.ai_requests_count || 0;
    return checkFeatureAccess('ai_requests', aiCount);
  };

  return {
    plan,
    isPro: plan === "pro" || plan === "enterprise",
    isFree: plan === "free",
    checkFeatureAccess,
    canUseAI
  };
}

export default function PlanGuard({ 
  feature, 
  children, 
  showUpgrade = true,
  customMessage 
}) {
  const { plan, isPro, checkFeatureAccess } = usePlanAccess();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const access = checkFeatureAccess(feature, user?.[`${feature}_count`] || 0);

  if (access.allowed) {
    return <>{children}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center p-8"
    >
      <Card className="max-w-2xl w-full p-8 text-center relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-50" />
        
        <div className="relative z-10">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
          >
            <Lock className="w-10 h-10 text-white" />
          </motion.div>

          {/* Message */}
          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            {customMessage || "Limite do Plano Gratuito Atingido"}
          </h3>
          
          <p className="text-slate-600 mb-6 leading-relaxed">
            {access.limit !== undefined && (
              <>
                Você atingiu o limite de <strong>{access.limit}</strong> {feature.replace('_', ' ')} 
                do plano gratuito. Faça upgrade para o plano Pro e tenha acesso ilimitado!
              </>
            )}
          </p>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-4 mb-8 text-left">
            <div className="bg-white rounded-xl p-4">
              <Sparkles className="w-8 h-8 text-blue-500 mb-2" />
              <h4 className="font-semibold text-slate-900 mb-1">IA Ilimitada</h4>
              <p className="text-xs text-slate-600">500 requisições/mês</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <Crown className="w-8 h-8 text-purple-500 mb-2" />
              <h4 className="font-semibold text-slate-900 mb-1">Recursos Pro</h4>
              <p className="text-xs text-slate-600">Tudo ilimitado</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <ArrowRight className="w-8 h-8 text-pink-500 mb-2" />
              <h4 className="font-semibold text-slate-900 mb-1">Sem Limites</h4>
              <p className="text-xs text-slate-600">Processos e clientes</p>
            </div>
          </div>

          {/* CTA */}
          <Link to={createPageUrl("Pricing")}>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Crown className="w-5 h-5 mr-2" />
              Ver Planos e Fazer Upgrade
            </Button>
          </Link>

          <p className="text-xs text-slate-500 mt-4">
            A partir de R$ 97/mês • Cancele quando quiser
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
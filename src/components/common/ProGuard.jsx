import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function ProGuard({ children, featureName }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      let subs = await base44.entities.Subscription.filter({ user_id: user.id });
      if (subs.length === 0) {
        subs = await base44.entities.Subscription.filter({ user_id: user.email });
      }
      return subs[0] || null;
    },
    enabled: !!user?.id
  });

  if (!subscription || subscription.plan !== 'pro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-2 border-purple-200 shadow-2xl">
            <CardContent className="pt-12 pb-8 text-center">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <Lock className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Recurso Exclusivo Pro
              </h2>
              
              <p className="text-slate-600 mb-2">
                <strong>{featureName}</strong> está disponível apenas no Plano Profissional.
              </p>
              
              <p className="text-sm text-slate-500 mb-6">
                Faça upgrade agora e tenha acesso ilimitado a todos os recursos!
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-700 mb-2">
                  <Crown className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold">Plano Pro - R$ 49,99/mês</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 text-left">
                  <li>✓ Clientes, processos e documentos ilimitados</li>
                  <li>✓ Equipes e Workspace colaborativo</li>
                  <li>✓ Jurisprudência completa</li>
                  <li>✓ Templates avançados</li>
                  <li>✓ Calendário inteligente</li>
                  <li>✓ Análise de documentos com LEXIA</li>
                </ul>
              </div>

              <Button
                onClick={() => navigate(createPageUrl('Pricing'))}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 text-white font-bold py-6 text-lg shadow-lg"
              >
                <Crown className="w-5 h-5 mr-2" />
                Assinar Plano Pro Agora
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="w-full mt-3 text-slate-600"
              >
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return children;
}
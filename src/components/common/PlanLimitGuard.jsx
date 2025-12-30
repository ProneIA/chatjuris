import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PlanLimitGuard({ 
  subscription, 
  currentCount, 
  limitCount, 
  entityName, 
  children 
}) {
  const navigate = useNavigate();
  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';
  const isAtLimit = !isPro && currentCount >= limitCount;

  if (isAtLimit) {
    return (
      <Card className="border-2 border-amber-200 bg-amber-50">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Limite Atingido
          </h3>
          <p className="text-slate-600 mb-6">
            Você atingiu o limite de <strong>{limitCount} {entityName}</strong> do plano gratuito.
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Pricing'))}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
          >
            <Crown className="w-4 h-4 mr-2" />
            Assinar Plano Pro
          </Button>
        </CardContent>
      </Card>
    );
  }

  return children;
}
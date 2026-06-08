import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Crown, 
  Building2,
  Check, 
  ArrowRight,
  Clock,
  AlertTriangle
} from "lucide-react";

const AVAILABLE_MONTHLY = [
  {
    id: "starter",
    name: "Starter",
    price: 79.00,
    period: "/mês",
    icon: Zap,
    description: "Para quem está começando",
    planType: "starter_monthly",
    popular: false,
  },
  {
    id: "profissional",
    name: "Profissional",
    price: 149.00,
    period: "/mês",
    icon: Crown,
    description: "Melhor custo-benefício",
    planType: "pro_monthly",
    popular: true,
  },
  {
    id: "escritorio",
    name: "Escritório",
    price: 299.00,
    period: "/mês",
    icon: Building2,
    description: "Para equipes e sócios",
    planType: "escritorio_monthly",
    popular: false,
  },
];

const AVAILABLE_YEARLY = [
  {
    id: "starter_anual",
    name: "Starter Anual",
    price: 708.00,
    monthlyEq: 59.00,
    period: "/ano",
    icon: Zap,
    description: "R$ 59/mês · economize R$ 240",
    planType: "starter_yearly",
    popular: false,
  },
  {
    id: "profissional_anual",
    name: "Profissional Anual",
    price: 1428.00,
    monthlyEq: 119.00,
    period: "/ano",
    icon: Crown,
    description: "R$ 119/mês · economize R$ 360",
    planType: "pro_yearly",
    popular: true,
  },
  {
    id: "escritorio_anual",
    name: "Escritório Anual",
    price: 3108.00,
    monthlyEq: 259.00,
    period: "/ano",
    icon: Building2,
    description: "R$ 259/mês · economize R$ 480",
    planType: "escritorio_yearly",
    popular: false,
  },
];

const planIdMap = {
  starter_monthly: 'starter_monthly',
  pro_monthly: 'pro_monthly',
  escritorio_monthly: 'escritorio_monthly',
};

export default function AvailablePlansSection({ 
  subscription, 
  trialDaysLeft = 0
}) {
  const [billing, setBilling] = useState("monthly");
  const availablePlans = billing === "yearly" ? AVAILABLE_YEARLY : AVAILABLE_MONTHLY;

  const isInTrial = subscription?.status === 'trial';
  const currentPlanType = subscription?.plan_type;
  const isExpired = subscription?.status === 'expired';
  const isActive = subscription?.status === 'active';

  const handleSelectPlan = (planType) => {
    const planId = planIdMap[planType] || planType;
    if (planId) {
      window.location.href = `/Checkout?plan=${planId}`;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {isInTrial ? 'Fazer Upgrade' : isExpired ? 'Escolha um Plano' : 'Planos Disponíveis'}
          </CardTitle>
          {isInTrial && trialDaysLeft > 0 && (
            <Badge style={{ background: 'var(--info-bg)', color: 'var(--info)', border: '1px solid var(--info-border)' }}>
              <Clock className="w-3 h-3 mr-1" />
              {trialDaysLeft} dias de teste
            </Badge>
          )}
        </div>
        {isInTrial && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Assine agora e continue com acesso completo após o período de teste
          </p>
        )}
        {isExpired && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>
            <AlertTriangle className="w-4 h-4" />
            Seu período de teste expirou. Assine para continuar.
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Toggle Mensal / Anual */}
        <div style={{ display: "flex", marginBottom: 16, border: "1px solid var(--border)", width: "fit-content" }}>
          {["monthly", "yearly"].map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: "6px 18px",
                background: billing === b ? "var(--accent)" : "transparent",
                color: billing === b ? "#1A1A1A" : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: ".08em",
                transition: "background .2s",
              }}
            >
              {b === "monthly" ? "Mensal" : "Anual (-20%)"}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {availablePlans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = isActive && currentPlanType === plan.planType;
            const isPopular = plan.popular;
            
            return (
              <div
                key={plan.id}
                className="relative rounded-lg border-2 p-4 transition-all"
                style={{
                  borderColor: isCurrentPlan ? 'var(--accent)' : 'var(--border)',
                  background: isCurrentPlan ? 'var(--surface)' : 'var(--main-bg)',
                }}
              >
                {/* Popular badge */}
                {isPopular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge style={{ background: 'var(--accent)', color: '#1A1A1A', border: 'none', fontSize: 11 }}>
                      Mais Popular
                    </Badge>
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge style={{ background: 'var(--accent)', color: '#1A1A1A', border: 'none', fontSize: 11 }}>
                      <Check className="w-3 h-3 mr-1" />
                      Plano Atual
                    </Badge>
                  </div>
                )}

                {/* Discount badge */}
                {plan.discount && !isCurrentPlan && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" style={{ fontSize: 11 }}>
                      {plan.discount}
                    </Badge>
                  </div>
                )}

                <div className="text-center pt-2">
                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <Icon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                  </div>

                  {/* Name */}
                  <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 4, color: 'var(--text-primary)' }}>
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div style={{ marginBottom: 8 }}>
                    {plan.originalPrice && (
                      <span style={{ fontSize: 12, textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                        R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                      <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                        R$ {plan.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: 11, marginBottom: 16, color: 'var(--text-secondary)' }}>
                    {plan.description}
                  </p>

                  {/* Button */}
                  {isCurrentPlan ? (
                    <Button disabled className="w-full btn-secondary" variant="outline">
                      <Check className="w-4 h-4 mr-2" />
                      Plano Ativo
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSelectPlan(plan.planType)}
                      className="w-full btn-primary"
                    >
                      {isInTrial ? 'Fazer Upgrade' : 'Assinar'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info adicional */}
        <div style={{ marginTop: 16, padding: 12, borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: 13, background: 'var(--surface)', color: 'var(--text-secondary)' }}>
          Todos os planos incluem acesso completo a todos os recursos. 
          {isInTrial && " Seu período de teste será substituído pelo plano escolhido."}
        </div>
      </CardContent>
    </Card>
  );
}
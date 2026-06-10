import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shield, CheckCircle2 } from "lucide-react";
import CheckoutModal from "@/components/subscription/CheckoutModal";

const PLANS = {
  starter_monthly: {
    id: "starter_monthly",
    name: "Starter — Mensal",
    price: 79.00,
    amount: 79.00,
    period: "/mês",
    billingType: "monthly",
    description: "Acesso à plataforma, renovação mensal",
    features: ["1 usuário", "50 documentos/mês", "Gestão de clientes", "Suporte por e-mail"],
  },
  pro_monthly: {
    id: "pro_monthly",
    name: "Profissional — Mensal",
    price: 149.00,
    amount: 149.00,
    period: "/mês",
    billingType: "monthly",
    description: "Acesso completo à plataforma, renovação mensal",
    features: ["Até 3 usuários", "Documentos ilimitados", "Portal do cliente", "Suporte prioritário"],
  },
  escritorio_monthly: {
    id: "escritorio_monthly",
    name: "Escritório — Mensal",
    price: 299.00,
    amount: 299.00,
    period: "/mês",
    billingType: "monthly",
    description: "Para equipes e sócios, renovação mensal",
    features: ["Usuários ilimitados", "Relatórios avançados", "Conformidade LGPD", "Onboarding assistido"],
  },
  starter_yearly: {
    id: "starter_yearly",
    name: "Starter — Anual",
    price: 708.00,
    amount: 708.00,
    pricePerMonth: 59.00,
    period: "/ano",
    billingType: "yearly",
    description: "Cobrança única anual — economize R$ 240",
    savingsText: "Economize R$ 240/ano vs. mensal",
    features: ["1 usuário", "50 documentos/mês", "Gestão de clientes", "Parcelamento em até 12x sem juros"],
  },
  pro_yearly: {
    id: "pro_yearly",
    name: "Profissional — Anual",
    price: 1428.00,
    amount: 1428.00,
    pricePerMonth: 119.00,
    period: "/ano",
    billingType: "yearly",
    description: "Cobrança única anual — economize R$ 360",
    savingsText: "Economize R$ 360/ano vs. mensal",
    features: ["Até 3 usuários", "Documentos ilimitados", "Portal do cliente", "Parcelamento em até 12x sem juros"],
  },
  escritorio_yearly: {
    id: "escritorio_yearly",
    name: "Escritório — Anual",
    price: 3108.00,
    amount: 3108.00,
    pricePerMonth: 259.00,
    period: "/ano",
    billingType: "yearly",
    description: "Cobrança única anual — economize R$ 480",
    savingsText: "Economize R$ 480/ano vs. mensal",
    features: ["Usuários ilimitados", "Relatórios avançados", "Conformidade LGPD", "Parcelamento em até 12x sem juros"],
  },
};

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const planId = searchParams.get('plan');
  const plan = PLANS[planId];

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  useEffect(() => {
    if (planId && !PLANS[planId]) {
      navigate(createPageUrl('Pricing'));
    }
  }, [planId, navigate]);

  if (!user || !plan) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px 48px" }}>

        {/* Voltar */}
        <button
          onClick={() => navigate(createPageUrl('Pricing'))}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 28, fontSize: 13, color: "#64748b", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
          Voltar aos Planos
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 24 }} className="md:grid-cols-[1fr_1.5fr] grid-cols-1">

          {/* Coluna esquerda — resumo */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Card do plano */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 20px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#94a3b8", margin: "0 0 4px" }}>
                Você está assinando
              </p>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                {plan.name}
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px" }}>{plan.description}</p>

              {plan.savingsText && (
                <div style={{ marginBottom: 14, padding: "6px 10px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#166534", margin: 0 }}>{plan.savingsText}</p>
                </div>
              )}

              <div style={{ paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                {plan.pricePerMonth && (
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 4px" }}>
                    R$ {plan.pricePerMonth.toFixed(2).replace('.', ',')} /mês
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                  <span style={{ fontSize: 30, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span style={{ fontSize: 13, color: "#94a3b8", marginBottom: 2 }}>{plan.period}</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#334155", margin: "0 0 12px" }}>Incluído no plano:</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle2 style={{ width: 15, height: 15, color: "#22c55e", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#475569" }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Segurança */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
              <Shield style={{ width: 14, height: 14, color: "#22c55e", flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                Pagamento 100% seguro via Mercado Pago · SSL · Antifraude
              </p>
            </div>
          </div>

          {/* Coluna direita — CTA */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "28px 28px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 20, textAlign: "center" }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                Completar Pagamento
              </h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                {plan.billingType === "yearly"
                  ? "Cobrança única anual — parcelamento em até 12x sem juros"
                  : "Cobrança mensal — cartão de crédito"}
              </p>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#475569" }}>{plan.name}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Período</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>{plan.period}</span>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              style={{
                width: "100%", padding: "14px 0",
                background: "#1d4ed8", color: "#fff",
                border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                letterSpacing: "-0.01em",
                transition: "background .15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#1e40af"}
              onMouseLeave={e => e.currentTarget.style.background = "#1d4ed8"}
            >
              💳 Pagar com Cartão de Crédito
            </button>

            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
              Seus dados de cartão são protegidos e processados diretamente pelo Mercado Pago.
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <CheckoutModal
          plan={plan}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
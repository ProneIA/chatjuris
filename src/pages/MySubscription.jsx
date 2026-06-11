import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crown, Calendar, CreditCard, CheckCircle2, AlertCircle,
  Clock, Star, Zap, Sparkles, ChevronRight, Shield,
  MessageSquare, FileText, Users, RefreshCw, X
} from "lucide-react";
import UpgradePlansSection from "@/components/subscription/UpgradePlansSection";
import CheckoutModal from "@/components/subscription/CheckoutModal";

// Plano padrão para renovação — Pro Mensal
const DEFAULT_RENEWAL_PLAN = {
  id: "pro_monthly",
  planType: "monthly",
  name: "Profissional",
  price: 149.00,
  amount: 149.00,
  period: "/mês",
};

const GOLD = "#C9A84C";
const GOLD_LIGHT = "#FBF5E6";
const GOLD_BORDER = "#E8D5A0";

const FEATURES = [
  { icon: Sparkles, label: "Assistente Jurídico com IA (ilimitado)" },
  { icon: FileText, label: "Geração de peças processuais" },
  { icon: Shield, label: "Análise inteligente de documentos" },
  { icon: MessageSquare, label: "Chat jurídico especializado" },
  { icon: Users, label: "Gestão de clientes e processos" },
  { icon: RefreshCw, label: "Monitoramento de Diário Oficial" },
  { icon: CreditCard, label: "Controle financeiro e honorários" },
  { icon: Calendar, label: "Agenda e calendário jurídico" },
];

const PLAN_CONFIG = {
  trial: {
    name: "Teste Gratuito",
    badge: "TRIAL",
    badgeBg: "#F0FDF4", badgeColor: "#16A34A", badgeBorder: "#BBF7D0",
    iconBg: "#F0FDF4", iconColor: "#16A34A", icon: Sparkles,
    desc: "Período de avaliação gratuita de 7 dias",
  },
  monthly: {
    name: "Plano Mensal",
    badge: "MENSAL",
    badgeBg: GOLD_LIGHT, badgeColor: "#A07830", badgeBorder: GOLD_BORDER,
    iconBg: GOLD_LIGHT, iconColor: GOLD, icon: Zap,
    desc: "Renovação mensal automática",
    isRecurrent: true,
  },
  yearly: {
    name: "Plano Anual",
    badge: "ANUAL",
    badgeBg: "#F5F3FF", badgeColor: "#7C3AED", badgeBorder: "#DDD6FE",
    iconBg: "#F5F3FF", iconColor: "#7C3AED", icon: Crown,
    desc: "Renovação anual automática",
    isRecurrent: true,
  },
  lifetime: {
    name: "Plano Vitalício",
    badge: "VITALÍCIO",
    badgeBg: GOLD_LIGHT, badgeColor: "#A07830", badgeBorder: GOLD_BORDER,
    iconBg: GOLD_LIGHT, iconColor: GOLD, icon: Star,
    desc: "Acesso permanente — sem expiração",
    isPermanent: true,
  },
};

export default function MySubscription() {
  const [user, setUser] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["my-subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0] || null;
    },
    enabled: !!user?.id,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["my-payments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const all = await base44.entities.Payment.list();
        return all.filter(p => p.user_id === user.id);
      } catch { return []; }
    },
    enabled: !!user?.id,
  });

  const planType = subscription?.status === "trial" ? "trial" : (subscription?.plan_type || "monthly");
  const plan = PLAN_CONFIG[planType] || PLAN_CONFIG.monthly;
  const PlanIcon = plan.icon;

  const trialDaysLeft = React.useMemo(() => {
    if (subscription?.status !== "trial" || !subscription?.end_date) return 0;
    const d = Math.ceil((new Date(subscription.end_date) - new Date()) / 86400000);
    return Math.max(d, 0);
  }, [subscription]);

  const isExpired = subscription?.end_date && new Date() > new Date(subscription.end_date) && !plan.isPermanent;

  const statusInfo = React.useMemo(() => {
    if (!subscription) return null;
    if (isExpired) return { label: "Expirado", icon: AlertCircle, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
    if (subscription.status === "trial") return { label: `Em Teste · ${trialDaysLeft} dias restantes`, icon: Clock, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
    if (subscription.status === "active" || subscription.status === "lifetime") return { label: "Ativo", icon: CheckCircle2, color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" };
    return { label: subscription.status, icon: AlertCircle, color: "#888", bg: "#F5F5F5", border: "#E5E5E5" };
  }, [subscription, isExpired, trialDaysLeft]);

  // Loading state
  if (isLoading || !user) {
    return (
      <div style={{ background: "#F5F3EE", minHeight: "100vh" }}>
        <div style={{ background: "#FAFAFA", borderBottom: "1px solid #E0E0E0", padding: "1.5rem 2rem" }}>
          <Skeleton className="h-8 w-56" />
        </div>
        <div style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // No subscription
  if (!subscription) {
    return (
      <div style={{ background: "#F5F3EE", minHeight: "100vh" }}>
        <div style={{ background: "#FAFAFA", borderBottom: "1px solid #E0E0E0" }}>
          <div style={{ padding: "1.5rem 2rem", maxWidth: 1000, margin: "0 auto" }}>
            <h1 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 800, fontSize: "1.4rem", color: "#1A1A1A", margin: 0, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Minha Assinatura
            </h1>
          </div>
        </div>
        <div style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 16, padding: "3rem 2rem" }}>
            <AlertCircle style={{ width: 48, height: 48, color: "#E8D5A0", margin: "0 auto 1rem" }} />
            <p style={{ color: "#555", marginBottom: "1.5rem", fontSize: "1rem" }}>Você não possui assinatura ativa</p>
            <button
              onClick={() => window.location.href = "/Pricing"}
              style={{ background: GOLD, color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Ver Planos
            </button>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = statusInfo.icon;

  return (
    <>
    <div style={{ background: "#F5F3EE", minHeight: "100vh" }}>
      {/* ── HEADER ── */}
      <div style={{ background: "#FAFAFA", borderBottom: "1px solid #E0E0E0" }}>
        <div style={{ padding: "1.5rem 2rem", maxWidth: 1000, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 800, fontSize: "1.4rem", color: "#1A1A1A", margin: 0, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Minha Assinatura
          </h1>
          <p style={{ marginTop: "0.2rem", color: "#888", fontSize: "0.82rem", margin: 0 }}>
            Detalhes do seu plano e histórico de pagamentos
          </p>
        </div>
      </div>

      {/* ── CONTEÚDO ── */}
      <div style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Card do Plano Atual */}
        <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          {/* Topo colorido */}
          <div style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, #fff 60%)`, borderBottom: "1px solid #F0EDE6", padding: "1.5rem 2rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: plan.iconBg, border: `1.5px solid ${GOLD_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <PlanIcon style={{ width: 26, height: 26, color: plan.iconColor }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 800, fontSize: "1.25rem", color: "#1A1A1A" }}>{plan.name}</span>
                  <span style={{ padding: "2px 10px", borderRadius: 999, background: plan.badgeBg, color: plan.badgeColor, border: `1px solid ${plan.badgeBorder}`, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em" }}>
                    {plan.badge}
                  </span>
                </div>
                <p style={{ color: "#888", fontSize: "0.82rem", margin: 0 }}>{plan.desc}</p>
              </div>
            </div>
            {/* Status badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", borderRadius: 999, background: statusInfo.bg, border: `1px solid ${statusInfo.border}` }}>
              <StatusIcon style={{ width: 15, height: 15, color: statusInfo.color }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: statusInfo.color }}>{statusInfo.label}</span>
            </div>
          </div>

          {/* Detalhes */}
          <div style={{ padding: "1.5rem 2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem" }}>
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Data de Início</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1A1A1A", display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar style={{ width: 14, height: 14, color: GOLD }} />
                {subscription.start_date ? new Date(subscription.start_date).toLocaleDateString("pt-BR") : "N/A"}
              </div>
            </div>
            {!plan.isPermanent && (
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                  {subscription.status === "trial" ? "Teste Termina em" : "Próxima Renovação"}
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: isExpired ? "#DC2626" : "#1A1A1A", display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar style={{ width: 14, height: 14, color: isExpired ? "#DC2626" : GOLD }} />
                  {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString("pt-BR") : "N/A"}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Pagamento</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1A1A1A", display: "flex", alignItems: "center", gap: 6 }}>
                <CreditCard style={{ width: 14, height: 14, color: GOLD }} />
                {subscription.payment_method === "hotmart" ? "Hotmart" : subscription.payment_method || "N/A"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Cobrança</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1A1A1A", display: "flex", alignItems: "center", gap: 6 }}>
                <RefreshCw style={{ width: 14, height: 14, color: GOLD }} />
                {plan.isPermanent ? "Pagamento Único" : plan.isRecurrent ? "Recorrente" : "Teste Gratuito"}
              </div>
            </div>
          </div>

          {/* Aviso especial */}
          {plan.isPermanent && (
            <div style={{ margin: "0 2rem 1.5rem", padding: "0.875rem 1.25rem", background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <Star style={{ width: 18, height: 18, color: GOLD, flexShrink: 0 }} />
              <span style={{ fontSize: "0.85rem", color: "#A07830", fontWeight: 600 }}>
                ✨ Você possui acesso vitalício ao JURIS — sem renovações, sem cobranças futuras.
              </span>
            </div>
          )}
          {isExpired && (
            <div style={{ margin: "0 2rem 1.5rem", padding: "0.875rem 1.25rem", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <AlertCircle style={{ width: 18, height: 18, color: "#DC2626", flexShrink: 0 }} />
              <span style={{ fontSize: "0.85rem", color: "#B91C1C", fontWeight: 600 }}>
                Assinatura expirada. Renove para continuar usando o JURIS.
              </span>
            </div>
          )}

          {/* Ações */}
          <div style={{ padding: "1rem 2rem 1.5rem", borderTop: "1px solid #F0EDE6", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {!plan.isPermanent && (
              <button
                onClick={() => setCheckoutOpen(true)}
                style={{ background: GOLD, color: "#fff", border: "none", borderRadius: 8, padding: "9px 22px", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em", boxShadow: "0 2px 8px rgba(201,168,76,0.25)" }}
              >
                {isExpired ? "Renovar Assinatura" : subscription.status === "trial" ? "Assinar um Plano" : "Gerenciar Assinatura"}
              </button>
            )}
            {plan.isRecurrent && !isExpired && (
              <button
                style={{ background: "#fff", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 8, padding: "9px 22px", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}
                onClick={() => {
                  if (confirm("Deseja cancelar sua assinatura? Entre em contato com o suporte para concluir o cancelamento.")) {
                    window.location.href = "/Contact";
                  }
                }}
              >
                Cancelar Plano
              </button>
            )}
          </div>
        </div>

        {/* Recursos Incluídos */}
        <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #F0EDE6" }}>
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.07em", color: "#1A1A1A" }}>
              Recursos Incluídos
            </span>
          </div>
          <div style={{ padding: "1.25rem 1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 style={{ width: 14, height: 14, color: GOLD }} />
                </div>
                <span style={{ fontSize: "0.83rem", color: "#444", fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Histórico de Pagamentos */}
        <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #F0EDE6" }}>
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.07em", color: "#1A1A1A" }}>
              Histórico de Pagamentos
            </span>
          </div>
          {payments.length === 0 ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "#888", fontSize: "0.875rem" }}>
              Nenhum pagamento registrado
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFAFA" }}>
                    {["Data", "Plano", "Valor", "Status"].map(h => (
                      <th key={h} style={{ padding: "0.6rem 1.25rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #F5F3EE" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FAFAF7"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "0.7rem 1.25rem", fontSize: "0.83rem", color: "#555", whiteSpace: "nowrap" }}>
                        {p.created_date ? new Date(p.created_date).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td style={{ padding: "0.7rem 1.25rem", fontSize: "0.85rem", color: "#1A1A1A", fontWeight: 500 }}>
                        {p.plan_id || p.plan_type || "Assinatura"}
                      </td>
                      <td style={{ padding: "0.7rem 1.25rem", fontSize: "0.88rem", fontWeight: 700, color: "#1A1A1A" }}>
                        {p.amount ? `R$ ${Number(p.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td style={{ padding: "0.7rem 1.25rem" }}>
                        <span style={{
                          padding: "2px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700,
                          background: p.status === "approved" || p.status === "pago" ? "#F0FDF4" : "#FEF2F2",
                          color: p.status === "approved" || p.status === "pago" ? "#16A34A" : "#DC2626",
                        }}>
                          {p.status === "approved" || p.status === "pago" ? "Pago" : "Pendente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upgrade / Planos */}
        {!plan.isPermanent && subscription && (
          <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #F0EDE6" }}>
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.07em", color: "#1A1A1A" }}>
                {subscription.status === "trial" ? "Escolha seu Plano" : "Upgrade de Plano"}
              </span>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <UpgradePlansSection subscription={subscription} />
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Checkout Modal direto com plano pré-selecionado */}
    {checkoutOpen && (
      <CheckoutModal
        plan={DEFAULT_RENEWAL_PLAN}
        onClose={() => setCheckoutOpen(false)}
      />
    )}
    </>
  );
}
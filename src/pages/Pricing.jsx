import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Check, X, Zap, Crown, Star, ArrowRight, Shield, Clock, Users, Sparkles, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import AffiliateTracker from "@/components/subscription/AffiliateTracker";
import { PublicNav, PublicFooter, publicStyles } from "@/components/landing/PublicLayout";

const plans = [
  {
    id: "pro_monthly",
    name: "Profissional Mensal",
    icon: Zap,
    price: 119.90,
    period: "/mês",
    billingType: "monthly",
    description: "Tudo ilimitado com renovação mensal",
    popular: false,
    features: [
      { text: "IA ILIMITADA - sem restrições", included: true, highlight: true },
      { text: "Clientes ILIMITADOS", included: true, highlight: true },
      { text: "Processos ILIMITADOS", included: true, highlight: true },
      { text: "Documentos ILIMITADOS", included: true, highlight: true },
      { text: "Todos os modos de IA", included: true },
      { text: "Equipes e Workspace", included: true },
      { text: "Jurisprudência completa", included: true },
      { text: "Modelos de Peças ilimitados", included: true },
      { text: "Calendário inteligente", included: true },
      { text: "Análise de documentos LEXIA", included: true },
      { text: "Gerador de imagens IA", included: true },
      { text: "Suporte prioritário 24/7", included: true },
    ],
    limits: { daily_actions_limit: 999999, daily_actions_used: 0 }
  },
  {
    id: "pro_yearly",
    name: "Profissional Anual",
    icon: Crown,
    price: 99.90,
    originalPrice: 119.90,
    period: "/mês",
    billingType: "yearly",
    annualTotal: 1198.80,
    description: "Melhor valor — pague anualmente e economize",
    popular: true,
    discount: 17,
    features: [
      { text: "IA ILIMITADA - sem restrições", included: true, highlight: true },
      { text: "Clientes ILIMITADOS", included: true, highlight: true },
      { text: "Processos ILIMITADOS", included: true, highlight: true },
      { text: "Documentos ILIMITADOS", included: true, highlight: true },
      { text: "Todos os modos de IA", included: true },
      { text: "Equipes e Workspace", included: true },
      { text: "Jurisprudência completa", included: true },
      { text: "Modelos de Peças ilimitados", included: true },
      { text: "Calendário inteligente", included: true },
      { text: "Análise de documentos LEXIA", included: true },
      { text: "Gerador de imagens IA", included: true },
      { text: "Suporte prioritário 24/7", included: true },
    ],
    limits: { daily_actions_limit: 999999, daily_actions_used: 0 },
    savingsText: "Economize R$ 240/ano — 2 meses grátis!"
  },
];

const testimonials = [
  { name: "Dr. Ricardo M.", role: "Advogado Criminalista", text: "Economizo 3 horas por dia com o Juris. A IA é impressionante." },
  { name: "Dra. Carla S.", role: "Advogada Trabalhista", text: "A melhor ferramenta que já usei. Indico para todos os colegas." },
];

const trustBadges = [
  { icon: Shield, title: "100% Seguro", sub: "Dados criptografados" },
  { icon: Zap, title: "Pagamento Seguro", sub: "Mercado Pago" },
  { icon: Clock, title: "Cancele Quando Quiser", sub: "Sem compromisso" },
  { icon: Users, title: "Suporte 24/7", sub: "Equipe especializada" },
];

export default function Pricing({ theme = "light" }) {
  const [user, setUser] = React.useState(null);
  const [trialDaysLeft, setTrialDaysLeft] = React.useState(0);
  const observerRef = useRef(null);

  React.useEffect(() => {
    base44.auth.me()
      .then(async (u) => {
        setUser(u);
        if (u?.trial_status === "active" && u?.trial_end_date) {
          const days = Math.ceil((new Date(u.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24));
          setTrialDaysLeft(days > 0 ? days : 0);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); observerRef.current.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".pub-fade-up, .pub-fade-in").forEach((el) => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0] || null;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });

  const handleSelectPlan = async (planId) => {
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      localStorage.setItem("selected_plan", planId);
      base44.auth.redirectToLogin(createPageUrl("Pricing"));
      return;
    }
    window.location.href = createPageUrl("Checkout") + "?plan=" + planId;
  };

  React.useEffect(() => {
    if (!user) return;
    const selectedPlan = localStorage.getItem("selected_plan");
    if (selectedPlan) {
      localStorage.removeItem("selected_plan");
      window.location.href = createPageUrl("Checkout") + "?plan=" + selectedPlan;
    }
  }, [user?.id]);

  const isCurrentPlan = (plan) => {
    if (!subscription) return false;
    const today = new Date().toISOString().split("T")[0];
    const isExpired = subscription.end_date && today > subscription.end_date;
    const isActive = subscription.status === "active" || subscription.status === "trial";
    if (isExpired || !isActive || subscription.status === "trial") return false;
    const planTypeToId = { monthly: "pro_monthly", annual: "pro_yearly", lifetime: "pro_lifetime" };
    return planTypeToId[subscription.plan_type] === plan.id;
  };

  return (
    <div style={{ overflowX: "hidden", WebkitFontSmoothing: "antialiased", background: "#fff" }}>
      <style>{publicStyles}{`
        .plan-card { border: 1px solid #e5e5e5; transition: border-color 0.3s; }
        .plan-card.popular { background: #0a0a0a; border-color: #0a0a0a; }
        .plan-card:not(.popular):hover { border-color: var(--primary); }
        .feature-row { display:flex; align-items:flex-start; gap:0.75rem; margin-bottom:0.75rem; }
      `}</style>
      <AffiliateTracker />
      <PublicNav />

      {/* Hero */}
      <section style={{ position: "relative", paddingTop: "64px", minHeight: "60vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1600&q=80&auto=format&fit=crop"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.2)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.7) 140%)" }} />

        <div style={{ position: "relative", zIndex: 2, padding: "5rem 2.5rem", maxWidth: "900px", margin: "0 auto" }}>
          {user && (
            <Link to={createPageUrl("Dashboard")}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.8rem", marginBottom: "2rem", fontFamily: "'Oswald',sans-serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              ← Voltar ao Painel
            </Link>
          )}

          {user?.trial_status === "active" && trialDaysLeft > 0 ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--primary)", color: "#000", padding: "0.5rem 1rem", marginBottom: "1.5rem", fontFamily: "'Oswald',sans-serif", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              <Sparkles style={{ width: 14, height: 14 }} />
              Teste: {trialDaysLeft} {trialDaysLeft === 1 ? "dia" : "dias"} restantes
            </div>
          ) : user?.trial_status === "expired" ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#ef4444", color: "#fff", padding: "0.5rem 1rem", marginBottom: "1.5rem", fontFamily: "'Oswald',sans-serif", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              <AlertTriangle style={{ width: 14, height: 14 }} />
              Período de Teste Expirado
            </div>
          ) : null}

          <h1 className="pub-font pub-fade-up"
            style={{ fontSize: "clamp(3rem, 8vw, 6rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1, color: "#fff", margin: "0 0 1.5rem" }}>
            Planos &<br />
            <span style={{ WebkitTextStroke: "1px #fff", color: "transparent" }}>Preços</span><br />
            <span style={{ color: "var(--primary)" }}>Simples.</span>
          </h1>
          <p className="pub-fade-up pub-delay-1" style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.1rem", maxWidth: "480px", lineHeight: 1.7 }}>
            +80 advogados economizando <strong style={{ color: "#fff" }}>2 dias de trabalho por semana</strong> com o Juris.
          </p>

          {/* Stats */}
          <div className="pub-fade-up pub-delay-2" style={{ display: "flex", gap: "3rem", marginTop: "2.5rem", flexWrap: "wrap" }}>
            {[["80+", "Advogados Ativos"], ["1.200+", "Docs Gerados"], ["4.9/5", "Avaliação"]].map(([n, l]) => (
              <div key={l}>
                <div className="pub-font" style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary)" }}>{n}</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section style={{ padding: "7rem 2.5rem", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1px", background: "#e5e5e5" }}>
          {plans.map((plan) => {
            const Icon = plan.icon;
            const current = isCurrentPlan(plan);
            return (
              <div key={plan.id} className={`plan-card pub-fade-up${plan.popular ? " popular" : ""}`} style={{ background: plan.popular ? "#0a0a0a" : "#fff", padding: "3rem", position: "relative" }}>
                {plan.discount && (
                  <div style={{ position: "absolute", top: 0, right: 0, background: "var(--primary)", color: "#000", fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "0.7rem", padding: "0.4rem 0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    🔥 {plan.discount}% OFF
                  </div>
                )}
                {plan.popular && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "var(--primary)", color: "#000", padding: "0.3rem 0.8rem", marginBottom: "1.5rem", fontFamily: "'Oswald',sans-serif", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    <Crown style={{ width: 12, height: 12 }} /> Recomendado
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div style={{ width: 44, height: 44, background: plan.popular ? "rgba(200,168,75,0.2)" : "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon style={{ width: 22, height: 22, color: plan.popular ? "var(--primary)" : "#555" }} />
                  </div>
                  <div>
                    <h3 className="pub-font" style={{ fontSize: "0.9rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: plan.popular ? "#fff" : "#0a0a0a", margin: 0 }}>{plan.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: plan.popular ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)", margin: 0 }}>{plan.description}</p>
                  </div>
                </div>

                {plan.originalPrice && (
                  <p style={{ fontSize: "1rem", color: plan.popular ? "rgba(255,255,255,0.3)" : "#aaa", textDecoration: "line-through", margin: "0 0 0.25rem" }}>
                    R$ {plan.originalPrice.toFixed(2).replace(".", ",")}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span className="pub-font" style={{ fontSize: "3.5rem", fontWeight: 700, color: plan.popular ? "#fff" : "#0a0a0a", lineHeight: 1 }}>
                    R$ {plan.price.toFixed(2).replace(".", ",")}
                  </span>
                  <span style={{ color: plan.popular ? "rgba(255,255,255,0.4)" : "#aaa", fontSize: "0.9rem" }}>{plan.period}</span>
                </div>
                {plan.savingsText && <p style={{ color: "#4ade80", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem" }}>{plan.savingsText}</p>}
                {plan.annualTotal && <p style={{ color: plan.popular ? "rgba(255,255,255,0.3)" : "#aaa", fontSize: "0.8rem", marginBottom: "2rem" }}>R$ {plan.annualTotal.toFixed(2).replace(".", ",")} cobrado anualmente</p>}
                {!plan.annualTotal && <div style={{ marginBottom: "2rem" }} />}

                <button
                  onClick={() => !current && handleSelectPlan(plan.id)}
                  disabled={current}
                  style={{ width: "100%", padding: "1rem", fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", border: "none", borderRadius: 0, cursor: current ? "not-allowed" : "pointer", marginBottom: "2rem", transition: "all 0.2s",
                    background: current ? (plan.popular ? "#333" : "#e5e5e5") : (plan.popular ? "var(--primary)" : "#0a0a0a"),
                    color: current ? (plan.popular ? "#666" : "#aaa") : (plan.popular ? "#000" : "#fff") }}
                  onMouseEnter={e => !current && (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  {current ? "✓ Plano Atual" : "Assinar Agora →"}
                </button>

                <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.15em", color: plan.popular ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", marginBottom: "1rem", fontFamily: "'Oswald',sans-serif" }}>
                  Tudo incluso:
                </p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="feature-row">
                    <div style={{ width: 18, height: 18, background: feature.included ? (plan.popular ? "rgba(200,168,75,0.2)" : "#f0f0f0") : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      {feature.included
                        ? <Check style={{ width: 11, height: 11, color: plan.popular ? "var(--primary)" : "#555" }} />
                        : <X style={{ width: 11, height: 11, color: "#ccc" }} />}
                    </div>
                    <span style={{ fontSize: "0.82rem", fontWeight: feature.highlight ? 700 : 400, color: feature.included ? (plan.popular ? (feature.highlight ? "#fff" : "rgba(255,255,255,0.7)") : (feature.highlight ? "#0a0a0a" : "#555")) : "#ccc", textDecoration: feature.included ? "none" : "line-through" }}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: "#121212", padding: "6rem 2.5rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px", opacity: 0.03 }} />
        <div style={{ maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p className="pub-label pub-fade-in" style={{ marginBottom: "1rem" }}>Depoimentos</p>
          <h2 className="pub-font pub-fade-up" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", color: "#fff", marginBottom: "3rem" }}>O que dizem nossos usuários.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1px", background: "rgba(255,255,255,0.05)" }}>
            {testimonials.map((t, i) => (
              <div key={i} className="pub-fade-up" style={{ transitionDelay: `${i * 100}ms`, padding: "2.5rem", background: "#121212" }}>
                <div style={{ display: "flex", gap: "3px", marginBottom: "1.5rem" }}>
                  {[...Array(5)].map((_, s) => <Star key={s} style={{ width: 14, height: 14, color: "var(--primary)", fill: "var(--primary)" }} />)}
                </div>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", lineHeight: 1.7, fontStyle: "italic", marginBottom: "1.5rem" }}>"{t.text}"</p>
                <p className="pub-font" style={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.name}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem" }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section style={{ padding: "5rem 2.5rem", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1px", background: "#e5e5e5" }}>
          {trustBadges.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="pub-fade-up" style={{ transitionDelay: `${i * 100}ms`, background: "#fff", padding: "2rem", textAlign: "center" }}>
                <Icon style={{ width: 28, height: 28, color: "#555", margin: "0 auto 1rem" }} />
                <p className="pub-font" style={{ fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#0a0a0a", marginBottom: "0.25rem" }}>{b.title}</p>
                <p style={{ color: "rgba(0,0,0,0.4)", fontSize: "0.78rem" }}>{b.sub}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "440px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&q=80&auto=format&fit=crop"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(200,168,75,0.88)", mixBlendMode: "multiply" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "4rem 2rem" }}>
          <h2 className="pub-font pub-fade-up" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", color: "#fff", lineHeight: 1, marginBottom: "1.5rem" }}>
            Comece Hoje.<br />Economize R$ 240.
          </h2>
          <p className="pub-fade-up pub-delay-1" style={{ color: "rgba(255,255,255,0.8)", marginBottom: "2rem" }}>
            Cancele quando quiser. Sem taxas ocultas.
          </p>
          <button onClick={() => handleSelectPlan("pro_yearly")}
            className="pub-fade-up pub-delay-2"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "1rem 2.5rem", background: "#fff", color: "#000", fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "pointer", borderRadius: 0, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#0a0a0a"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}>
            Plano Anual — Economize R$ 240 <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
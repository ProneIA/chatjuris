import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Check, Crown, Building2, Star, Shield, Clock, Users, Zap, Sparkles, AlertTriangle, CreditCard } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import AffiliateTracker from "@/components/subscription/AffiliateTracker";
import { SITE_CSS, SiteNav, SiteFooter } from "@/components/landing/PublicLayout";
import CheckoutModal from "@/components/subscription/CheckoutModal";

// ─── Planos ─────────────────────────────────────────────────────────────────
const MONTHLY_PLANS = [
  {
    id: "basic_monthly",
    name: "Básico",
    price: 89.90,
    amount: 89.90,
    period: "/mês",
    billingType: "monthly",
    billingLabel: "Cobrança mensal",
    installments: 1,
    description: "Ideal para advogados iniciantes",
    badge: null,
    popular: false,
    dark: false,
    features: [
      { text: "30 documentos por mês", highlight: false },
      { text: "300 créditos de IA", highlight: false },
      { text: "Gestão de processos", highlight: false },
      { text: "Jurisprudência básica", highlight: false },
      { text: "Suporte por e-mail", highlight: false },
    ],
  },
  {
    id: "adv_monthly",
    name: "Advogado",
    price: 119.90,
    amount: 119.90,
    period: "/mês",
    billingType: "monthly",
    billingLabel: "Cobrança mensal",
    installments: 1,
    description: "Melhor custo-benefício",
    badge: "Mais popular",
    popular: true,
    dark: true,
    features: [
      { text: "60 documentos por mês", highlight: true },
      { text: "600 créditos de IA", highlight: true },
      { text: "Todos os modos de IA", highlight: false },
      { text: "Jurisprudência completa", highlight: false },
      { text: "Calendário inteligente", highlight: false },
      { text: "Suporte prioritário", highlight: false },
    ],
  },
  {
    id: "empresa_monthly",
    name: "Empresas",
    price: 219.90,
    amount: 219.90,
    period: "/mês",
    billingType: "monthly",
    billingLabel: "Cobrança mensal",
    installments: 1,
    description: "Para escritórios em crescimento",
    badge: null,
    popular: false,
    dark: false,
    features: [
      { text: "Documentos ilimitados", highlight: true },
      { text: "Créditos de IA ilimitados*", highlight: true },
      { text: "Prioridade na geração", highlight: true },
      { text: "Suporte prioritário", highlight: false },
      { text: "Equipes e workspace", highlight: false },
      { text: "*política de uso justo", highlight: false },
    ],
  },
];

const ANNUAL_PLANS = [
  {
    id: "adv_yearly",
    name: "Advogado Anual",
    price: 1197.00,
    monthlyEq: 99.75,
    amount: 1197.00,
    period: "/ano",
    billingType: "yearly",
    billingLabel: "Cobrança anual · até 12x sem juros",
    installments: 12,
    description: "Economize R$ 241,80 por ano",
    badge: "Mais escolhido 🔥",
    savings: "R$ 241,80/ano",
    popular: true,
    dark: true,
    features: [
      { text: "60 documentos por mês", highlight: true },
      { text: "600 créditos de IA", highlight: true },
      { text: "Todos os modos de IA", highlight: false },
      { text: "Jurisprudência completa", highlight: false },
      { text: "Prioridade leve na geração", highlight: false },
      { text: "Calendário inteligente", highlight: false },
      { text: "Suporte prioritário", highlight: false },
    ],
  },
  {
    id: "empresa_yearly",
    name: "Empresas Anual",
    price: 2197.00,
    monthlyEq: 183.08,
    amount: 2197.00,
    period: "/ano",
    billingType: "yearly",
    billingLabel: "Cobrança anual · até 12x sem juros",
    installments: 12,
    description: "Para escritórios que escalam",
    badge: "Para escritórios 🚀",
    savings: "R$ 441,80/ano",
    popular: false,
    dark: false,
    features: [
      { text: "Documentos ilimitados", highlight: true },
      { text: "Créditos de IA ilimitados*", highlight: true },
      { text: "Prioridade máxima", highlight: true },
      { text: "Suporte prioritário + rápido", highlight: false },
      { text: "Equipes e workspace", highlight: false },
      { text: "*política de uso justo", highlight: false },
    ],
  },
];

const trust = [
  { icon: Shield, title: "100% Seguro", sub: "Dados criptografados" },
  { icon: CreditCard, title: "Pagamento Seguro", sub: "Mercado Pago" },
  { icon: Clock, title: "Cancele Quando Quiser", sub: "Sem compromisso" },
  { icon: Users, title: "Suporte 24/7", sub: "Equipe especializada" },
];

const testimonials = [
  { name: "Dr. Ricardo M.", role: "Advogado Criminalista", text: "Economizo 3 horas por dia com o Juris. A IA é impressionante." },
  { name: "Dra. Carla S.", role: "Advogada Trabalhista", text: "A melhor ferramenta que já usei. Indico para todos os colegas." },
];

// ─── PlanCard ────────────────────────────────────────────────────────────────
function PlanCard({ plan, onSelect, isCurrent }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: plan.dark ? "#0a0a0a" : "#fff",
        padding: "2.5rem",
        position: "relative",
        borderBottom: plan.popular
          ? "4px solid #C8A84B"
          : hovered ? "4px solid #191970" : "4px solid transparent",
        transition: "border-color .2s, box-shadow .2s",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,.12)" : "none",
      }}
    >
      {/* Badge */}
      {plan.badge && (
        <div style={{
          position: "absolute", top: 0, right: 0,
          background: plan.popular ? "#C8A84B" : "#191970",
          color: plan.popular ? "#000" : "#fff",
          fontFamily: "'Oswald', sans-serif", fontWeight: 700,
          fontSize: ".65rem", padding: ".35rem .8rem",
          textTransform: "uppercase", letterSpacing: ".1em",
        }}>
          {plan.badge}
        </div>
      )}

      {/* Nome e descrição */}
      <div style={{ marginBottom: "1.5rem", paddingTop: plan.badge ? "1rem" : 0 }}>
        <h3 style={{
          fontFamily: "'Oswald', sans-serif", fontWeight: 700,
          fontSize: "1rem", textTransform: "uppercase", letterSpacing: ".05em",
          color: plan.dark ? "#fff" : "#0a0a0a", margin: "0 0 .3rem",
        }}>{plan.name}</h3>
        <p style={{ fontSize: ".78rem", color: plan.dark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.4)", margin: 0 }}>
          {plan.description}
        </p>
      </div>

      {/* Preço */}
      <div style={{ marginBottom: "1.25rem" }}>
        {plan.monthlyEq && (
          <p style={{ color: plan.dark ? "rgba(255,255,255,.3)" : "#bbb", fontSize: ".8rem", margin: "0 0 .2rem", fontFamily: "'Oswald', sans-serif" }}>
            ~R$ {plan.monthlyEq.toFixed(2).replace(".", ",")}/mês
          </p>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: ".4rem" }}>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "3rem", lineHeight: 1, color: plan.dark ? "#fff" : "#0a0a0a" }}>
            R$ {plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
          <span style={{ color: plan.dark ? "rgba(255,255,255,.3)" : "#aaa", fontSize: ".85rem" }}>{plan.period}</span>
        </div>
        {plan.savings && (
          <p style={{ color: "#4ade80", fontSize: ".78rem", fontWeight: 600, margin: ".3rem 0 0", fontFamily: "'Oswald', sans-serif" }}>
            ✓ Economize {plan.savings}
          </p>
        )}
        {plan.installments > 1 && (
          <p style={{ color: plan.dark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.4)", fontSize: ".72rem", margin: ".2rem 0 0" }}>
            em até {plan.installments}x sem juros
          </p>
        )}
      </div>

      {/* Botão */}
      <button
        onClick={() => !isCurrent && onSelect(plan)}
        disabled={isCurrent}
        style={{
          width: "100%", padding: ".9rem", marginBottom: "1.75rem",
          fontFamily: "'Oswald', sans-serif", fontWeight: 700,
          fontSize: ".82rem", textTransform: "uppercase", letterSpacing: ".1em",
          border: "none", cursor: isCurrent ? "not-allowed" : "pointer",
          transition: "background .2s, color .2s",
          background: isCurrent
            ? (plan.dark ? "#222" : "#e5e5e5")
            : plan.popular ? "#C8A84B" : (plan.dark ? "#C8A84B" : "#0a0a0a"),
          color: isCurrent
            ? (plan.dark ? "#555" : "#aaa")
            : plan.popular ? "#000" : (plan.dark ? "#000" : "#fff"),
        }}
        onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.opacity = ".85"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
      >
        {isCurrent ? "✓ Plano Atual" : "Assinar Agora →"}
      </button>

      {/* Features */}
      <div>
        <p style={{
          fontFamily: "'Oswald', sans-serif", fontSize: ".6rem", textTransform: "uppercase",
          letterSpacing: ".15em", color: plan.dark ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.3)",
          marginBottom: ".75rem",
        }}>Incluído:</p>
        {plan.features.map((f, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: ".6rem", marginBottom: ".6rem" }}>
            <div style={{
              width: 16, height: 16, flexShrink: 0, marginTop: 2,
              background: plan.dark ? "rgba(200,168,75,.15)" : "#f0f0f0",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check style={{ width: 10, height: 10, color: plan.dark ? "#C8A84B" : "#555" }} />
            </div>
            <span style={{
              fontSize: ".8rem", lineHeight: 1.4,
              fontWeight: f.highlight ? 700 : 400,
              color: plan.dark
                ? (f.highlight ? "#fff" : "rgba(255,255,255,.55)")
                : (f.highlight ? "#0a0a0a" : "#666"),
            }}>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Toggle Mensal / Anual ────────────────────────────────────────────────────
function BillingToggle({ billing, onChange }) {
  return (
    <div style={{ display: "inline-flex", border: "1px solid #e0e0ea", overflow: "hidden" }}>
      {["monthly", "yearly"].map((b) => (
        <button
          key={b}
          onClick={() => onChange(b)}
          style={{
            padding: ".6rem 1.6rem",
            background: billing === b ? "#191970" : "#fff",
            color: billing === b ? "#fff" : "#6b6b80",
            border: "none", cursor: "pointer",
            fontFamily: "'Oswald', sans-serif", fontWeight: 600,
            fontSize: ".75rem", textTransform: "uppercase", letterSpacing: ".1em",
            transition: "background .2s, color .2s",
            position: "relative",
          }}
        >
          {b === "monthly" ? "Mensal" : "Anual"}
          {b === "yearly" && (
            <span style={{
              marginLeft: ".5rem", background: "#4ade80", color: "#000",
              fontSize: ".55rem", padding: ".1rem .35rem",
              fontFamily: "'Oswald', sans-serif", fontWeight: 700, letterSpacing: ".08em",
            }}>
              ATÉ -17%
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Pricing Page ─────────────────────────────────────────────────────────────
export default function Pricing() {
  const [user, setUser] = useState(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [billing, setBilling] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const obsRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u?.trial_status === "active" && u?.trial_end_date) {
        const days = Math.ceil((new Date(u.trial_end_date) - new Date()) / 864e5);
        setTrialDaysLeft(days > 0 ? days : 0);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    obsRef.current = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("v"); obsRef.current.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".fu,.fi").forEach((el) => obsRef.current.observe(el));
    return () => obsRef.current?.disconnect();
  }, [billing]);

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0] || null;
    },
    enabled: !!user?.id, staleTime: 10 * 60 * 1000,
  });

  const isCurrentPlan = (planId) => {
    if (!subscription) return false;
    const today = new Date().toISOString().split("T")[0];
    if ((subscription.end_date && today > subscription.end_date)) return false;
    if (!["active"].includes(subscription.status)) return false;
    return subscription.payment_external_id?.includes(planId) || false;
  };

  const handleSelectPlan = async (plan) => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      localStorage.setItem("selected_plan", plan.id);
      base44.auth.redirectToLogin(createPageUrl("Pricing"));
      return;
    }
    setSelectedPlan(plan);
  };

  // Ao logar, retomar seleção de plano
  useEffect(() => {
    if (!user) return;
    const p = localStorage.getItem("selected_plan");
    if (p) {
      localStorage.removeItem("selected_plan");
      const allPlans = [...MONTHLY_PLANS, ...ANNUAL_PLANS];
      const found = allPlans.find(pl => pl.id === p);
      if (found) setSelectedPlan(found);
    }
  }, [user?.id]);

  const plans = billing === "monthly" ? MONTHLY_PLANS : ANNUAL_PLANS;

  return (
    <div style={{ overflowX: "hidden", WebkitFontSmoothing: "antialiased" }}>
      <style>{SITE_CSS}{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
      `}</style>
      <AffiliateTracker />
      <SiteNav blend />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{ position: "relative", height: "100vh", minHeight: "600px", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1920&q=80&auto=format&fit=crop" alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.2)" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.75)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 50%, rgba(25,25,112,.3) 0%, transparent 60%)" }} />

        <div style={{ position: "relative", zIndex: 2, padding: "0 2.5rem", maxWidth: "900px", marginLeft: "auto", marginRight: "auto" }}>
          {user && (
            <Link to={createPageUrl("Dashboard")} className="D"
              style={{ color: "rgba(255,255,255,.45)", textDecoration: "none", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".14em", display: "inline-block", marginBottom: "1.5rem" }}>
              ← Voltar ao Painel
            </Link>
          )}
          {user?.trial_status === "active" && trialDaysLeft > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", background: "#C8A84B", color: "#000", padding: ".4rem 1rem", marginBottom: "1.5rem", fontFamily: "'Oswald',sans-serif", fontSize: ".7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>
              <Sparkles style={{ width: 14, height: 14 }} /> Teste: {trialDaysLeft} {trialDaysLeft === 1 ? "dia" : "dias"} restantes
            </div>
          )}
          {user?.trial_status === "expired" && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", background: "#ef4444", color: "#fff", padding: ".4rem 1rem", marginBottom: "1.5rem", fontFamily: "'Oswald',sans-serif", fontSize: ".7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>
              <AlertTriangle style={{ width: 14, height: 14 }} /> Período de Teste Expirado
            </div>
          )}

          <p className="lbl fi" style={{ marginBottom: "1.2rem" }}>✦ Plataforma Jurídica com IA</p>
          <h1 className="D fu" style={{ fontSize: "clamp(3.5rem,10vw,7rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1, color: "#fff", margin: "0 0 1.5rem" }}>
            Planos &amp;<br /><span className="outline-w">Preços</span><br /><span style={{ color: "#C8A84B" }}>Transparentes.</span>
          </h1>
          <p className="fu d1" style={{ color: "rgba(255,255,255,.7)", fontSize: "1.05rem", maxWidth: "500px", lineHeight: 1.7, marginBottom: "2.5rem" }}>
            Sem taxas ocultas. Sem surpresas. Escolha o plano ideal para seu escritório e cancele quando quiser.
          </p>
          <div className="fu d2" style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
            {[["80+", "Advogados Ativos"], ["1.200+", "Docs Gerados"], ["4.9/5", "Avaliação"]].map(([n, l]) => (
              <div key={l}>
                <div className="D" style={{ fontSize: "2rem", fontWeight: 700, color: "#C8A84B" }}>{n}</div>
                <div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".1em" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ───────────────────────────────────────── */}
      <section id="planos" style={{ padding: "7rem 2.5rem", background: "#f4f4f6" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* Título + toggle */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "flex-end", marginBottom: "3rem" }}>
            <div style={{ flex: "1 1 400px" }}>
              <h2 className="D fu" style={{ fontSize: "clamp(2.5rem,5vw,4rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", color: "#0a0a0a", margin: "0 0 .5rem" }}>
                Escolha Seu Plano.
              </h2>
              <p className="fu d1" style={{ color: "rgba(0,0,0,.5)", lineHeight: 1.6, fontSize: ".9rem", margin: 0 }}>
                Pagamento seguro via Mercado Pago · Somente cartão de crédito.
              </p>
            </div>
            <div className="fu d2">
              <BillingToggle billing={billing} onChange={setBilling} />
            </div>
          </div>

          {/* Grid de planos */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${plans.length}, 1fr)`,
            gap: "1px",
            background: "#e0e0ea",
          }}>
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={isCurrentPlan(plan.id)}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>

          {/* Nota planos anuais */}
          {billing === "yearly" && (
            <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: ".78rem", color: "rgba(0,0,0,.4)", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".1em" }}>
              🔒 Planos anuais: parcelamento em até 12x sem juros — os juros são absorvidos pelo Juris.
            </p>
          )}
        </div>
      </section>

      {/* ── DEPOIMENTOS + TRUST ──────────────────────────── */}
      <section style={{ background: "#0d0d1a", position: "relative", overflow: "hidden", padding: "7rem 2.5rem" }}>
        <div className="grid-bg" style={{ position: "absolute", inset: 0 }} />
        <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 className="D fu" style={{ fontSize: "clamp(2.5rem,5vw,4rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1, color: "#fff", margin: "0 0 3rem" }}>
            O Que Dizem<br />Nossos Usuários.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: "1px", background: "rgba(255,255,255,.05)" }}>
            {testimonials.map((t, i) => (
              <div key={i} className="fu" style={{ transitionDelay: `${i * 100}ms`, padding: "2.5rem", background: "#0d0d1a" }}>
                <div style={{ display: "flex", gap: "3px", marginBottom: "1.25rem" }}>
                  {[...Array(5)].map((_, s) => <Star key={s} style={{ width: 13, height: 13, color: "#C8A84B", fill: "#C8A84B" }} />)}
                </div>
                <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".9rem", lineHeight: 1.7, fontStyle: "italic", marginBottom: "1rem" }}>"{t.text}"</p>
                <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".08em", color: "#C8A84B", margin: 0 }}>{t.name}</p>
                <p style={{ color: "rgba(255,255,255,.3)", fontSize: ".72rem", margin: ".2rem 0 0" }}>{t.role}</p>
              </div>
            ))}
            {trust.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="fu" style={{ transitionDelay: `${(i + 2) * 100}ms`, padding: "2.5rem", background: "#0d0d1a", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Icon style={{ width: 26, height: 26, color: "#C8A84B", marginBottom: "1rem" }} />
                  <p className="D" style={{ fontWeight: 600, fontSize: ".85rem", textTransform: "uppercase", letterSpacing: ".05em", color: "#fff", marginBottom: ".25rem" }}>{b.title}</p>
                  <p style={{ color: "rgba(255,255,255,.3)", fontSize: ".78rem" }}>{b.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "480px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80&auto=format&fit=crop" alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1)" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(25,25,112,.88)" }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "5rem 2rem", maxWidth: "720px" }}>
          <p className="lbl fi" style={{ color: "rgba(255,255,255,.6)", marginBottom: "1.25rem" }}>✦ Comece Agora</p>
          <h2 className="D fu" style={{ fontSize: "clamp(2.5rem,7vw,5rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1, color: "#fff", marginBottom: "1.25rem" }}>
            Transforme Seu<br /><span style={{ color: "#C8A84B" }}>Escritório Hoje.</span>
          </h2>
          <p className="fu d1" style={{ color: "rgba(255,255,255,.7)", fontSize: ".95rem", marginBottom: "2rem" }}>
            Cancele quando quiser. Sem taxas ocultas.
          </p>
          <button
            onClick={() => { setBilling("yearly"); document.querySelector("#planos")?.scrollIntoView({ behavior: "smooth" }); }}
            className="btn-gold fu d2"
          >
            Ver Planos Anuais — Economize até R$ 441 →
          </button>
        </div>
      </section>

      <SiteFooter />

      {/* ── MODAL DE CHECKOUT ────────────────────────────── */}
      {selectedPlan && (
        <CheckoutModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  );
}
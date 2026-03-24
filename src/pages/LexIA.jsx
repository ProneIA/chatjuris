import React, { useState } from "react";
import CheckoutModal from "@/components/subscription/CheckoutModal";

/* ═══════════════════════════════════════════════════════════
   LEXIA — Página de Planos com Checkout Mercado Pago Bricks
   ═══════════════════════════════════════════════════════════ */

const MONTHLY_PLANS = [
  {
    id: "basic_monthly",
    name: "Básico",
    label: "BÁSICO",
    price: 89.90,
    amount: 89.90,
    period: "/mês",
    billingLabel: "Cobrança mensal",
    installments: 1,
    featured: false,
    badge: null,
    tagline: "Ideal para advogados iniciantes",
    features: [
      "30 documentos por mês",
      "300 créditos de IA",
      "Assistente jurídico IA",
      "Gestão de processos básica",
      "Suporte por e-mail",
    ],
  },
  {
    id: "adv_monthly",
    name: "Advogado",
    label: "ADVOGADO",
    price: 119.90,
    amount: 119.90,
    period: "/mês",
    billingLabel: "Cobrança mensal",
    installments: 1,
    featured: true,
    badge: "Mais popular",
    tagline: "Melhor custo-benefício",
    features: [
      "60 documentos por mês",
      "600 créditos de IA",
      "Assistente jurídico IA avançado",
      "Gestão completa de processos",
      "Pesquisa de jurisprudência",
      "Suporte prioritário",
    ],
  },
  {
    id: "empresa_monthly",
    name: "Empresas",
    label: "EMPRESAS",
    price: 219.90,
    amount: 219.90,
    period: "/mês",
    billingLabel: "Cobrança mensal",
    installments: 1,
    featured: false,
    badge: null,
    tagline: "Para escritórios em crescimento",
    features: [
      "Documentos ilimitados",
      "Créditos de IA ilimitados*",
      "Prioridade na fila de geração",
      "Equipes e colaboração",
      "Suporte prioritário + rápido",
      "* uso justo",
    ],
  },
];

const ANNUAL_PLANS = [
  {
    id: "adv_yearly",
    name: "Advogado Anual",
    label: "ADVOGADO ANUAL",
    price: 1197.00,
    monthlyEq: 99.75,
    amount: 1197.00,
    period: "/ano",
    billingLabel: "Cobrança anual — até 12x sem juros",
    installments: 12,
    featured: true,
    badge: "Mais escolhido 🔥",
    savings: "R$ 241,80",
    tagline: "Economize R$ 241,80 por ano",
    features: [
      "60 documentos por mês",
      "600 créditos de IA",
      "Assistente jurídico IA avançado",
      "Gestão completa de processos",
      "Pesquisa de jurisprudência",
      "Prioridade leve na fila",
      "Suporte prioritário",
    ],
  },
  {
    id: "empresa_yearly",
    name: "Empresas Anual",
    label: "EMPRESAS ANUAL",
    price: 2197.00,
    monthlyEq: 183.08,
    amount: 2197.00,
    period: "/ano",
    billingLabel: "Cobrança anual — até 12x sem juros",
    installments: 12,
    featured: false,
    badge: "Para escritórios 🚀",
    savings: "R$ 441,80",
    tagline: "Economize R$ 441,80 por ano",
    features: [
      "Documentos ilimitados",
      "Créditos de IA ilimitados*",
      "Prioridade máxima na fila",
      "Equipes e colaboração",
      "Suporte prioritário + rápido",
      "Onboarding dedicado",
      "* uso justo",
    ],
  },
];

/* ─── Plan Card ──────────────────────────────────────────── */
function PlanCard({ plan, onSelect }) {
  const fmt = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  return (
    <div
      style={{
        background: "#111318",
        border: plan.featured ? "1px solid rgba(200,168,75,0.5)" : "1px solid rgba(255,255,255,0.06)",
        padding: "2.2rem 1.75rem",
        display: "flex", flexDirection: "column",
        position: "relative",
        transition: "transform .25s, box-shadow .25s",
        boxShadow: plan.featured ? "0 0 40px rgba(200,168,75,0.12), 0 4px 24px rgba(0,0,0,0.4)" : "0 4px 24px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = plan.featured
          ? "0 0 60px rgba(200,168,75,0.2), 0 16px 40px rgba(0,0,0,0.5)"
          : "0 16px 40px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = plan.featured
          ? "0 0 40px rgba(200,168,75,0.12), 0 4px 24px rgba(0,0,0,0.4)"
          : "0 4px 24px rgba(0,0,0,0.3)";
      }}
    >
      {plan.badge && (
        <div style={{
          position: "absolute", top: "-1px", left: "50%", transform: "translateX(-50%)",
          background: plan.featured ? "#C8A84B" : "rgba(255,255,255,0.1)",
          color: plan.featured ? "#000" : "rgba(255,255,255,0.7)",
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: ".62rem",
          padding: ".25rem .9rem", textTransform: "uppercase", letterSpacing: ".1em",
          whiteSpace: "nowrap",
        }}>{plan.badge}</div>
      )}

      <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".2em", color: plan.featured ? "#C8A84B" : "rgba(255,255,255,0.35)", margin: "0 0 .4rem" }}>
        {plan.label}
      </p>
      <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "1.5rem", color: "#fff", margin: "0 0 .3rem", lineHeight: 1.2 }}>
        {plan.name}
      </h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: ".8rem", color: "rgba(255,255,255,0.4)", margin: "0 0 1.5rem" }}>
        {plan.tagline}
      </p>

      <div style={{ marginBottom: "1.5rem" }}>
        {plan.monthlyEq && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: ".7rem", color: "rgba(255,255,255,0.3)", margin: "0 0 .2rem" }}>
            ~R$ {fmt(plan.monthlyEq)}/mês
          </p>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: ".3rem" }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "2.4rem", color: plan.featured ? "#C8A84B" : "#fff", lineHeight: 1 }}>
            R$ {fmt(plan.price)}
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: ".8rem", color: "rgba(255,255,255,0.3)" }}>
            {plan.period}
          </span>
        </div>
        {plan.savings && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: ".72rem", color: "#4ade80", margin: ".3rem 0 0", fontWeight: 600 }}>
            ✓ Economize {plan.savings}
          </p>
        )}
        {plan.installments > 1 && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: ".7rem", color: "rgba(255,255,255,0.25)", margin: ".15rem 0 0" }}>
            Parcelável em até {plan.installments}× sem juros
          </p>
        )}
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 0 1.4rem" }} />

      <ul style={{ listStyle: "none", margin: "0 0 2rem", padding: 0, flex: 1, display: "flex", flexDirection: "column", gap: ".6rem" }}>
        {plan.features.map((f, i) => (
          <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: ".83rem", color: f.startsWith("*") ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: ".6rem" }}>
            {!f.startsWith("*") && (
              <span style={{ width: 16, height: 16, background: plan.featured ? "rgba(200,168,75,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${plan.featured ? "rgba(200,168,75,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".5rem", color: plan.featured ? "#C8A84B" : "rgba(255,255,255,0.4)", flexShrink: 0 }}>✓</span>
            )}
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan)}
        style={{
          width: "100%", padding: "1rem",
          background: plan.featured ? "#C8A84B" : "transparent",
          color: plan.featured ? "#000" : "#C8A84B",
          border: "1px solid " + (plan.featured ? "#C8A84B" : "rgba(200,168,75,0.4)"),
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: ".8rem",
          textTransform: "uppercase", letterSpacing: ".1em",
          transition: "all .2s", borderRadius: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#C8A84B"; e.currentTarget.style.color = "#000"; e.currentTarget.style.borderColor = "#C8A84B"; }}
        onMouseLeave={e => { e.currentTarget.style.background = plan.featured ? "#C8A84B" : "transparent"; e.currentTarget.style.color = plan.featured ? "#000" : "#C8A84B"; e.currentTarget.style.borderColor = plan.featured ? "#C8A84B" : "rgba(200,168,75,0.4)"; }}
      >
        Assinar agora →
      </button>
    </div>
  );
}

/* ─── FAQ Accordion Item ─────────────────────────────────── */
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", padding: "1.2rem 0", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", textAlign: "left" }}
      >
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: ".92rem", color: open ? "#C8A84B" : "rgba(255,255,255,0.8)", transition: "color .2s" }}>{question}</span>
        <span style={{ color: open ? "#C8A84B" : "rgba(255,255,255,0.3)", fontSize: "1.1rem", flexShrink: 0, transition: "transform .2s, color .2s", transform: open ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
      </button>
      {open && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: ".85rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.75, padding: "0 0 1.2rem", margin: 0 }}>
          {answer}
        </p>
      )}
    </div>
  );
}

/* ─── Main LexIA Page ────────────────────────────────────── */
export default function LexIA() {
  const [billing, setBilling] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = billing === "monthly" ? MONTHLY_PLANS : ANNUAL_PLANS;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0c10", color: "#fff", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .lexia-grain::before {
          content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.025;
        }
        .lexia-billing-btn {
          padding: .55rem 1.6rem; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: .75rem;
          text-transform: uppercase; letter-spacing: .1em; transition: all .2s;
        }
        .lexia-billing-btn.active { background: #C8A84B; color: #000; }
        .lexia-billing-btn.inactive { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.45); }
        .lexia-billing-btn.inactive:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
        @media (max-width: 640px) {
          .lexia-grid { grid-template-columns: 1fr !important; }
          .lexia-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="lexia-grain" style={{ position: "relative" }}>
        <div style={{ position: "fixed", top: "-20%", left: "10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(200,168,75,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", bottom: "10%", right: "5%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(200,168,75,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        {/* NAV */}
        <nav style={{ position: "relative", zIndex: 10, padding: "1.5rem 3rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.5rem", color: "#fff", letterSpacing: "-0.02em" }}>Lex</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.5rem", color: "#C8A84B", letterSpacing: "-0.02em" }}>IA</span>
            <div style={{ width: 6, height: 6, background: "#C8A84B", borderRadius: "50%", marginLeft: ".2rem" }} />
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".15em", color: "rgba(255,255,255,0.25)", margin: 0 }}>
            Plataforma Jurídica com IA
          </p>
        </nav>

        {/* HERO */}
        <section style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "5rem 2rem 4rem" }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: ".85rem", color: "#C8A84B", letterSpacing: ".15em", marginBottom: "1rem" }}>
            ✦ Planos &amp; Preços
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "clamp(2.5rem, 6vw, 4.5rem)", color: "#fff", margin: "0 0 1rem", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            Escale seu escritório<br />
            <span style={{ color: "#C8A84B" }}>com inteligência artificial</span>
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255,255,255,0.5)", maxWidth: "480px", margin: "0 auto 3rem", lineHeight: 1.75 }}>
            Escolha o plano ideal para o seu escritório. Pagamento seguro via cartão de crédito. Cancele quando quiser.
          </p>

          <div style={{ display: "inline-flex", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", marginBottom: "1rem" }}>
            <button className={`lexia-billing-btn ${billing === "monthly" ? "active" : "inactive"}`} onClick={() => setBilling("monthly")}>
              Mensal
            </button>
            <button className={`lexia-billing-btn ${billing === "yearly" ? "active" : "inactive"}`} onClick={() => setBilling("yearly")}>
              Anual
              <span style={{ marginLeft: ".4rem", background: "#4ade80", color: "#000", fontSize: ".55rem", padding: ".1rem .35rem", fontWeight: 800, verticalAlign: "middle" }}>-17%</span>
            </button>
          </div>

          {billing === "yearly" && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: ".78rem", color: "rgba(200,168,75,0.7)", marginTop: ".5rem" }}>
              🎉 Planos anuais parceláveis em até 12× sem juros
            </p>
          )}
        </section>

        {/* PLANS GRID */}
        <section style={{ position: "relative", zIndex: 1, padding: "0 2rem 6rem", maxWidth: "1100px", margin: "0 auto" }}>
          <div
            className={billing === "monthly" ? "lexia-grid" : "lexia-grid-2"}
            style={{ display: "grid", gridTemplateColumns: billing === "monthly" ? "repeat(3, 1fr)" : "repeat(2, 1fr)", gap: "1.5rem", alignItems: "start" }}
          >
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} onSelect={setSelectedPlan} />
            ))}
          </div>

          <div style={{ marginTop: "3rem", display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "center" }}>
            {["🔒 SSL 256-bit", "💳 Mercado Pago", "✓ Cancele quando quiser", "📧 Suporte por e-mail"].map(t => (
              <span key={t} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: ".72rem", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: ".1em" }}>{t}</span>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ position: "relative", zIndex: 1, padding: "4rem 2rem 6rem", maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "2rem", color: "#fff", textAlign: "center", marginBottom: "3rem" }}>
            Dúvidas frequentes
          </h2>
          {[
            { q: "Posso cancelar a qualquer momento?", a: "Sim. Você pode cancelar sua assinatura a qualquer momento sem taxas ou multas. O acesso continua até o final do período pago." },
            { q: "O que são créditos de IA?", a: "Créditos são consumidos ao gerar documentos, fazer consultas jurídicas e usar o assistente de IA. Cada documento consome entre 1 e 5 créditos dependendo da complexidade." },
            { q: "Planos anuais têm parcelamento?", a: "Sim! Planos anuais podem ser parcelados em até 12× sem juros no cartão de crédito. O custo dos juros é absorvido por nós." },
            { q: "Meus dados são seguros?", a: "Absolutamente. Utilizamos criptografia AES-256 em repouso e TLS em trânsito. Somos totalmente conformes com a LGPD." },
          ].map(({ q, a }) => (
            <FAQItem key={q} question={q} answer={a} />
          ))}
        </section>

        {/* FOOTER */}
        <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2rem", textAlign: "center" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: ".72rem", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: ".12em" }}>
            © 2024 LexIA · Plataforma Jurídica com IA · Todos os direitos reservados
          </p>
        </footer>
      </div>

      {/* Checkout Modal — usa containerId único para não conflitar com Pricing */}
      {selectedPlan && (
        <CheckoutModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          containerId="lexia-brick-container"
        />
      )}
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Check, X, Zap, Crown, Star, ArrowRight, Shield, Clock, Users, Sparkles, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import AffiliateTracker from "@/components/subscription/AffiliateTracker";
import { SITE_CSS, SiteNav, SiteFooter } from "@/components/landing/PublicLayout";

const plans = [
  {
    id:"pro_monthly", name:"Profissional Mensal", icon:Zap,
    price:119.90, period:"/mês", billingType:"monthly",
    description:"Tudo ilimitado com renovação mensal",
    features:[
      { text:"IA ILIMITADA — sem restrições", included:true, highlight:true },
      { text:"Clientes ILIMITADOS", included:true, highlight:true },
      { text:"Processos ILIMITADOS", included:true, highlight:true },
      { text:"Documentos ILIMITADOS", included:true, highlight:true },
      { text:"Todos os modos de IA", included:true },
      { text:"Equipes e Workspace", included:true },
      { text:"Jurisprudência completa", included:true },
      { text:"Modelos de Peças ilimitados", included:true },
      { text:"Calendário inteligente", included:true },
      { text:"Análise LEXIA de documentos", included:true },
      { text:"Gerador de imagens IA", included:true },
      { text:"Suporte prioritário 24/7", included:true },
    ],
  },
  {
    id:"pro_yearly", name:"Profissional Anual", icon:Crown,
    price:99.90, originalPrice:119.90, period:"/mês", billingType:"yearly",
    annualTotal:1198.80, description:"Melhor valor — pague anualmente e economize",
    popular:true, discount:17, savingsText:"Economize R$ 240/ano — 2 meses grátis!",
    features:[
      { text:"IA ILIMITADA — sem restrições", included:true, highlight:true },
      { text:"Clientes ILIMITADOS", included:true, highlight:true },
      { text:"Processos ILIMITADOS", included:true, highlight:true },
      { text:"Documentos ILIMITADOS", included:true, highlight:true },
      { text:"Todos os modos de IA", included:true },
      { text:"Equipes e Workspace", included:true },
      { text:"Jurisprudência completa", included:true },
      { text:"Modelos de Peças ilimitados", included:true },
      { text:"Calendário inteligente", included:true },
      { text:"Análise LEXIA de documentos", included:true },
      { text:"Gerador de imagens IA", included:true },
      { text:"Suporte prioritário 24/7", included:true },
    ],
  },
];

const testimonials = [
  { name:"Dr. Ricardo M.", role:"Advogado Criminalista", text:"Economizo 3 horas por dia com o Juris. A IA é impressionante." },
  { name:"Dra. Carla S.", role:"Advogada Trabalhista", text:"A melhor ferramenta que já usei. Indico para todos os colegas." },
];

const trust = [
  { icon:Shield, title:"100% Seguro", sub:"Dados criptografados" },
  { icon:Zap, title:"Pagamento Seguro", sub:"Mercado Pago" },
  { icon:Clock, title:"Cancele Quando Quiser", sub:"Sem compromisso" },
  { icon:Users, title:"Suporte 24/7", sub:"Equipe especializada" },
];

export default function Pricing({ theme = "light" }) {
  const [user, setUser] = useState(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const obs = useRef(null);

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
    obs.current = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("v"); obs.current.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".fu,.fi").forEach((el) => obs.current.observe(el));
    return () => obs.current?.disconnect();
  }, []);

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0] || null;
    },
    enabled: !!user?.id, staleTime: 10*60*1000,
  });

  const handleSelectPlan = async (planId) => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) { localStorage.setItem("selected_plan", planId); base44.auth.redirectToLogin(createPageUrl("Pricing")); return; }
    window.location.href = createPageUrl("Checkout") + "?plan=" + planId;
  };

  useEffect(() => {
    if (!user) return;
    const p = localStorage.getItem("selected_plan");
    if (p) { localStorage.removeItem("selected_plan"); window.location.href = createPageUrl("Checkout") + "?plan=" + p; }
  }, [user?.id]);

  const isCurrentPlan = (plan) => {
    if (!subscription) return false;
    const today = new Date().toISOString().split("T")[0];
    if ((subscription.end_date && today > subscription.end_date) || !["active","trial"].includes(subscription.status) || subscription.status === "trial") return false;
    return ({ monthly:"pro_monthly", annual:"pro_yearly", lifetime:"pro_lifetime" })[subscription.plan_type] === plan.id;
  };

  return (
    <div style={{ overflowX:"hidden", WebkitFontSmoothing:"antialiased" }}>
      <style>{SITE_CSS}</style>
      <AffiliateTracker />
      <SiteNav blend />

      {/* HERO */}
      <section style={{ position:"relative", height:"100vh", minHeight:"600px", display:"flex", alignItems:"center", overflow:"hidden" }}>
        <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1920&q=80&auto=format&fit=crop" alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", filter:"grayscale(1) contrast(1.2)" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.72)" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle, transparent 50%, rgba(0,0,0,.8) 150%)" }} />

        <div style={{ position:"relative", zIndex:2, padding:"0 2.5rem", maxWidth:"900px", marginLeft:"auto", marginRight:"auto" }}>
          {user && (
            <Link to={createPageUrl("Dashboard")} className="D"
              style={{ color:"rgba(255,255,255,.5)", textDecoration:"none", fontSize:".75rem", textTransform:"uppercase", letterSpacing:".12em", display:"inline-block", marginBottom:"1.5rem" }}>
              ← Voltar ao Painel
            </Link>
          )}
          {user?.trial_status === "active" && trialDaysLeft > 0 && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:".5rem", background:"var(--gold)", color:"#000", padding:".4rem 1rem", marginBottom:"1.5rem", fontFamily:"'Oswald',sans-serif", fontSize:".7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em" }}>
              <Sparkles style={{ width:14, height:14 }} /> Teste: {trialDaysLeft} {trialDaysLeft===1?"dia":"dias"} restantes
            </div>
          )}
          {user?.trial_status === "expired" && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:".5rem", background:"#ef4444", color:"#fff", padding:".4rem 1rem", marginBottom:"1.5rem", fontFamily:"'Oswald',sans-serif", fontSize:".7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em" }}>
              <AlertTriangle style={{ width:14, height:14 }} /> Período de Teste Expirado
            </div>
          )}

          <h1 className="D fu" style={{ fontSize:"clamp(3.5rem,10vw,7rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"#fff", margin:"0 0 1.5rem" }}>
            Planos &amp;<br /><span className="outline-w">Preços</span><br /><span style={{ color:"var(--primary)" }}>Simples.</span>
          </h1>
          <p className="fu d1" style={{ color:"rgba(255,255,255,.75)", fontSize:"1.1rem", maxWidth:"520px", lineHeight:1.7, marginBottom:"2rem" }}>
            +80 advogados economizando <strong style={{ color:"#fff" }}>2 dias de trabalho por semana</strong> com o Juris.
          </p>
          {/* Stats */}
          <div className="fu d2" style={{ display:"flex", gap:"3rem", flexWrap:"wrap" }}>
            {[["80+","Advogados Ativos"],["1.200+","Docs Gerados"],["4.9/5","Avaliação"]].map(([n,l])=>(
              <div key={l}>
                <div className="D" style={{ fontSize:"2rem", fontWeight:700, color:"var(--primary)" }}>{n}</div>
                <div style={{ fontSize:".72rem", color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:".1em" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section style={{ padding:"7rem 2.5rem" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"2rem", alignItems:"flex-end", marginBottom:"4rem" }}>
            <h2 className="D fu" style={{ fontSize:"clamp(3rem,6vw,5rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", color:"#0a0a0a", margin:0 }}>
              Escolha Seu<br />Plano.
            </h2>
            <p className="fu d1" style={{ color:"rgba(0,0,0,.5)", maxWidth:"280px", lineHeight:1.7, fontSize:".95rem" }}>
              Sem taxas ocultas. Cancele quando quiser.
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px,1fr))", gap:"1px", background:"#e5e5e5" }}>
            {plans.map((plan) => {
              const Icon = plan.icon;
              const current = isCurrentPlan(plan);
              return (
                <div key={plan.id} className="fu"
                  style={{ background: plan.popular ? "#0a0a0a" : "#fff", padding:"3rem", position:"relative", borderBottom: plan.popular ? "4px solid var(--gold)" : "4px solid transparent" }}>
                  {plan.discount && (
                    <div style={{ position:"absolute", top:0, right:0, background:"var(--gold)", color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:".7rem", padding:".4rem .8rem", textTransform:"uppercase", letterSpacing:".1em" }}>
                      🔥 {plan.discount}% OFF
                    </div>
                  )}
                  {plan.popular && (
                    <div style={{ display:"inline-flex", alignItems:"center", gap:".4rem", background:"var(--gold)", color:"#000", padding:".3rem .8rem", marginBottom:"1.5rem", fontFamily:"'Oswald',sans-serif", fontSize:".65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em" }}>
                      <Crown style={{ width:12, height:12 }} /> Recomendado
                    </div>
                  )}

                  <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.5rem" }}>
                    <div style={{ width:44, height:44, background: plan.popular ? "rgba(200,168,75,.15)" : "#f5f5f5", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Icon style={{ width:22, height:22, color: plan.popular ? "var(--gold)" : "#555" }} />
                    </div>
                    <div>
                      <h3 className="D" style={{ fontSize:".9rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", color: plan.popular?"#fff":"#0a0a0a", margin:0 }}>{plan.name}</h3>
                      <p style={{ fontSize:".78rem", color: plan.popular?"rgba(255,255,255,.35)":"rgba(0,0,0,.4)", margin:0 }}>{plan.description}</p>
                    </div>
                  </div>

                  {plan.originalPrice && <p style={{ color: plan.popular?"rgba(255,255,255,.3)":"#bbb", textDecoration:"line-through", fontSize:".95rem", margin:"0 0 .25rem" }}>R$ {plan.originalPrice.toFixed(2).replace(".",",")}</p>}
                  <div style={{ display:"flex", alignItems:"baseline", gap:".5rem", marginBottom:".5rem" }}>
                    <span className="D" style={{ fontSize:"3.5rem", fontWeight:700, color: plan.popular?"#fff":"#0a0a0a", lineHeight:1 }}>R$ {plan.price.toFixed(2).replace(".",",")}</span>
                    <span style={{ color: plan.popular?"rgba(255,255,255,.35)":"#aaa", fontSize:".9rem" }}>{plan.period}</span>
                  </div>
                  {plan.savingsText && <p style={{ color:"#4ade80", fontSize:".8rem", fontWeight:600, marginBottom:".25rem" }}>{plan.savingsText}</p>}
                  {plan.annualTotal && <p style={{ color: plan.popular?"rgba(255,255,255,.3)":"#aaa", fontSize:".8rem", marginBottom:"2rem" }}>R$ {plan.annualTotal.toFixed(2).replace(".",",")} cobrado anualmente</p>}
                  {!plan.annualTotal && <div style={{ marginBottom:"2rem" }} />}

                  <button onClick={()=>!current&&handleSelectPlan(plan.id)} disabled={current}
                    className="D"
                    style={{ width:"100%", padding:"1rem", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:".85rem", textTransform:"uppercase", letterSpacing:".1em", border:"none", borderRadius:0, cursor:current?"not-allowed":"pointer", marginBottom:"2rem", transition:"all .2s",
                      background: current ? (plan.popular?"#333":"#e5e5e5") : (plan.popular?"var(--gold)":"#0a0a0a"),
                      color: current ? (plan.popular?"#666":"#aaa") : (plan.popular?"#000":"#fff") }}
                    onMouseEnter={e=>!current&&(e.currentTarget.style.opacity=".85")}
                    onMouseLeave={e=>(e.currentTarget.style.opacity="1")}
                  >
                    {current ? "✓ Plano Atual" : "Assinar Agora →"}
                  </button>

                  <p className="D" style={{ fontSize:".65rem", textTransform:"uppercase", letterSpacing:".15em", color: plan.popular?"rgba(255,255,255,.25)":"rgba(0,0,0,.3)", marginBottom:"1rem" }}>Tudo incluso:</p>
                  {plan.features.map((f, idx) => (
                    <div key={idx} style={{ display:"flex", alignItems:"flex-start", gap:".75rem", marginBottom:".7rem" }}>
                      <div style={{ width:18, height:18, background: f.included?(plan.popular?"rgba(200,168,75,.2)":"#f0f0f0"):"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                        {f.included
                          ? <Check style={{ width:11, height:11, color: plan.popular?"var(--gold)":"#555" }} />
                          : <X style={{ width:11, height:11, color:"#ccc" }} />}
                      </div>
                      <span style={{ fontSize:".82rem", fontWeight: f.highlight?700:400, color: f.included?(plan.popular?(f.highlight?"#fff":"rgba(255,255,255,.65)"):(f.highlight?"#0a0a0a":"#666")):"#ccc", textDecoration: f.included?"none":"line-through" }}>{f.text}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — dark */}
      <section style={{ background:"#121212", position:"relative", overflow:"hidden", padding:"7rem 2.5rem" }}>
        <div className="grid-bg" style={{ position:"absolute", inset:0 }} />
        <div style={{ maxWidth:"1100px", margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"2rem", alignItems:"flex-end", marginBottom:"4rem" }}>
            <h2 className="D fu" style={{ fontSize:"clamp(3rem,6vw,5rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"#fff", margin:0 }}>
              O Que Dizem<br />Nossos Usuários.
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))", gap:"1px", background:"rgba(255,255,255,.05)" }}>
            {testimonials.map((t, i) => (
              <div key={i} className="fu" style={{ transitionDelay:`${i*100}ms`, padding:"3rem", background:"#121212" }}>
                <div style={{ display:"flex", gap:"3px", marginBottom:"1.5rem" }}>
                  {[...Array(5)].map((_,s)=><Star key={s} style={{ width:14, height:14, color:"var(--primary)", fill:"var(--primary)" }} />)}
                </div>
                <p style={{ color:"rgba(255,255,255,.7)", fontSize:"1rem", lineHeight:1.7, fontStyle:"italic" }}>"{t.text}"</p>
              </div>
            ))}
            {/* Trust badges alongside */}
            {trust.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="fu" style={{ transitionDelay:`${(i+2)*100}ms`, padding:"3rem", background:"#121212", display:"flex", flexDirection:"column", justifyContent:"center" }}>
                  <Icon style={{ width:28, height:28, color:"var(--primary)", marginBottom:"1rem" }} />
                  <p className="D" style={{ fontWeight:600, fontSize:".9rem", textTransform:"uppercase", letterSpacing:".05em", color:"#fff", marginBottom:".25rem" }}>{b.title}</p>
                  <p style={{ color:"rgba(255,255,255,.35)", fontSize:".8rem" }}>{b.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position:"relative", overflow:"hidden", minHeight:"560px", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <img src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80&auto=format&fit=crop" alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", filter:"grayscale(1)" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(193,35,46,.85)", mixBlendMode:"multiply" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.55)" }} />
        <div style={{ position:"relative", zIndex:2, textAlign:"center", padding:"5rem 2rem", maxWidth:"820px" }}>
          <p className="lbl fi" style={{ color:"rgba(255,255,255,.8)", marginBottom:"1.5rem" }}>✦ Comece Agora</p>
          <h2 className="D fu" style={{ fontSize:"clamp(3rem,9vw,6rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"#fff", marginBottom:"1.5rem" }}>
            Comece Hoje.<br />Economize R$ 240.
          </h2>
          <p className="fu d1" style={{ color:"rgba(255,255,255,.8)", fontSize:"1rem", marginBottom:"2.5rem" }}>
            Cancele quando quiser. Sem taxas ocultas.
          </p>
          <button onClick={()=>handleSelectPlan("pro_yearly")} className="btn-white fu d2">
            Plano Anual — Economize R$ 240 →
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
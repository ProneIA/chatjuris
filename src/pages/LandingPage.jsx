import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { SITE_CSS, SiteNav, SiteFooter } from "@/components/landing/PublicLayout";

const AffiliateTracker = lazy(() => import("@/components/subscription/AffiliateTracker"));

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const observerRef = useRef(null);

  const login = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  const goToPricing = () => { window.location.href = createPageUrl("Pricing"); };

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) window.location.href = createPageUrl("Dashboard");
    };
    checkAuth();

    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("v"); observerRef.current.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".fu,.fi").forEach((el) => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const pillars = [
    { num: "01", title: "IA Jurídica", text: "Petições, contratos e pareceres em segundos com IA treinada em documentos jurídicos brasileiros." },
    { num: "02", title: "Gestão de Processos", text: "Organize casos, prazos e documentos. Alertas automáticos para nunca perder um prazo." },
    { num: "03", title: "Jurisprudência", text: "Acesse decisões dos principais tribunais e fortaleça suas teses com fundamentação sólida." },
    { num: "04", title: "Segurança LGPD", text: "Criptografia de ponta, conformidade total com a LGPD e backups automáticos." },
    { num: "05", title: "Equipes", text: "Colaboração segura com controle de acesso granular para cada membro do escritório." },
  ];

  return (
    <div style={{ overflowX: "hidden", WebkitFontSmoothing: "antialiased" }}>
      <style>{SITE_CSS}{`@keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-8px)}}`}</style>
      <Suspense fallback={null}><AffiliateTracker /></Suspense>

      {/* NAV — blend mode over dark hero */}
      <SiteNav blend />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ position:"relative", height:"100vh", minHeight:"600px", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        <img src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80&auto=format&fit=crop" alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", filter:"grayscale(1) contrast(1.25)" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.58)" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle, transparent 50%, rgba(0,0,0,.8) 150%)" }} />

        <div style={{ position:"relative", zIndex:2, textAlign:"center", padding:"0 1.5rem", maxWidth:"900px" }}>
          <p className="lbl fi" style={{ marginBottom:"1.5rem" }}>✦ Plataforma Jurídica com Inteligência Artificial</p>
          <h1 className="D fu" style={{ fontSize:"clamp(3.5rem,10vw,7rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"#fff", margin:0 }}>
            Direito<br /><span className="outline-w">Tradicional.</span>
          </h1>
          <h2 className="D fu d1" style={{ fontSize:"clamp(3.5rem,10vw,7rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"var(--gold)", margin:"0 0 1.5rem" }}>
            Soluções Modernas.
          </h2>
          <p className="fu d2" style={{ color:"rgba(255,255,255,.75)", fontSize:"1.1rem", maxWidth:"520px", margin:"0 auto 2.5rem", lineHeight:1.7 }}>
            Gerencie processos, gere documentos e pesquise jurisprudência com IA — tudo em uma única plataforma para advogados modernos.
          </p>
          <div className="fu d3" style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={login} className="btn-white">Teste Grátis 7 Dias</button>
            <button onClick={goToPricing} className="btn-outline-w">Ver Planos</button>
          </div>
        </div>

        <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior:"smooth" })}
          style={{ position:"absolute", bottom:"2rem", left:"50%", transform:"translateX(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,.6)", animation:"bounce 2s infinite", fontSize:"1.5rem" }}>↓</button>
      </section>

      {/* ── STICKY SCROLL SPLIT ───────────────────────────────── */}
      <section id="features" style={{ display:"flex", flexWrap:"wrap" }}>
        {/* Sticky image */}
        <div style={{ width:"100%", flex:"0 0 50%" }} className="sticky-panel hidden lg:block">
          <div style={{ position:"sticky", top:0, height:"100vh", overflow:"hidden" }}>
            <img src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=900&q=80&auto=format&fit=crop" alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover", filter:"grayscale(1)" }} />
            <div style={{ position:"absolute", right:0, top:0, bottom:0, width:8, background:"var(--gold)" }} />
          </div>
        </div>

        {/* Scrollable narrative */}
        <div style={{ flex:"1 1 50%", padding:"8rem 4rem 8rem 5rem", display:"flex", flexDirection:"column", gap:"8rem" }}>
          {[
            {
              ch:"Chapter 01",
              title:<>Inteligência<br/>Artificial<br/>Jurídica</>,
              body:"Nossa IA foi treinada em milhares de documentos jurídicos brasileiros. Gere petições iniciais, contestações, recursos e contratos em questão de segundos — com fundamentação legal precisa e linguagem forense adequada."
            },
            {
              ch:"Chapter 02",
              title:<>Gestão<br/>Completa<br/>de Processos</>,
              body:"Do primeiro atendimento até a sentença final. Organize todos os seus casos, gerencie prazos processuais com alertas automáticos, controle honorários e documentos em um único lugar — acessível de qualquer dispositivo."
            },
          ].map((item) => (
            <div key={item.ch} className="fu">
              <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1rem" }}>
                <span className="lbl">{item.ch}</span>
                <div style={{ flex:1, height:1, background:"rgba(0,0,0,.15)" }} />
              </div>
              <h3 className="D" style={{ fontSize:"clamp(2.5rem,5vw,4rem)", fontWeight:600, letterSpacing:"-0.03em", textTransform:"uppercase", lineHeight:1.05, marginBottom:"1.5rem", color:"#0a0a0a" }}>
                {item.title}
              </h3>
              <p style={{ color:"rgba(0,0,0,.65)", lineHeight:1.8, fontSize:"1rem", maxWidth:"480px" }}>{item.body}</p>
            </div>
          ))}

          {/* Quote card */}
          <div className="fu">
            <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1rem" }}>
              <span className="lbl">Chapter 03</span>
              <div style={{ flex:1, height:1, background:"rgba(0,0,0,.15)" }} />
            </div>
            <div style={{ background:"#0a0a0a", padding:"3rem", position:"relative" }}>
              <p className="D" style={{ fontSize:"clamp(1.8rem,4vw,2.8rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.02em", lineHeight:1.15, color:"#fff", marginBottom:"2rem" }}>
                "Economize 80% do tempo em tarefas repetitivas."
              </p>
              <p style={{ color:"rgba(255,255,255,.5)", fontSize:".875rem", marginBottom:"1.5rem" }}>
                Advogados que usam o Juris relatam ganho médio de 15h semanais — devolvidas para estratégia e atendimento ao cliente.
              </p>
              <div style={{ height:3, background:"var(--gold)", width:"4rem" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── PILARES ───────────────────────────────────────────── */}
      <section style={{ background:"#121212", position:"relative", overflow:"hidden", padding:"7rem 2.5rem" }}>
        <div className="grid-bg" style={{ position:"absolute", inset:0 }} />
        <div style={{ maxWidth:"1200px", margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"2rem", alignItems:"flex-end", marginBottom:"4rem" }}>
            <h2 className="D fu" style={{ fontSize:"clamp(3rem,7vw,5.5rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"#fff", flex:"1 1 500px", margin:0 }}>
              Nossos<br />Pilares
            </h2>
            <p className="fu d1" style={{ color:"rgba(255,255,255,.5)", maxWidth:"300px", lineHeight:1.7, fontSize:".95rem", flex:"0 0 300px" }}>
              Cinco fundamentos que fazem do Juris a plataforma mais completa para advogados brasileiros.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:"1px" }}>
            {pillars.map((p, i) => (
              <div key={p.num} className={`pillar fu d${Math.min(i,4)}`}>
                <div className="p-num">{p.num}</div>
                <div className="p-title">{p.title}</div>
                <div className="p-txt">{p.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS PREVIEW ────────────────────────────────────── */}
      <section style={{ padding: "7rem 2.5rem", background: "#f4f4f6" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p className="lbl fu" style={{ marginBottom: ".75rem" }}>✦ Planos &amp; Preços</p>
            <h2 className="D fu d1" style={{ fontSize: "clamp(2.5rem,5vw,4rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", color: "#0a0a0a", margin: "0 0 .75rem" }}>
              Simples. Transparente.
            </h2>
            <p className="fu d2" style={{ color: "rgba(0,0,0,.5)", maxWidth: "420px", margin: "0 auto 2rem", lineHeight: 1.6 }}>
              Escolha o plano ideal. Pagamento seguro via cartão de crédito.
            </p>
          </div>

          {/* 3 cards resumidos */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1px", background: "#e0e0ea", marginBottom: "2rem" }}>
            {[
              { name: "Básico", price: "R$ 89,90", period: "/mês", desc: "30 docs · 300 créditos IA", dark: false },
              { name: "Advogado", price: "R$ 119,90", period: "/mês", desc: "60 docs · 600 créditos IA", dark: true, badge: "Mais popular" },
              { name: "Empresas", price: "R$ 219,90", period: "/mês", desc: "Ilimitado · Suporte prioritário", dark: false },
            ].map((p) => (
              <div key={p.name} className="fu"
                style={{ background: p.dark ? "#0a0a0a" : "#fff", padding: "2.5rem", position: "relative", borderBottom: p.dark ? "4px solid #C8A84B" : "4px solid transparent" }}>
                {p.badge && (
                  <div style={{ position: "absolute", top: 0, right: 0, background: "#C8A84B", color: "#000", fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: ".6rem", padding: ".3rem .7rem", textTransform: "uppercase", letterSpacing: ".1em" }}>{p.badge}</div>
                )}
                <h3 className="D" style={{ fontSize: ".95rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: p.dark ? "#fff" : "#0a0a0a", margin: "0 0 .3rem" }}>{p.name}</h3>
                <p style={{ color: p.dark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.4)", fontSize: ".75rem", margin: "0 0 1rem" }}>{p.desc}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: ".3rem", marginBottom: "1.5rem" }}>
                  <span className="D" style={{ fontSize: "2.4rem", fontWeight: 700, color: p.dark ? "#fff" : "#0a0a0a", lineHeight: 1 }}>{p.price}</span>
                  <span style={{ fontSize: ".8rem", color: p.dark ? "rgba(255,255,255,.3)" : "#aaa" }}>{p.period}</span>
                </div>
                <a href={createPageUrl("Pricing")}
                  style={{ display: "block", width: "100%", padding: ".8rem", textAlign: "center", background: p.dark ? "#C8A84B" : "#0a0a0a", color: p.dark ? "#000" : "#fff", textDecoration: "none", fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".1em", boxSizing: "border-box" }}>
                  Assinar Agora →
                </a>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <a href={createPageUrl("Pricing")} className="btn-dark" style={{ display: "inline-flex" }}>
              Ver todos os planos e detalhes →
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ position:"relative", overflow:"hidden", minHeight:"560px", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <img src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80&auto=format&fit=crop" alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", filter:"grayscale(1)" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(200,168,75,.9)", mixBlendMode:"multiply" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.55)" }} />
        <div style={{ position:"relative", zIndex:2, textAlign:"center", padding:"5rem 2rem", maxWidth:"820px" }}>
          <p className="lbl fi" style={{ color:"rgba(255,255,255,.8)", marginBottom:"1.5rem" }}>✦ Comece Agora</p>
          <h2 className="D fu" style={{ fontSize:"clamp(3rem,9vw,6rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"#fff", marginBottom:"1.5rem" }}>
            Transforme Seu<br />Escritório Hoje.
          </h2>
          <p className="fu d1" style={{ color:"rgba(255,255,255,.8)", fontSize:"1rem", lineHeight:1.7, maxWidth:"500px", margin:"0 auto 2.5rem" }}>
            Junte-se a advogados que já economizam tempo e aumentam sua produtividade. Teste grátis por 7 dias — sem cartão de crédito.
          </p>
          <div className="fu d2" style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={login} className="btn-white">Teste Grátis 7 Dias</button>
            <button onClick={goToPricing} className="btn-outline-w">Ver Planos</button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
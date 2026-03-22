import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

const AffiliateTracker = lazy(() => import("@/components/subscription/AffiliateTracker"));

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const observerRef = useRef(null);

  const handleLogin = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  const handleStartTrial = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  const goToPricing = () => { window.location.href = createPageUrl("Pricing"); };

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) window.location.href = createPageUrl("Dashboard");
    };
    checkAuth();

    // IntersectionObserver for scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observerRef.current.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll(".fade-up, .fade-in").forEach((el) => {
      observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const pillars = [
    { num: "01", title: "IA Jurídica", text: "Petições, contratos e pareceres em segundos com IA treinada em documentos jurídicos brasileiros." },
    { num: "02", title: "Gestão de Processos", text: "Organize casos, prazos e documentos. Alertas automáticos para nunca perder um prazo." },
    { num: "03", title: "Jurisprudência", text: "Acesse decisões dos principais tribunais e fortaleça suas teses com fundamentação sólida." },
    { num: "04", title: "Segurança LGPD", text: "Criptografia de ponta, conformidade total com a LGPD e backups automáticos." },
    { num: "05", title: "Equipes", text: "Colaboração segura com controle de acesso granular para cada membro do escritório." },
  ];

  const scrollToSection = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ overflowX: "hidden", WebkitFontSmoothing: "antialiased" }}>
      <Suspense fallback={null}>
        <AffiliateTracker />
      </Suspense>

      <style>{`
        :root {
          --primary: #C8A84B;
          --dark: #0a0a0a;
          --white: #FFFFFF;
          --gray: #1E1E1E;
        }

        * { box-sizing: border-box; }
        body { margin: 0; }

        ::-webkit-scrollbar { width: 0; }
        html { scroll-behavior: smooth; }

        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap');

        .font-oswald { font-family: 'Oswald', 'Helvetica Neue', Arial, sans-serif; }

        .fade-up {
          opacity: 0;
          transform: translateY(2rem);
          transition: opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1);
        }
        .fade-in {
          opacity: 0;
          transition: opacity 1.5s ease-out;
        }
        .fade-up.is-visible, .fade-in.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .delay-100 { transition-delay: 100ms; }
        .delay-200 { transition-delay: 200ms; }
        .delay-300 { transition-delay: 300ms; }
        .delay-400 { transition-delay: 400ms; }
        .delay-500 { transition-delay: 500ms; }

        .text-outline {
          -webkit-text-stroke: 1px var(--white);
          color: transparent;
        }
        .text-outline-dark {
          -webkit-text-stroke: 1px var(--dark);
          color: transparent;
        }

        .nav-blend {
          mix-blend-mode: difference;
        }

        .hero-vignette {
          background: radial-gradient(circle, transparent 50%, rgba(0,0,0,0.8) 150%);
        }

        .pillar-card {
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.5);
          padding: 2rem;
          transition: all 0.3s ease;
          cursor: default;
        }
        .pillar-card:hover {
          background: var(--primary);
          border-color: var(--primary);
        }
        .pillar-card:hover .pillar-num { color: rgba(255,255,255,0.4); }
        .pillar-card:hover .pillar-title { color: #fff; }
        .pillar-card:hover .pillar-text { color: rgba(255,255,255,0.9); }

        .pillar-num {
          font-size: 4rem;
          font-weight: 700;
          color: rgba(255,255,255,0.15);
          font-family: 'Oswald', sans-serif;
          line-height: 1;
          margin-bottom: 0.5rem;
          transition: color 0.3s ease;
        }
        .pillar-title {
          font-family: 'Oswald', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #fff;
          margin-bottom: 0.75rem;
          transition: color 0.3s ease;
        }
        .pillar-text {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.5);
          line-height: 1.6;
          transition: color 0.3s ease;
        }

        .grid-pattern {
          background-image: linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px);
          background-size: 60px 60px;
          opacity: 0.03;
        }

        .chapter-label {
          font-family: 'Oswald', sans-serif;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--primary);
          font-weight: 500;
        }

        .sticky-image-strip::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 8px;
          background: var(--primary);
        }

        .btn-white {
          display: inline-block;
          padding: 1rem 2.5rem;
          background: #fff;
          color: #000;
          font-family: 'Oswald', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: none;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          text-decoration: none;
          border-radius: 0;
        }
        .btn-white:hover {
          background: #000;
          color: #fff;
        }
        .btn-outline-white {
          display: inline-block;
          padding: 1rem 2.5rem;
          background: transparent;
          color: #fff;
          font-family: 'Oswald', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: 2px solid #fff;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          text-decoration: none;
          border-radius: 0;
        }
        .btn-outline-white:hover {
          background: #fff;
          color: #000;
        }

        .social-icon {
          width: 36px;
          height: 36px;
          border: 1px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s;
          cursor: pointer;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.6);
        }
        .social-icon:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        @media (max-width: 1023px) {
          .sticky-panel { position: relative !important; height: 60vw !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav
        className="nav-blend"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "1.25rem 2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            className="font-oswald"
            style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.02em", textTransform: "uppercase" }}
          >
            Juris
          </span>
          <div style={{ display: "flex", gap: "3px" }}>
            {["#C8A84B", "#fff", "#555", "#C8A84B", "#fff"].map((c, i) => (
              <div key={i} style={{ width: 6, height: 6, background: c }} />
            ))}
          </div>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex" style={{ gap: "2.5rem", alignItems: "center" }}>
          {[
            { label: "Quem Somos", to: createPageUrl("QuemSomos") },
            { label: "Funcionalidades", to: createPageUrl("Funcionalidades") },
            { label: "Preços", to: createPageUrl("Pricing") },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="font-oswald"
              style={{ color: "#fff", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.12em", textDecoration: "none", fontWeight: 500, opacity: 0.8, transition: "opacity 0.2s" }}
              onMouseEnter={e => e.target.style.opacity = 1}
              onMouseLeave={e => e.target.style.opacity = 0.8}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogin}
            className="font-oswald"
            style={{ color: "#fff", background: "none", border: "none", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 500, cursor: "pointer", opacity: 0.8 }}
          >
            Entrar
          </button>
          <button onClick={handleStartTrial} className="btn-white" style={{ padding: "0.6rem 1.5rem", fontSize: "0.75rem" }}>
            Teste 7 dias
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", fontSize: "1.5rem" }}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99,
            background: "var(--dark)", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "2rem"
          }}
        >
          {[
            { label: "Quem Somos", to: createPageUrl("QuemSomos") },
            { label: "Funcionalidades", to: createPageUrl("Funcionalidades") },
            { label: "Preços", to: createPageUrl("Pricing") },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="font-oswald"
              style={{ color: "#fff", fontSize: "2rem", textTransform: "uppercase", letterSpacing: "0.1em", textDecoration: "none", fontWeight: 600 }}
            >
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogin} className="font-oswald" style={{ color: "rgba(255,255,255,0.6)", background: "none", border: "none", fontSize: "1.2rem", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer" }}>
            Entrar
          </button>
          <button onClick={handleStartTrial} className="btn-white">Teste Grátis 7 Dias</button>
        </div>
      )}

      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          height: "100vh",
          minHeight: "600px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80&auto=format&fit=crop"
          alt=""
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", filter: "grayscale(1) contrast(1.25)",
          }}
        />
        {/* Overlays */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
        <div className="hero-vignette" style={{ position: "absolute", inset: 0 }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 1.5rem", maxWidth: "900px" }}>
          <p className="chapter-label fade-in" style={{ marginBottom: "1.5rem" }}>
            ✦ Plataforma Jurídica com Inteligência Artificial
          </p>
          <h1
            className="font-oswald fade-up"
            style={{
              fontSize: "clamp(3.5rem, 10vw, 7rem)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: "#fff",
              margin: 0,
            }}
          >
            Direito<br />
            <span className="text-outline">Tradicional.</span>
          </h1>
          <h2
            className="font-oswald fade-up delay-100"
            style={{
              fontSize: "clamp(3.5rem, 10vw, 7rem)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: "var(--primary)",
              margin: "0 0 1.5rem",
            }}
          >
            Soluções Modernas.
          </h2>
          <p
            className="fade-up delay-200"
            style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.1rem", maxWidth: "520px", margin: "0 auto 2.5rem", lineHeight: 1.7 }}
          >
            Gerencie processos, gere documentos e pesquise jurisprudência com IA — tudo em uma única plataforma para advogados modernos.
          </p>
          <div className="fade-up delay-300" style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleStartTrial} className="btn-white">Teste Grátis 7 Dias</button>
            <button onClick={goToPricing} className="btn-outline-white">Ver Planos</button>
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToSection}
          style={{
            position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)",
            animation: "bounce 2s infinite", fontSize: "1.5rem"
          }}
        >
          ↓
        </button>
        <style>{`@keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-8px)} }`}</style>
      </section>

      {/* ── STICKY SCROLL SPLIT ── */}
      <section id="features" style={{ display: "flex", flexWrap: "wrap" }}>
        {/* Left sticky image */}
        <div style={{ width: "100%", flex: "0 0 50%" }} className="sticky-panel hidden lg:block">
          <div
            className="sticky-image-strip"
            style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", position: "sticky" }}
          >
            <img
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=900&q=80&auto=format&fit=crop"
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1)" }}
            />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 8, background: "var(--primary)" }} />
          </div>
        </div>

        {/* Right scrollable text */}
        <div style={{ flex: "1 1 50%", padding: "8rem 4rem 8rem 5rem", display: "flex", flexDirection: "column", gap: "8rem" }}>
          {/* Chapter 01 */}
          <div className="fade-up">
            <p className="chapter-label" style={{ marginBottom: "1rem" }}>Chapter 01</p>
            <div style={{ height: 1, background: "#e5e5e5", marginBottom: "2rem" }} />
            <h3
              className="font-oswald"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 600, letterSpacing: "-0.03em", textTransform: "uppercase", lineHeight: 1.05, marginBottom: "1.5rem", color: "#0a0a0a" }}
            >
              Inteligência<br />Artificial<br />Jurídica
            </h3>
            <p style={{ color: "rgba(0,0,0,0.65)", lineHeight: 1.8, fontSize: "1rem", maxWidth: "480px" }}>
              Nossa IA foi treinada em milhares de documentos jurídicos brasileiros. Gere petições iniciais, contestações, recursos e contratos em questão de segundos — com fundamentação legal precisa e linguagem forense adequada.
            </p>
          </div>

          {/* Chapter 02 */}
          <div className="fade-up">
            <p className="chapter-label" style={{ marginBottom: "1rem" }}>Chapter 02</p>
            <div style={{ height: 1, background: "#e5e5e5", marginBottom: "2rem" }} />
            <h3
              className="font-oswald"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 600, letterSpacing: "-0.03em", textTransform: "uppercase", lineHeight: 1.05, marginBottom: "1.5rem", color: "#0a0a0a" }}
            >
              Gestão<br />Completa<br />de Processos
            </h3>
            <p style={{ color: "rgba(0,0,0,0.65)", lineHeight: 1.8, fontSize: "1rem", maxWidth: "480px" }}>
              Do primeiro atendimento até a sentença final. Organize todos os seus casos, gerencie prazos processuais com alertas automáticos, controle honorários e documentos em um único lugar — acessível de qualquer dispositivo.
            </p>
          </div>

          {/* Chapter 03 — Quote card */}
          <div className="fade-up">
            <p className="chapter-label" style={{ marginBottom: "1rem" }}>Chapter 03</p>
            <div style={{ height: 1, background: "#e5e5e5", marginBottom: "2rem" }} />
            <div style={{ background: "#0a0a0a", padding: "3rem", position: "relative" }}>
              <p
                className="font-oswald"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.15, color: "#fff", marginBottom: "2rem" }}
              >
                "Economize 80% do tempo em tarefas repetitivas."
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                Advogados que usam o Juris relatam ganho médio de 15h semanais — horas devolvidas para o que realmente importa: estratégia e clientes.
              </p>
              <div style={{ height: 3, background: "var(--primary)", width: "4rem" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES / PILARES ── */}
      <section style={{ background: "#121212", position: "relative", overflow: "hidden", padding: "7rem 2.5rem" }}>
        {/* Grid pattern */}
        <div className="grid-pattern" style={{ position: "absolute", inset: 0 }} />

        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "flex-end", marginBottom: "4rem" }}>
            <h2
              className="font-oswald fade-up"
              style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1, color: "#fff", flex: "1 1 500px", margin: 0 }}
            >
              Nossos<br />Pilares
            </h2>
            <p className="fade-up delay-100" style={{ color: "rgba(255,255,255,0.5)", maxWidth: "300px", lineHeight: 1.7, fontSize: "0.95rem", flex: "0 0 300px" }}>
              Cinco fundamentos que fazem do Juris a plataforma mais completa para advogados brasileiros.
            </p>
          </div>

          {/* Cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1px" }}>
            {pillars.map((p, i) => (
              <div
                key={p.num}
                className={`pillar-card fade-up delay-${i * 100 > 400 ? 400 : i * 100}`}
              >
                <div className="pillar-num">{p.num}</div>
                <div className="pillar-title">{p.title}</div>
                <div className="pillar-text">{p.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "560px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80&auto=format&fit=crop"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1)" }}
        />
        {/* Double overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(200,168,75,0.9)", mixBlendMode: "multiply" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "5rem 2rem", maxWidth: "820px" }}>
          <p className="chapter-label fade-in" style={{ color: "rgba(255,255,255,0.8)", marginBottom: "1.5rem" }}>
            ✦ Comece Agora
          </p>
          <h2
            className="font-oswald fade-up"
            style={{
              fontSize: "clamp(3rem, 9vw, 6rem)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: "#fff",
              marginBottom: "1.5rem",
            }}
          >
            Transforme Seu<br />Escritório Hoje.
          </h2>
          <p className="fade-up delay-100" style={{ color: "rgba(255,255,255,0.8)", fontSize: "1rem", lineHeight: 1.7, maxWidth: "500px", margin: "0 auto 2.5rem" }}>
            Junte-se a milhares de advogados que já economizam tempo e aumentam sua produtividade. Teste grátis por 7 dias — sem cartão de crédito.
          </p>
          <div className="fade-up delay-200" style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleStartTrial} className="btn-white">Teste Grátis 7 Dias</button>
            <button onClick={goToPricing} className="btn-outline-white">Ver Planos</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#000", padding: "5rem 2.5rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "3rem", marginBottom: "4rem" }}>
            {/* Brand column */}
            <div style={{ gridColumn: "span 2" }}>
              <span
                className="font-oswald"
                style={{ color: "#fff", fontSize: "2rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.02em", display: "block", marginBottom: "1rem" }}
              >
                Juris
              </span>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", lineHeight: 1.7, maxWidth: "280px", marginBottom: "1.5rem" }}>
                A plataforma jurídica com inteligência artificial para advogados e escritórios modernos.
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["in", "tw", "ig"].map((s) => (
                  <div key={s} className="social-icon font-oswald" style={{ fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase" }}>{s}</div>
                ))}
              </div>
            </div>

            {/* Links col 1 */}
            <div>
              <p className="chapter-label" style={{ color: "rgba(255,255,255,0.3)", marginBottom: "1.5rem" }}>Produto</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { label: "Funcionalidades", to: createPageUrl("Funcionalidades") },
                  { label: "Preços", to: createPageUrl("Pricing") },
                  { label: "Quem Somos", to: createPageUrl("QuemSomos") },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => e.target.style.color = "var(--primary)"}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Links col 2 */}
            <div>
              <p className="chapter-label" style={{ color: "rgba(255,255,255,0.3)", marginBottom: "1.5rem" }}>Legal</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { label: "Política de Privacidade", to: createPageUrl("PrivacyPolicy") },
                  { label: "Termos de Uso", to: createPageUrl("TermsOfService") },
                  { label: "Contato", to: createPageUrl("ContactPublic") },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => e.target.style.color = "var(--primary)"}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem", margin: 0 }}>
              © 2024 Juris. Todos os direitos reservados.
            </p>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              {["Privacidade", "Termos", "Cookies"].map((l) => (
                <span key={l} style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem", cursor: "pointer" }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
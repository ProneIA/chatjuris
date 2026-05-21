import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

const AffiliateTracker = lazy(() => import("@/components/subscription/AffiliateTracker"));

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  :root {
    --blue: #4F6EF7;
    --blue-dark: #3B56E0;
    --blue-light: #EEF1FF;
    --dark: #0D0F1A;
    --gray: #6B7280;
    --border: #E5E7EB;
    --surface: #F9FAFB;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, sans-serif; }
  ::-webkit-scrollbar { width: 0; }
  html { scroll-behavior: smooth; }

  /* Animations */
  .fu { opacity: 0; transform: translateY(2rem); transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1); }
  .fi { opacity: 0; transition: opacity 1.2s ease; }
  .fu.v, .fi.v { opacity: 1; transform: translateY(0); }
  .d1 { transition-delay: 80ms; }
  .d2 { transition-delay: 160ms; }
  .d3 { transition-delay: 240ms; }
  .d4 { transition-delay: 320ms; }

  /* Pill badge */
  .pill {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .35rem .9rem;
    background: var(--blue-light);
    color: var(--blue);
    border-radius: 999px;
    font-size: .78rem; font-weight: 600;
    letter-spacing: .01em;
    border: 1px solid rgba(79,110,247,.2);
  }

  /* Buttons */
  .btn-primary {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem;
    background: var(--blue); color: #fff;
    font-family: 'Inter', sans-serif; font-weight: 600; font-size: .95rem;
    border: none; cursor: pointer; border-radius: 10px;
    text-decoration: none; transition: background .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 4px 14px rgba(79,110,247,.35);
  }
  .btn-primary:hover { background: var(--blue-dark); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,110,247,.45); }

  .btn-secondary {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem;
    background: #fff; color: var(--dark);
    font-family: 'Inter', sans-serif; font-weight: 600; font-size: .95rem;
    border: 1.5px solid var(--border); cursor: pointer; border-radius: 10px;
    text-decoration: none; transition: border-color .2s, transform .15s;
  }
  .btn-secondary:hover { border-color: var(--blue); transform: translateY(-1px); }

  .btn-outline-gold {
    display: inline-flex; align-items: center; gap: .6rem;
    padding: .6rem 1.4rem;
    background: transparent; color: #B8963E;
    font-family: 'Inter', sans-serif; font-weight: 600; font-size: .9rem;
    border: 1.5px solid #B8963E; cursor: pointer; border-radius: 999px;
    text-decoration: none; transition: all .2s;
  }
  .btn-outline-gold:hover { background: #B8963E; color: #fff; }

  /* Feature cards */
  .feat-card {
    background: #fff;
    border: 1.5px solid var(--border);
    border-radius: 16px;
    padding: 2rem;
    transition: border-color .25s, box-shadow .25s, transform .25s;
  }
  .feat-card:hover {
    border-color: var(--blue);
    box-shadow: 0 8px 32px rgba(79,110,247,.12);
    transform: translateY(-3px);
  }
  .feat-icon {
    width: 48px; height: 48px;
    background: var(--blue-light);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.4rem;
    margin-bottom: 1.25rem;
  }

  /* Pricing cards */
  .price-card {
    background: #fff;
    border: 1.5px solid var(--border);
    border-radius: 20px;
    padding: 2.5rem;
    transition: box-shadow .25s, transform .25s;
  }
  .price-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,.08); transform: translateY(-4px); }
  .price-card.featured {
    background: var(--dark);
    border-color: var(--dark);
    box-shadow: 0 16px 48px rgba(13,15,26,.25);
  }

  /* Nav */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: rgba(255,255,255,.85);
    border-bottom: 1px solid var(--border);
    padding: 0 2.5rem;
    height: 68px;
    display: flex; align-items: center; justify-content: space-between;
  }

  /* Gradient hero */
  .hero-gradient {
    background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,110,247,.15) 0%, transparent 60%),
                radial-gradient(ellipse 60% 50% at 80% 50%, rgba(168,119,232,.08) 0%, transparent 60%),
                #fff;
  }

  /* Stats bar */
  .stat-bar {
    display: flex; align-items: center;
    gap: .75rem;
    padding: .6rem 1.2rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: .82rem;
  }

  /* Testimonial card */
  .testi-card {
    background: #fff;
    border: 1.5px solid var(--border);
    border-radius: 16px;
    padding: 2rem;
    display: flex; flex-direction: column; gap: 1.25rem;
    transition: box-shadow .2s;
  }
  .testi-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,.07); }

  /* Logo strip */
  .logo-strip {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
    gap: 2.5rem;
    padding: 2.5rem 2rem;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .logo-item {
    font-family: 'Inter', sans-serif;
    font-weight: 700; font-size: .95rem;
    color: #D1D5DB;
    letter-spacing: -.01em;
    text-transform: uppercase;
    transition: color .2s;
    cursor: default;
  }
  .logo-item:hover { color: #9CA3AF; }

  /* CTA section */
  .cta-section {
    background: var(--dark);
    border-radius: 24px;
    padding: 5rem 4rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .cta-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 70% 80% at 50% -20%, rgba(79,110,247,.4) 0%, transparent 60%);
  }

  @media(max-width: 768px) {
    .lp-nav { padding: 0 1.25rem; }
    .cta-section { padding: 3rem 1.5rem; border-radius: 16px; }
  }

  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
`;

const features = [
  { icon: "⚡", title: "IA Jurídica Avançada", text: "Petições, contestações e contratos gerados em segundos com IA treinada em documentos jurídicos brasileiros." },
  { icon: "📁", title: "Gestão de Processos", text: "Organize casos, prazos e documentos. Alertas automáticos para nunca perder um prazo crítico." },
  { icon: "⚖️", title: "Jurisprudência Integrada", text: "Acesse decisões dos principais tribunais e fortaleça suas teses com fundamentação sólida." },
  { icon: "🔐", title: "Segurança LGPD", text: "Criptografia de ponta, conformidade total com a LGPD e backups automáticos na nuvem." },
  { icon: "👥", title: "Equipes Colaborativas", text: "Colaboração segura com controle de acesso granular para cada membro do escritório." },
  { icon: "📊", title: "Relatórios & Financeiro", text: "Controle honorários, despesas e gere relatórios de produtividade do seu escritório." },
];

const testimonials = [
  { name: "Dra. Ana Souza", role: "Advogada Trabalhista", text: "Reduzi o tempo de redação de peças em 70%. O Juris transformou completamente minha rotina." },
  { name: "Dr. Carlos Lima", role: "Sócio · Lima & Associados", text: "A gestão de processos é impecável. Nunca mais perdi um prazo desde que comecei a usar." },
  { name: "Dra. Marina Vieira", role: "Advogada Cível", text: "A pesquisa de jurisprudência integrada é o diferencial. Economizo horas de pesquisa por semana." },
];

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
      { threshold: 0.12 }
    );
    document.querySelectorAll(".fu,.fi").forEach((el) => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div style={{ overflowX: "hidden", fontFamily: "'Inter', sans-serif", background: "#fff" }}>
      <style>{CSS}</style>
      <Suspense fallback={null}><AffiliateTracker /></Suspense>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <Link to={createPageUrl("LandingPage")} style={{ display: "flex", alignItems: "center", gap: ".5rem", textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, background: "var(--blue)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: ".9rem" }}>J</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--dark)", letterSpacing: "-.02em" }}>Juris</span>
        </Link>

        <div className="hidden md:flex" style={{ gap: "2rem", alignItems: "center" }}>
          {[
            { label: "Funcionalidades", to: createPageUrl("Funcionalidades") },
            { label: "Quem Somos", to: createPageUrl("QuemSomos") },
            { label: "Preços", to: createPageUrl("Pricing") },
          ].map(item => (
            <Link key={item.label} to={item.to}
              style={{ color: "var(--gray)", fontSize: ".9rem", fontWeight: 500, textDecoration: "none", transition: "color .2s" }}
              onMouseEnter={e => e.target.style.color = "var(--dark)"}
              onMouseLeave={e => e.target.style.color = "var(--gray)"}
            >{item.label}</Link>
          ))}
        </div>

        <div className="hidden md:flex" style={{ gap: ".75rem", alignItems: "center" }}>
          <button onClick={login} style={{ background: "none", border: "none", color: "var(--gray)", fontFamily: "'Inter',sans-serif", fontSize: ".9rem", fontWeight: 500, cursor: "pointer", transition: "color .2s" }}
            onMouseEnter={e => e.target.style.color = "var(--dark)"}
            onMouseLeave={e => e.target.style.color = "var(--gray)"}
          >Entrar</button>
          <button onClick={login} className="btn-outline-gold">
            ✦ Assistente IA
          </button>
        </div>

        <button className="flex md:hidden" onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", color: "var(--dark)" }}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2rem", paddingTop: "4rem" }}>
          {[
            { label: "Funcionalidades", to: createPageUrl("Funcionalidades") },
            { label: "Quem Somos", to: createPageUrl("QuemSomos") },
            { label: "Preços", to: createPageUrl("Pricing") },
          ].map(item => (
            <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)}
              style={{ color: "var(--dark)", fontSize: "1.5rem", fontWeight: 700, textDecoration: "none" }}>
              {item.label}
            </Link>
          ))}
          <button onClick={login} className="btn-outline-gold">✦ Assistente IA</button>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero-gradient" style={{ paddingTop: "10rem", paddingBottom: "6rem", textAlign: "center", padding: "10rem 2rem 6rem" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>

          <div className="fi" style={{ marginBottom: "1.75rem" }}>
            <span className="pill">✦ Plataforma Jurídica com Inteligência Artificial</span>
          </div>

          <h1 className="fu" style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 900, letterSpacing: "-.04em", lineHeight: 1.05, color: "var(--dark)", marginBottom: "1.5rem" }}>
            Direito Mais Inteligente.<br />
            <span style={{ background: "linear-gradient(135deg, var(--blue) 0%, #9B6EF7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Resultados Mais Rápidos.
            </span>
          </h1>

          <p className="fu d1" style={{ color: "var(--gray)", fontSize: "1.15rem", lineHeight: 1.75, maxWidth: "580px", margin: "0 auto 2.5rem" }}>
            Gerencie processos, gere documentos e pesquise jurisprudência com IA — tudo em uma única plataforma para advogados modernos.
          </p>

          <div className="fu d2" style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3rem" }}>
            <button onClick={login} className="btn-outline-gold">✦ Assistente IA</button>
            <button onClick={goToPricing} className="btn-secondary">Ver Planos</button>
          </div>

          {/* Social proof row */}
          <div className="fu d3" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center", alignItems: "center" }}>
            <div className="stat-bar">
              <span style={{ fontSize: "1.1rem" }}>👨‍💼</span>
              <span style={{ fontWeight: 600, color: "var(--dark)" }}>+2.000</span>
              <span style={{ color: "var(--gray)" }}>advogados</span>
            </div>
            <div className="stat-bar">
              <span style={{ fontSize: "1.1rem" }}>⚡</span>
              <span style={{ fontWeight: 600, color: "var(--dark)" }}>70%</span>
              <span style={{ color: "var(--gray)" }}>mais rápido</span>
            </div>
            <div className="stat-bar">
              <span style={{ fontSize: "1.1rem" }}>⭐</span>
              <span style={{ fontWeight: 600, color: "var(--dark)" }}>4.9/5</span>
              <span style={{ color: "var(--gray)" }}>avaliação</span>
            </div>
          </div>
        </div>

        {/* Hero visual */}
        <div className="fu d4" style={{ maxWidth: "1000px", margin: "4rem auto 0", position: "relative" }}>
          <div style={{ background: "var(--dark)", borderRadius: "20px", overflow: "hidden", boxShadow: "0 32px 80px rgba(13,15,26,.25)", border: "1px solid rgba(255,255,255,.08)" }}>
            {/* Browser bar */}
            <div style={{ background: "#1a1d2e", padding: ".8rem 1.25rem", display: "flex", alignItems: "center", gap: ".6rem", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
              {["#FF5F57","#FEBC2E","#28C840"].map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />)}
              <div style={{ flex: 1, background: "rgba(255,255,255,.06)", borderRadius: 6, height: 22, marginLeft: ".5rem", display: "flex", alignItems: "center", paddingLeft: ".75rem" }}>
                <span style={{ color: "rgba(255,255,255,.3)", fontSize: ".72rem" }}>app.chatjuris.com.br/dashboard</span>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=85&auto=format&fit=crop"
              alt="Dashboard Juris"
              style={{ width: "100%", height: "400px", objectFit: "cover", filter: "brightness(.7) saturate(.4)" }}
            />
            {/* Overlay cards */}
            <div style={{ position: "absolute", bottom: "2rem", left: "2rem", background: "rgba(255,255,255,.96)", backdropFilter: "blur(10px)", borderRadius: 14, padding: "1rem 1.25rem", boxShadow: "0 8px 32px rgba(0,0,0,.2)", display: "none" }} className="md:block">
              <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--blue-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>⚡</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: ".85rem", color: "var(--dark)", marginBottom: ".1rem" }}>Peça gerada com sucesso</p>
                  <p style={{ fontSize: ".75rem", color: "var(--gray)" }}>Petição Inicial · Trabalhista</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS ────────────────────────────────────────────── */}
      <section style={{ background: "#fff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p style={{ textAlign: "center", color: "var(--gray)", fontSize: ".82rem", fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", padding: "3rem 0 1.5rem" }}>
            Confiado por advogados em todo o Brasil
          </p>
          <div className="logo-strip">
            {["OAB-SP", "TJSP", "TRT-2", "STJ", "TRF-3", "TJRJ", "TST"].map(l => (
              <span key={l} className="logo-item">{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" style={{ background: "var(--surface)", padding: "6rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span className="pill fu" style={{ marginBottom: "1rem", display: "inline-flex" }}>✦ Funcionalidades</span>
            <h2 className="fu d1" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, letterSpacing: "-.03em", color: "var(--dark)", marginBottom: "1rem" }}>
              Tudo que você precisa,<br />em um só lugar
            </h2>
            <p className="fu d2" style={{ color: "var(--gray)", fontSize: "1.05rem", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
              Ferramentas construídas especificamente para o fluxo de trabalho do advogado brasileiro.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {features.map((f, i) => (
              <div key={f.title} className={`feat-card fu d${Math.min(i % 4, 3)}`}>
                <div className="feat-icon">{f.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--dark)", marginBottom: ".6rem" }}>{f.title}</h3>
                <p style={{ color: "var(--gray)", fontSize: ".9rem", lineHeight: 1.7 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPLIT HIGHLIGHT ──────────────────────────────────── */}
      <section style={{ background: "#fff", padding: "6rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "5rem", alignItems: "center" }}>
          {/* Text side */}
          <div>
            <span className="pill fu" style={{ marginBottom: "1.25rem", display: "inline-flex" }}>Chapter 01</span>
            <h2 className="fu d1" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-.03em", color: "var(--dark)", marginBottom: "1.25rem", lineHeight: 1.15 }}>
              Inteligência Artificial<br />treinada para o Direito
            </h2>
            <p className="fu d2" style={{ color: "var(--gray)", lineHeight: 1.8, fontSize: "1rem", marginBottom: "2rem" }}>
              Nossa IA foi treinada em milhares de documentos jurídicos brasileiros. Gere petições iniciais, contestações, recursos e contratos em questão de segundos — com fundamentação legal precisa e linguagem forense adequada.
            </p>
            <div className="fu d3" style={{ display: "flex", flexDirection: "column", gap: ".75rem", marginBottom: "2.5rem" }}>
              {["Petições e contratos em segundos", "Linguagem forense precisa", "Atualizado com legislação vigente"].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--blue-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "var(--blue)", fontSize: ".7rem", fontWeight: 800 }}>✓</span>
                  </div>
                  <span style={{ color: "var(--dark)", fontSize: ".9rem", fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={login} className="btn-outline-gold fu d4">✦ Assistente IA</button>
          </div>
          {/* Visual side */}
          <div className="fu d2" style={{ position: "relative" }}>
            <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,.1)", border: "1px solid var(--border)" }}>
              <img src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80&auto=format&fit=crop"
                alt="Documentos jurídicos" style={{ width: "100%", height: "420px", objectFit: "cover", filter: "saturate(.6)" }} />
            </div>
            {/* Floating badge */}
            <div style={{ position: "absolute", bottom: "-1.5rem", left: "-1.5rem", background: "#fff", border: "1.5px solid var(--border)", borderRadius: 16, padding: "1.25rem 1.5rem", boxShadow: "0 8px 30px rgba(0,0,0,.1)" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--dark)", lineHeight: 1 }}>80%</div>
              <div style={{ fontSize: ".78rem", color: "var(--gray)", fontWeight: 500, marginTop: ".2rem" }}>menos tempo em<br />tarefas repetitivas</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section style={{ background: "var(--dark)", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "3rem", textAlign: "center" }}>
            {[
              { value: "+2.000", label: "Advogados ativos" },
              { value: "+50.000", label: "Peças geradas" },
              { value: "70%", label: "Economia de tempo" },
              { value: "4.9/5", label: "Satisfação média" },
            ].map((s, i) => (
              <div key={s.label} className={`fu d${i}`}>
                <div style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 900, color: "#fff", letterSpacing: "-.03em", lineHeight: 1, marginBottom: ".5rem" }}>{s.value}</div>
                <div style={{ color: "rgba(255,255,255,.45)", fontSize: ".875rem" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section style={{ background: "var(--surface)", padding: "6rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span className="pill fu" style={{ marginBottom: "1rem", display: "inline-flex" }}>✦ Depoimentos</span>
            <h2 className="fu d1" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-.03em", color: "var(--dark)" }}>
              O que dizem nossos clientes
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {testimonials.map((t, i) => (
              <div key={t.name} className={`testi-card fu d${i}`}>
                <div style={{ display: "flex", gap: ".2rem" }}>
                  {[...Array(5)].map((_, j) => <span key={j} style={{ color: "#FBBF24", fontSize: "1rem" }}>★</span>)}
                </div>
                <p style={{ color: "#374151", lineHeight: 1.75, fontSize: ".95rem" }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--blue-light)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--blue)", fontSize: ".9rem" }}>
                    {t.name.charAt(4)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".88rem", color: "var(--dark)" }}>{t.name}</div>
                    <div style={{ fontSize: ".78rem", color: "var(--gray)" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section style={{ background: "#fff", padding: "6rem 2rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span className="pill fu" style={{ marginBottom: "1rem", display: "inline-flex" }}>✦ Planos & Preços</span>
            <h2 className="fu d1" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-.03em", color: "var(--dark)", marginBottom: ".75rem" }}>
              Simples. Transparente.
            </h2>
            <p className="fu d2" style={{ color: "var(--gray)", maxWidth: "380px", margin: "0 auto", lineHeight: 1.7 }}>
              Escolha o plano ideal. Cancele quando quiser. Sem taxas ocultas.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", alignItems: "start" }}>
            {[
              { name: "Básico", price: "R$ 89,90", period: "/mês", desc: "Para advogados autônomos", perks: ["30 documentos/mês", "300 créditos IA", "Suporte por email", "Gestão de processos"], dark: false },
              { name: "Advogado", price: "R$ 119,90", period: "/mês", desc: "O mais escolhido", perks: ["60 documentos/mês", "600 créditos IA", "Suporte prioritário", "Jurisprudência integrada", "Relatórios avançados"], dark: true, badge: "Mais popular" },
              { name: "Empresas", price: "R$ 219,90", period: "/mês", desc: "Para escritórios", perks: ["Documentos ilimitados", "IA ilimitada", "Suporte dedicado", "Múltiplos usuários", "API access"], dark: false },
            ].map((p, i) => (
              <div key={p.name} className={`price-card fu d${i} ${p.dark ? "featured" : ""}`} style={{ position: "relative" }}>
                {p.badge && (
                  <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "var(--blue)", color: "#fff", borderRadius: "999px", padding: ".3rem .9rem", fontSize: ".72rem", fontWeight: 700, whiteSpace: "nowrap" }}>{p.badge}</div>
                )}
                <h3 style={{ fontWeight: 700, fontSize: "1rem", color: p.dark ? "#fff" : "var(--dark)", marginBottom: ".25rem" }}>{p.name}</h3>
                <p style={{ fontSize: ".82rem", color: p.dark ? "rgba(255,255,255,.4)" : "var(--gray)", marginBottom: "1.5rem" }}>{p.desc}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: ".3rem", marginBottom: "1.75rem" }}>
                  <span style={{ fontSize: "2.8rem", fontWeight: 900, color: p.dark ? "#fff" : "var(--dark)", letterSpacing: "-.03em", lineHeight: 1 }}>{p.price}</span>
                  <span style={{ fontSize: ".82rem", color: p.dark ? "rgba(255,255,255,.35)" : "var(--gray)" }}>{p.period}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: ".6rem", marginBottom: "2rem" }}>
                  {p.perks.map(perk => (
                    <div key={perk} style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                      <span style={{ color: p.dark ? "var(--blue)" : "var(--blue)", fontSize: ".85rem" }}>✓</span>
                      <span style={{ fontSize: ".875rem", color: p.dark ? "rgba(255,255,255,.7)" : "#374151" }}>{perk}</span>
                    </div>
                  ))}
                </div>
                <a href={createPageUrl("Pricing")} style={{ display: "block", textAlign: "center", padding: ".85rem", borderRadius: 10, fontWeight: 600, fontSize: ".9rem", textDecoration: "none", transition: "all .2s", background: p.dark ? "var(--blue)" : "transparent", color: p.dark ? "#fff" : "#B8963E", border: p.dark ? "none" : "1.5px solid #B8963E", boxShadow: p.dark ? "0 4px 14px rgba(79,110,247,.35)" : "none" }}
                  onMouseEnter={e => { if (!p.dark) { e.currentTarget.style.background = "#B8963E"; e.currentTarget.style.color = "#fff"; }}}
                  onMouseLeave={e => { if (!p.dark) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#B8963E"; }}}
                >
                  {p.dark ? "Assinar Agora →" : "Começar →"}
                </a>
              </div>
            ))}
          </div>

          <div className="fu" style={{ textAlign: "center", marginTop: "2rem" }}>
            <a href={createPageUrl("Pricing")} style={{ color: "var(--gray)", fontSize: ".875rem", textDecoration: "none", fontWeight: 500, transition: "color .2s" }}
              onMouseEnter={e => e.target.style.color = "var(--blue)"}
              onMouseLeave={e => e.target.style.color = "var(--gray)"}
            >
              Ver todos os detalhes dos planos →
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--surface)", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div className="cta-section">
            <div style={{ position: "relative", zIndex: 1 }}>
              <span className="pill fi" style={{ marginBottom: "1.5rem", display: "inline-flex", background: "rgba(79,110,247,.2)", color: "#93B4FF", border: "1px solid rgba(79,110,247,.3)" }}>
                ✦ Comece Agora
              </span>
              <h2 className="fu" style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 900, color: "#fff", letterSpacing: "-.04em", lineHeight: 1.1, marginBottom: "1.25rem" }}>
                Transforme seu escritório.<br />Comece hoje mesmo.
              </h2>
              <p className="fu d1" style={{ color: "rgba(255,255,255,.6)", fontSize: "1.05rem", lineHeight: 1.75, maxWidth: "480px", margin: "0 auto 2.5rem" }}>
                Junte-se a mais de 2.000 advogados que já economizam tempo e aumentam produtividade. Teste grátis por 7 dias — sem cartão de crédito.
              </p>
              <div className="fu d2" style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={login} className="btn-outline-gold" style={{ background: "#B8963E", color: "#fff", border: "1.5px solid #B8963E" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#B8963E"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#B8963E"; e.currentTarget.style.color = "#fff"; }}
                >
                  ✦ Assistente IA
                </button>
                <button onClick={goToPricing} style={{ background: "transparent", color: "rgba(255,255,255,.7)", border: "1.5px solid rgba(255,255,255,.2)", borderRadius: 10, padding: ".85rem 2rem", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: ".95rem", transition: "all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.6)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.2)"; e.currentTarget.style.color = "rgba(255,255,255,.7)"; }}
                >
                  Ver Planos
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: "var(--dark)", padding: "5rem 2.5rem 2.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "3rem", marginBottom: "4rem" }}>
            <div style={{ gridColumn: "span 2" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: "1rem" }}>
                <div style={{ width: 34, height: 34, background: "var(--blue)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontWeight: 900, fontSize: ".95rem" }}>J</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: "1.15rem", color: "#fff", letterSpacing: "-.02em" }}>Juris</span>
              </div>
              <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".875rem", lineHeight: 1.7, maxWidth: "260px" }}>
                A plataforma jurídica com inteligência artificial para advogados e escritórios modernos.
              </p>
            </div>
            {[
              {
                title: "Produto",
                links: [
                  { label: "Funcionalidades", to: "Funcionalidades" },
                  { label: "Preços", to: "Pricing" },
                  { label: "Quem Somos", to: "QuemSomos" },
                ]
              },
              {
                title: "Legal",
                links: [
                  { label: "Privacidade", to: "PrivacyPolicy" },
                  { label: "Termos", to: "TermsOfService" },
                  { label: "Contato", to: "ContactPublic" },
                ]
              }
            ].map(col => (
              <div key={col.title}>
                <p style={{ color: "rgba(255,255,255,.25)", fontSize: ".72rem", fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "1.25rem" }}>{col.title}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: ".7rem" }}>
                  {col.links.map(({ label, to }) => (
                    <Link key={label} to={createPageUrl(to)}
                      style={{ color: "rgba(255,255,255,.45)", fontSize: ".875rem", textDecoration: "none", transition: "color .2s" }}
                      onMouseEnter={e => e.target.style.color = "#fff"}
                      onMouseLeave={e => e.target.style.color = "rgba(255,255,255,.45)"}
                    >{label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ color: "rgba(255,255,255,.2)", fontSize: ".78rem" }}>© 2024 Juris. Todos os direitos reservados.</p>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              {["Privacidade", "Termos", "Cookies"].map(l => <span key={l} style={{ color: "rgba(255,255,255,.2)", fontSize: ".78rem", cursor: "pointer" }}>{l}</span>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
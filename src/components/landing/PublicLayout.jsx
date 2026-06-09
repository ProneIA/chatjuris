import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Menu, X, Scale, FileText, Search, DollarSign,
  MessageCircle, Users, Star, ArrowRight, CheckCircle, Zap,
} from "lucide-react";

export const SITE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }

  :root {
    --navy: #0B1120; --navy2: #141E35; --navy3: #1E2D4A;
    --accent: #3B82F6; --accent2: #2563EB;
    --white: #ffffff; --gray: #F1F5F9; --text: #0F172A; --text2: #475569; --text3: #94A3B8;
    --border: #E2E8F0; --r: 12px;
    --sh: 0 4px 24px rgba(0,0,0,.08);
  }

  @keyframes pulseBlue { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

  .fu { opacity:0; transform:translateY(20px); transition:opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
  .fu.v { opacity:1; transform:translateY(0); }
  .d1{transition-delay:80ms} .d2{transition-delay:160ms} .d3{transition-delay:240ms} .d4{transition-delay:320ms}

  .grid-dots {
    background-image: radial-gradient(circle, rgba(255,255,255,.07) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  .lp-btn {
    display:inline-flex; align-items:center; gap:8px;
    padding:13px 28px; border-radius:8px; font-family:'Inter',sans-serif;
    font-size:15px; font-weight:600; cursor:pointer; border:none;
    text-decoration:none; transition:all .2s ease; white-space:nowrap; min-height:unset;
  }
  .lp-btn-primary { background:var(--accent); color:#fff; box-shadow:0 2px 8px rgba(59,130,246,.4); }
  .lp-btn-primary:hover { background:var(--accent2); transform:translateY(-1px); box-shadow:0 6px 20px rgba(59,130,246,.4); }
  .lp-btn-outline { background:rgba(255,255,255,.08); color:#fff; border:1.5px solid rgba(255,255,255,.2); }
  .lp-btn-outline:hover { background:rgba(255,255,255,.14); }
  .lp-btn-dark { background:var(--navy); color:#fff; }
  .lp-btn-dark:hover { background:var(--navy2); transform:translateY(-1px); box-shadow:var(--sh); }

  .feature-card {
    background:#fff; border:1px solid var(--border); border-radius:var(--r);
    padding:28px; transition:all .25s ease;
  }
  .feature-card:hover { box-shadow:0 8px 32px rgba(0,0,0,.1); transform:translateY(-3px); border-color:rgba(59,130,246,.3); }

  .pricing-card {
    background:#fff; border:1.5px solid var(--border); border-radius:16px;
    padding:32px; transition:all .25s ease; position:relative;
  }
  .pricing-card.featured { border-color:var(--accent); box-shadow:0 0 0 4px rgba(59,130,246,.08); }
  .pricing-card:hover { box-shadow:0 12px 40px rgba(0,0,0,.1); }

  .stat-num { font-family:'Syne',sans-serif; font-size:42px; font-weight:800; color:#fff; letter-spacing:-0.04em; line-height:1; }
  .stat-label { font-size:14px; color:rgba(255,255,255,.5); margin-top:6px; }

  @media(max-width:767px){ .hide-mobile-nav{display:none!important} }
  @media(min-width:768px){ .show-mobile-nav{display:none!important} }
`;

/* ─── NAVBAR ─────────────────────────────────────────────── */
export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const login = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));

  const navLinks = [
    { label: "Funcionalidades", to: createPageUrl("Funcionalidades") },
    { label: "Preços", to: createPageUrl("Pricing") },
    { label: "Quem Somos", to: createPageUrl("QuemSomos") },
  ];

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(11,17,32,.95)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,.08)" : "none",
        padding: "0 6%", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all .3s ease",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {/* Logo */}
        <Link to={createPageUrl("LandingPage")} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Scale size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Syne', 'Inter', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: "-0.03em" }}>
            Juris<span style={{ color: "#3B82F6" }}>.IA</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, position: "absolute", left: "50%", transform: "translateX(-50%)" }} className="hide-mobile-nav">
          {navLinks.map(({ label, to }) => (
            <Link key={label} to={to} style={{ color: "rgba(255,255,255,.65)", fontSize: 14, fontWeight: 400, textDecoration: "none", transition: "color .2s" }}
              onMouseEnter={e => e.target.style.color = "#fff"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,.65)"}
            >{label}</Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="hide-mobile-nav">
          <button onClick={login} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.65)", fontSize: 14, padding: "8px 16px", transition: "color .2s", minHeight: "unset" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.65)"}
          >Entrar</button>
          <button onClick={login} className="lp-btn lp-btn-primary" style={{ padding: "9px 20px", fontSize: 14 }}>
            Começar grátis
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="show-mobile-nav" style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: "#fff", minHeight: "unset" }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99,
          background: "#0B1120",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 24,
          paddingTop: 60,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          {navLinks.map(({ label, to }) => (
            <Link key={label} to={to} onClick={() => setOpen(false)} style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 600, textDecoration: "none" }}>{label}</Link>
          ))}
          <button onClick={login} style={{ color: "rgba(255,255,255,.6)", background: "none", border: "none", fontSize: "1rem", cursor: "pointer", minHeight: "unset" }}>Entrar</button>
          <button onClick={login} className="lp-btn lp-btn-primary">Começar grátis</button>
        </div>
      )}
    </>
  );
}

/* ─── FOOTER ─────────────────────────────────────────────── */
export function SiteFooter() {
  const cols = {
    Produto: [
      { label: "Funcionalidades", to: "Funcionalidades" },
      { label: "Preços", to: "Pricing" },
      { label: "Quem Somos", to: "QuemSomos" },
    ],
    Legal: [
      { label: "Política de Privacidade", to: "PrivacyPolicy" },
      { label: "Termos de Uso", to: "TermsOfService" },
      { label: "Contato", to: "ContactPublic" },
    ],
  };

  return (
    <footer style={{ background: "#0B1120", padding: "48px 6% 28px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "3rem", marginBottom: "3rem" }}>
          <div style={{ gridColumn: "span 2" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Scale size={14} color="#fff" />
              </div>
              <span style={{ fontFamily: "'Syne','Inter',sans-serif", fontWeight: 800, fontSize: 16, color: "#fff", letterSpacing: "-0.02em" }}>
                Juris<span style={{ color: "#3B82F6" }}>.IA</span>
              </span>
            </div>
            <p style={{ color: "rgba(255,255,255,.35)", fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>
              A plataforma jurídica com inteligência artificial para advogados e escritórios modernos.
            </p>
          </div>
          {Object.entries(cols).map(([title, items]) => (
            <div key={title}>
              <p style={{ color: "rgba(255,255,255,.25)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.25rem" }}>{title}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map(({ label, to }) => (
                  <Link key={label} to={createPageUrl(to)} style={{ color: "rgba(255,255,255,.4)", fontSize: 13, textDecoration: "none", transition: "color .2s" }}
                    onMouseEnter={e => e.target.style.color = "rgba(255,255,255,.85)"}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,.4)"}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "rgba(255,255,255,.2)", fontSize: 11, margin: 0 }}>© 2025 Juris.IA. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── LANDING PAGE COMPLETA ──────────────────────────────── */
export default function LandingPageLayout() {
  const login = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));

  const features = [
    { icon: Scale,         title: "Gestão de Processos",    desc: "Acompanhe todos os seus casos em um único painel, com prazos, movimentações e alertas automáticos." },
    { icon: FileText,      title: "Gerador de Peças com IA", desc: "Gere petições, contratos e documentos jurídicos em segundos com inteligência artificial especializada." },
    { icon: Search,        title: "Pesquisa Jurídica",       desc: "Pesquise jurisprudência e legislação com precisão, em tribunais superiores e regionais." },
    { icon: DollarSign,    title: "Controle Financeiro",     desc: "Controle honorários, despesas e fluxo de caixa do escritório com relatórios detalhados." },
    { icon: MessageCircle, title: "WhatsApp Jurídico",       desc: "Atendimento automatizado de clientes pelo WhatsApp com agente de IA configurável." },
    { icon: Users,         title: "Gestão de Equipe",        desc: "Distribua tarefas, colabore em documentos e gerencie toda a equipe em tempo real." },
  ];

  const metrics = [
    { value: "+500", label: "Advogados Ativos" },
    { value: "+10K", label: "Documentos Gerados" },
    { value: "98%",  label: "Satisfação" },
    { value: "3×",   label: "Mais Produtividade" },
  ];

  const testimonials = [
    { text: "O Juris.IA transformou completamente minha rotina. Reduzi em 70% o tempo que gastava redigindo petições.", name: "Dra. Ana Lima" },
    { text: "A ferramenta de acompanhamento de processos é incrível. Nunca mais perdi um prazo desde que comecei a usar.", name: "Dr. Carlos Mendes" },
    { text: "O gerador de documentos com IA é impressionante. A qualidade das peças geradas é profissional e precisa.", name: "Dra. Fernanda Costa" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#F1F5F9", overflowX: "hidden" }}>
      <style>{SITE_CSS}</style>
      <SiteNav />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{
        background: "#0B1120", minHeight: "100vh",
        display: "flex", alignItems: "center",
        position: "relative", overflow: "hidden", paddingTop: 60,
      }}>
        {/* Dots pattern */}
        <div className="grid-dots" style={{ position: "absolute", inset: 0, opacity: .5 }} />
        {/* Glow */}
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(59,130,246,.15) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 6%", textAlign: "center", position: "relative", zIndex: 1 }}>
          {/* Pill badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,.12)", border: "1px solid rgba(59,130,246,.3)", borderRadius: 99, padding: "6px 16px", marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", animation: "pulseBlue 2s infinite" }} />
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "#93C5FD", letterSpacing: ".03em" }}>Software Jurídico com IA</span>
          </div>

          <h1 style={{ fontFamily: "'Syne','Inter',sans-serif", fontSize: "clamp(36px,6vw,68px)", fontWeight: 800, color: "#fff", lineHeight: 1.08, letterSpacing: "-0.04em", marginBottom: 24 }}>
            Advocacia mais<br />
            <span style={{ background: "linear-gradient(135deg,#3B82F6,#60A5FA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              inteligente
            </span>
          </h1>

          <p style={{ fontSize: "clamp(15px,2vw,19px)", color: "rgba(255,255,255,.55)", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
            IA para pesquisa jurídica, geração de peças, cálculos processuais e gestão do seu escritório.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={login} className="lp-btn lp-btn-primary">
              Começar 7 dias grátis <ArrowRight size={16} />
            </button>
            <Link to={createPageUrl("Funcionalidades")} className="lp-btn lp-btn-outline">
              Ver demonstração
            </Link>
          </div>

          {/* Trust indicators */}
          <div style={{ marginTop: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            {["Sem cartão de crédito", "7 dias grátis", "Cancele quando quiser"].map(item => (
              <span key={item} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,.4)", fontSize: 12 }}>
                <CheckCircle size={12} color="#22C55E" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── MÉTRICAS ──────────────────────────────────────────────────── */}
      <section style={{ background: "#141E35", padding: "0 6%" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4,1fr)",
        }}>
          {metrics.map(({ value, label }, i) => (
            <div key={label} style={{
              padding: "40px 24px", textAlign: "center",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,.06)" : "none",
            }}>
              <div className="stat-num">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FUNCIONALIDADES ───────────────────────────────────────────── */}
      <section style={{ padding: "80px 6%", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 12 }}>Funcionalidades</p>
            <h2 style={{ fontFamily: "'Syne','Inter',sans-serif", fontSize: "clamp(1.6rem,3vw,2.5rem)", fontWeight: 800, color: "#0F172A", margin: 0, maxWidth: 540, lineHeight: 1.15, letterSpacing: "-0.03em" }}>
              Para cada desafio jurídico, uma solução inteligente
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="feature-card">
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon size={18} color="#3B82F6" strokeWidth={1.75} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", margin: "0 0 8px" }}>{title}</h3>
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ───────────────────────────────────────────────── */}
      <section style={{ padding: "80px 6%", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 12 }}>Depoimentos</p>
            <h2 style={{ fontFamily: "'Syne','Inter',sans-serif", fontSize: "clamp(1.6rem,3vw,2.5rem)", fontWeight: 800, color: "#0F172A", margin: 0, lineHeight: 1.15, letterSpacing: "-0.03em" }}>
              O que nossos usuários dizem
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
            {testimonials.map(({ text, name }) => (
              <div key={name} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: "28px 24px" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#EAB308" color="#EAB308" />)}
                </div>
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, margin: "0 0 20px", fontStyle: "italic" }}>"{text}"</p>
                <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>{name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 6%", background: "#0B1120", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 400, background: "radial-gradient(circle,rgba(59,130,246,.12) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 560, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 20 }}>Comece agora</p>
          <h2 style={{ fontFamily: "'Syne','Inter',sans-serif", fontSize: "clamp(1.6rem,3vw,2.5rem)", fontWeight: 800, color: "#fff", margin: "0 0 16px", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
            Pronto para transformar seu escritório?
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.45)", margin: "0 0 36px", lineHeight: 1.7 }}>
            Comece hoje mesmo com 7 dias de acesso completo. Sem cartão de crédito.
          </p>
          <button onClick={login} className="lp-btn lp-btn-primary">
            Começar agora — é grátis <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
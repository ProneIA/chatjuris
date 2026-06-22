import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Menu, X, Scale, FileText, Search, DollarSign,
  MessageSquare, Users, ArrowRight, CheckCircle,
  ChevronRight, BarChart2, Shield, Clock,
} from "lucide-react";

/* ─── NAVBAR ──────────────────────────────────────────────────── */
export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const login = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));

  const navLinks = [
    { label: "Funcionalidades", to: createPageUrl("Funcionalidades") },
    { label: "Preços",          to: createPageUrl("Pricing")          },
    { label: "Quem Somos",      to: createPageUrl("QuemSomos")        },
  ];

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "#ffffff" : "transparent",
        borderBottom: scrolled ? "1px solid #E2E8F0" : "none",
        padding: "0 6%", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "background .2s ease, border-color .2s ease",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {/* Logo */}
        <Link to={createPageUrl("LandingPage")} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 6, background: "#1E3A5F", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Scale size={15} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16, color: scrolled ? "#0F172A" : "#fff", letterSpacing: "-0.02em" }}>
            JURIS
          </span>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 28, position: "absolute", left: "50%", transform: "translateX(-50%)" }}
          className="hide-mobile-nav">
          {navLinks.map(({ label, to }) => (
            <Link key={label} to={to}
              style={{ color: scrolled ? "#64748B" : "rgba(255,255,255,.70)", fontSize: 14, fontWeight: 400, textDecoration: "none", transition: "color .15s" }}
              onMouseEnter={e => e.target.style.color = scrolled ? "#0F172A" : "#fff"}
              onMouseLeave={e => e.target.style.color = scrolled ? "#64748B" : "rgba(255,255,255,.70)"}
            >{label}</Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="hide-mobile-nav">
          <button onClick={login} style={{
            background: "none", border: "none", cursor: "pointer", minHeight: "unset",
            color: scrolled ? "#64748B" : "rgba(255,255,255,.70)",
            fontSize: 14, padding: "8px 16px", fontFamily: "'Inter', sans-serif",
            transition: "color .15s",
          }}
            onMouseEnter={e => e.currentTarget.style.color = scrolled ? "#0F172A" : "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = scrolled ? "#64748B" : "rgba(255,255,255,.70)"}
          >Entrar</button>
          <button onClick={login} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 20px", borderRadius: 6,
            background: "#1E3A5F", color: "#fff",
            fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif",
            border: "none", cursor: "pointer", transition: "background .15s",
            minHeight: "unset",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#162d4a"}
            onMouseLeave={e => e.currentTarget.style.background = "#1E3A5F"}
          >Começar grátis</button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)}
          className="show-mobile-nav"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: scrolled ? "#0F172A" : "#fff", minHeight: "unset" }}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99, background: "#fff",
          display: "flex", flexDirection: "column",
          padding: "80px 6% 40px", gap: 0,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          {navLinks.map(({ label, to }) => (
            <Link key={label} to={to} onClick={() => setOpen(false)}
              style={{ color: "#0F172A", fontSize: 18, fontWeight: 500, textDecoration: "none", padding: "16px 0", borderBottom: "1px solid #F1F5F9" }}>
              {label}
            </Link>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 32 }}>
            <button onClick={login} style={{
              background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6,
              color: "#0F172A", fontSize: 14, fontWeight: 500, padding: "12px",
              fontFamily: "'Inter', sans-serif", cursor: "pointer",
            }}>Entrar</button>
            <button onClick={login} style={{
              background: "#1E3A5F", border: "none", borderRadius: 6,
              color: "#fff", fontSize: 14, fontWeight: 500, padding: "12px",
              fontFamily: "'Inter', sans-serif", cursor: "pointer",
            }}>Começar grátis</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── FOOTER ──────────────────────────────────────────────────── */
export function SiteFooter() {
  const cols = {
    Produto: [
      { label: "Funcionalidades", to: "Funcionalidades" },
      { label: "Preços",          to: "Pricing"         },
      { label: "Quem Somos",      to: "QuemSomos"       },
    ],
    Legal: [
      { label: "Política de Privacidade", to: "PrivacyPolicy"   },
      { label: "Termos de Uso",           to: "TermsOfService"  },
      { label: "Contato",                 to: "ContactPublic"   },
    ],
  };

  return (
    <footer style={{ background: "#0F172A", padding: "48px 6% 28px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "2.5rem", marginBottom: "2.5rem" }}>
          <div style={{ gridColumn: "span 2" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 26, height: 26, borderRadius: 5, background: "#1E3A5F", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Scale size={13} color="#fff" strokeWidth={2} />
              </div>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: "#F1F5F9", letterSpacing: "-0.01em" }}>
                JURIS
              </span>
            </div>
            <p style={{ color: "rgba(255,255,255,.30)", fontSize: 13, lineHeight: 1.65, maxWidth: 260, margin: 0 }}>
              Plataforma de gestão jurídica para advogados e escritórios.
            </p>
          </div>
          {Object.entries(cols).map(([title, items]) => (
            <div key={title}>
              <p style={{ color: "rgba(255,255,255,.20)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, margin: "0 0 14px" }}>{title}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map(({ label, to }) => (
                  <Link key={label} to={createPageUrl(to)}
                    style={{ color: "rgba(255,255,255,.35)", fontSize: 13, textDecoration: "none", transition: "color .15s" }}
                    onMouseEnter={e => e.target.style.color = "rgba(255,255,255,.70)"}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,.35)"}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: 20, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "rgba(255,255,255,.18)", fontSize: 12, margin: 0 }}>© 2025 JURIS. Todos os direitos reservados.</p>
          <p style={{ color: "rgba(255,255,255,.18)", fontSize: 12, margin: 0 }}>Software Jurídico Profissional</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── LANDING PAGE ────────────────────────────────────────────── */
export const SITE_CSS = ``;

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  @media(max-width:767px){ .hide-mobile-nav{display:none!important} }
  @media(min-width:768px){ .show-mobile-nav{display:none!important} }
  .lp-feature-card { background:#fff; border:1px solid #E2E8F0; border-radius:8px; padding:28px 24px; transition:border-color .15s ease; }
  .lp-feature-card:hover { border-color:#CBD5E1; }
  .lp-testimonial { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:28px 24px; }
`;

export default function LandingPageLayout() {
  const login = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));

  const features = [
    { icon: FileText,      title: "Gestão de Processos",      desc: "Acompanhe casos, prazos e movimentações processuais em um único painel organizado." },
    { icon: BarChart2,     title: "Gerador de Peças Jurídicas", desc: "Redija petições, contratos e documentos com assistência de inteligência artificial." },
    { icon: Search,        title: "Pesquisa Jurídica",          desc: "Acesse jurisprudência e legislação em tribunais superiores e regionais com precisão." },
    { icon: DollarSign,    title: "Controle Financeiro",        desc: "Gerencie honorários, despesas e fluxo de caixa com relatórios detalhados." },
    { icon: MessageSquare, title: "Atendimento Automatizado",   desc: "Configure atendimento de clientes via WhatsApp com agente jurídico inteligente." },
    { icon: Users,         title: "Gestão de Equipe",           desc: "Distribua tarefas, colabore em documentos e gerencie a equipe em tempo real." },
  ];

  const metrics = [
    { value: "+500", label: "Advogados Ativos"   },
    { value: "+10K", label: "Documentos Gerados" },
    { value: "98%",  label: "Satisfação"         },
    { value: "3×",   label: "Ganho de Eficiência" },
  ];

  const testimonials = [
    { text: "Reduzi o tempo dedicado à redação de petições em aproximadamente 70%. A qualidade das peças geradas é compatível com o padrão do escritório.", name: "Dra. Ana Lima", oab: "OAB/SP" },
    { text: "O controle de prazos e movimentações processuais melhorou significativamente nossa gestão. Nenhum prazo perdido desde a implantação.", name: "Dr. Carlos Mendes", oab: "OAB/RJ" },
    { text: "A ferramenta de geração de documentos entrega peças bem estruturadas. Utilizamos como base para todas as nossas ações.", name: "Dra. Fernanda Costa", oab: "OAB/MG" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#F8FAFC", overflowX: "hidden" }}>
      <style>{CSS}</style>
      <SiteNav />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{
        background: "#0F172A",
        minHeight: "100vh",
        display: "flex", alignItems: "center",
        paddingTop: 60,
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "96px 6%", textAlign: "center" }}>

          {/* Tag institucional */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.10)",
            borderRadius: 4, padding: "6px 14px", marginBottom: 36,
          }}>
            <Shield size={12} color="#94A3B8" strokeWidth={2} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8", letterSpacing: ".04em", textTransform: "uppercase" }}>Software Jurídico Profissional</span>
          </div>

          <h1 style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 700, color: "#F1F5F9",
            lineHeight: 1.12, letterSpacing: "-0.03em",
            marginBottom: 24,
          }}>
            Gestão jurídica para<br />
            <span style={{ color: "#93C5FD" }}>escritórios profissionais</span>
          </h1>

          <p style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "rgba(255,255,255,.45)",
            maxWidth: 520, margin: "0 auto 40px",
            lineHeight: 1.70,
          }}>
            Processos, prazos, documentos, financeiro e atendimento ao cliente em uma plataforma integrada.
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={login} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 24px", borderRadius: 6,
              background: "#2563EB", color: "#fff",
              fontSize: 14, fontWeight: 500, border: "none",
              cursor: "pointer", transition: "background .15s",
              fontFamily: "'Inter', sans-serif",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#1D4ED8"}
              onMouseLeave={e => e.currentTarget.style.background = "#2563EB"}
            >
              Iniciar período de teste <ArrowRight size={15} />
            </button>
            <Link to={createPageUrl("Funcionalidades")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 24px", borderRadius: 6,
              background: "transparent", color: "rgba(255,255,255,.65)",
              border: "1px solid rgba(255,255,255,.15)",
              fontSize: 14, fontWeight: 400, textDecoration: "none",
              transition: "border-color .15s, color .15s",
              fontFamily: "'Inter', sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.30)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.15)"; e.currentTarget.style.color = "rgba(255,255,255,.65)"; }}
            >
              Ver funcionalidades
            </Link>
          </div>

          {/* Trust */}
          <div style={{ marginTop: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            {["7 dias de teste gratuito", "Sem cartão de crédito", "Suporte incluso"].map(item => (
              <span key={item} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,.30)", fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
                <CheckCircle size={12} color="#4ADE80" strokeWidth={2} />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── MÉTRICAS ────────────────────────────────────────────── */}
      <section style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 6%", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {metrics.map(({ value, label }, i) => (
            <div key={label} style={{
              padding: "36px 24px", textAlign: "center",
              borderRight: i < 3 ? "1px solid #E2E8F0" : "none",
            }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 32, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em", margin: "0 0 4px" }}>{value}</p>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FUNCIONALIDADES ─────────────────────────────────────── */}
      <section style={{ padding: "80px 6%", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 10 }}>Funcionalidades</p>
            <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, color: "#0F172A", margin: 0, maxWidth: 480, lineHeight: 1.20, letterSpacing: "-0.02em" }}>
              Todas as ferramentas que um escritório precisa
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="lp-feature-card">
                <div style={{ width: 36, height: 36, borderRadius: 7, background: "#F1F5F9", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon size={16} color="#1E3A5F" strokeWidth={1.75} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", margin: "0 0 8px", letterSpacing: "-0.01em" }}>{title}</h3>
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ─────────────────────────────────────────── */}
      <section style={{ padding: "80px 6%", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 10 }}>Avaliações</p>
            <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, color: "#0F172A", margin: 0, lineHeight: 1.20, letterSpacing: "-0.02em" }}>
              Utilizado por advogados em todo o Brasil
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {testimonials.map(({ text, name, oab }) => (
              <div key={name} className="lp-testimonial">
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.70, margin: "0 0 20px" }}>"{text}"</p>
                <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>{name}</p>
                  <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }}>{oab}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POR QUE JURIS ───────────────────────────────────────── */}
      <section style={{ padding: "80px 6%", background: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 10 }}>Diferenciais</p>
              <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 700, color: "#0F172A", margin: "0 0 16px", lineHeight: 1.20, letterSpacing: "-0.02em" }}>
                Desenvolvido para a prática jurídica
              </h2>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.70, margin: "0 0 32px" }}>
                O JURIS foi construído com base nas necessidades reais de advogados e escritórios, priorizando organização, segurança e eficiência operacional.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { icon: Shield, title: "Segurança e LGPD", desc: "Dados protegidos com conformidade à Lei Geral de Proteção de Dados." },
                  { icon: Clock,  title: "Controle de Prazos", desc: "Alertas automáticos para prazos processuais e audiências." },
                  { icon: BarChart2, title: "Relatórios Gerenciais", desc: "Indicadores financeiros e operacionais para tomada de decisão." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} style={{ display: "flex", gap: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: "#fff", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} color="#1E3A5F" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: "0 0 3px" }}>{title}</p>
                      <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.55 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "32px 28px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: "Processos ativos", value: "247" },
                  { label: "Prazos esta semana", value: "12" },
                  { label: "Documentos gerados", value: "1.840" },
                  { label: "Clientes cadastrados", value: "318" },
                ].map(({ label, value }, i) => (
                  <div key={label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 0",
                    borderBottom: i < 3 ? "1px solid #F1F5F9" : "none",
                  }}>
                    <span style={{ fontSize: 13, color: "#64748B" }}>{label}</span>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, padding: "14px 16px", background: "#F8FAFC", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 4px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sistema</p>
                <p style={{ fontSize: 13, color: "#0F172A", margin: 0, fontWeight: 500 }}>Operacional — todos os serviços ativos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────── */}
      <section style={{ padding: "80px 6%", background: "#0F172A", textAlign: "center" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,.25)", marginBottom: 20 }}>Comece hoje</p>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, color: "#F1F5F9", margin: "0 0 16px", lineHeight: 1.20, letterSpacing: "-0.02em" }}>
            Otimize a gestão do seu escritório
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.40)", margin: "0 0 36px", lineHeight: 1.70 }}>
            Acesso completo por 7 dias. Sem custo, sem compromisso.
          </p>
          <button onClick={login} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "13px 28px", borderRadius: 6,
            background: "#2563EB", color: "#fff",
            fontSize: 14, fontWeight: 500, border: "none",
            cursor: "pointer", transition: "background .15s",
            fontFamily: "'Inter', sans-serif",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#1D4ED8"}
            onMouseLeave={e => e.currentTarget.style.background = "#2563EB"}
          >
            Iniciar período de teste <ArrowRight size={15} />
          </button>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.20)", marginTop: 16 }}>
            Sem cartão de crédito · Cancele quando quiser
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
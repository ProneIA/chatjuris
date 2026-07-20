import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Menu, X, Scale, FileText, Search, DollarSign,
  MessageSquare, Users, ArrowRight, CheckCircle,
  ChevronRight, BarChart2, Shield, Clock,
} from "lucide-react";

const F = "'Plus Jakarta Sans', system-ui, sans-serif";
const S = "'Playfair Display', Georgia, serif";

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
        borderBottom: scrolled ? "1px solid #E5E3DF" : "none",
        padding: "0 6%", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "background .2s ease, border-color .2s ease",
        fontFamily: F,
      }}>
        {/* Logo */}
        <Link to={createPageUrl("LandingPage")} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: 5, background: "#14362E", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Scale size={13} color="#C5A880" strokeWidth={1.5} />
          </div>
          <span style={{ fontFamily: S, fontWeight: 500, fontSize: 17, color: scrolled ? "#1B2421" : "#F4F3F1", letterSpacing: "0.01em" }}>
            Juris
          </span>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 28, position: "absolute", left: "50%", transform: "translateX(-50%)" }}
          className="hide-mobile-nav">
          {navLinks.map(({ label, to }) => (
            <Link key={label} to={to}
              style={{ color: scrolled ? "#5C6662" : "rgba(244,243,241,.60)", fontSize: 13.5, fontWeight: 400, textDecoration: "none", transition: "color .15s", fontFamily: F }}
              onMouseEnter={e => e.target.style.color = scrolled ? "#1B2421" : "#F4F3F1"}
              onMouseLeave={e => e.target.style.color = scrolled ? "#5C6662" : "rgba(244,243,241,.60)"}
            >{label}</Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="hide-mobile-nav">
          <button onClick={login} style={{
            background: "none", border: "none", cursor: "pointer", minHeight: "unset",
            color: scrolled ? "#5C6662" : "rgba(244,243,241,.65)",
            fontSize: 13.5, padding: "7px 14px", fontFamily: F,
            transition: "color .15s",
          }}
            onMouseEnter={e => e.currentTarget.style.color = scrolled ? "#1B2421" : "#F4F3F1"}
            onMouseLeave={e => e.currentTarget.style.color = scrolled ? "#5C6662" : "rgba(244,243,241,.65)"}
          >Entrar</button>
          <button onClick={login} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 18px", borderRadius: 5,
            background: "#C5A880", color: "#1B2421",
            fontSize: 13, fontWeight: 600, fontFamily: F,
            border: "none", cursor: "pointer", transition: "background .15s",
            minHeight: "unset",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#B8956A"}
            onMouseLeave={e => e.currentTarget.style.background = "#C5A880"}
          >Começar grátis</button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)}
          className="show-mobile-nav"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: scrolled ? "#1B2421" : "#F4F3F1", minHeight: "unset" }}>
          {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99, background: "#fff",
          display: "flex", flexDirection: "column",
          padding: "80px 6% 40px", gap: 0,
          fontFamily: F,
        }}>
          {navLinks.map(({ label, to }) => (
            <Link key={label} to={to} onClick={() => setOpen(false)}
              style={{ color: "#1B2421", fontSize: 17, fontWeight: 400, textDecoration: "none", padding: "15px 0", borderBottom: "1px solid #E5E3DF", fontFamily: S }}>
              {label}
            </Link>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 28 }}>
            <button onClick={login} style={{
              background: "#F9F8F6", border: "1px solid #E5E3DF", borderRadius: 6,
              color: "#1B2421", fontSize: 14, fontWeight: 500, padding: "11px",
              fontFamily: F, cursor: "pointer",
            }}>Entrar</button>
            <button onClick={login} style={{
              background: "#14362E", border: "none", borderRadius: 6,
              color: "#F4F3F1", fontSize: 14, fontWeight: 500, padding: "11px",
              fontFamily: F, cursor: "pointer",
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
      { label: "Política de Privacidade", to: "PrivacyPolicy"  },
      { label: "Termos de Uso",           to: "TermsOfService" },
      { label: "Contato",                 to: "ContactPublic"  },
    ],
  };

  return (
    <footer style={{ background: "#0D1916", padding: "48px 6% 28px", fontFamily: F }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "2.5rem", marginBottom: "2.5rem" }}>
          <div style={{ gridColumn: "span 2" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 24, height: 24, borderRadius: 4, background: "#14362E", border: "1px solid rgba(197,168,128,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Scale size={12} color="#C5A880" strokeWidth={1.5} />
              </div>
              <span style={{ fontFamily: S, fontWeight: 500, fontSize: 15, color: "#F4F3F1" }}>Juris</span>
            </div>
            <p style={{ color: "rgba(244,243,241,.25)", fontSize: 13, lineHeight: 1.65, maxWidth: 260, margin: 0 }}>
              Plataforma de gestão jurídica para advogados e escritórios.
            </p>
          </div>
          {Object.entries(cols).map(([title, items]) => (
            <div key={title}>
              <p style={{ color: "rgba(244,243,241,.18)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>{title}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map(({ label, to }) => (
                  <Link key={label} to={createPageUrl(to)}
                    style={{ color: "rgba(244,243,241,.32)", fontSize: 13, textDecoration: "none", transition: "color .15s" }}
                    onMouseEnter={e => e.target.style.color = "rgba(244,243,241,.65)"}
                    onMouseLeave={e => e.target.style.color = "rgba(244,243,241,.32)"}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 20, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "rgba(244,243,241,.15)", fontSize: 12, margin: 0 }}>© 2026 Juris. Todos os direitos reservados.</p>
          <p style={{ color: "rgba(244,243,241,.15)", fontSize: 12, margin: 0 }}>Software Jurídico Profissional</p>
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
  body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  @media(max-width:767px){ .hide-mobile-nav{display:none!important} }
  @media(min-width:768px){ .show-mobile-nav{display:none!important} }
  @media(max-width:767px){ .lp-two-col{grid-template-columns:1fr!important} }
  @media(max-width:767px){ .lp-metrics{grid-template-columns:1fr 1fr!important} }
  .lp-feature-card {
    background:#fff; border:1px solid #E5E3DF; border-radius:7px; padding:24px 22px;
    transition:border-color .15s ease;
  }
  .lp-feature-card:hover { border-color:#C5A880; }
  .lp-testimonial {
    background:#F9F8F6; border:1px solid #E5E3DF; border-radius:7px; padding:24px 22px;
  }
`;

export default function LandingPageLayout() {
  const login = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));

  const features = [
    { icon: FileText,      title: "Gestão de Processos",       desc: "Acompanhe casos, prazos e movimentações processuais em um único painel organizado." },
    { icon: BarChart2,     title: "Gerador de Peças Jurídicas", desc: "Redija petições, contratos e documentos com assistência de inteligência artificial." },
    { icon: Search,        title: "Pesquisa Jurídica",          desc: "Acesse jurisprudência e legislação em tribunais superiores e regionais com precisão." },
    { icon: DollarSign,    title: "Controle Financeiro",        desc: "Gerencie honorários, despesas e fluxo de caixa com relatórios detalhados." },
    { icon: MessageSquare, title: "Atendimento Automatizado",   desc: "Configure atendimento de clientes via WhatsApp com agente jurídico inteligente." },
    { icon: Users,         title: "Gestão de Equipe",           desc: "Distribua tarefas, colabore em documentos e gerencie a equipe em tempo real." },
  ];

  const metrics = [
    { value: "+500", label: "Advogados Ativos"    },
    { value: "+10K", label: "Documentos Gerados"  },
    { value: "98%",  label: "Satisfação"          },
    { value: "3×",   label: "Ganho de Eficiência" },
  ];

  const testimonials = [
    { text: "Reduzi o tempo dedicado à redação de petições em aproximadamente 70%. A qualidade das peças geradas é compatível com o padrão do escritório.", name: "Dra. Ana Lima", oab: "OAB/SP" },
    { text: "O controle de prazos e movimentações processuais melhorou significativamente nossa gestão. Nenhum prazo perdido desde a implantação.", name: "Dr. Carlos Mendes", oab: "OAB/RJ" },
    { text: "A ferramenta de geração de documentos entrega peças bem estruturadas. Utilizamos como base para todas as nossas ações.", name: "Dra. Fernanda Costa", oab: "OAB/MG" },
  ];

  return (
    <div style={{ fontFamily: F, background: "#F9F8F6", overflowX: "hidden" }}>
      <style>{CSS}</style>
      <SiteNav />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{
        background: "#0D1916",
        minHeight: "100vh",
        display: "flex", alignItems: "center",
        paddingTop: 58,
      }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "96px 6%", textAlign: "center" }}>

          {/* Tag institucional */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(197,168,128,.08)", border: "1px solid rgba(197,168,128,.18)",
            borderRadius: 4, padding: "5px 14px", marginBottom: 40,
          }}>
            <Shield size={11} color="#C5A880" strokeWidth={1.5} />
            <span style={{ fontSize: 11, fontWeight: 500, color: "#C5A880", letterSpacing: ".07em", textTransform: "uppercase", fontFamily: F }}>Software Jurídico Profissional</span>
          </div>

          <h1 style={{
            fontFamily: S,
            fontSize: "clamp(30px, 5vw, 52px)",
            fontWeight: 400, color: "#F4F3F1",
            lineHeight: 1.18, letterSpacing: "0",
            marginBottom: 24,
          }}>
            Gestão jurídica para<br />
            <em style={{ color: "#C5A880", fontStyle: "italic" }}>escritórios profissionais</em>
          </h1>

          <p style={{
            fontFamily: F,
            fontSize: "clamp(14px, 1.8vw, 16px)",
            color: "rgba(244,243,241,.42)",
            maxWidth: 480, margin: "0 auto 40px",
            lineHeight: 1.75,
          }}>
            Processos, prazos, documentos, financeiro e atendimento ao cliente em uma plataforma integrada.
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={login} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 22px", borderRadius: 5,
              background: "#C5A880", color: "#1B2421",
              fontSize: 13.5, fontWeight: 600, border: "none",
              cursor: "pointer", transition: "background .15s",
              fontFamily: F,
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#B8956A"}
              onMouseLeave={e => e.currentTarget.style.background = "#C5A880"}
            >
              Iniciar período de teste <ArrowRight size={14} strokeWidth={2} />
            </button>
            <Link to={createPageUrl("Funcionalidades")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 22px", borderRadius: 5,
              background: "transparent", color: "rgba(244,243,241,.55)",
              border: "1px solid rgba(244,243,241,.12)",
              fontSize: 13.5, fontWeight: 400, textDecoration: "none",
              transition: "border-color .15s, color .15s",
              fontFamily: F,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(244,243,241,.25)"; e.currentTarget.style.color = "#F4F3F1"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(244,243,241,.12)"; e.currentTarget.style.color = "rgba(244,243,241,.55)"; }}
            >
              Ver funcionalidades
            </Link>
          </div>

          {/* Trust */}
          <div style={{ marginTop: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            {["7 dias de teste gratuito", "Sem cartão de crédito", "Suporte incluso"].map(item => (
              <span key={item} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(244,243,241,.25)", fontSize: 12, fontFamily: F }}>
                <CheckCircle size={11} color="#3E6E5A" strokeWidth={2} />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── MÉTRICAS ────────────────────────────────────────────── */}
      <section style={{ background: "#fff", borderBottom: "1px solid #E5E3DF" }}>
        <div className="lp-metrics" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 6%", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {metrics.map(({ value, label }, i) => (
            <div key={label} style={{
              padding: "32px 20px", textAlign: "center",
              borderRight: i < 3 ? "1px solid #E5E3DF" : "none",
            }}>
              <p style={{ fontFamily: S, fontSize: 34, fontWeight: 400, color: "#1B2421", letterSpacing: "-0.01em", margin: "0 0 4px" }}>{value}</p>
              <p style={{ fontSize: 12.5, color: "#5C6662", margin: 0, fontFamily: F }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FUNCIONALIDADES ─────────────────────────────────────── */}
      <section style={{ padding: "72px 6%", background: "#F9F8F6" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 44 }}>
            <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#8A9490", marginBottom: 10, fontFamily: F }}>Funcionalidades</p>
            <h2 style={{ fontFamily: S, fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 400, color: "#1B2421", margin: 0, maxWidth: 440, lineHeight: 1.25 }}>
              Todas as ferramentas que um escritório precisa
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="lp-feature-card">
                <div style={{ width: 32, height: 32, borderRadius: 6, background: "#EEF5F1", border: "1px solid #D5E8DF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={15} color="#14362E" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontFamily: F, fontSize: 13.5, fontWeight: 600, color: "#1B2421", margin: "0 0 7px" }}>{title}</h3>
                <p style={{ fontSize: 13, color: "#5C6662", lineHeight: 1.65, margin: 0, fontFamily: F }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ─────────────────────────────────────────── */}
      <section style={{ padding: "72px 6%", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 44 }}>
            <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#8A9490", marginBottom: 10, fontFamily: F }}>Avaliações</p>
            <h2 style={{ fontFamily: S, fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 400, color: "#1B2421", margin: 0, lineHeight: 1.25 }}>
              Utilizado por advogados em todo o Brasil
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {testimonials.map(({ text, name, oab }) => (
              <div key={name} className="lp-testimonial">
                <p style={{ fontSize: 13.5, color: "#3F4F4B", lineHeight: 1.75, margin: "0 0 20px", fontFamily: S, fontStyle: "italic" }}>"{text}"</p>
                <div style={{ borderTop: "1px solid #E5E3DF", paddingTop: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1B2421", margin: 0, fontFamily: F }}>{name}</p>
                  <p style={{ fontSize: 11.5, color: "#8A9490", margin: "2px 0 0", fontFamily: F }}>{oab}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POR QUE JURIS ───────────────────────────────────────── */}
      <section style={{ padding: "72px 6%", background: "#F9F8F6", borderTop: "1px solid #E5E3DF" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="lp-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "#8A9490", marginBottom: 10, fontFamily: F }}>Diferenciais</p>
              <h2 style={{ fontFamily: S, fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 400, color: "#1B2421", margin: "0 0 14px", lineHeight: 1.25 }}>
                Desenvolvido para a prática jurídica
              </h2>
              <p style={{ fontSize: 13.5, color: "#5C6662", lineHeight: 1.70, margin: "0 0 28px", fontFamily: F }}>
                O Juris foi construído com base nas necessidades reais de advogados e escritórios, priorizando organização, segurança e eficiência operacional.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { icon: Shield,   title: "Segurança e LGPD",      desc: "Dados protegidos com conformidade à Lei Geral de Proteção de Dados." },
                  { icon: Clock,    title: "Controle de Prazos",     desc: "Alertas automáticos para prazos processuais e audiências." },
                  { icon: BarChart2, title: "Relatórios Gerenciais", desc: "Indicadores financeiros e operacionais para tomada de decisão." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 5, background: "#fff", border: "1px solid #E5E3DF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={14} color="#14362E" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1B2421", margin: "0 0 2px", fontFamily: F }}>{title}</p>
                      <p style={{ fontSize: 12.5, color: "#5C6662", margin: 0, lineHeight: 1.55, fontFamily: F }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard preview */}
            <div style={{ background: "#fff", border: "1px solid #E5E3DF", borderRadius: 8, padding: "28px 24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: "Processos ativos",   value: "247" },
                  { label: "Prazos esta semana", value: "12"  },
                  { label: "Documentos gerados", value: "1.840" },
                  { label: "Clientes cadastrados", value: "318" },
                ].map(({ label, value }, i) => (
                  <div key={label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 0",
                    borderBottom: i < 3 ? "1px solid #F0EFEC" : "none",
                  }}>
                    <span style={{ fontSize: 13, color: "#5C6662", fontFamily: F }}>{label}</span>
                    <span style={{ fontFamily: S, fontSize: 22, fontWeight: 400, color: "#1B2421" }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: "12px 14px", background: "#EEF5F1", borderRadius: 6, border: "1px solid #D5E8DF" }}>
                <p style={{ fontSize: 10.5, color: "#3E6E5A", margin: "0 0 3px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F }}>Sistema</p>
                <p style={{ fontSize: 13, color: "#1B2421", margin: 0, fontWeight: 500, fontFamily: F }}>Operacional — todos os serviços ativos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────── */}
      <section style={{ padding: "72px 6%", background: "#0D1916", textAlign: "center" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(197,168,128,.4)", marginBottom: 18, fontFamily: F }}>Comece hoje</p>
          <h2 style={{ fontFamily: S, fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 400, color: "#F4F3F1", margin: "0 0 14px", lineHeight: 1.25 }}>
            Otimize a gestão do seu escritório
          </h2>
          <p style={{ fontSize: 13.5, color: "rgba(244,243,241,.35)", margin: "0 0 32px", lineHeight: 1.70, fontFamily: F }}>
            Acesso completo por 7 dias. Sem custo, sem compromisso.
          </p>
          <button onClick={login} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "11px 24px", borderRadius: 5,
            background: "#C5A880", color: "#1B2421",
            fontSize: 13.5, fontWeight: 600, border: "none",
            cursor: "pointer", transition: "background .15s",
            fontFamily: F,
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#B8956A"}
            onMouseLeave={e => e.currentTarget.style.background = "#C5A880"}
          >
            Iniciar período de teste <ArrowRight size={14} strokeWidth={2} />
          </button>
          <p style={{ fontSize: 12, color: "rgba(244,243,241,.18)", marginTop: 14, fontFamily: F }}>
            Sem cartão de crédito · Cancele quando quiser
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
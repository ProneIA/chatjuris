import React, { useState, useEffect } from "react";

export const SITE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  .fu { opacity: 0; transform: translateY(2rem); transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1); }
  .fi { opacity: 0; transition: opacity 1.2s ease; }
  .fu.v, .fi.v { opacity: 1; transform: translateY(0); }
  .d1 { transition-delay: 80ms; } .d2 { transition-delay: 160ms; } .d3 { transition-delay: 240ms; } .d4 { transition-delay: 320ms; }
  .D { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
  .lbl { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.75rem; font-weight: 600; color: rgba(0,0,0,.4); letter-spacing: .08em; text-transform: uppercase; }
  .outline-w { -webkit-text-stroke: 2px #fff; color: transparent; }
  .grid-bg { background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px); background-size: 60px 60px; }
  .pillar { border: 1.5px solid rgba(255,255,255,.08); background: rgba(255,255,255,.02); border-radius: 4px; padding: 2.5rem; transition: all .35s ease; cursor: default; }
  .pillar:hover { background: #C9A84C; border-color: #C9A84C; }
  .p-num { font-size:3rem; font-weight:800; color:rgba(255,255,255,.1); line-height:1; margin-bottom:.5rem; transition:color .3s; }
  .p-title { font-size:1rem; font-weight:700; color:#fff; margin-bottom:.6rem; }
  .p-txt { font-size:.875rem; color:rgba(255,255,255,.45); line-height:1.7; transition:color .3s; }
  .pillar:hover .p-num, .pillar:hover .p-txt { color:rgba(255,255,255,.85); }
  .btn-white { display:inline-flex; align-items:center; gap:.5rem; padding:.85rem 2rem; background:#fff; color:#111; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; font-size:.9rem; border:none; cursor:pointer; border-radius:999px; text-decoration:none; transition:opacity .2s; }
  .btn-white:hover { opacity:.9; }
  .btn-gold { display:inline-flex; align-items:center; gap:.5rem; padding:.85rem 2rem; background:#C9A84C; color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; font-size:.9rem; border:none; cursor:pointer; border-radius:999px; text-decoration:none; transition:background .2s; }
  .btn-gold:hover { background:#9A7228; }
  .btn-outline-w { display:inline-flex; align-items:center; gap:.5rem; padding:.85rem 2rem; background:transparent; color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; font-size:.9rem; border:1.5px solid rgba(255,255,255,.4); cursor:pointer; border-radius:999px; text-decoration:none; transition:background .2s; }
  .btn-outline-w:hover { background:rgba(255,255,255,.1); }
  .btn-outline-gold { display:inline-flex; align-items:center; gap:.5rem; padding:.75rem 1.5rem; background:#fff; color:#9A7228; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; font-size:.875rem; border:1.5px solid #C9A84C; cursor:pointer; border-radius:999px; text-decoration:none; transition:background .2s, box-shadow .2s; }
  .btn-outline-gold:hover { background:#F7EED8; box-shadow:0 0 0 3px rgba(201,168,76,.2); }
  .sticky-panel { height: 100vh !important; }
  @media(max-width:1023px){ .sticky-panel{ position:relative !important; height:60vw !important; } }
`;
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Menu, X, Scale, FileText, Search, DollarSign,
  MessageCircle, Users, Star, ArrowRight, CheckCircle, Zap
} from "lucide-react";

const LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/render/image/public/base44-prod/public/690e408daf48e0f633c6cf3a/5c0116596_LOGO2.png";

const S = {
  font: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif",
  gold: "#C9A84C",
  goldDeep: "#9A7228",
  goldLight: "#F7EED8",
  goldBorder: "rgba(201,168,76,0.35)",
  goldGlow: "rgba(201,168,76,0.18)",
  text: "#18181B",
  textMuted: "#71717A",
  surface: "#FFFFFF",
  surface2: "#F9F8F5",
  border: "#E4E2DB",
  bg: "#F6F4EF",
};

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
        background: scrolled ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: `1px solid ${scrolled ? S.border : "transparent"}`,
        transition: "all 0.3s ease",
        padding: "0 5%",
        height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link to={createPageUrl("LandingPage")} style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
          <img src={LOGO} alt="Juris.IA" style={{ height: 38, objectFit: "contain" }} />
        </Link>

        {/* Desktop Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, position: "absolute", left: "50%", transform: "translateX(-50%)" }}
          className="hide-mobile-nav">
          {navLinks.map(({ label, to }) => (
            <Link key={label} to={to} style={{
              color: S.textMuted, fontSize: 14, fontWeight: 500, textDecoration: "none",
              fontFamily: S.font, transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = S.text}
              onMouseLeave={e => e.target.style.color = S.textMuted}
            >{label}</Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="hide-mobile-nav">
          <button onClick={login} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: S.font, fontSize: 14, fontWeight: 500, color: S.textMuted,
            padding: "8px 16px", borderRadius: 999, transition: "color 0.2s, background 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = S.text; e.currentTarget.style.background = S.surface2; }}
            onMouseLeave={e => { e.currentTarget.style.color = S.textMuted; e.currentTarget.style.background = "none"; }}
          >Entrar</button>
          <button onClick={login} style={{
            background: S.gold, color: "#fff", border: "none", cursor: "pointer",
            fontFamily: S.font, fontSize: 14, fontWeight: 600,
            padding: "9px 20px", borderRadius: 999,
            boxShadow: "0 2px 12px rgba(201,168,76,0.4)",
            transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = S.goldDeep; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = S.gold; e.currentTarget.style.transform = "none"; }}
          >Começar grátis</button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="show-mobile-nav" style={{
          background: "none", border: "none", cursor: "pointer", padding: 8, color: S.text,
        }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99,
          background: "#fff",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 28,
          paddingTop: 64,
        }}>
          {navLinks.map(({ label, to }) => (
            <Link key={label} to={to} onClick={() => setOpen(false)} style={{
              color: S.text, fontSize: "1.6rem", fontWeight: 700,
              textDecoration: "none", fontFamily: S.font,
            }}>{label}</Link>
          ))}
          <button onClick={login} style={{
            color: S.textMuted, background: "none", border: "none",
            fontSize: "1rem", cursor: "pointer", fontFamily: S.font, fontWeight: 500,
          }}>Entrar</button>
          <button onClick={login} style={{
            background: S.gold, color: "#fff", border: "none", cursor: "pointer",
            fontFamily: S.font, fontSize: "1rem", fontWeight: 600,
            padding: "12px 32px", borderRadius: 999,
          }}>Começar grátis</button>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) { .hide-mobile-nav { display: none !important; } }
        @media (min-width: 768px) { .show-mobile-nav { display: none !important; } }
      `}</style>
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
    <footer style={{ background: "#111", padding: "4rem 5% 2rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "3rem", marginBottom: "3rem",
        }}>
          <div style={{ gridColumn: "span 2" }}>
            <img src={LOGO} alt="Juris.IA" style={{ height: 38, objectFit: "contain", marginBottom: "1rem", filter: "brightness(0) invert(1)" }} />
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.7, maxWidth: 260, fontFamily: S.font }}>
              A plataforma jurídica com inteligência artificial para advogados e escritórios modernos.
            </p>
          </div>
          {Object.entries(cols).map(([title, items]) => (
            <div key={title}>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1.25rem", fontFamily: S.font }}>{title}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map(({ label, to }) => (
                  <Link key={label} to={createPageUrl(to)} style={{
                    color: "rgba(255,255,255,0.45)", fontSize: 14, textDecoration: "none",
                    fontFamily: S.font, transition: "color 0.2s",
                  }}
                    onMouseEnter={e => e.target.style.color = "#fff"}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, margin: 0, fontFamily: S.font }}>© 2025 Juris.IA. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── LANDING PAGE COMPLETA ──────────────────────────────── */
export default function LandingPageLayout() {
  const login = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));

  const features = [
    { icon: Scale, title: "Gestão de Processos", desc: "Acompanhe todos os seus casos em um único painel, com prazos, movimentações e alertas automáticos." },
    { icon: FileText, title: "Gerador de Peças com IA", desc: "Gere petições, contratos e documentos jurídicos em segundos com inteligência artificial especializada." },
    { icon: Search, title: "Pesquisa Jurídica", desc: "Pesquise jurisprudência e legislação com precisão, em tribunais superiores e regionais." },
    { icon: DollarSign, title: "Controle Financeiro", desc: "Controle honorários, despesas e fluxo de caixa do escritório com relatórios detalhados." },
    { icon: MessageCircle, title: "WhatsApp Jurídico", desc: "Atendimento automatizado de clientes pelo WhatsApp com agente de IA configurável." },
    { icon: Users, title: "Gestão de Equipe", desc: "Distribua tarefas, colabore em documentos e gerencie toda a equipe em tempo real." },
  ];

  const metrics = [
    { value: "+500", label: "Advogados Ativos" },
    { value: "+10K", label: "Documentos Gerados" },
    { value: "98%", label: "Satisfação" },
    { value: "3×", label: "Mais Produtividade" },
  ];

  const testimonials = [
    { text: "O Juris.IA transformou completamente minha rotina. Reduzi em 70% o tempo que gastava redigindo petições.", name: "Dra. Ana Lima", role: "" },
    { text: "A ferramenta de acompanhamento de processos é incrível. Nunca mais perdi um prazo desde que comecei a usar.", name: "Dr. Carlos Mendes", role: "" },
    { text: "O gerador de documentos com IA é impressionante. A qualidade das peças geradas é profissional e precisa.", name: "Dra. Fernanda Costa", role: "" },
  ];

  return (
    <div style={{ fontFamily: S.font, background: "#fff", overflowX: "hidden" }}>
      <SiteNav />

      {/* ── HERO ──────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "120px 5% 80px",
        background: "linear-gradient(160deg, #fff 0%, #F7EED8 60%, #fff 100%)",
        textAlign: "center",
        position: "relative",
      }}>
        {/* Background decoration */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.12) 0%, transparent 70%)",
        }} />

        <div style={{ maxWidth: 760, position: "relative" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: S.goldLight, border: `1px solid ${S.goldBorder}`,
            borderRadius: 999, padding: "6px 16px",
            fontSize: 13, fontWeight: 600, color: S.goldDeep,
            marginBottom: 32,
          }}>
            <Zap size={13} />
            Plataforma Jurídica com IA
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
            fontWeight: 800, lineHeight: 1.12, margin: "0 0 24px",
            letterSpacing: "-0.03em", color: S.text,
          }}>
            Advocacia mais inteligente.{" "}
            <span style={{
              background: `linear-gradient(135deg, ${S.gold} 0%, ${S.goldDeep} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Resultados que impressionam.
            </span>
          </h1>

          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)", color: S.textMuted,
            lineHeight: 1.7, margin: "0 auto 44px", maxWidth: 580,
          }}>
            Gerencie processos, gere documentos com IA e pesquise jurisprudência — tudo em uma única plataforma.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={login} style={{
              background: S.gold, color: "#fff", border: "none", cursor: "pointer",
              fontFamily: S.font, fontSize: 15, fontWeight: 700,
              padding: "14px 32px", borderRadius: 999,
              boxShadow: "0 4px 20px rgba(201,168,76,0.45)",
              display: "inline-flex", alignItems: "center", gap: 8,
              transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = S.goldDeep; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(201,168,76,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = S.gold; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(201,168,76,0.45)"; }}
            >
              Começar grátis <ArrowRight size={16} />
            </button>
            <Link to={createPageUrl("Funcionalidades")} style={{
              background: "#fff", color: S.text, textDecoration: "none",
              fontFamily: S.font, fontSize: 15, fontWeight: 600,
              padding: "13px 28px", borderRadius: 999,
              border: `1.5px solid ${S.border}`,
              display: "inline-flex", alignItems: "center", gap: 8,
              transition: "border-color 0.2s, transform 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = S.goldBorder; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.transform = "none"; }}
            >
              Ver demonstração
            </Link>
          </div>

          {/* Trust indicators */}
          <div style={{ marginTop: 52, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            {["Sem cartão de crédito", "7 dias grátis", "Cancele quando quiser"].map((item, i) => (
              <React.Fragment key={item}>
                {i > 0 && <span style={{ color: S.border, fontSize: 12 }}>·</span>}
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: S.textMuted, fontSize: 13 }}>
                  <CheckCircle size={13} color={S.gold} />
                  {item}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── MÉTRICAS ──────────────────────────────── */}
      <section style={{ background: "#111", padding: "60px 5%" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 32, textAlign: "center",
        }}>
          {metrics.map(({ value, label }) => (
            <div key={label}>
              <div style={{
                fontSize: "clamp(2.2rem, 4vw, 3rem)", fontWeight: 800,
                color: S.gold, lineHeight: 1, marginBottom: 8,
                fontFamily: S.font,
              }}>{value}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 500, fontFamily: S.font }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FUNCIONALIDADES ───────────────────────── */}
      <section style={{ padding: "96px 5%", background: S.bg }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p style={{ color: S.gold, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Funcionalidades</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.75rem)", fontWeight: 800, color: S.text, margin: "0 auto", maxWidth: 600, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              Para cada desafio jurídico, uma solução inteligente
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 24,
          }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{
                background: S.surface, border: `1.5px solid ${S.border}`,
                borderRadius: 16, padding: "2rem",
                transition: "border-color 0.25s, box-shadow 0.25s, transform 0.25s",
                cursor: "default",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = S.goldBorder;
                  e.currentTarget.style.boxShadow = `0 8px 32px ${S.goldGlow}`;
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = S.border;
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: S.goldLight, border: `1px solid ${S.goldBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20,
                }}>
                  <Icon size={20} color={S.goldDeep} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: S.text, margin: "0 0 10px", fontFamily: S.font }}>{title}</h3>
                <p style={{ fontSize: 14, color: S.textMuted, lineHeight: 1.65, margin: 0, fontFamily: S.font }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ───────────────────────────── */}
      <section style={{ padding: "96px 5%", background: S.surface2 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ color: S.gold, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Depoimentos</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, color: S.text, margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              O que nossos usuários dizem
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 24,
          }}>
            {testimonials.map(({ text, name, role }) => (
              <div key={name} style={{
                background: S.surface, border: `1.5px solid ${S.border}`,
                borderRadius: 16, padding: "2rem",
                transition: "box-shadow 0.25s, transform 0.25s",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={S.gold} color={S.gold} />)}
                </div>
                <p style={{ fontSize: 15, color: S.text, lineHeight: 1.7, margin: "0 0 24px", fontFamily: S.font, fontStyle: "italic" }}>
                  "{text}"
                </p>
                <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: S.text, margin: "0 0 3px", fontFamily: S.font }}>{name}</p>
                  <p style={{ fontSize: 12, color: S.textMuted, margin: 0, fontFamily: S.font }}>{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────── */}
      <section style={{
        padding: "96px 5%",
        background: `linear-gradient(135deg, ${S.gold} 0%, ${S.goldDeep} 100%)`,
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(1.8rem, 3.5vw, 2.75rem)", fontWeight: 800,
            color: "#fff", margin: "0 0 16px", lineHeight: 1.2, letterSpacing: "-0.02em",
            fontFamily: S.font,
          }}>
            Pronto para transformar seu escritório?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", margin: "0 0 40px", lineHeight: 1.6, fontFamily: S.font }}>
            Comece hoje mesmo com 7 dias de acesso completo. Sem cartão de crédito.
          </p>
          <button onClick={login} style={{
            background: "#fff", color: S.goldDeep, border: "none", cursor: "pointer",
            fontFamily: S.font, fontSize: 16, fontWeight: 700,
            padding: "15px 40px", borderRadius: 999,
            display: "inline-flex", alignItems: "center", gap: 10,
            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            transition: "transform 0.15s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.15)"; }}
          >
            Começar agora — é grátis <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
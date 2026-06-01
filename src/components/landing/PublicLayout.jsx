import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Re-exportado para compatibilidade com páginas que ainda o importam
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
  .btn-white { display:inline-flex; align-items:center; gap:.5rem; padding:.85rem 2rem; background:#fff; color:#111; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; font-size:.9rem; border:none; cursor:pointer; border-radius:0; text-decoration:none; transition:opacity .2s; }
  .btn-white:hover { opacity:.9; }
  .btn-gold { display:inline-flex; align-items:center; gap:.5rem; padding:.85rem 2rem; background:var(--ink); color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; font-size:.9rem; border:none; cursor:pointer; border-radius:0; text-decoration:none; transition:background .2s; }
  .btn-gold:hover { background:var(--ink-2); }
  .btn-outline-w { display:inline-flex; align-items:center; gap:.5rem; padding:.85rem 2rem; background:transparent; color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; font-size:.9rem; border:1.5px solid rgba(255,255,255,.4); cursor:pointer; border-radius:0; text-decoration:none; transition:background .2s; }
  .btn-outline-w:hover { background:rgba(255,255,255,.1); }
  .btn-outline-gold { display:inline-flex; align-items:center; gap:.5rem; padding:.75rem 1.5rem; background:var(--ink); color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; font-size:.875rem; border:1px solid var(--ink); cursor:pointer; border-radius:0; text-decoration:none; transition:background .2s; }
  .btn-outline-gold:hover { background:var(--ink-2); }
  :root { --gold: var(--warn); }
  .sticky-panel { height: 100vh !important; }
  @media(max-width:1023px){ .sticky-panel{ position:relative !important; height:60vw !important; } }
`;
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Menu, X, Scale, FileText, Search, DollarSign,
  MessageCircle, Users, Star, ArrowRight, CheckCircle, Zap
} from "lucide-react";

const LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/render/image/public/base44-prod/public/690e408daf48e0f633c6cf3a/5c0116596_LOGO2.png";

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
        background: "var(--white)",
        borderBottom: `1px solid ${scrolled ? "var(--ink-6)" : "transparent"}`,
        transition: "border-color 0.2s",
        padding: "0 5%",
        height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "var(--font-sans)",
      }}>
        {/* Logo text */}
        <Link to={createPageUrl("LandingPage")} style={{ display: "flex", alignItems: "center", textDecoration: "none", gap: 8 }}>
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: "italic", fontWeight: 700, fontSize: 20,
            color: "var(--ink)", letterSpacing: "-0.01em", lineHeight: 1.2,
          }}>
            Juris<span style={{ fontStyle: "normal", fontFamily: "var(--font-sans)", fontWeight: 600 }}>.IA</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, position: "absolute", left: "50%", transform: "translateX(-50%)" }}
          className="hide-mobile-nav">
          {navLinks.map(({ label, to }) => (
            <Link key={label} to={to} style={{
              color: "var(--ink-3)", fontSize: 13, fontWeight: 400, textDecoration: "none",
              fontFamily: "var(--font-sans)", transition: "color var(--duration)",
            }}
              onMouseEnter={e => e.target.style.color = "var(--ink)"}
              onMouseLeave={e => e.target.style.color = "var(--ink-3)"}
            >{label}</Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="hide-mobile-nav">
          <button onClick={login} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 400, color: "var(--ink-3)",
            padding: "8px 16px", transition: "color var(--duration)",
          }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--ink)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--ink-3)"}
          >Entrar</button>
          <button onClick={login} style={{
            background: "var(--ink)", color: "var(--white)", border: "none", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
            padding: "9px 20px", borderRadius: 0,
            transition: "background var(--duration)",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--ink-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--ink)"}
          >Começar grátis</button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="show-mobile-nav" style={{
          background: "none", border: "none", cursor: "pointer", padding: 8, color: "var(--ink)",
        }}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99,
          background: "var(--white)",
          borderTop: "1px solid var(--ink-6)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 24,
          paddingTop: 56,
          fontFamily: "var(--font-sans)",
        }}>
          {navLinks.map(({ label, to }) => (
            <Link key={label} to={to} onClick={() => setOpen(false)} style={{
              color: "var(--ink)", fontSize: "1.4rem", fontWeight: 600,
              textDecoration: "none", fontFamily: "var(--font-sans)",
            }}>{label}</Link>
          ))}
          <button onClick={login} style={{
            color: "var(--ink-3)", background: "none", border: "none",
            fontSize: "1rem", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 400,
          }}>Entrar</button>
          <button onClick={login} style={{
            background: "var(--ink)", color: "var(--white)", border: "none", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: "1rem", fontWeight: 500,
            padding: "12px 32px", borderRadius: 0,
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
    <footer style={{ background: "var(--ink)", padding: "48px 5% 28px", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "3rem", marginBottom: "3rem",
        }}>
          <div style={{ gridColumn: "span 2" }}>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic", fontWeight: 700, fontSize: 20,
              color: "var(--white)", marginBottom: "1rem", lineHeight: 1.2,
            }}>
              Juris<span style={{ fontStyle: "normal", fontFamily: "var(--font-sans)", fontWeight: 600 }}>.IA</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>
              A plataforma jurídica com inteligência artificial para advogados e escritórios modernos.
            </p>
          </div>
          {Object.entries(cols).map(([title, items]) => (
            <div key={title}>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.25rem" }}>{title}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map(({ label, to }) => (
                  <Link key={label} to={createPageUrl(to)} style={{
                    color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none",
                    transition: "color var(--duration)",
                  }}
                    onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.85)"}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.4)"}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0 }}>© 2025 Juris.IA. Todos os direitos reservados.</p>
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
    { text: "O Juris.IA transformou completamente minha rotina. Reduzi em 70% o tempo que gastava redigindo petições.", name: "Dra. Ana Lima" },
    { text: "A ferramenta de acompanhamento de processos é incrível. Nunca mais perdi um prazo desde que comecei a usar.", name: "Dr. Carlos Mendes" },
    { text: "O gerador de documentos com IA é impressionante. A qualidade das peças geradas é profissional e precisa.", name: "Dra. Fernanda Costa" },
  ];

  return (
    <div style={{ fontFamily: "var(--font-sans)", background: "var(--surface)", overflowX: "hidden" }}>
      <SiteNav />

      {/* ── HERO ──────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "120px 5% 80px",
        background: "var(--white)",
        borderBottom: "1px solid var(--ink-6)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 680, position: "relative" }}>

          {/* Label */}
          <p style={{
            fontSize: 9, fontWeight: 600, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--ink-4)",
            marginBottom: 24, fontFamily: "var(--font-sans)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <Zap size={11} style={{ color: "var(--ink-4)" }} />
            Plataforma Jurídica com IA
          </p>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2.2rem, 5vw, 3.75rem)",
            fontWeight: 700, lineHeight: 1.12, margin: "0 0 24px",
            letterSpacing: "-0.03em", color: "var(--ink)",
          }}>
            Advocacia mais inteligente.<br />
            <span style={{ fontStyle: "italic", fontWeight: 400 }}>Resultados que impressionam.</span>
          </h1>

          <p style={{
            fontSize: "clamp(0.9rem, 1.8vw, 1.05rem)", color: "var(--ink-3)",
            lineHeight: 1.7, margin: "0 auto 44px", maxWidth: 520,
            fontFamily: "var(--font-sans)",
          }}>
            Gerencie processos, gere documentos com IA e pesquise jurisprudência — tudo em uma única plataforma.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={login} style={{
              background: "var(--ink)", color: "var(--white)", border: "none", cursor: "pointer",
              fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
              padding: "12px 28px", borderRadius: 0,
              display: "inline-flex", alignItems: "center", gap: 8,
              transition: "background var(--duration)",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--ink-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--ink)"}
            >
              Começar grátis <ArrowRight size={14} />
            </button>
            <Link to={createPageUrl("Funcionalidades")} style={{
              background: "transparent", color: "var(--ink-2)", textDecoration: "none",
              fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 400,
              padding: "11px 24px", borderRadius: 0,
              border: "1px solid var(--ink-5)",
              display: "inline-flex", alignItems: "center", gap: 8,
              transition: "border-color var(--duration), color var(--duration)",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--ink-3)"; e.currentTarget.style.color = "var(--ink)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--ink-5)"; e.currentTarget.style.color = "var(--ink-2)"; }}
            >
              Ver demonstração
            </Link>
          </div>

          {/* Trust indicators */}
          <div style={{ marginTop: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            {["Sem cartão de crédito", "7 dias grátis", "Cancele quando quiser"].map((item, i) => (
              <span key={item} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-4)", fontSize: 12 }}>
                <CheckCircle size={12} color="var(--ok)" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── MÉTRICAS ──────────────────────────────── */}
      <section style={{ background: "var(--ink)", padding: "0 5%" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          background: "rgba(255,255,255,0.04)",
          gap: 1,
        }}>
          {metrics.map(({ value, label }, i) => (
            <div key={label} style={{
              padding: "40px 24px",
              textAlign: "center",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none",
            }}>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(2rem, 3.5vw, 2.75rem)", fontWeight: 600,
                color: "var(--white)", lineHeight: 1, marginBottom: 8,
                letterSpacing: "-0.03em",
              }}>{value}</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FUNCIONALIDADES ───────────────────────── */}
      <section style={{ padding: "80px 5%", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 12, fontFamily: "var(--font-sans)" }}>Funcionalidades</p>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(1.6rem, 3vw, 2.5rem)", fontWeight: 600,
              color: "var(--ink)", margin: 0, maxWidth: 540, lineHeight: 1.2, letterSpacing: "-0.02em",
            }}>
              Para cada desafio jurídico, uma solução inteligente
            </h2>
          </div>

          {/* Grid with 1px gap (Dashboard style) */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 1, background: "var(--ink-6)",
            border: "1px solid var(--ink-6)",
          }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{
                background: "var(--white)",
                padding: "28px 24px",
                transition: "background var(--duration)",
                cursor: "default",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--ink-7)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--white)"}
              >
                <div style={{
                  width: 36, height: 36,
                  background: "var(--ink-7)", border: "1px solid var(--ink-6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16,
                }}>
                  <Icon size={16} color="var(--ink-3)" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: "0 0 8px", fontFamily: "var(--font-sans)" }}>{title}</h3>
                <p style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.65, margin: 0, fontFamily: "var(--font-sans)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ───────────────────────────── */}
      <section style={{ padding: "80px 5%", background: "var(--white)", borderTop: "1px solid var(--ink-6)", borderBottom: "1px solid var(--ink-6)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 12 }}>Depoimentos</p>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(1.6rem, 3vw, 2.5rem)", fontWeight: 600,
              color: "var(--ink)", margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em",
            }}>
              O que nossos usuários dizem
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 1, background: "var(--ink-6)",
            border: "1px solid var(--ink-6)",
          }}>
            {testimonials.map(({ text, name }) => (
              <div key={name} style={{
                background: "var(--white)", padding: "28px 24px",
                transition: "background var(--duration)",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--ink-7)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--white)"}
              >
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="var(--warn)" color="var(--warn)" />)}
                </div>
                <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7, margin: "0 0 20px", fontFamily: "var(--font-sans)", fontStyle: "italic" }}>
                  "{text}"
                </p>
                <div style={{ borderTop: "1px solid var(--ink-6)", paddingTop: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", margin: "0 0 2px" }}>{name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────── */}
      <section style={{
        padding: "80px 5%",
        background: "var(--ink)",
        textAlign: "center",
        fontFamily: "var(--font-sans)",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>Comece agora</p>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(1.6rem, 3vw, 2.5rem)", fontWeight: 600,
            color: "var(--white)", margin: "0 0 16px", lineHeight: 1.2, letterSpacing: "-0.02em",
          }}>
            Pronto para transformar seu escritório?
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 36px", lineHeight: 1.7 }}>
            Comece hoje mesmo com 7 dias de acesso completo. Sem cartão de crédito.
          </p>
          <button onClick={login} style={{
            background: "var(--white)", color: "var(--ink)", border: "none", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
            padding: "12px 32px", borderRadius: 0,
            display: "inline-flex", alignItems: "center", gap: 8,
            transition: "opacity var(--duration)",
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Começar agora — é grátis <ArrowRight size={14} />
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
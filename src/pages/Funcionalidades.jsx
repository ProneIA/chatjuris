import React, { useEffect, useRef } from "react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PublicNav, PublicFooter, publicStyles } from "@/components/landing/PublicLayout";
import { Sparkles, FileText, FolderOpen, Users, CheckSquare, CalendarDays, BookOpen, Zap, Shield, Search } from "lucide-react";

const features = [
  { icon: Sparkles, num: "01", title: "Assistente IA Jurídico", text: "Inteligência artificial especializada em direito brasileiro. Tire dúvidas, pesquise jurisprudência e receba orientações em segundos.", highlight: true },
  { icon: FileText, num: "02", title: "LEXIA — Análise de Docs", text: "Envie contratos e petições para análise automática. Identifique riscos e receba sugestões de melhoria." },
  { icon: FolderOpen, num: "03", title: "Gestão de Processos", text: "Organize todos os seus casos. Acompanhe prazos, andamentos e nunca perca uma deadline." },
  { icon: Users, num: "04", title: "Cadastro de Clientes", text: "Mantenha informações de clientes organizadas. Histórico completo de atendimentos e documentos." },
  { icon: CheckSquare, num: "05", title: "Gestão de Tarefas", text: "Crie e acompanhe tarefas. Defina prioridades, prazos e responsáveis para cada atividade." },
  { icon: CalendarDays, num: "06", title: "Calendário Inteligente", text: "Agenda integrada com lembretes automáticos. Nunca mais perca uma audiência ou prazo processual." },
  { icon: BookOpen, num: "07", title: "Pesquisa de Jurisprudência", text: "Busque decisões de tribunais de forma rápida. Encontre precedentes relevantes para seus casos." },
  { icon: Zap, num: "08", title: "Gerador de Documentos", text: "Biblioteca de modelos de petições, contratos e documentos jurídicos prontos para personalizar." },
  { icon: Users, num: "09", title: "Trabalho em Equipe", text: "Colabore com sua equipe em tempo real. Compartilhe casos, documentos e tarefas com segurança." },
];

const highlights = [
  { icon: Zap, title: "Rápido e Eficiente", text: "Economize horas de trabalho com automação inteligente de tarefas repetitivas." },
  { icon: Shield, title: "Seguro e Confiável", text: "Seus dados protegidos com criptografia e infraestrutura de nível empresarial." },
  { icon: Search, title: "IA Especializada", text: "Inteligência artificial treinada especificamente para o direito brasileiro." },
];

export default function Funcionalidades() {
  const handleLogin = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); observerRef.current.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".pub-fade-up, .pub-fade-in").forEach((el) => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div style={{ overflowX: "hidden", WebkitFontSmoothing: "antialiased", background: "#fff" }}>
      <style>{publicStyles}{`
        .feat-card { border: 1px solid #e5e5e5; padding: 2rem; transition: all 0.3s; }
        .feat-card:hover { border-color: var(--primary); background: #fafafa; }
        .feat-card.highlight { background: #0a0a0a; border-color: #0a0a0a; }
      `}</style>
      <PublicNav />

      {/* Hero */}
      <section style={{ position: "relative", paddingTop: "64px", minHeight: "65vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80&auto=format&fit=crop"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.2)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.7) 140%)" }} />

        <div style={{ position: "relative", zIndex: 2, padding: "5rem 2.5rem", maxWidth: "900px", margin: "0 auto" }}>
          <p className="pub-label pub-fade-in" style={{ marginBottom: "1.5rem" }}>✦ Funcionalidades</p>
          <h1 className="pub-font pub-fade-up"
            style={{ fontSize: "clamp(3rem, 8vw, 6rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1, color: "#fff", margin: "0 0 1.5rem" }}>
            Tudo Que<br />
            <span style={{ WebkitTextStroke: "1px #fff", color: "transparent" }}>Você Precisa</span><br />
            <span style={{ color: "var(--primary)" }}>Num Só Lugar.</span>
          </h1>
          <p className="pub-fade-up pub-delay-1" style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.1rem", maxWidth: "500px", lineHeight: 1.7, marginBottom: "2rem" }}>
            Ferramentas poderosas de IA combinadas com gestão completa do escritório em uma única plataforma.
          </p>
          <button onClick={handleLogin} className="pub-btn-dark pub-fade-up pub-delay-2">
            Começar Teste Grátis
          </button>
        </div>
      </section>

      {/* Features grid */}
      <section style={{ padding: "7rem 2.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "3rem" }}>
          <h2 className="pub-font pub-fade-up" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", color: "#0a0a0a", margin: 0 }}>
            09 Ferramentas<br />Poderosas.
          </h2>
          <p className="pub-fade-up pub-delay-1" style={{ color: "rgba(0,0,0,0.5)", maxWidth: "280px", lineHeight: 1.7, fontSize: "0.95rem" }}>
            Cada funcionalidade foi pensada para resolver um problema real da rotina jurídica.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1px", background: "#e5e5e5" }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.num} className={`feat-card pub-fade-up${f.highlight ? " highlight" : ""}`} style={{ transitionDelay: `${(i % 3) * 100}ms`, background: f.highlight ? "#0a0a0a" : "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                  <Icon style={{ width: 28, height: 28, color: f.highlight ? "var(--primary)" : "#555" }} />
                  <span className="pub-font" style={{ fontSize: "0.65rem", color: f.highlight ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)", fontWeight: 600, letterSpacing: "0.1em" }}>{f.num}</span>
                </div>
                <h3 className="pub-font" style={{ fontSize: "1rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: f.highlight ? "#fff" : "#0a0a0a", marginBottom: "0.75rem" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: f.highlight ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)", lineHeight: 1.7 }}>{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Highlights — dark */}
      <section style={{ background: "#121212", padding: "7rem 2.5rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px", opacity: 0.03 }} />
        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p className="pub-label pub-fade-in" style={{ marginBottom: "1rem" }}>Por que o Juris?</p>
          <h2 className="pub-font pub-fade-up" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", color: "#fff", marginBottom: "4rem" }}>
            Três Razões<br />Para Escolher.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1px", background: "rgba(255,255,255,0.05)" }}>
            {highlights.map((h, i) => {
              const Icon = h.icon;
              return (
                <div key={h.title} className="pub-fade-up" style={{ transitionDelay: `${i * 100}ms`, padding: "3rem 2.5rem", background: "#121212" }}>
                  <div style={{ width: 48, height: 48, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                    <Icon style={{ width: 22, height: 22, color: "#000" }} />
                  </div>
                  <h3 className="pub-font" style={{ fontSize: "1.1rem", fontWeight: 600, textTransform: "uppercase", color: "#fff", marginBottom: "0.75rem" }}>{h.title}</h3>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", lineHeight: 1.7 }}>{h.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "460px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1600&q=80&auto=format&fit=crop"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(200,168,75,0.88)", mixBlendMode: "multiply" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "4rem 2rem" }}>
          <h2 className="pub-font pub-fade-up" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", color: "#fff", lineHeight: 1, marginBottom: "1.5rem" }}>
            Experimente<br />Gratuitamente.
          </h2>
          <p className="pub-fade-up pub-delay-1" style={{ color: "rgba(255,255,255,0.8)", marginBottom: "2rem" }}>
            7 dias grátis. Sem cartão de crédito.
          </p>
          <div className="pub-fade-up pub-delay-2" style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleLogin} style={{ display: "inline-flex", alignItems: "center", padding: "0.9rem 2rem", background: "#fff", color: "#000", fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "pointer", borderRadius: 0, transition: "background 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#000"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}>
              Criar Conta Grátis
            </button>
            <Link to={createPageUrl("Pricing")} style={{ display: "inline-flex", alignItems: "center", padding: "0.9rem 2rem", background: "transparent", color: "#fff", fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", border: "2px solid #fff", borderRadius: 0, textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#fff"; }}>
              Ver Planos
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { PublicNav, PublicFooter, publicStyles } from "@/components/landing/PublicLayout";

export default function QuemSomos() {
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

  const values = [
    { num: "01", title: "Foco no Cliente", text: "Desenvolvemos soluções pensadas nas necessidades reais dos advogados brasileiros." },
    { num: "02", title: "Inovação", text: "Utilizamos as mais avançadas tecnologias de IA disponíveis no mercado." },
    { num: "03", title: "Colaboração", text: "Facilitamos o trabalho em equipe com ferramentas modernas e seguras." },
    { num: "04", title: "Excelência", text: "Comprometidos com a qualidade em cada detalhe da plataforma." },
  ];

  return (
    <div style={{ overflowX: "hidden", WebkitFontSmoothing: "antialiased", background: "#fff" }}>
      <style>{publicStyles}</style>
      <PublicNav />

      {/* Hero */}
      <section style={{ position: "relative", paddingTop: "64px", minHeight: "70vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600&q=80&auto=format&fit=crop"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.2)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.7) 140%)" }} />

        <div style={{ position: "relative", zIndex: 2, padding: "5rem 2.5rem", maxWidth: "900px", margin: "0 auto" }}>
          <p className="pub-label pub-fade-in" style={{ marginBottom: "1.5rem" }}>✦ Sobre Nós</p>
          <h1 className="pub-font pub-fade-up"
            style={{ fontSize: "clamp(3rem, 8vw, 6rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1, color: "#fff", margin: "0 0 1.5rem" }}>
            A Plataforma<br />
            <span style={{ WebkitTextStroke: "1px #fff", color: "transparent" }}>Jurídica do</span><br />
            <span style={{ color: "var(--primary)" }}>Futuro.</span>
          </h1>
          <p className="pub-fade-up pub-delay-1" style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.1rem", maxWidth: "520px", lineHeight: 1.7 }}>
            Somos uma equipe apaixonada por tecnologia e direito, dedicada a criar ferramentas que simplificam o trabalho jurídico.
          </p>
        </div>
      </section>

      {/* Missão */}
      <section style={{ padding: "7rem 2.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "5rem", alignItems: "center" }}>
          <div>
            <p className="pub-label pub-fade-in" style={{ marginBottom: "1rem" }}>Nossa Missão</p>
            <div style={{ height: 1, background: "#e5e5e5", marginBottom: "2rem" }} />
            <h2 className="pub-font pub-fade-up" style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1.05, color: "#0a0a0a", margin: "0 0 1.5rem" }}>
              Democratizar<br />a Tecnologia<br />Jurídica.
            </h2>
            <p className="pub-fade-up pub-delay-1" style={{ color: "rgba(0,0,0,0.6)", lineHeight: 1.8, marginBottom: "1rem" }}>
              Permitir que advogados de todos os portes aumentem sua produtividade e ofereçam serviços de maior qualidade aos seus clientes.
            </p>
            <p className="pub-fade-up pub-delay-2" style={{ color: "rgba(0,0,0,0.6)", lineHeight: 1.8 }}>
              Acreditamos que a inteligência artificial pode ser uma aliada poderosa na prática jurídica, automatizando tarefas repetitivas.
            </p>
          </div>

          {/* Values grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "#e5e5e5" }}>
            {values.map((v, i) => (
              <div key={v.num} className="pub-fade-up" style={{ transitionDelay: `${i * 100}ms`, background: "#fff", padding: "2rem" }}>
                <div className="pub-font" style={{ fontSize: "2.5rem", fontWeight: 700, color: "rgba(0,0,0,0.1)", lineHeight: 1, marginBottom: "0.5rem" }}>{v.num}</div>
                <div className="pub-font" style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#0a0a0a", marginBottom: "0.5rem" }}>{v.title}</div>
                <div style={{ fontSize: "0.85rem", color: "rgba(0,0,0,0.55)", lineHeight: 1.6 }}>{v.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* História — dark section */}
      <section style={{ background: "#121212", padding: "7rem 2.5rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px", opacity: 0.03 }} />
        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p className="pub-label pub-fade-in" style={{ marginBottom: "1rem" }}>Nossa História</p>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: "2rem" }} />
          <h2 className="pub-font pub-fade-up" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.05, marginBottom: "2.5rem" }}>
            Nascida da<br />Vivência Real<br />na Advocacia.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {[
              "A JURIS nasceu da vivência real na advocacia.",
              "Como estudante de Direito e estagiário em escritórios, percebi que muitos profissionais perdiam tempo com tarefas operacionais e sistemas pouco eficientes, quando deveriam estar focados em estratégia, clientes e crescimento.",
              "Dessa inquietação surgiu a JURIS: uma plataforma criada a partir da prática, unindo tecnologia, inteligência artificial e conhecimento jurídico para transformar a rotina do advogado brasileiro."
            ].map((p, i) => (
              <p key={i} className="pub-fade-up" style={{ transitionDelay: `${i * 100}ms`, color: "rgba(255,255,255,0.6)", lineHeight: 1.8, fontSize: "1rem", margin: 0 }}>{p}</p>
            ))}
          </div>
          <div style={{ marginTop: "3rem", height: 3, background: "var(--primary)", width: "4rem" }} />
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "480px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&q=80&auto=format&fit=crop"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(200,168,75,0.88)", mixBlendMode: "multiply" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "4rem 2rem" }}>
          <h2 className="pub-font pub-fade-up" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", color: "#fff", lineHeight: 1, marginBottom: "1.5rem" }}>
            Comece Sua<br />Transformação Hoje.
          </h2>
          <p className="pub-fade-up pub-delay-1" style={{ color: "rgba(255,255,255,0.8)", fontSize: "1rem", marginBottom: "2rem" }}>
            Teste grátis por 7 dias. Sem cartão de crédito.
          </p>
          <button onClick={handleLogin} className="pub-fade-up pub-delay-2 pub-btn-dark" style={{ background: "#fff", color: "#000" }}
            onMouseEnter={e => e.currentTarget.style.background = "#0a0a0a"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            Começar Gratuitamente
          </button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
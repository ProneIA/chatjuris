import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { PublicNav, PublicFooter, publicStyles } from "@/components/landing/PublicLayout";

const contacts = [
  { icon: Mail, num: "01", title: "Email", sub: "Resposta em até 24 horas úteis", value: "juris.ia.tech@gmail.com", href: "mailto:juris.ia.tech@gmail.com" },
  { icon: Phone, num: "02", title: "Telefone", sub: "Segunda a Sexta, 9h às 18h", value: "(86) 99993-1754", href: "tel:+5586999931754" },
  { icon: Clock, num: "03", title: "Horário", sub: "Atendimento presencial", value: "Seg — Sex: 9h às 18h", href: null },
  { icon: MapPin, num: "04", title: "Localização", sub: "Brasil", value: "Piripiri, PI", href: null },
];

export default function ContactPublic() {
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
        .contact-card { border: 1px solid #e5e5e5; padding: 2.5rem; transition: border-color 0.3s; }
        .contact-card:hover { border-color: var(--primary); }
      `}</style>
      <PublicNav />

      {/* Hero */}
      <section style={{ position: "relative", paddingTop: "64px", minHeight: "55vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1600&q=80&auto=format&fit=crop"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.2)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.7) 140%)" }} />

        <div style={{ position: "relative", zIndex: 2, padding: "5rem 2.5rem", maxWidth: "900px", margin: "0 auto" }}>
          <p className="pub-label pub-fade-in" style={{ marginBottom: "1.5rem" }}>✦ Fale Conosco</p>
          <h1 className="pub-font pub-fade-up"
            style={{ fontSize: "clamp(3rem, 8vw, 6rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1, color: "#fff", margin: "0 0 1.5rem" }}>
            Entre em<br />
            <span style={{ WebkitTextStroke: "1px #fff", color: "transparent" }}>Contato.</span>
          </h1>
          <p className="pub-fade-up pub-delay-1" style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.1rem", maxWidth: "460px", lineHeight: 1.7 }}>
            Estamos aqui para ajudar. Entre em contato através dos canais abaixo.
          </p>
        </div>
      </section>

      {/* Contacts grid */}
      <section style={{ padding: "7rem 2.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1px", background: "#e5e5e5" }}>
          {contacts.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={c.num} className="contact-card pub-fade-up" style={{ transitionDelay: `${i * 100}ms`, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                  <div style={{ width: 44, height: 44, border: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon style={{ width: 20, height: 20, color: "#555" }} />
                  </div>
                  <span className="pub-font" style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.2)", fontWeight: 600, letterSpacing: "0.1em" }}>{c.num}</span>
                </div>
                <h3 className="pub-font" style={{ fontSize: "1rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#0a0a0a", marginBottom: "0.4rem" }}>{c.title}</h3>
                <p style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.4)", marginBottom: "0.75rem" }}>{c.sub}</p>
                {c.href ? (
                  <a href={c.href} style={{ color: "#0a0a0a", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => e.target.style.color = "var(--primary)"}
                    onMouseLeave={e => e.target.style.color = "#0a0a0a"}>{c.value}</a>
                ) : (
                  <p style={{ color: "#0a0a0a", fontWeight: 600, fontSize: "0.95rem", margin: 0 }}>{c.value}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA box */}
        <div className="pub-fade-up" style={{ marginTop: "1px", background: "#0a0a0a", padding: "4rem", textAlign: "center" }}>
          <p className="pub-label" style={{ marginBottom: "1.5rem" }}>✦ Pronto para Começar</p>
          <h3 className="pub-font" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#fff", marginBottom: "1rem" }}>
            Transforme sua Prática Jurídica.
          </h3>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem", fontSize: "0.95rem" }}>
            Crie sua conta e comece a usar a IA jurídica mais avançada do Brasil.
          </p>
          <Link to={createPageUrl("Pricing")}
            style={{ display: "inline-flex", alignItems: "center", padding: "0.9rem 2.5rem", background: "var(--primary)", color: "#000", fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", textDecoration: "none", borderRadius: 0, transition: "background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#fff"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--primary)"}>
            Criar Conta Grátis
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { SITE_CSS, SiteNav, SiteFooter } from "@/components/landing/PublicLayout";

const contacts = [
  { icon:Mail, num:"01", title:"Email", sub:"Resposta em até 24 horas úteis", value:"juris.ia.tech@gmail.com", href:"mailto:juris.ia.tech@gmail.com" },
  { icon:Phone, num:"02", title:"Telefone", sub:"Segunda a Sexta, 9h às 18h", value:"(86) 99993-1754", href:"tel:+5586999931754" },
  { icon:Clock, num:"03", title:"Horário", sub:"Atendimento", value:"Seg — Sex: 9h às 18h", href:null },
  { icon:MapPin, num:"04", title:"Localização", sub:"Brasil", value:"Piripiri, PI", href:null },
];

export default function ContactPublic() {
  const obs = useRef(null);

  useEffect(() => {
    obs.current = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("v"); obs.current.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".fu,.fi").forEach((el) => obs.current.observe(el));
    return () => obs.current?.disconnect();
  }, []);

  return (
    <div style={{ overflowX:"hidden", WebkitFontSmoothing:"antialiased" }}>
      <style>{SITE_CSS}</style>
      <SiteNav blend />

      {/* HERO */}
      <section style={{ position:"relative", height:"100vh", minHeight:"600px", display:"flex", alignItems:"center", overflow:"hidden" }}>
        <img src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1920&q=80&auto=format&fit=crop" alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", filter:"grayscale(1) contrast(1.2)" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.72)" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle, transparent 50%, rgba(0,0,0,.8) 150%)" }} />

        <div style={{ position:"relative", zIndex:2, padding:"0 2.5rem", maxWidth:"900px", marginLeft:"auto", marginRight:"auto" }}>
          <p className="lbl fi" style={{ marginBottom:"1.5rem" }}>✦ Fale Conosco</p>
          <h1 className="D fu" style={{ fontSize:"clamp(3.5rem,10vw,7rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"#fff", margin:"0 0 1.5rem" }}>
            Entre em<br /><span className="outline-w">Contato.</span>
          </h1>
          <p className="fu d1" style={{ color:"rgba(255,255,255,.75)", fontSize:"1.1rem", maxWidth:"460px", lineHeight:1.7 }}>
            Estamos aqui para ajudar. Entre em contato através dos canais abaixo.
          </p>
        </div>
      </section>

      {/* CONTACT GRID — pillar-style cards */}
      <section style={{ padding:"7rem 2.5rem", background:"var(--bg)" }}>
        <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"2rem", alignItems:"flex-end", marginBottom:"4rem" }}>
            <h2 className="D fu" style={{ fontSize:"clamp(3rem,6vw,5rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", color:"#fff", margin:0 }}>
              Nossos<br />Canais.
            </h2>
            <p className="fu d1" style={{ color:"var(--text-muted)", maxWidth:"280px", lineHeight:1.7, fontSize:".95rem", fontFamily:"'Helvetica Neue',Arial,sans-serif", fontWeight:500 }}>
              Escolha a forma que prefere para entrar em contato com nossa equipe.
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:"1rem" }}>
            {contacts.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={c.num} className="fu" style={{ transitionDelay:`${i*100}ms`, background:"var(--surface)", padding:"2.5rem", border:"1px solid var(--border)", transition:"border-color .3s" }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor="var(--primary)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,.1)"; }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem" }}>
                    <div style={{ width:44, height:44, border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Icon style={{ width:20, height:20, color:"var(--primary)" }} />
                    </div>
                    <span className="D" style={{ fontSize:".65rem", color:"rgba(255,255,255,.15)", fontWeight:600, letterSpacing:".1em" }}>{c.num}</span>
                  </div>
                  <h3 className="D" style={{ fontSize:"1rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", color:"#fff", marginBottom:".3rem" }}>{c.title}</h3>
                  <p style={{ fontSize:".8rem", color:"var(--text-muted)", marginBottom:".75rem", fontFamily:"'Helvetica Neue',Arial,sans-serif" }}>{c.sub}</p>
                  {c.href
                    ? <a href={c.href} className="D" style={{ color:"#fff", fontWeight:600, fontSize:".95rem", textDecoration:"none", transition:"color .3s" }}
                        onMouseEnter={e=>e.target.style.color="var(--primary)"}
                        onMouseLeave={e=>e.target.style.color="#fff"}>{c.value}</a>
                    : <p className="D" style={{ color:"#fff", fontWeight:600, fontSize:".95rem", margin:0 }}>{c.value}</p>
                  }
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA block — dark */}
      <section style={{ background:"#121212", position:"relative", overflow:"hidden", padding:"7rem 2.5rem" }}>
        <div className="grid-bg" style={{ position:"absolute", inset:0 }} />
        <div style={{ maxWidth:"900px", margin:"0 auto", position:"relative", zIndex:1, textAlign:"center" }}>
          <p className="lbl fi" style={{ marginBottom:"1.5rem" }}>✦ Pronto para Começar</p>
          <h2 className="D fu" style={{ fontSize:"clamp(3rem,7vw,5rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"#fff", marginBottom:"1.5rem" }}>
            Transforme Sua<br />Prática Jurídica.
          </h2>
          <p className="fu d1" style={{ color:"rgba(255,255,255,.5)", maxWidth:"460px", margin:"0 auto 2.5rem", lineHeight:1.7 }}>
            Crie sua conta e comece a usar a IA jurídica mais avançada do Brasil.
          </p>
          <Link to={createPageUrl("Pricing")} className="btn-gold fu d2">Criar Conta Grátis</Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
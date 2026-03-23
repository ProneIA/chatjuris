import React, { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { SITE_CSS, SiteNav, SiteFooter } from "@/components/landing/PublicLayout";

export default function QuemSomos() {
  const login = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  const obs = useRef(null);

  useEffect(() => {
    obs.current = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("v"); obs.current.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".fu,.fi").forEach((el) => obs.current.observe(el));
    return () => obs.current?.disconnect();
  }, []);

  const values = [
    { num:"01", title:"Foco no Cliente", text:"Desenvolvemos soluções pensadas nas necessidades reais dos advogados brasileiros." },
    { num:"02", title:"Inovação", text:"Utilizamos as mais avançadas tecnologias de IA disponíveis no mercado." },
    { num:"03", title:"Colaboração", text:"Facilitamos o trabalho em equipe com ferramentas modernas e seguras." },
    { num:"04", title:"Excelência", text:"Comprometidos com a qualidade em cada detalhe da plataforma." },
  ];

  return (
    <div style={{ overflowX:"hidden", WebkitFontSmoothing:"antialiased" }}>
      <style>{SITE_CSS}</style>
      <SiteNav blend />

      {/* HERO */}
      <section style={{ position:"relative", height:"100vh", minHeight:"600px", display:"flex", alignItems:"center", overflow:"hidden" }}>
        <img src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1920&q=80&auto=format&fit=crop" alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", filter:"grayscale(1) contrast(1.2)" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.72)" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle, transparent 50%, rgba(0,0,0,.8) 150%)" }} />

        <div style={{ position:"relative", zIndex:2, padding:"0 2.5rem", maxWidth:"900px", marginLeft:"auto", marginRight:"auto" }}>
          <p className="lbl fi" style={{ marginBottom:"1.5rem" }}>✦ Sobre Nós</p>
          <h1 className="D fu" style={{ fontSize:"clamp(3.5rem,10vw,7rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"#fff", margin:"0 0 1.5rem" }}>
            A Plataforma<br /><span className="outline-w">Jurídica do</span><br /><span style={{ color:"var(--gold)" }}>Futuro.</span>
          </h1>
          <p className="fu d1" style={{ color:"rgba(255,255,255,.75)", fontSize:"1.1rem", maxWidth:"520px", lineHeight:1.7 }}>
            Somos uma equipe apaixonada por tecnologia e direito, dedicada a criar ferramentas que simplificam o trabalho jurídico.
          </p>
        </div>
      </section>

      {/* STICKY SCROLL — Missão */}
      <section style={{ display:"flex", flexWrap:"wrap" }}>
        {/* Sticky image */}
        <div style={{ width:"100%", flex:"0 0 50%" }} className="sticky-panel hidden lg:block">
          <div style={{ position:"sticky", top:0, height:"100vh", overflow:"hidden" }}>
            <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80&auto=format&fit=crop" alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover", filter:"grayscale(1)" }} />
            <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:"var(--primary)" }} />
          </div>
        </div>

        {/* Narrative */}
        <div style={{ flex:"1 1 50%", padding:"8rem 4rem 8rem 5rem", display:"flex", flexDirection:"column", gap:"8rem" }}>
          <div className="fu">
            <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1rem" }}>
              <span className="lbl">Nossa Missão</span>
              <div style={{ flex:1, height:1, background:"rgba(0,0,0,.15)" }} />
            </div>
            <h3 className="D" style={{ fontSize:"clamp(2.5rem,5vw,4rem)", fontWeight:600, letterSpacing:"-0.03em", textTransform:"uppercase", lineHeight:1.05, marginBottom:"1.5rem", color:"#fff" }}>
              Democratizar<br />a Tecnologia<br />Jurídica.
            </h3>
            <p style={{ color:"rgba(0,0,0,.65)", lineHeight:1.8, fontSize:"1rem", maxWidth:"480px", marginBottom:"1rem" }}>
              Permitir que advogados de todos os portes aumentem sua produtividade e ofereçam serviços de maior qualidade aos seus clientes.
            </p>
            <p style={{ color:"rgba(0,0,0,.65)", lineHeight:1.8, fontSize:"1rem", maxWidth:"480px" }}>
              Acreditamos que a inteligência artificial pode ser uma aliada poderosa na prática jurídica, automatizando tarefas repetitivas.
            </p>
          </div>

          <div className="fu">
            <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1rem" }}>
              <span className="lbl">Nossa História</span>
              <div style={{ flex:1, height:1, background:"rgba(0,0,0,.15)" }} />
            </div>
            <div style={{ background:"#0a0a0a", padding:"3rem" }}>
              <p className="D" style={{ fontSize:"clamp(1.8rem,4vw,2.8rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.02em", lineHeight:1.15, color:"#fff", marginBottom:"2rem" }}>
                "Nascida da vivência real na advocacia."
              </p>
              <p style={{ color:"rgba(255,255,255,.5)", fontSize:".875rem", lineHeight:1.8, marginBottom:"1rem" }}>
                Como estudante de Direito e estagiário em escritórios, percebi que muitos profissionais perdiam tempo com tarefas operacionais quando deveriam estar focados em estratégia, clientes e crescimento.
              </p>
              <p style={{ color:"rgba(255,255,255,.5)", fontSize:".875rem", lineHeight:1.8, marginBottom:"1.5rem" }}>
                Dessa inquietação surgiu a JURIS: unindo tecnologia, IA e conhecimento jurídico para transformar a rotina do advogado brasileiro.
              </p>
              <div style={{ height:3, background:"var(--gold)", width:"4rem" }} />
            </div>
          </div>
        </div>
      </section>

      {/* VALORES — pillar cards */}
      <section style={{ background:"#121212", position:"relative", overflow:"hidden", padding:"7rem 2.5rem" }}>
        <div className="grid-bg" style={{ position:"absolute", inset:0 }} />
        <div style={{ maxWidth:"1200px", margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"2rem", alignItems:"flex-end", marginBottom:"4rem" }}>
            <h2 className="D fu" style={{ fontSize:"clamp(3rem,7vw,5.5rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"#fff", flex:"1 1 400px", margin:0 }}>
              Nossos<br />Valores
            </h2>
            <p className="fu d1" style={{ color:"rgba(255,255,255,.5)", maxWidth:"300px", lineHeight:1.7, fontSize:".95rem" }}>
              Os pilares que guiam cada decisão que tomamos na construção da plataforma.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:"1px" }}>
            {values.map((v, i) => (
              <div key={v.num} className={`pillar fu d${Math.min(i,4)}`}>
                <div className="p-num">{v.num}</div>
                <div className="p-title">{v.title}</div>
                <div className="p-txt">{v.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position:"relative", overflow:"hidden", minHeight:"480px", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <img src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80&auto=format&fit=crop" alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", filter:"grayscale(1)" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(200,168,75,.9)", mixBlendMode:"multiply" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.55)" }} />
        <div style={{ position:"relative", zIndex:2, textAlign:"center", padding:"5rem 2rem", maxWidth:"700px" }}>
          <p className="lbl fi" style={{ color:"rgba(255,255,255,.8)", marginBottom:"1.5rem" }}>✦ Comece Agora</p>
          <h2 className="D fu" style={{ fontSize:"clamp(3rem,8vw,5rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"#fff", marginBottom:"1.5rem" }}>
            Comece Sua<br />Transformação Hoje.
          </h2>
          <p className="fu d1" style={{ color:"rgba(255,255,255,.8)", marginBottom:"2rem" }}>Teste grátis por 7 dias. Sem cartão de crédito.</p>
          <button onClick={login} className="btn-white fu d2">Começar Gratuitamente</button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
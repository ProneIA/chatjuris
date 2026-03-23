import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { SITE_CSS, SiteNav, SiteFooter } from "@/components/landing/PublicLayout";
import { Sparkles, FileText, FolderOpen, Users, CheckSquare, CalendarDays, BookOpen, Zap, Shield, Search } from "lucide-react";

const features = [
  { icon:Sparkles, num:"01", title:"Assistente IA Jurídico", text:"IA especializada em direito brasileiro. Tire dúvidas, pesquise jurisprudência e receba orientações em segundos.", dark:true },
  { icon:FileText, num:"02", title:"LEXIA — Análise de Docs", text:"Envie contratos e petições para análise automática. Identifique riscos e receba sugestões de melhoria." },
  { icon:FolderOpen, num:"03", title:"Gestão de Processos", text:"Organize todos os seus casos. Acompanhe prazos, andamentos e nunca perca uma deadline." },
  { icon:Users, num:"04", title:"Cadastro de Clientes", text:"Mantenha informações de clientes organizadas. Histórico completo de atendimentos e documentos." },
  { icon:CheckSquare, num:"05", title:"Gestão de Tarefas", text:"Crie e acompanhe tarefas. Defina prioridades, prazos e responsáveis para cada atividade." },
  { icon:CalendarDays, num:"06", title:"Calendário Inteligente", text:"Agenda integrada com lembretes automáticos. Nunca mais perca uma audiência ou prazo processual." },
  { icon:BookOpen, num:"07", title:"Pesquisa de Jurisprudência", text:"Busque decisões de tribunais de forma rápida. Encontre precedentes relevantes para seus casos." },
  { icon:Zap, num:"08", title:"Gerador de Documentos", text:"Biblioteca de modelos de petições, contratos e documentos jurídicos prontos para personalizar." },
  { icon:Users, num:"09", title:"Trabalho em Equipe", text:"Colabore com sua equipe em tempo real. Compartilhe casos, documentos e tarefas com segurança." },
];

const highlights = [
  { icon:Zap, num:"01", title:"Rápido e Eficiente", text:"Economize horas de trabalho com automação inteligente de tarefas repetitivas." },
  { icon:Shield, num:"02", title:"Seguro e Confiável", text:"Seus dados protegidos com criptografia e infraestrutura de nível empresarial." },
  { icon:Search, num:"03", title:"IA Especializada", text:"Inteligência artificial treinada especificamente para o direito brasileiro." },
];

export default function Funcionalidades() {
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

  return (
    <div style={{ overflowX:"hidden", WebkitFontSmoothing:"antialiased" }}>
      <style>{SITE_CSS}</style>
      <SiteNav blend />

      {/* HERO */}
      <section style={{ position:"relative", height:"100vh", minHeight:"600px", display:"flex", alignItems:"center", overflow:"hidden" }}>
        <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80&auto=format&fit=crop" alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", filter:"grayscale(1) contrast(1.2)" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.72)" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle, transparent 50%, rgba(0,0,0,.8) 150%)" }} />

        <div style={{ position:"relative", zIndex:2, padding:"0 2.5rem", maxWidth:"900px", marginLeft:"auto", marginRight:"auto" }}>
          <p className="lbl fi" style={{ marginBottom:"1.5rem" }}>✦ Funcionalidades</p>
          <h1 className="D fu" style={{ fontSize:"clamp(3.5rem,10vw,7rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"#fff", margin:"0 0 1.5rem" }}>
            Tudo Que<br /><span className="outline-w">Você Precisa</span><br /><span style={{ color:"var(--gold)" }}>Num Só Lugar.</span>
          </h1>
          <p className="fu d1" style={{ color:"rgba(255,255,255,.75)", fontSize:"1.1rem", maxWidth:"500px", lineHeight:1.7, marginBottom:"2rem" }}>
            Ferramentas poderosas de IA combinadas com gestão completa do escritório em uma única plataforma.
          </p>
          <button onClick={login} className="btn-white fu d2">Começar Teste Grátis</button>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section style={{ padding:"7rem 2.5rem" }}>
        <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:"2rem", marginBottom:"4rem" }}>
            <h2 className="D fu" style={{ fontSize:"clamp(3rem,6vw,5rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", color:"#0a0a0a", margin:0 }}>
              09 Ferramentas<br />Poderosas.
            </h2>
            <p className="fu d1" style={{ color:"rgba(0,0,0,.5)", maxWidth:"280px", lineHeight:1.7, fontSize:".95rem" }}>
              Cada funcionalidade foi pensada para resolver um problema real da rotina jurídica.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px,1fr))", gap:"1px", background:"#e5e5e5" }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={f.num} className="fu" style={{ transitionDelay:`${(i%3)*100}ms`, background: f.dark ? "#0a0a0a" : "#fff", padding:"2.5rem", transition:"background .3s", cursor:"default" }}
                  onMouseEnter={e=>{ if(!f.dark) e.currentTarget.style.background="#fafafa"; }}
                  onMouseLeave={e=>{ if(!f.dark) e.currentTarget.style.background="#fff"; }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem" }}>
                    <Icon style={{ width:28, height:28, color: f.dark ? "var(--gold)" : "#555" }} />
                    <span className="D" style={{ fontSize:".65rem", color: f.dark ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.2)", fontWeight:600, letterSpacing:".1em" }}>{f.num}</span>
                  </div>
                  <h3 className="D" style={{ fontSize:"1rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", color: f.dark ? "#fff" : "#0a0a0a", marginBottom:".75rem" }}>{f.title}</h3>
                  <p style={{ fontSize:".875rem", color: f.dark ? "rgba(255,255,255,.5)" : "rgba(0,0,0,.55)", lineHeight:1.7 }}>{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* POR QUE O JURIS — dark pillar section */}
      <section style={{ background:"#121212", position:"relative", overflow:"hidden", padding:"7rem 2.5rem" }}>
        <div className="grid-bg" style={{ position:"absolute", inset:0 }} />
        <div style={{ maxWidth:"1200px", margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"2rem", alignItems:"flex-end", marginBottom:"4rem" }}>
            <h2 className="D fu" style={{ fontSize:"clamp(3rem,7vw,5.5rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"#fff", flex:"1 1 400px", margin:0 }}>
              Por Que<br />Escolher o Juris?
            </h2>
            <p className="fu d1" style={{ color:"rgba(255,255,255,.5)", maxWidth:"300px", lineHeight:1.7, fontSize:".95rem" }}>
              Três razões fundamentais para transformar sua prática jurídica com o Juris.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:"1px" }}>
            {highlights.map((h, i) => {
              const Icon = h.icon;
              return (
                <div key={h.num} className={`pillar fu d${i}`}>
                  <div className="p-num">{h.num}</div>
                  <div style={{ marginBottom:"1rem" }}><Icon style={{ width:24, height:24, color:"rgba(255,255,255,.4)" }} /></div>
                  <div className="p-title">{h.title}</div>
                  <div className="p-txt">{h.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position:"relative", overflow:"hidden", minHeight:"480px", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <img src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&q=80&auto=format&fit=crop" alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", filter:"grayscale(1)" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(200,168,75,.9)", mixBlendMode:"multiply" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.55)" }} />
        <div style={{ position:"relative", zIndex:2, textAlign:"center", padding:"5rem 2rem", maxWidth:"700px" }}>
          <p className="lbl fi" style={{ color:"rgba(255,255,255,.8)", marginBottom:"1.5rem" }}>✦ Experimente</p>
          <h2 className="D fu" style={{ fontSize:"clamp(3rem,8vw,5rem)", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.03em", lineHeight:1, color:"#fff", marginBottom:"1.5rem" }}>
            Experimente<br />Gratuitamente.
          </h2>
          <p className="fu d1" style={{ color:"rgba(255,255,255,.8)", marginBottom:"2rem" }}>7 dias grátis. Sem cartão de crédito.</p>
          <div className="fu d2" style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={login} className="btn-white">Criar Conta Grátis</button>
            <Link to={createPageUrl("Pricing")} className="btn-outline-w">Ver Planos</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
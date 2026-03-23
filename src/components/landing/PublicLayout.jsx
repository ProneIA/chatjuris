import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

// ─── Shared CSS design system ───────────────────────────────────────────────
export const SITE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap');

  :root {
    --gold: #C8A84B;
    --dark: #0a0a0a;
  }

  * { box-sizing: border-box; }
  body { margin: 0; }
  ::-webkit-scrollbar { width: 0; }
  html { scroll-behavior: smooth; }

  /* Typography */
  .D { font-family: 'Oswald', 'Helvetica Neue', Arial, sans-serif; }

  /* Labels */
  .lbl {
    font-family: 'Oswald', sans-serif;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--gold);
    font-weight: 500;
  }

  /* Scroll animations */
  .fu { opacity: 0; transform: translateY(2rem); transition: opacity 1s cubic-bezier(.16,1,.3,1), transform 1s cubic-bezier(.16,1,.3,1); }
  .fi { opacity: 0; transition: opacity 1.5s ease-out; }
  .fu.v, .fi.v { opacity: 1; transform: translateY(0); }
  .d1 { transition-delay: 100ms; }
  .d2 { transition-delay: 200ms; }
  .d3 { transition-delay: 300ms; }
  .d4 { transition-delay: 400ms; }

  /* Text effects */
  .outline-w { -webkit-text-stroke: 2px #fff; color: transparent; }
  .outline-d { -webkit-text-stroke: 2px var(--dark); color: transparent; }

  /* Buttons */
  .btn-dark {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem;
    background: var(--dark); color: #fff;
    font-family: 'Oswald', sans-serif; font-weight: 700; font-size: .8rem;
    text-transform: uppercase; letter-spacing: .12em;
    border: none; cursor: pointer; border-radius: 0;
    text-decoration: none; transition: background .2s, color .2s;
  }
  .btn-dark:hover { background: var(--gold); color: #000; }

  .btn-white {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem;
    background: #fff; color: #000;
    font-family: 'Oswald', sans-serif; font-weight: 700; font-size: .8rem;
    text-transform: uppercase; letter-spacing: .12em;
    border: none; cursor: pointer; border-radius: 0;
    text-decoration: none; transition: background .2s, color .2s;
  }
  .btn-white:hover { background: var(--gold); color: #000; }

  .btn-outline-w {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem;
    background: transparent; color: #fff;
    font-family: 'Oswald', sans-serif; font-weight: 700; font-size: .8rem;
    text-transform: uppercase; letter-spacing: .12em;
    border: 2px solid #fff; cursor: pointer; border-radius: 0;
    text-decoration: none; transition: background .2s, color .2s;
  }
  .btn-outline-w:hover { background: #fff; color: #000; }

  .btn-gold {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem;
    background: var(--gold); color: #000;
    font-family: 'Oswald', sans-serif; font-weight: 700; font-size: .8rem;
    text-transform: uppercase; letter-spacing: .12em;
    border: none; cursor: pointer; border-radius: 0;
    text-decoration: none; transition: background .2s, color .2s;
  }
  .btn-gold:hover { background: #fff; color: #000; }

  /* Pillar cards */
  .pillar {
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(0,0,0,.5);
    padding: 2rem; transition: all .35s ease; cursor: default;
  }
  .pillar:hover { background: var(--gold); border-color: var(--gold); }
  .pillar:hover .p-num { color: rgba(255,255,255,.4); }
  .pillar:hover .p-txt { color: rgba(255,255,255,.9); }
  .p-num { font-family:'Oswald',sans-serif; font-size:3.5rem; font-weight:700; color:rgba(255,255,255,.15); line-height:1; margin-bottom:.5rem; transition:color .3s; }
  .p-title { font-family:'Oswald',sans-serif; font-size:1rem; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:#fff; margin-bottom:.6rem; }
  .p-txt { font-size:.85rem; color:rgba(255,255,255,.5); line-height:1.6; transition:color .3s; }

  /* Grid bg pattern */
  .grid-bg {
    background-image: linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px);
    background-size: 60px 60px;
    opacity: .03;
  }

  /* Nav */
  .nav-blend { mix-blend-mode: difference; }

  /* Social icons */
  .soc {
    width:36px; height:36px; border:1px solid rgba(255,255,255,.2);
    display:flex; align-items:center; justify-content:center;
    transition: border-color .2s, color .2s; cursor:pointer;
    font-family:'Oswald',sans-serif; font-weight:600; font-size:.7rem;
    text-transform:uppercase; color:rgba(255,255,255,.5);
  }
  .soc:hover { border-color:var(--gold); color:var(--gold); }

  /* Card hover (light) */
  .card-hover { border:1px solid #e5e5e5; transition: border-color .3s; }
  .card-hover:hover { border-color: var(--gold); }

  /* Feature card */
  .feat-dark { background:#0a0a0a; }
  .feat-light { background:#fff; }
  .feat-light:hover { background:#fafafa; }

  @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-8px)} }
  @media(max-width:1023px){ .sticky-panel{ position:relative !important; height:60vw !important; } }
`;

// ─── Shared Nav ──────────────────────────────────────────────────────────────
export function SiteNav({ blend = false }) {
  const [open, setOpen] = useState(false);
  const login = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));

  const links = [
    { label: "Quem Somos", to: createPageUrl("QuemSomos") },
    { label: "Funcionalidades", to: createPageUrl("Funcionalidades") },
    { label: "Preços", to: createPageUrl("Pricing") },
  ];

  return (
    <>
      <nav
        className={blend ? "nav-blend" : ""}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          padding: "1.25rem 2.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: blend ? "transparent" : "#fff",
          borderBottom: blend ? "none" : "1px solid #e5e5e5",
        }}
      >
        <Link to={createPageUrl("LandingPage")} style={{ display:"flex", alignItems:"center", gap:".75rem", textDecoration:"none" }}>
          <span className="D" style={{ color: blend ? "#fff" : "#0a0a0a", fontSize:"1.4rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"-0.02em" }}>Juris</span>
          <div style={{ display:"flex", gap:"3px" }}>
            {["#C8A84B","#fff","#555","#C8A84B","#fff"].map((c,i)=>(
              <div key={i} style={{ width:6, height:6, background: blend ? c : (c=="#fff"?"#0a0a0a":c) }} />
            ))}
          </div>
        </Link>

        <div className="hidden md:flex" style={{ gap:"2.5rem", alignItems:"center" }}>
          {links.map(item => (
            <Link key={item.label} to={item.to} className="D"
              style={{ color: blend ? "#fff" : "#555", fontSize:".8rem", textTransform:"uppercase", letterSpacing:".12em", textDecoration:"none", fontWeight:500, opacity:.85, transition:"opacity .2s,color .2s" }}
              onMouseEnter={e=>{e.target.style.opacity=1; e.target.style.color="var(--gold)";}}
              onMouseLeave={e=>{e.target.style.opacity=.85; e.target.style.color=blend?"#fff":"#555";}}
            >{item.label}</Link>
          ))}
          <button onClick={login} className="D"
            style={{ color: blend?"#fff":"#555", background:"none", border:"none", fontSize:".8rem", textTransform:"uppercase", letterSpacing:".12em", fontWeight:500, cursor:"pointer", opacity:.85 }}>
            Entrar
          </button>
          <button onClick={login} className="btn-dark" style={{ padding:".6rem 1.4rem", fontSize:".72rem" }}>
            Teste 7 dias
          </button>
        </div>

        <button className="flex md:hidden" onClick={()=>setOpen(!open)}
          style={{ background:"none", border:"none", cursor:"pointer", color: blend?"#fff":"#0a0a0a", fontSize:"1.5rem" }}>
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {open && (
        <div style={{ position:"fixed", inset:0, zIndex:99, background:"#0a0a0a", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"2rem" }}>
          {links.map(item=>(
            <Link key={item.label} to={item.to} onClick={()=>setOpen(false)} className="D"
              style={{ color:"#fff", fontSize:"2rem", textTransform:"uppercase", letterSpacing:".1em", textDecoration:"none", fontWeight:600 }}>
              {item.label}
            </Link>
          ))}
          <button onClick={login} className="D" style={{ color:"rgba(255,255,255,.5)", background:"none", border:"none", fontSize:"1.2rem", textTransform:"uppercase", cursor:"pointer" }}>
            Entrar
          </button>
          <button onClick={login} className="btn-gold">Teste Grátis 7 Dias</button>
        </div>
      )}
    </>
  );
}

// ─── Shared Footer ────────────────────────────────────────────────────────────
export function SiteFooter() {
  const cols = {
    Produto: [
      { label:"Funcionalidades", to:"Funcionalidades" },
      { label:"Preços", to:"Pricing" },
      { label:"Quem Somos", to:"QuemSomos" },
    ],
    Legal: [
      { label:"Política de Privacidade", to:"PrivacyPolicy" },
      { label:"Termos de Uso", to:"TermsOfService" },
      { label:"Contato", to:"ContactPublic" },
    ],
  };

  return (
    <footer style={{ background:"#000", padding:"5rem 2.5rem 2rem" }}>
      <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:"3rem", marginBottom:"4rem" }}>
          <div style={{ gridColumn:"span 2" }}>
            <span className="D" style={{ color:"#fff", fontSize:"2rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"-0.02em", display:"block", marginBottom:"1rem" }}>Juris</span>
            <p style={{ color:"rgba(255,255,255,.4)", fontSize:".875rem", lineHeight:1.7, maxWidth:"280px", marginBottom:"1.5rem" }}>
              A plataforma jurídica com inteligência artificial para advogados e escritórios modernos.
            </p>
            <div style={{ display:"flex", gap:".5rem" }}>
              {["in","tw","ig"].map(s=><div key={s} className="soc">{s}</div>)}
            </div>
          </div>
          {Object.entries(cols).map(([title, items])=>(
            <div key={title}>
              <p className="lbl" style={{ color:"rgba(255,255,255,.3)", marginBottom:"1.5rem" }}>{title}</p>
              <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
                {items.map(({label,to})=>(
                  <Link key={label} to={createPageUrl(to)}
                    style={{ color:"rgba(255,255,255,.5)", fontSize:".875rem", textDecoration:"none", transition:"color .2s" }}
                    onMouseEnter={e=>e.target.style.color="var(--gold)"}
                    onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.5)"}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop:"1px solid rgba(255,255,255,.08)", paddingTop:"1.5rem", display:"flex", flexWrap:"wrap", gap:"1rem", justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ color:"rgba(255,255,255,.22)", fontSize:".75rem", margin:0 }}>© 2024 Juris. Todos os direitos reservados.</p>
          <div style={{ display:"flex", gap:"1.5rem" }}>
            {["Privacidade","Termos","Cookies"].map(l=><span key={l} style={{ color:"rgba(255,255,255,.22)", fontSize:".75rem", cursor:"pointer" }}>{l}</span>)}
          </div>
        </div>
      </div>
    </footer>
  );
}
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

// ─── Shared CSS design system ───────────────────────────────────────────────
export const SITE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600&display=swap');

  :root {
    --primary: #C1232E;
    --primary-dark: #721212;
    --bg: #000000;
    --surface: #121212;
    --surface-2: #1E1E1E;
    --text: #FFFFFF;
    --text-muted: rgba(255,255,255,0.5);
    --border: rgba(255,255,255,0.1);

    /* legacy aliases — mantidos para compatibilidade interna */
    --gold: #C1232E;
    --dark: #000000;
  }

  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); }
  ::-webkit-scrollbar { width: 0; background: transparent; }
  html { scroll-behavior: smooth; }
  ::selection { background: var(--primary); color: #fff; }

  /* Typography */
  .D { font-family: 'Oswald', 'Helvetica Neue', Arial, sans-serif; }

  /* Labels */
  .lbl {
    font-family: 'Oswald', sans-serif;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--primary);
    font-weight: 600;
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
  .outline-d { -webkit-text-stroke: 2px var(--bg); color: transparent; }

  /* Buttons — sem border-radius, hover inverte */
  .btn-dark {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem;
    background: var(--primary); color: #fff;
    font-family: 'Oswald', sans-serif; font-weight: 600; font-size: .8rem;
    text-transform: uppercase; letter-spacing: .12em;
    border: 2px solid var(--primary); cursor: pointer; border-radius: 0;
    text-decoration: none; transition: background .3s, color .3s;
  }
  .btn-dark:hover { background: transparent; color: var(--primary); }

  .btn-white {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem;
    background: #fff; color: #000;
    font-family: 'Oswald', sans-serif; font-weight: 600; font-size: .8rem;
    text-transform: uppercase; letter-spacing: .12em;
    border: 2px solid #fff; cursor: pointer; border-radius: 0;
    text-decoration: none; transition: background .3s, color .3s;
  }
  .btn-white:hover { background: var(--primary); color: #fff; border-color: var(--primary); }

  .btn-outline-w {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem;
    background: transparent; color: #fff;
    font-family: 'Oswald', sans-serif; font-weight: 600; font-size: .8rem;
    text-transform: uppercase; letter-spacing: .12em;
    border: 2px solid rgba(255,255,255,.4); cursor: pointer; border-radius: 0;
    text-decoration: none; transition: background .3s, color .3s, border-color .3s;
  }
  .btn-outline-w:hover { background: #fff; color: #000; border-color: #fff; }

  .btn-gold {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem;
    background: var(--primary); color: #fff;
    font-family: 'Oswald', sans-serif; font-weight: 600; font-size: .8rem;
    text-transform: uppercase; letter-spacing: .12em;
    border: 2px solid var(--primary); cursor: pointer; border-radius: 0;
    text-decoration: none; transition: background .3s, color .3s;
  }
  .btn-gold:hover { background: #fff; color: var(--primary); }

  /* Pillar cards */
  .pillar {
    border: 1px solid var(--border);
    background: rgba(0,0,0,.5);
    padding: 2rem; transition: all .35s ease; cursor: default;
  }
  .pillar:hover { background: var(--primary); border-color: var(--primary); }
  .pillar:hover .p-num { color: rgba(255,255,255,.4); }
  .pillar:hover .p-txt { color: rgba(255,255,255,.9); }
  .p-num { font-family:'Oswald',sans-serif; font-size:3.5rem; font-weight:600; color:rgba(255,255,255,.1); line-height:1; margin-bottom:.5rem; transition:color .3s; }
  .p-title { font-family:'Oswald',sans-serif; font-size:1rem; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:#fff; margin-bottom:.6rem; }
  .p-txt { font-size:.85rem; color:var(--text-muted); line-height:1.6; transition:color .3s; font-family:'Helvetica Neue',Arial,sans-serif; font-weight:500; }

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
    width:36px; height:36px; border:1px solid var(--border);
    display:flex; align-items:center; justify-content:center;
    transition: border-color .3s, color .3s; cursor:pointer;
    font-family:'Oswald',sans-serif; font-weight:600; font-size:.7rem;
    text-transform:uppercase; color:var(--text-muted);
  }
  .soc:hover { border-color:var(--primary); color:var(--primary); }

  /* Card hover (light sections) */
  .card-hover { border:1px solid var(--border); transition: border-color .3s; }
  .card-hover:hover { border-color: var(--primary); }

  /* Feature card */
  .feat-dark { background: var(--surface); }
  .feat-light { background: var(--surface-2); }
  .feat-light:hover { background: #252525; }

  /* Inputs */
  input, textarea, select {
    border-radius: 0 !important;
    border: 1px solid var(--border) !important;
    background: transparent !important;
    color: var(--text) !important;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-weight: 500;
    transition: border-color .3s;
  }
  input:focus, textarea:focus, select:focus {
    border-color: var(--primary) !important;
    outline: none !important;
  }

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
          background: blend ? "transparent" : "rgba(0,0,0,.95)",
          borderBottom: blend ? "none" : "1px solid rgba(255,255,255,.08)",
          backdropFilter: blend ? "none" : "blur(12px)",
        }}
      >
        <Link to={createPageUrl("LandingPage")} style={{ display:"flex", alignItems:"center", gap:".75rem", textDecoration:"none" }}>
          <span className="D" style={{ color:"#fff", fontSize:"1.4rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.02em" }}>Juris</span>
          <div style={{ display:"flex", gap:"3px" }}>
            {["#C1232E","#fff","rgba(255,255,255,.3)","#C1232E","#fff"].map((c,i)=>(
              <div key={i} style={{ width:6, height:6, background: c }} />
            ))}
          </div>
        </Link>

        <div className="hidden md:flex" style={{ gap:"2.5rem", alignItems:"center" }}>
          {links.map(item => (
            <Link key={item.label} to={item.to} className="D"
              style={{ color:"rgba(255,255,255,.7)", fontSize:".8rem", textTransform:"uppercase", letterSpacing:".12em", textDecoration:"none", fontWeight:600, transition:"color .3s" }}
              onMouseEnter={e=>{e.target.style.color="#C1232E";}}
              onMouseLeave={e=>{e.target.style.color="rgba(255,255,255,.7)";}}
            >{item.label}</Link>
          ))}
          <button onClick={login} className="D"
            style={{ color:"rgba(255,255,255,.7)", background:"none", border:"none", fontSize:".8rem", textTransform:"uppercase", letterSpacing:".12em", fontWeight:600, cursor:"pointer", transition:"color .3s" }}
            onMouseEnter={e=>e.target.style.color="#fff"}
            onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.7)"}>
            Entrar
          </button>
          <button onClick={login} className="btn-dark" style={{ padding:".6rem 1.4rem", fontSize:".72rem" }}>
            Teste 7 dias
          </button>
        </div>

        <button className="flex md:hidden" onClick={()=>setOpen(!open)}
          style={{ background:"none", border:"none", cursor:"pointer", color:"#fff", fontSize:"1.5rem" }}>
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {open && (
        <div style={{ position:"fixed", inset:0, zIndex:99, background:"#000", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"2rem" }}>
          {/* accent line top */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"var(--primary)" }} />
          {links.map(item=>(
            <Link key={item.label} to={item.to} onClick={()=>setOpen(false)} className="D"
              style={{ color:"#fff", fontSize:"2rem", textTransform:"uppercase", letterSpacing:".1em", textDecoration:"none", fontWeight:600 }}>
              {item.label}
            </Link>
          ))}
          <button onClick={login} className="D" style={{ color:"rgba(255,255,255,.4)", background:"none", border:"none", fontSize:"1.2rem", textTransform:"uppercase", cursor:"pointer" }}>
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
    <footer style={{ background:"#000", padding:"5rem 2.5rem 2rem", borderTop:"1px solid rgba(255,255,255,.06)" }}>
      <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:"3rem", marginBottom:"4rem" }}>
          <div style={{ gridColumn:"span 2" }}>
            <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:"1rem" }}>
              <span className="D" style={{ color:"#fff", fontSize:"2rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"-0.02em" }}>Juris</span>
              <div style={{ width:8, height:8, background:"var(--primary)", borderRadius:0 }} />
            </div>
            <p style={{ color:"var(--text-muted)", fontSize:".875rem", lineHeight:1.7, maxWidth:"280px", marginBottom:"1.5rem", fontFamily:"'Helvetica Neue',Arial,sans-serif", fontWeight:500 }}>
              A plataforma jurídica com inteligência artificial para advogados e escritórios modernos.
            </p>
            <div style={{ display:"flex", gap:".5rem" }}>
              {["in","tw","ig"].map(s=><div key={s} className="soc">{s}</div>)}
            </div>
          </div>
          {Object.entries(cols).map(([title, items])=>(
            <div key={title}>
              <p className="lbl" style={{ color:"rgba(255,255,255,.25)", marginBottom:"1.5rem" }}>{title}</p>
              <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
                {items.map(({label,to})=>(
                  <Link key={label} to={createPageUrl(to)}
                    style={{ color:"var(--text-muted)", fontSize:".875rem", textDecoration:"none", transition:"color .3s", fontFamily:"'Helvetica Neue',Arial,sans-serif" }}
                    onMouseEnter={e=>e.target.style.color="var(--primary)"}
                    onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.5)"}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", paddingTop:"1.5rem", display:"flex", flexWrap:"wrap", gap:"1rem", justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ color:"rgba(255,255,255,.2)", fontSize:".75rem", margin:0, fontFamily:"'Helvetica Neue',Arial,sans-serif" }}>© 2024 Juris. Todos os direitos reservados.</p>
          <div style={{ display:"flex", gap:"1.5rem" }}>
            {["Privacidade","Termos","Cookies"].map(l=><span key={l} style={{ color:"rgba(255,255,255,.2)", fontSize:".75rem", cursor:"pointer", fontFamily:"'Helvetica Neue',Arial,sans-serif" }}>{l}</span>)}
          </div>
        </div>
      </div>
    </footer>
  );
}
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

// ─── Shared CSS design system ───────────────────────────────────────────────
export const SITE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  :root {
    --primary:       #4F6EF7;
    --primary-dark:  #3B56E0;
    --primary-light: #EEF1FF;
    --dark:          #0D0F1A;
    --gray:          #6B7280;
    --border:        #E5E7EB;
    --surface:       #F9FAFB;
    --white:         #FFFFFF;
    --font-main:     'Inter', -apple-system, sans-serif;
    --radius-sm:     8px;
    --radius-md:     12px;
    --radius-lg:     16px;
    --radius-xl:     20px;
    --radius-pill:   999px;
  }

  * { box-sizing: border-box; }
  body { margin: 0; font-family: var(--font-main); }
  ::-webkit-scrollbar { width: 0; }
  html { scroll-behavior: smooth; }

  /* Scroll animations */
  .fu { opacity: 0; transform: translateY(2rem); transition: opacity 1s cubic-bezier(.16,1,.3,1), transform 1s cubic-bezier(.16,1,.3,1); }
  .fi { opacity: 0; transition: opacity 1.5s ease-out; }
  .fu.v, .fi.v { opacity: 1; transform: translateY(0); }
  .d1 { transition-delay: 100ms; }
  .d2 { transition-delay: 200ms; }
  .d3 { transition-delay: 300ms; }
  .d4 { transition-delay: 400ms; }

  /* Pill / Badge */
  .pill {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .35rem .9rem;
    background: var(--primary-light);
    color: var(--primary);
    border-radius: var(--radius-pill);
    font-size: .78rem; font-weight: 600;
    letter-spacing: .01em;
    border: 1px solid rgba(79,110,247,.2);
    font-family: var(--font-main);
  }

  /* Section label */
  .lbl {
    font-family: var(--font-main);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--gray);
  }

  /* Buttons */
  .btn-primary {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem;
    background: var(--primary); color: #fff;
    font-family: var(--font-main); font-weight: 600; font-size: .95rem;
    border: none; cursor: pointer; border-radius: var(--radius-md);
    text-decoration: none;
    transition: background .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 4px 14px rgba(79,110,247,.35);
  }
  .btn-primary:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,110,247,.45); }

  .btn-secondary {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem;
    background: #fff; color: var(--dark);
    font-family: var(--font-main); font-weight: 600; font-size: .95rem;
    border: 1.5px solid var(--border); cursor: pointer;
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: border-color .2s, transform .15s;
  }
  .btn-secondary:hover { border-color: var(--primary); transform: translateY(-1px); }

  /* keep old aliases pointing to new styles */
  .btn-dark { display: inline-flex; align-items: center; gap: .5rem; padding: .85rem 2rem; background: var(--primary); color: #fff; font-family: var(--font-main); font-weight: 600; font-size: .95rem; border: none; cursor: pointer; border-radius: var(--radius-md); text-decoration: none; transition: background .2s, transform .15s, box-shadow .2s; box-shadow: 0 4px 14px rgba(79,110,247,.35); }
  .btn-dark:hover { background: var(--primary-dark); transform: translateY(-1px); }
  .btn-white { display: inline-flex; align-items: center; gap: .5rem; padding: .85rem 2rem; background: #fff; color: var(--dark); font-family: var(--font-main); font-weight: 600; font-size: .95rem; border: 1.5px solid var(--border); cursor: pointer; border-radius: var(--radius-md); text-decoration: none; transition: border-color .2s; }
  .btn-white:hover { border-color: var(--primary); }
  .btn-gold { display: inline-flex; align-items: center; gap: .5rem; padding: .85rem 2rem; background: var(--primary); color: #fff; font-family: var(--font-main); font-weight: 600; font-size: .95rem; border: none; cursor: pointer; border-radius: var(--radius-md); text-decoration: none; transition: background .2s; }
  .btn-gold:hover { background: var(--primary-dark); }
  .btn-outline-w { display: inline-flex; align-items: center; gap: .5rem; padding: .85rem 2rem; background: transparent; color: #fff; font-family: var(--font-main); font-weight: 600; font-size: .95rem; border: 1.5px solid rgba(255,255,255,.4); cursor: pointer; border-radius: var(--radius-md); text-decoration: none; transition: background .2s; }
  .btn-outline-w:hover { background: rgba(255,255,255,.1); }

  /* Feature cards */
  .feat-card {
    background: #fff;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2rem;
    transition: border-color .25s, box-shadow .25s, transform .25s;
  }
  .feat-card:hover { border-color: var(--primary); box-shadow: 0 8px 32px rgba(79,110,247,.12); transform: translateY(-3px); }

  .feat-icon {
    width: 48px; height: 48px;
    background: var(--primary-light);
    border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.4rem;
    margin-bottom: 1.25rem;
  }

  /* Pillar cards (updated) */
  .pillar {
    border: 1.5px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.04);
    border-radius: var(--radius-lg);
    padding: 2rem; transition: all .35s ease; cursor: default;
  }
  .pillar:hover { background: var(--primary); border-color: var(--primary); }
  .pillar:hover .p-num { color: rgba(255,255,255,.4); }
  .pillar:hover .p-txt { color: rgba(255,255,255,.9); }
  .p-num { font-family: var(--font-main); font-size:3.5rem; font-weight:800; color:rgba(255,255,255,.15); line-height:1; margin-bottom:.5rem; transition:color .3s; }
  .p-title { font-family: var(--font-main); font-size:1rem; font-weight:700; color:#fff; margin-bottom:.6rem; }
  .p-txt { font-size:.875rem; color:rgba(255,255,255,.5); line-height:1.6; transition:color .3s; }

  /* Price cards */
  .price-card {
    background: #fff;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 2.5rem;
    transition: box-shadow .25s, transform .25s;
  }
  .price-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,.08); transform: translateY(-4px); }
  .price-card.featured { background: var(--dark); border-color: var(--dark); color: #fff; }

  /* Card hover (light) */
  .card-hover { border:1.5px solid var(--border); border-radius: var(--radius-lg); transition: border-color .3s, box-shadow .3s; }
  .card-hover:hover { border-color: var(--primary); box-shadow: 0 4px 16px rgba(79,110,247,.1); }

  /* Social icons */
  .soc {
    width:36px; height:36px; border:1px solid rgba(255,255,255,.2);
    border-radius: var(--radius-sm);
    display:flex; align-items:center; justify-content:center;
    transition: border-color .2s, color .2s; cursor:pointer;
    font-family: var(--font-main); font-weight:600; font-size:.7rem;
    color:rgba(255,255,255,.5);
  }
  .soc:hover { border-color: var(--primary); color: var(--primary); }

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
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          padding: "1rem 2.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link to={createPageUrl("LandingPage")} style={{ display:"flex", alignItems:"center", gap:".5rem", textDecoration:"none" }}>
          <span style={{ color:"#0D0F1A", fontSize:"1.3rem", fontWeight:800, fontFamily:"'Inter',sans-serif", letterSpacing:"-0.03em" }}>Juris</span>
          <span style={{ background:"#4F6EF7", color:"#fff", fontSize:".6rem", fontWeight:700, padding:".15rem .45rem", borderRadius:"6px", fontFamily:"'Inter',sans-serif" }}>IA</span>
        </Link>

        <div className="hidden md:flex" style={{ gap:"2rem", alignItems:"center" }}>
          {links.map(item => (
            <Link key={item.label} to={item.to}
              style={{ color:"#6B7280", fontSize:".9rem", textDecoration:"none", fontWeight:500, fontFamily:"'Inter',sans-serif", transition:"color .2s" }}
              onMouseEnter={e=>e.target.style.color="#0D0F1A"}
              onMouseLeave={e=>e.target.style.color="#6B7280"}
            >{item.label}</Link>
          ))}
          <button onClick={login}
            style={{ color:"#6B7280", background:"none", border:"none", fontSize:".9rem", fontWeight:500, cursor:"pointer", fontFamily:"'Inter',sans-serif", transition:"color .2s" }}
            onMouseEnter={e=>e.target.style.color="#0D0F1A"}
            onMouseLeave={e=>e.target.style.color="#6B7280"}
          >
            Entrar
          </button>
          <button onClick={login} className="btn-primary" style={{ padding:".55rem 1.35rem", fontSize:".85rem" }}>
            Teste 7 dias
          </button>
        </div>

        <button className="flex md:hidden" onClick={()=>setOpen(!open)}
          style={{ background:"none", border:"none", cursor:"pointer", color:"#0D0F1A", fontSize:"1.4rem" }}>
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {open && (
        <div style={{ position:"fixed", inset:0, zIndex:99, background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"2rem" }}>
          {links.map(item=>(
            <Link key={item.label} to={item.to} onClick={()=>setOpen(false)}
              style={{ color:"#0D0F1A", fontSize:"1.75rem", textDecoration:"none", fontWeight:700, fontFamily:"'Inter',sans-serif" }}>
              {item.label}
            </Link>
          ))}
          <button onClick={login} style={{ color:"#6B7280", background:"none", border:"none", fontSize:"1.1rem", cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:500 }}>
            Entrar
          </button>
          <button onClick={login} className="btn-primary">Teste Grátis 7 Dias</button>
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
    <footer style={{ background:"#0D0F1A", padding:"5rem 2.5rem 2rem" }}>
      <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:"3rem", marginBottom:"4rem" }}>
          <div style={{ gridColumn:"span 2" }}>
            <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:"1rem" }}>
              <span style={{ color:"#fff", fontSize:"1.4rem", fontWeight:800, fontFamily:"'Inter',sans-serif", letterSpacing:"-0.03em" }}>Juris</span>
              <span style={{ background:"#4F6EF7", color:"#fff", fontSize:".6rem", fontWeight:700, padding:".15rem .45rem", borderRadius:"6px", fontFamily:"'Inter',sans-serif" }}>IA</span>
            </div>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:".875rem", lineHeight:1.7, maxWidth:"280px", marginBottom:"1.5rem", fontFamily:"'Inter',sans-serif" }}>
              A plataforma jurídica com inteligência artificial para advogados e escritórios modernos.
            </p>
            <div style={{ display:"flex", gap:".5rem" }}>
              {["in","tw","ig"].map(s=><div key={s} className="soc">{s}</div>)}
            </div>
          </div>
          {Object.entries(cols).map(([title, items])=>(
            <div key={title}>
              <p style={{ color:"rgba(255,255,255,.35)", fontSize:".75rem", fontWeight:600, marginBottom:"1.5rem", fontFamily:"'Inter',sans-serif" }}>{title}</p>
              <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
                {items.map(({label,to})=>(
                  <Link key={label} to={createPageUrl(to)}
                    style={{ color:"rgba(255,255,255,.5)", fontSize:".875rem", textDecoration:"none", transition:"color .2s", fontFamily:"'Inter',sans-serif" }}
                    onMouseEnter={e=>e.target.style.color="#fff"}
                    onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.5)"}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop:"1px solid rgba(255,255,255,.1)", paddingTop:"1.5rem", display:"flex", flexWrap:"wrap", gap:"1rem", justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ color:"rgba(255,255,255,.25)", fontSize:".75rem", margin:0, fontFamily:"'Inter',sans-serif" }}>© 2024 Juris. Todos os direitos reservados.</p>
          <div style={{ display:"flex", gap:"1.5rem" }}>
            {["Privacidade","Termos","Cookies"].map(l=><span key={l} style={{ color:"rgba(255,255,255,.25)", fontSize:".75rem", cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>{l}</span>)}
          </div>
        </div>
      </div>
    </footer>
  );
}
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export const publicStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap');
  :root { --primary: #C8A84B; --dark: #0a0a0a; }
  .pub-font { font-family: 'Oswald', 'Helvetica Neue', Arial, sans-serif; }
  .pub-label { font-family: 'Oswald', sans-serif; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--primary); font-weight: 500; }
  .pub-fade-up { opacity: 0; transform: translateY(2rem); transition: opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1); }
  .pub-fade-in { opacity: 0; transition: opacity 1.5s ease-out; }
  .pub-fade-up.is-visible, .pub-fade-in.is-visible { opacity: 1; transform: translateY(0); }
  .pub-delay-1 { transition-delay: 100ms; }
  .pub-delay-2 { transition-delay: 200ms; }
  .pub-delay-3 { transition-delay: 300ms; }
  .pub-delay-4 { transition-delay: 400ms; }
  .pub-btn-dark { display:inline-flex; align-items:center; gap:0.5rem; padding:0.9rem 2rem; background:#0a0a0a; color:#fff; font-family:'Oswald',sans-serif; font-weight:600; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.1em; border:none; cursor:pointer; transition:background 0.2s; border-radius:0; text-decoration:none; }
  .pub-btn-dark:hover { background:#C8A84B; color:#000; }
  .pub-btn-outline { display:inline-flex; align-items:center; gap:0.5rem; padding:0.9rem 2rem; background:transparent; color:#0a0a0a; font-family:'Oswald',sans-serif; font-weight:600; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.1em; border:2px solid #0a0a0a; cursor:pointer; transition:all 0.2s; border-radius:0; text-decoration:none; }
  .pub-btn-outline:hover { background:#0a0a0a; color:#fff; }
  ::-webkit-scrollbar { width: 0; }
  html { scroll-behavior: smooth; }
`;

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const handleLogin = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));

  const links = [
    { label: "Quem Somos", to: createPageUrl("QuemSomos") },
    { label: "Funcionalidades", to: createPageUrl("Funcionalidades") },
    { label: "Preços", to: createPageUrl("Pricing") },
  ];

  return (
    <>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "#fff", borderBottom: "1px solid #e5e5e5", padding: "0 2.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to={createPageUrl("LandingPage")} style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
          <span className="pub-font" style={{ color: "#0a0a0a", fontSize: "1.3rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Juris</span>
          <div style={{ display: "flex", gap: "3px" }}>
            {["#C8A84B", "#0a0a0a", "#888", "#C8A84B", "#0a0a0a"].map((c, i) => (
              <div key={i} style={{ width: 5, height: 5, background: c }} />
            ))}
          </div>
        </Link>

        <div className="hidden md:flex" style={{ gap: "2rem", alignItems: "center" }}>
          {links.map((item) => (
            <Link key={item.label} to={item.to} className="pub-font"
              style={{ color: "#555", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "var(--primary)"}
              onMouseLeave={e => e.target.style.color = "#555"}
            >
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogin} className="pub-font"
            style={{ color: "#555", background: "none", border: "none", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", fontWeight: 500 }}>
            Entrar
          </button>
          <button onClick={handleLogin} className="pub-btn-dark" style={{ padding: "0.55rem 1.25rem", fontSize: "0.7rem" }}>
            Teste 7 dias
          </button>
        </div>

        <button className="flex md:hidden" onClick={() => setOpen(!open)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", color: "#0a0a0a" }}>
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99, background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2rem" }}>
          {links.map((item) => (
            <Link key={item.label} to={item.to} onClick={() => setOpen(false)} className="pub-font"
              style={{ color: "#fff", fontSize: "2rem", textTransform: "uppercase", letterSpacing: "0.1em", textDecoration: "none", fontWeight: 600 }}>
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogin} className="pub-font"
            style={{ color: "rgba(255,255,255,0.5)", background: "none", border: "none", fontSize: "1.2rem", textTransform: "uppercase", cursor: "pointer" }}>
            Entrar
          </button>
          <button onClick={handleLogin} className="pub-btn-dark" style={{ background: "var(--primary)", color: "#000" }}>
            Teste Grátis 7 Dias
          </button>
        </div>
      )}
    </>
  );
}

export function PublicFooter() {
  return (
    <footer style={{ background: "#000", padding: "4rem 2.5rem 2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "3rem", marginBottom: "3rem" }}>
          <div style={{ gridColumn: "span 2" }}>
            <span className="pub-font" style={{ color: "#fff", fontSize: "1.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.02em", display: "block", marginBottom: "0.75rem" }}>Juris</span>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", lineHeight: 1.7, maxWidth: "260px" }}>
              A plataforma jurídica com inteligência artificial para advogados modernos.
            </p>
          </div>
          <div>
            <p className="pub-label" style={{ color: "rgba(255,255,255,0.3)", marginBottom: "1.25rem" }}>Produto</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[{ l: "Funcionalidades", t: "Funcionalidades" }, { l: "Preços", t: "Pricing" }, { l: "Quem Somos", t: "QuemSomos" }].map(({ l, t }) => (
                <Link key={l} to={createPageUrl(t)} style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = "var(--primary)"}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}>{l}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="pub-label" style={{ color: "rgba(255,255,255,0.3)", marginBottom: "1.25rem" }}>Legal</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[{ l: "Privacidade", t: "PrivacyPolicy" }, { l: "Termos", t: "TermsOfService" }, { l: "Contato", t: "ContactPublic" }].map(({ l, t }) => (
                <Link key={l} to={createPageUrl(t)} style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = "var(--primary)"}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}>{l}</Link>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between" }}>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem", margin: 0 }}>© 2024 Juris. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
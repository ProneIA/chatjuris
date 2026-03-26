import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Scale, LayoutDashboard, Search, FolderOpen, Plus, Menu, X } from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/JusTrackDashboard", icon: LayoutDashboard },
  { label: "Pesquisar", path: "/JusTrackPesquisa", icon: Search },
  { label: "Processos", path: "/JusTrackProcessos", icon: FolderOpen },
  { label: "Cadastrar", path: "/JusTrackNovo", icon: Plus },
];

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
`;

export default function JusTrackLayout({ children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "#e8eaf0", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{FONTS}</style>

      {/* Sidebar Desktop */}
      <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 220, background: "#0d1117", borderRight: "1px solid #1e2740", zIndex: 40, display: "flex", flexDirection: "column" }}
        className="hidden lg:flex">
        <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: "1px solid #1e2740" }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
            <Scale style={{ width: 20, height: 20, color: "#C9A84C" }} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.1rem", color: "#C9A84C", letterSpacing: ".03em" }}>JusTrack</span>
          </div>
          <p style={{ fontSize: ".65rem", color: "#4a5568", margin: ".3rem 0 0", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".12em" }}>
            Gestão Judicial
          </p>
        </div>
        <nav style={{ flex: 1, padding: ".75rem 0" }}>
          {navItems.map(item => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}
                style={{ display: "flex", alignItems: "center", gap: ".75rem", padding: ".7rem 1.25rem", textDecoration: "none", borderLeft: active ? "3px solid #C9A84C" : "3px solid transparent", background: active ? "rgba(201,168,76,.08)" : "transparent", color: active ? "#C9A84C" : "#8892a4", fontSize: ".8rem", fontWeight: active ? 600 : 400, fontFamily: "'IBM Plex Sans', sans-serif", transition: "all .15s" }}
              >
                <Icon style={{ width: 15, height: 15 }} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #1e2740" }}>
          <p style={{ fontSize: ".62rem", color: "#2a3550", fontFamily: "'IBM Plex Sans', sans-serif", textAlign: "center" }}>
            Powered by DataJud · CNJ
          </p>
        </div>
      </aside>

      {/* Mobile Header */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, height: 52, background: "#0d1117", borderBottom: "1px solid #1e2740", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1rem" }}
        className="lg:hidden">
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          <Scale style={{ width: 18, height: 18, color: "#C9A84C" }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1rem", color: "#C9A84C" }}>JusTrack</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8892a4", padding: ".25rem" }}>
          {mobileOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{ position: "fixed", top: 52, left: 0, right: 0, bottom: 0, background: "#0d1117", zIndex: 45, borderTop: "1px solid #1e2740" }}
          className="lg:hidden">
          <nav style={{ padding: ".5rem 0" }}>
            {navItems.map(item => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: ".75rem", padding: "1rem 1.5rem", textDecoration: "none", borderLeft: active ? "3px solid #C9A84C" : "3px solid transparent", background: active ? "rgba(201,168,76,.08)" : "transparent", color: active ? "#C9A84C" : "#8892a4", fontSize: ".9rem", fontWeight: active ? 600 : 400, fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  <Icon style={{ width: 16, height: 16 }} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main */}
      <main style={{ paddingLeft: 0 }} className="lg:pl-[220px]">
        <div className="pt-0 lg:pt-0" style={{ paddingTop: 0 }}>
          <div className="block lg:hidden" style={{ height: 52 }} />
          {children}
        </div>
      </main>
    </div>
  );
}
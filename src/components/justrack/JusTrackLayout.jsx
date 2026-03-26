import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Scale, LayoutDashboard, Search, FolderOpen, Plus, Menu, X, BadgeCheck, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const navItems = [
  { label: "Dashboard", path: "/JusTrackDashboard", icon: LayoutDashboard },
  { label: "Pesquisar", path: "/JusTrackPesquisa", icon: Search },
  { label: "Minha OAB", path: "/JusTrackOAB", icon: BadgeCheck },
  { label: "Processos", path: "/JusTrackProcessos", icon: FolderOpen },
  { label: "Cadastrar", path: "/JusTrackNovo", icon: Plus },
];

function parseRelativeTime(dt) {
  if (!dt) return "nunca";
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return `há ${Math.floor(hrs / 24)}d`;
}

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
`;

export default function JusTrackLayout({ children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: perfis = [] } = useQuery({
    queryKey: ["perfilOAB"],
    queryFn: () => base44.entities.PerfilOAB.list("-created_date", 1),
    staleTime: 60000,
  });
  const perfil = perfis[0] || null;

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
          {perfil ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".5rem" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: ".75rem", color: "#C9A84C" }}>
                    {(perfil.nomeAdvogado || perfil.tipo)?.[0]?.toUpperCase() || "A"}
                  </span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: ".72rem", color: "#C9A84C", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    OAB/{perfil.seccional} {perfil.numeroOAB}
                  </p>
                  <p style={{ fontSize: ".6rem", color: "#4a5568", fontFamily: "'IBM Plex Sans', sans-serif", margin: 0 }}>
                    Sync: {parseRelativeTime(perfil.ultimaSincronizacao)}
                  </p>
                </div>
              </div>
              <Link to="/JusTrackOAB" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".35rem", padding: ".35rem", background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.2)", color: "#C9A84C", textDecoration: "none", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".65rem", letterSpacing: ".05em" }}>
                <RefreshCw style={{ width: 10, height: 10 }} />SINCRONIZAR
              </Link>
            </div>
          ) : (
            <Link to="/JusTrackOAB" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".4rem", padding: ".45rem", background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.15)", color: "#C9A84C", textDecoration: "none", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".65rem", letterSpacing: ".06em" }}>
              <BadgeCheck style={{ width: 11, height: 11 }} />VINCULAR OAB
            </Link>
          )}
          <p style={{ fontSize: ".55rem", color: "#2a3550", fontFamily: "'IBM Plex Sans', sans-serif", textAlign: "center", marginTop: ".5rem" }}>
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
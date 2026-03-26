import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Scale, Search, Plus, FileText, CheckCircle, Archive, Clock } from "lucide-react";
import JusTrackLayout from "@/components/justrack/JusTrackLayout";
import StatusBadge from "@/components/justrack/StatusBadge";
import TribunalDonutChart from "@/components/justrack/TribunalDonutChart";

export default function JusTrackDashboard() {
  const { data: processos = [], isLoading } = useQuery({
    queryKey: ["processos"],
    queryFn: () => base44.entities.Processo.list("-created_date", 100),
  });

  const total = processos.length;
  const ativos = processos.filter(p => p.status === "Ativo").length;
  const arquivados = processos.filter(p => p.status === "Arquivado").length;
  const suspensos = processos.filter(p => p.status === "Suspenso").length;
  const recentes = processos.slice(0, 8);

  const stats = [
    { label: "Total de Processos", value: total, icon: FileText, color: "#C9A84C" },
    { label: "Ativos", value: ativos, icon: CheckCircle, color: "#4ade80" },
    { label: "Arquivados", value: arquivados, icon: Archive, color: "#94a3b8" },
    { label: "Suspensos", value: suspensos, icon: Clock, color: "#fbbf24" },
  ];

  return (
    <JusTrackLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.6rem", color: "#C9A84C", margin: 0 }}>
              Dashboard
            </h1>
            <p style={{ color: "#8892a4", fontSize: ".85rem", margin: ".25rem 0 0" }}>
              Visão geral dos seus processos judiciais
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/JusTrackPesquisa" style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", padding: ".6rem 1.2rem", background: "transparent", border: "1px solid #C9A84C", color: "#C9A84C", textDecoration: "none", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".78rem", letterSpacing: ".05em" }}>
              <Search className="w-4 h-4" /> Nova Pesquisa
            </Link>
            <Link to="/JusTrackNovo" style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", padding: ".6rem 1.2rem", background: "#C9A84C", border: "1px solid #C9A84C", color: "#0d1117", textDecoration: "none", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: ".78rem", letterSpacing: ".05em" }}>
              <Plus className="w-4 h-4" /> Cadastrar Processo
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ background: "#161b27", border: "1px solid #1e2740", padding: "1.25rem" }}>
                <div className="flex items-center justify-between mb-3">
                  <span style={{ fontSize: ".72rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".1em" }}>{s.label}</span>
                  <Icon style={{ width: 16, height: 16, color: s.color }} />
                </div>
                <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: "2rem", color: s.color, margin: 0, lineHeight: 1 }}>
                  {isLoading ? "—" : s.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Gráfico de rosca — distribuição por tribunal */}
        <div style={{ background: "#161b27", border: "1px solid #1e2740" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #1e2740" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "1rem", color: "#e8eaf0", margin: 0 }}>
              Distribuição por Tribunal
            </h2>
          </div>
          <div style={{ padding: "1rem 1.5rem" }}>
            {isLoading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif" }}>Carregando...</div>
            ) : (
              <TribunalDonutChart processos={processos} />
            )}
          </div>
        </div>

        {/* Últimos processos */}
        <div style={{ background: "#161b27", border: "1px solid #1e2740" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #1e2740", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "1rem", color: "#e8eaf0", margin: 0 }}>
              Processos Recentes
            </h2>
            <Link to="/JusTrackProcessos" style={{ fontSize: ".75rem", color: "#C9A84C", textDecoration: "none", fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Ver todos →
            </Link>
          </div>

          {isLoading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif" }}>Carregando...</div>
          ) : recentes.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <Scale style={{ width: 32, height: 32, color: "#2a3550", margin: "0 auto .75rem", display: "block" }} />
              <p style={{ color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".85rem" }}>Nenhum processo cadastrado ainda.</p>
              <Link to="/JusTrackPesquisa" style={{ display: "inline-block", marginTop: ".75rem", color: "#C9A84C", fontSize: ".8rem", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Pesquisar na API DataJud →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e2740" }}>
                    {["Número do Processo", "Tribunal", "Classe", "Status", "Cadastrado em"].map(h => (
                      <th key={h} style={{ padding: ".75rem 1.5rem", textAlign: "left", fontSize: ".68rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentes.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #1e2740", transition: "background .15s", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#1a2035"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      onClick={() => window.location.href = `/JusTrackDetalhes?id=${p.id}`}
                    >
                      <td style={{ padding: ".85rem 1.5rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".82rem", color: "#C9A84C", fontWeight: 600 }}>{p.numeroProcesso}</td>
                      <td style={{ padding: ".85rem 1.5rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".82rem", color: "#e8eaf0" }}>{p.tribunal}</td>
                      <td style={{ padding: ".85rem 1.5rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".82rem", color: "#8892a4" }}>{p.classeProcessual || "—"}</td>
                      <td style={{ padding: ".85rem 1.5rem" }}><StatusBadge status={p.status} /></td>
                      <td style={{ padding: ".85rem 1.5rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".8rem", color: "#8892a4" }}>
                        {p.created_date ? new Date(p.created_date).toLocaleDateString("pt-BR") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </JusTrackLayout>
  );
}
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Plus, Trash2, Eye, Edit2, Filter } from "lucide-react";
import JusTrackLayout from "@/components/justrack/JusTrackLayout";
import StatusBadge from "@/components/justrack/StatusBadge";
import { TRIBUNAIS } from "@/components/justrack/TribunalSelect";

export default function JusTrackProcessos() {
  const queryClient = useQueryClient();
  const { data: processos = [], isLoading } = useQuery({
    queryKey: ["processos"],
    queryFn: () => base44.entities.Processo.list("-created_date", 500),
  });

  const [busca, setBusca] = useState("");
  const [filtroTribunal, setFiltroTribunal] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const todosOsTribunais = useMemo(() => {
    const set = new Set(processos.map(p => p.tribunal).filter(Boolean));
    return Array.from(set).sort();
  }, [processos]);

  const filtrados = useMemo(() => {
    return processos.filter(p => {
      const matchBusca = !busca || p.numeroProcesso?.includes(busca) || p.requerente?.toLowerCase().includes(busca.toLowerCase()) || p.requerido?.toLowerCase().includes(busca.toLowerCase()) || p.advogado?.toLowerCase().includes(busca.toLowerCase());
      const matchTribunal = !filtroTribunal || p.tribunal === filtroTribunal;
      const matchStatus = !filtroStatus || p.status === filtroStatus;
      return matchBusca && matchTribunal && matchStatus;
    });
  }, [processos, busca, filtroTribunal, filtroStatus]);

  const handleDelete = async (id) => {
    if (!confirm("Excluir este processo?")) return;
    setDeletingId(id);
    await base44.entities.Processo.delete(id);
    queryClient.invalidateQueries({ queryKey: ["processos"] });
    setDeletingId(null);
  };

  const inputStyle = { background: "#0d1117", border: "1px solid #1e2740", color: "#e8eaf0", padding: ".5rem .75rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".82rem", outline: "none" };

  return (
    <JusTrackLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.6rem", color: "#C9A84C", margin: 0 }}>
              Processos Cadastrados
            </h1>
            <p style={{ color: "#8892a4", fontSize: ".85rem", margin: ".25rem 0 0", fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {filtrados.length} de {processos.length} processos
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/JusTrackPesquisa" style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", padding: ".6rem 1.1rem", background: "transparent", border: "1px solid #1e2740", color: "#8892a4", textDecoration: "none", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".78rem" }}>
              <Search className="w-3.5 h-3.5" /> Pesquisar
            </Link>
            <Link to="/JusTrackNovo" style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", padding: ".6rem 1.1rem", background: "#C9A84C", border: "1px solid #C9A84C", color: "#0d1117", textDecoration: "none", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: ".78rem" }}>
              <Plus className="w-3.5 h-3.5" /> Cadastrar
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ background: "#161b27", border: "1px solid #1e2740", padding: "1rem 1.5rem" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: ".65rem", top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#4a5568" }} />
              <input style={{ ...inputStyle, width: "100%", paddingLeft: "2rem" }} placeholder="Buscar por número, parte, advogado..." value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <select style={{ ...inputStyle, width: "100%", cursor: "pointer" }} value={filtroTribunal} onChange={e => setFiltroTribunal(e.target.value)}>
              <option value="">Todos os tribunais</option>
              {todosOsTribunais.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select style={{ ...inputStyle, width: "100%", cursor: "pointer" }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              {["Ativo", "Arquivado", "Suspenso", "Baixado"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Tabela */}
        <div style={{ background: "#161b27", border: "1px solid #1e2740" }}>
          {isLoading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif" }}>Carregando processos...</div>
          ) : filtrados.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <p style={{ color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".85rem" }}>
                {processos.length === 0 ? "Nenhum processo cadastrado." : "Nenhum processo encontrado com os filtros aplicados."}
              </p>
              {processos.length === 0 && (
                <Link to="/JusTrackNovo" style={{ display: "inline-block", marginTop: ".75rem", color: "#C9A84C", fontSize: ".8rem", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  → Cadastrar primeiro processo
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e2740" }}>
                    {["Número do Processo", "Tribunal", "Classe", "Requerente", "Advogado", "Status", "Ações"].map(h => (
                      <th key={h} style={{ padding: ".75rem 1rem", textAlign: "left", fontSize: ".65rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #1a2035", transition: "background .12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#1a2035"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: ".8rem 1rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".8rem", color: "#C9A84C", fontWeight: 600, whiteSpace: "nowrap" }}>{p.numeroProcesso}</td>
                      <td style={{ padding: ".8rem 1rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".78rem", color: "#e8eaf0", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.tribunal}</td>
                      <td style={{ padding: ".8rem 1rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".78rem", color: "#8892a4", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.classeProcessual || "—"}</td>
                      <td style={{ padding: ".8rem 1rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".78rem", color: "#8892a4", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.requerente || "—"}</td>
                      <td style={{ padding: ".8rem 1rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".78rem", color: "#8892a4", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.advogado || "—"}</td>
                      <td style={{ padding: ".8rem 1rem" }}><StatusBadge status={p.status} /></td>
                      <td style={{ padding: ".8rem 1rem" }}>
                        <div style={{ display: "flex", gap: ".4rem" }}>
                          <Link to={`/JusTrackDetalhes?id=${p.id}`}
                            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.2)", color: "#C9A84C", cursor: "pointer", textDecoration: "none" }}
                            title="Ver detalhes"
                          >
                            <Eye style={{ width: 13, height: 13 }} />
                          </Link>
                          <Link to={`/JusTrackEditar?id=${p.id}`}
                            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: "rgba(148,163,184,.08)", border: "1px solid #1e2740", color: "#8892a4", cursor: "pointer", textDecoration: "none" }}
                            title="Editar"
                          >
                            <Edit2 style={{ width: 13, height: 13 }} />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", color: "#f87171", cursor: "pointer" }}
                            title="Excluir"
                          >
                            <Trash2 style={{ width: 13, height: 13 }} />
                          </button>
                        </div>
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
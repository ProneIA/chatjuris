import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Edit2, RefreshCw, Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import JusTrackLayout from "@/components/justrack/JusTrackLayout";
import StatusBadge from "@/components/justrack/StatusBadge";

function parseProcesso(hit) {
  const s = hit._source || {};
  const movimentos = s.movimentos || [];
  const ultimo = movimentos[movimentos.length - 1];
  return {
    classeProcessual: s.classe?.nome || s.classeProcessual || "",
    orgaoJulgador: s.orgaoJulgador?.nome || s.orgaoJulgador || "",
    ultimoMovimento: ultimo?.nome || ultimo?.descricao || "",
    dataUltimoMovimento: ultimo?.dataHora?.split("T")[0] || "",
    movimentos: movimentos.map(m => ({ dataHora: m.dataHora || "", descricao: m.nome || m.descricao || "" })),
    dadosApiRaw: JSON.stringify(s).slice(0, 8000),
  };
}

export default function JusTrackDetalhes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const { data: processo, isLoading } = useQuery({
    queryKey: ["processo", id],
    queryFn: () => base44.entities.Processo.filter({ id }),
    select: d => d[0],
    enabled: !!id,
  });

  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState(null);

  const handleAtualizar = async () => {
    if (!processo?.tribunalUrl || !processo?.numeroProcesso) {
      setUpdateMsg({ type: "error", text: "Tribunal ou número do processo não configurado para busca." });
      return;
    }
    setUpdating(true); setUpdateMsg(null);
    try {
      const res = await base44.functions.invoke("datajudSearch", {
        numeroProcesso: processo.numeroProcesso,
        tribunalUrl: processo.tribunalUrl,
      });
      const hits = res?.data?.hits || [];
      if (hits.length === 0) {
        setUpdateMsg({ type: "warn", text: "Nenhuma atualização encontrada na API DataJud." });
      } else {
        const parsed = parseProcesso(hits[0]);
        await base44.entities.Processo.update(id, {
          ultimoMovimento: parsed.ultimoMovimento,
          dataUltimoMovimento: parsed.dataUltimoMovimento,
          movimentos: parsed.movimentos,
          dadosApiRaw: parsed.dadosApiRaw,
          classeProcessual: parsed.classeProcessual || processo.classeProcessual,
          orgaoJulgador: parsed.orgaoJulgador || processo.orgaoJulgador,
        });
        queryClient.invalidateQueries({ queryKey: ["processo", id] });
        setUpdateMsg({ type: "success", text: "Movimentações atualizadas com sucesso!" });
      }
    } catch (e) {
      setUpdateMsg({ type: "error", text: "A API DataJud não respondeu. Tente novamente mais tarde." });
    } finally {
      setUpdating(false);
    }
  };

  const Row = ({ label, value }) => (
    <div>
      <p style={{ fontSize: ".68rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".1em", margin: "0 0 .2rem", fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: ".85rem", color: "#e8eaf0", fontFamily: "'IBM Plex Sans', sans-serif", margin: 0 }}>{value || "—"}</p>
    </div>
  );

  if (isLoading) return (
    <JusTrackLayout>
      <div style={{ padding: "4rem", textAlign: "center", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif" }}>Carregando...</div>
    </JusTrackLayout>
  );

  if (!processo) return (
    <JusTrackLayout>
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <p style={{ color: "#f87171", fontFamily: "'IBM Plex Sans', sans-serif" }}>Processo não encontrado.</p>
        <Link to="/JusTrackProcessos" style={{ color: "#C9A84C", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".85rem" }}>← Voltar</Link>
      </div>
    </JusTrackLayout>
  );

  const movimentos = processo.movimentos || [];

  return (
    <JusTrackLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/JusTrackProcessos")} style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer", display: "flex", alignItems: "center", gap: ".4rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".8rem" }}>
              <ArrowLeft style={{ width: 14, height: 14 }} />
            </button>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.4rem", color: "#C9A84C", margin: 0 }}>
                {processo.numeroProcesso}
              </h1>
              <p style={{ color: "#8892a4", fontSize: ".82rem", margin: ".2rem 0 0", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                {processo.tribunal}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <StatusBadge status={processo.status} />
            <Link to={`/JusTrackEditar?id=${id}`}
              style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".55rem 1rem", background: "transparent", border: "1px solid #1e2740", color: "#8892a4", textDecoration: "none", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".78rem" }}>
              <Edit2 style={{ width: 12, height: 12 }} /> Editar
            </Link>
          </div>
        </div>

        {/* Dados principais */}
        <div style={{ background: "#161b27", border: "1px solid #1e2740" }}>
          <div style={{ padding: ".9rem 1.5rem", borderBottom: "1px solid #1e2740" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: ".95rem", color: "#e8eaf0", margin: 0 }}>Dados do Processo</h2>
          </div>
          <div style={{ padding: "1.25rem 1.5rem" }} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Row label="Número" value={processo.numeroProcesso} />
            <Row label="Tribunal" value={processo.tribunal} />
            <Row label="Classe Processual" value={processo.classeProcessual} />
            <Row label="Tipo de Ação" value={processo.tipoAcao} />
            <Row label="Órgão Julgador" value={processo.orgaoJulgador} />
            <Row label="Status" value={processo.status} />
            <Row label="Requerente" value={processo.requerente} />
            <Row label="Requerido" value={processo.requerido} />
            <Row label="Advogado" value={processo.advogado} />
            <Row label="Data de Distribuição" value={processo.dataDistribuicao ? new Date(processo.dataDistribuicao).toLocaleDateString("pt-BR") : null} />
            <Row label="Valor da Causa" value={processo.valorCausa ? `R$ ${Number(processo.valorCausa).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : null} />
            {processo.observacoes && (
              <div className="md:col-span-2"><Row label="Observações" value={processo.observacoes} /></div>
            )}
          </div>
        </div>

        {/* Movimentações */}
        <div style={{ background: "#161b27", border: "1px solid #1e2740" }}>
          <div style={{ padding: ".9rem 1.5rem", borderBottom: "1px solid #1e2740", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: ".75rem" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: ".95rem", color: "#e8eaf0", margin: 0 }}>
              Últimas Movimentações
            </h2>
            <button
              onClick={handleAtualizar}
              disabled={updating}
              style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".5rem 1rem", background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.3)", color: "#C9A84C", cursor: updating ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".75rem", opacity: updating ? .7 : 1 }}
            >
              {updating ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <RefreshCw style={{ width: 13, height: 13 }} />}
              {updating ? "Atualizando..." : "Atualizar via DataJud"}
            </button>
          </div>

          {/* Feedback */}
          {updateMsg && (
            <div style={{ padding: ".75rem 1.5rem", borderBottom: "1px solid #1e2740", display: "flex", alignItems: "center", gap: ".5rem", background: updateMsg.type === "success" ? "rgba(74,222,128,.06)" : updateMsg.type === "warn" ? "rgba(251,191,36,.06)" : "rgba(248,113,113,.06)" }}>
              {updateMsg.type === "success" ? <CheckCircle2 style={{ width: 14, height: 14, color: "#4ade80" }} /> : <AlertCircle style={{ width: 14, height: 14, color: updateMsg.type === "warn" ? "#fbbf24" : "#f87171" }} />}
              <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".78rem", color: updateMsg.type === "success" ? "#4ade80" : updateMsg.type === "warn" ? "#fbbf24" : "#f87171", margin: 0 }}>
                {updateMsg.text}
              </p>
            </div>
          )}

          <div style={{ padding: "1.25rem 1.5rem" }}>
            {movimentos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <Clock style={{ width: 24, height: 24, color: "#2a3550", margin: "0 auto .5rem", display: "block" }} />
                <p style={{ color: "#4a5568", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".82rem" }}>
                  Nenhuma movimentação registrada. Clique em "Atualizar via DataJud" para buscar.
                </p>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                {/* Linha vertical da timeline */}
                <div style={{ position: "absolute", left: 7, top: 0, bottom: 0, width: 1, background: "#1e2740" }} />
                <div className="space-y-4">
                  {[...movimentos].reverse().map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: "1.25rem", paddingLeft: ".25rem" }}>
                      <div style={{ width: 15, height: 15, borderRadius: "50%", background: i === 0 ? "#C9A84C" : "#1e2740", border: i === 0 ? "2px solid #C9A84C" : "2px solid #2a3550", flexShrink: 0, marginTop: 2, position: "relative", zIndex: 1 }} />
                      <div style={{ flex: 1, paddingBottom: ".75rem", borderBottom: i < movimentos.length - 1 ? "1px solid #1a2035" : "none" }}>
                        {m.dataHora && (
                          <p style={{ fontSize: ".68rem", color: "#4a5568", fontFamily: "'IBM Plex Sans', sans-serif", margin: "0 0 .2rem", letterSpacing: ".05em" }}>
                            {new Date(m.dataHora).toLocaleString("pt-BR")}
                          </p>
                        )}
                        <p style={{ fontSize: ".82rem", color: i === 0 ? "#e8eaf0" : "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", margin: 0 }}>
                          {m.descricao || "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </JusTrackLayout>
  );
}
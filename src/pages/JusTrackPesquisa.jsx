import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Save, AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import JusTrackLayout from "@/components/justrack/JusTrackLayout";
import TribunalSelect, { TRIBUNAIS, getTribunalNome } from "@/components/justrack/TribunalSelect";

function maskCNJ(v) {
  v = v.replace(/\D/g, "");
  if (v.length > 20) v = v.slice(0, 20);
  let r = v;
  if (v.length > 7) r = v.slice(0,7) + "-" + v.slice(7);
  if (v.length > 9) r = v.slice(0,7) + "-" + v.slice(7,9) + "." + v.slice(9);
  if (v.length > 13) r = v.slice(0,7) + "-" + v.slice(7,9) + "." + v.slice(9,13) + "." + v.slice(13);
  if (v.length > 14) r = v.slice(0,7) + "-" + v.slice(7,9) + "." + v.slice(9,13) + "." + v.slice(13,14) + "." + v.slice(14);
  if (v.length > 16) r = v.slice(0,7) + "-" + v.slice(7,9) + "." + v.slice(9,13) + "." + v.slice(13,14) + "." + v.slice(14,16) + "." + v.slice(16);
  return r;
}

function parseProcesso(hit) {
  const s = hit._source || {};
  const movimentos = s.movimentos || [];
  const ultimo = movimentos[movimentos.length - 1];
  return {
    numeroProcesso: s.numeroProcesso || "",
    classeProcessual: s.classe?.nome || s.classeProcessual || "",
    orgaoJulgador: s.orgaoJulgador?.nome || s.orgaoJulgador || "",
    dataDistribuicao: s.dataAjuizamento || s.dataDistribuicao || "",
    ultimoMovimento: ultimo?.nome || ultimo?.descricao || "",
    dataUltimoMovimento: ultimo?.dataHora?.split("T")[0] || "",
    movimentos: movimentos.map(m => ({ dataHora: m.dataHora || "", descricao: m.nome || m.descricao || "" })),
    dadosApiRaw: JSON.stringify(s).slice(0, 8000),
  };
}

export default function JusTrackPesquisa() {
  const [tipoBusca, setTipoBusca] = useState("numero"); // "numero" | "parte"
  const [numero, setNumero] = useState("");
  const [nomeParte, setNomeParte] = useState("");
  const [tribunalUrl, setTribunalUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]); // múltiplos resultados para busca por parte
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSearch = async () => {
    if (tipoBusca === "numero" && !numero.trim()) { setErro("Digite o número do processo."); return; }
    if (tipoBusca === "parte" && !nomeParte.trim()) { setErro("Digite o nome da parte."); return; }
    if (!tribunalUrl) { setErro("Selecione o tribunal."); return; }
    setErro(""); setResultado(null); setResultados([]); setSaved(false); setLoading(true);
    try {
      const payload = tipoBusca === "numero"
        ? { numeroProcesso: numero.replace(/\D/g, "").replace(/(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/, "$1-$2.$3.$4.$5.$6"), tribunalUrl }
        : { nomeParte: nomeParte.trim(), tribunalUrl };
      const res = await base44.functions.invoke("datajudSearch", payload);
      const hits = res?.data?.hits || [];
      if (hits.length === 0) {
        setErro("Nenhum processo encontrado. Verifique os dados ou cadastre manualmente.");
      } else if (tipoBusca === "parte") {
        setResultados(hits.map(h => parseProcesso(h)));
      } else {
        setResultado(parseProcesso(hits[0]));
      }
    } catch (e) {
      setErro("A API DataJud não respondeu. Verifique sua conexão ou cadastre o processo manualmente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!resultado) return;
    setSaving(true);
    try {
      const tribunalNome = getTribunalNome(tribunalUrl);
      await base44.entities.Processo.create({
        ...resultado,
        tribunal: tribunalNome,
        tribunalUrl,
        status: "Ativo",
      });
      setSaved(true);
    } catch (e) {
      setErro("Erro ao salvar o processo: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    background: "#161b27",
    border: "1px solid #1e2740",
    color: "#e8eaf0",
    padding: ".65rem .9rem",
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: ".85rem",
    outline: "none",
    width: "100%",
  };

  const labelStyle = {
    display: "block",
    fontSize: ".72rem",
    color: "#8892a4",
    fontFamily: "'IBM Plex Sans', sans-serif",
    textTransform: "uppercase",
    letterSpacing: ".1em",
    marginBottom: ".4rem",
    fontWeight: 600,
  };

  return (
    <JusTrackLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.6rem", color: "#C9A84C", margin: 0 }}>
            Pesquisar Processo
          </h1>
          <p style={{ color: "#8892a4", fontSize: ".85rem", margin: ".25rem 0 0", fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Consulta em tempo real via API Pública DataJud — CNJ
          </p>
        </div>

        {/* Formulário */}
        <div style={{ background: "#161b27", border: "1px solid #1e2740", padding: "1.5rem" }}>
          <div className="space-y-4">
            {/* Toggle tipo de busca */}
            <div style={{ display: "flex", gap: 0, border: "1px solid #1e2740", width: "fit-content" }}>
              {[["numero", "Por Número CNJ"], ["parte", "Por Nome da Parte"]].map(([val, label]) => (
                <button key={val} onClick={() => { setTipoBusca(val); setErro(""); setResultado(null); setResultados([]); }}
                  style={{ padding: ".45rem 1rem", background: tipoBusca === val ? "#C9A84C" : "transparent", border: "none", color: tipoBusca === val ? "#0d1117" : "#8892a4", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: tipoBusca === val ? 700 : 400, fontSize: ".75rem", letterSpacing: ".04em" }}>
                  {label}
                </button>
              ))}
            </div>

            {tipoBusca === "numero" ? (
              <div>
                <label style={labelStyle}>Número do Processo (formato CNJ)</label>
                <input style={inputStyle} placeholder="0000000-00.0000.0.00.0000" value={numero}
                  onChange={e => setNumero(maskCNJ(e.target.value))}
                  onKeyDown={e => e.key === "Enter" && handleSearch()} maxLength={25} />
              </div>
            ) : (
              <div>
                <label style={labelStyle}>Nome da Parte</label>
                <input style={inputStyle} placeholder="Ex: João da Silva ou Empresa LTDA"
                  value={nomeParte} onChange={e => setNomeParte(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()} />
                <p style={{ fontSize: ".68rem", color: "#4a5568", fontFamily: "'IBM Plex Sans', sans-serif", margin: ".3rem 0 0" }}>
                  Busca no campo <code style={{ color: "#C9A84C" }}>partes.nome</code> via Elasticsearch
                </p>
              </div>
            )}

            <div>
              <label style={labelStyle}>Tribunal</label>
              <TribunalSelect value={tribunalUrl} onChange={setTribunalUrl} style={{ background: "#161b27" }} />
            </div>
            <button onClick={handleSearch} disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".75rem 1.5rem", background: "#C9A84C", border: "none", color: "#0d1117", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: ".82rem", opacity: loading ? .7 : 1, letterSpacing: ".05em" }}>
              {loading ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Search style={{ width: 16, height: 16 }} />}
              {loading ? "Pesquisando..." : "Pesquisar na API DataJud"}
            </button>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div style={{ display: "flex", gap: ".75rem", background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.3)", padding: "1rem" }}>
            <AlertCircle style={{ width: 16, height: 16, color: "#f87171", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ color: "#f87171", fontSize: ".82rem", fontFamily: "'IBM Plex Sans', sans-serif", margin: "0 0 .3rem", fontWeight: 600 }}>Nenhum resultado</p>
              <p style={{ color: "#f87171", fontSize: ".8rem", fontFamily: "'IBM Plex Sans', sans-serif", margin: 0, opacity: .8 }}>{erro}</p>
              <a href="/JusTrackNovo" style={{ display: "inline-block", marginTop: ".5rem", color: "#C9A84C", fontSize: ".78rem", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                → Cadastrar manualmente
              </a>
            </div>
          </div>
        )}

        {/* Múltiplos resultados (busca por parte) */}
        {resultados.length > 0 && (
          <div style={{ background: "#161b27", border: "1px solid #1e2740" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #1e2740", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "1rem", color: "#C9A84C", margin: 0 }}>
                {resultados.length} processo{resultados.length !== 1 ? "s" : ""} encontrado{resultados.length !== 1 ? "s" : ""}
              </h3>
            </div>
            {resultados.map((r, i) => (
              <div key={i} style={{ padding: "1rem 1.5rem", borderBottom: i < resultados.length - 1 ? "1px solid #1a2035" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: ".5rem" }}
                onMouseEnter={e => e.currentTarget.style.background = "#1a2035"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div>
                  <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, color: "#C9A84C", fontSize: ".85rem", margin: "0 0 .15rem" }}>{r.numeroProcesso || "—"}</p>
                  <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "#8892a4", fontSize: ".75rem", margin: 0 }}>
                    {r.classeProcessual || ""}{r.classeProcessual && r.orgaoJulgador ? " · " : ""}{r.orgaoJulgador || ""}
                  </p>
                </div>
                <button onClick={async () => {
                  const tribunalNome = getTribunalNome(tribunalUrl);
                  await base44.entities.Processo.create({ ...r, tribunal: tribunalNome, tribunalUrl, status: "Ativo" });
                  alert("Processo salvo com sucesso!");
                }} style={{ padding: ".4rem .9rem", background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.3)", color: "#C9A84C", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".72rem" }}>
                  <Save style={{ width: 12, height: 12, display: "inline", marginRight: 4 }} />Salvar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Resultado único (busca por número) */}
        {resultado && (
          <div style={{ background: "#161b27", border: "1px solid #1e2740" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #1e2740", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "1rem", color: "#C9A84C", margin: 0 }}>
                Processo Encontrado
              </h3>
              <span style={{ fontSize: ".68rem", background: "rgba(74,222,128,.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,.3)", padding: ".2rem .6rem", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 }}>
                LOCALIZADO
              </span>
            </div>

            <div style={{ padding: "1.25rem 1.5rem" }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ["Número do Processo", resultado.numeroProcesso],
                ["Tribunal", getTribunalNome(tribunalUrl)],
                ["Classe Processual", resultado.classeProcessual],
                ["Órgão Julgador", resultado.orgaoJulgador],
                ["Data de Ajuizamento", resultado.dataDistribuicao ? new Date(resultado.dataDistribuicao).toLocaleDateString("pt-BR") : "—"],
                ["Último Movimento", resultado.ultimoMovimento],
                ["Data do Último Movimento", resultado.dataUltimoMovimento ? new Date(resultado.dataUltimoMovimento).toLocaleDateString("pt-BR") : "—"],
              ].map(([k, v]) => v && (
                <div key={k}>
                  <p style={{ fontSize: ".68rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".1em", margin: "0 0 .2rem", fontWeight: 600 }}>{k}</p>
                  <p style={{ fontSize: ".85rem", color: "#e8eaf0", fontFamily: "'IBM Plex Sans', sans-serif", margin: 0 }}>{v || "—"}</p>
                </div>
              ))}
            </div>

            <div style={{ padding: "0 1.5rem 1.5rem", display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
              {saved ? (
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", color: "#4ade80", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".82rem" }}>
                  <CheckCircle2 style={{ width: 16, height: 16 }} />
                  Processo salvo com sucesso!
                </div>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".65rem 1.25rem", background: "#C9A84C", border: "none", color: "#0d1117", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: ".78rem", opacity: saving ? .7 : 1 }}
                >
                  {saving ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Save style={{ width: 14, height: 14 }} />}
                  {saving ? "Salvando..." : "Salvar Processo"}
                </button>
              )}
              <button
                onClick={() => { setResultado(null); setNumero(""); setTribunalUrl(""); setSaved(false); }}
                style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".65rem 1.25rem", background: "transparent", border: "1px solid #1e2740", color: "#8892a4", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".78rem" }}
              >
                <RefreshCw style={{ width: 14, height: 14 }} />
                Nova Pesquisa
              </button>
            </div>
          </div>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </JusTrackLayout>
  );
}
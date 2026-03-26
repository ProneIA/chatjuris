import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Search, Save, CheckCircle2, Loader2, User, AlertTriangle,
  ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight,
  Settings, Hash
} from "lucide-react";
import JusTrackLayout from "@/components/justrack/JusTrackLayout";
import StatusBadge from "@/components/justrack/StatusBadge";
import { TRIBUNAIS as TRIBUNAIS_LIST } from "@/components/justrack/TribunalSelect";

const SECCIONAIS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO","Federal"];

const TRIBUNAL_NOMES = [
  "TST","TSE","STJ","STM","TRF1","TRF2","TRF3","TRF4","TRF5","TRF6",
  "TJAC","TJAL","TJAM","TJAP","TJBA","TJCE","TJDFT","TJES","TJGO","TJMA",
  "TJMG","TJMS","TJMT","TJPA","TJPB","TJPE","TJPI","TJPR","TJRJ","TJRN",
  "TJRO","TJRR","TJRS","TJSC","TJSE","TJSP","TJTO"
];

const inputStyle = { background: "#0d1117", border: "1px solid #1e2740", color: "#e8eaf0", padding: ".6rem .85rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".85rem", outline: "none", width: "100%" };
const labelStyle = { display: "block", fontSize: ".68rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".3rem", fontWeight: 600 };
const PAGE_SIZE = 20;

function parseRelativeTime(dt) {
  if (!dt) return "nunca";
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return `há ${Math.floor(hrs / 24)}d`;
}

export default function JusTrackBuscaAdvogado() {
  const queryClient = useQueryClient();

  const { data: perfis = [] } = useQuery({
    queryKey: ["perfilOAB"],
    queryFn: () => base44.entities.PerfilOAB.list("-created_date", 1),
  });
  const perfil = perfis[0] || null;

  const { data: processosSalvos = [] } = useQuery({
    queryKey: ["processos"],
    queryFn: () => base44.entities.Processo.list("-created_date", 1000),
  });

  // Toggle de modo
  const [modo, setModo] = useState("nome"); // "nome" | "oab"

  // Form busca por nome
  const [nomeForm, setNomeForm] = useState({ nomeAdvogado: "", tribunalNome: "" });

  // Form busca por OAB (via Judit)
  const [oabForm, setOabForm] = useState({ numeroOAB: "", seccional: "" });

  const [buscando, setBuscando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultados, setResultados] = useState(null);
  const [badges, setBadges] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [salvoMsg, setSalvoMsg] = useState("");
  const [selecionados, setSelecionados] = useState(new Set());
  const [erro, setErro] = useState("");

  // Filtros tabela
  const [busca, setBusca] = useState("");
  const [filtroTribunal, setFiltroTribunal] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroClasse, setFiltroClasse] = useState("");
  const [sortCol, setSortCol] = useState("dataDistribuicao");
  const [sortDir, setSortDir] = useState("desc");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    if (perfil) {
      if (perfil.nomeAdvogado) setNomeForm(f => ({ ...f, nomeAdvogado: perfil.nomeAdvogado }));
      if (perfil.numeroOAB) setOabForm(f => ({ ...f, numeroOAB: perfil.numeroOAB, seccional: perfil.seccional || "" }));
    }
  }, [perfil]);

  const juditKey = perfil?.juditApiKey || "";

  const handleBuscarPorNome = async () => {
    if (!nomeForm.nomeAdvogado.trim() || nomeForm.nomeAdvogado.trim().length < 3) {
      setErro("Digite pelo menos 3 caracteres no nome.");
      return;
    }
    setErro("");
    setBuscando(true); setProgresso(5); setResultados(null); setSalvoMsg(""); setSelecionados(new Set());
    const timer = setInterval(() => setProgresso(p => Math.min(p + 2, 90)), 600);

    try {
      const res = await base44.functions.invoke("datajudNameSearch", {
        nomeAdvogado: nomeForm.nomeAdvogado.trim(),
        tribunalNome: nomeForm.tribunalNome || undefined,
      });
      clearInterval(timer);
      setProgresso(100);
      const { processos = [], totalTribunais = 0, tribunais = [] } = res.data;
      processarResultados(processos, totalTribunais, tribunais);

      // Salva nome no perfil
      const update = { nomeAdvogado: nomeForm.nomeAdvogado.trim(), ultimaSincronizacao: new Date().toISOString(), totalProcessosEncontrados: processos.length };
      if (perfil?.id) await base44.entities.PerfilOAB.update(perfil.id, update);
      else await base44.entities.PerfilOAB.create({ seccional: "SP", ...update });
      queryClient.invalidateQueries({ queryKey: ["perfilOAB"] });

    } catch (e) {
      clearInterval(timer);
      setProgresso(0);
      setErro("Erro na busca. Tente novamente.");
    } finally {
      setBuscando(false);
      setTimeout(() => setProgresso(0), 800);
    }
  };

  const handleBuscarPorOAB = async () => {
    if (!oabForm.numeroOAB.trim() || !oabForm.seccional) {
      setErro("Preencha o número OAB e a seccional.");
      return;
    }
    setErro("");
    setBuscando(true); setProgresso(5); setResultados(null); setSalvoMsg(""); setSelecionados(new Set());
    const timer = setInterval(() => setProgresso(p => Math.min(p + 3, 92)), 800);

    try {
      const url = `https://requests.judit.io/api/oab?oab_number=${oabForm.numeroOAB.trim()}&uf=${oabForm.seccional}`;
      const response = await fetch(url, {
        headers: { "api-key": juditKey, "Content-Type": "application/json" }
      });
      const data = await response.json();
      clearInterval(timer);
      setProgresso(100);

      // A Judit retorna uma lista de processos — adaptar ao formato interno
      const rawProcessos = Array.isArray(data) ? data : (data.data || data.processos || []);
      const processos = rawProcessos.map(p => ({
        numeroProcesso: p.numero_cnj || p.numeroProcesso || p.numero || "",
        tribunal: p.tribunal || p.tribunal_nome || "",
        classeProcessual: p.classe || p.classeProcessual || "",
        orgaoJulgador: p.orgao_julgador || p.orgaoJulgador || "",
        dataDistribuicao: p.data_ajuizamento || p.dataDistribuicao || "",
        ultimoMovimento: p.ultimo_movimento?.descricao || p.ultimoMovimento || "",
        dataUltimoMovimento: p.ultimo_movimento?.data || p.dataUltimoMovimento || "",
        status: "Ativo",
        dadosApiRaw: JSON.stringify(p).slice(0, 4000),
      })).filter(p => p.numeroProcesso);

      processarResultados(processos, [...new Set(processos.map(p => p.tribunal))].length, [...new Set(processos.map(p => p.tribunal))]);

      // Salva OAB no perfil
      const update = { numeroOAB: oabForm.numeroOAB.trim(), seccional: oabForm.seccional, ultimaSincronizacao: new Date().toISOString(), totalProcessosEncontrados: processos.length };
      if (perfil?.id) await base44.entities.PerfilOAB.update(perfil.id, update);
      else await base44.entities.PerfilOAB.create({ seccional: oabForm.seccional, ...update });
      queryClient.invalidateQueries({ queryKey: ["perfilOAB"] });

    } catch (e) {
      clearInterval(timer);
      setProgresso(0);
      setErro("Erro na busca via Judit. Verifique sua API Key em Configurações.");
    } finally {
      setBuscando(false);
      setTimeout(() => setProgresso(0), 800);
    }
  };

  function processarResultados(processos, totalTribunais, tribunais) {
    const numerosExistentes = new Set(processosSalvos.map(p => p.numeroProcesso));
    const newBadges = {};
    for (const p of processos) {
      if (!numerosExistentes.has(p.numeroProcesso)) {
        newBadges[p.numeroProcesso] = "novo";
      } else {
        const existente = processosSalvos.find(e => e.numeroProcesso === p.numeroProcesso);
        if (existente && p.ultimoMovimento && p.ultimoMovimento !== existente.ultimoMovimento) {
          newBadges[p.numeroProcesso] = "atualizado";
        }
      }
    }
    setBadges(newBadges);
    setResultados({ processos, totalTribunais, tribunais });
  }

  const salvarProcessos = async (lista) => {
    setSalvando(true); setSalvoMsg("");
    const existentes = new Set(processosSalvos.map(p => p.numeroProcesso));
    const novos = lista.filter(p => !existentes.has(p.numeroProcesso));
    for (const p of novos) await base44.entities.Processo.create(p);
    queryClient.invalidateQueries({ queryKey: ["processos"] });
    setSalvoMsg(`${novos.length} processo${novos.length !== 1 ? "s" : ""} salvo${novos.length !== 1 ? "s" : ""}. ${lista.length - novos.length} já existiam.`);
    setSalvando(false);
  };

  const processados = useMemo(() => {
    if (!resultados) return [];
    let arr = [...resultados.processos];
    if (busca) arr = arr.filter(p => p.numeroProcesso?.includes(busca) || p.classeProcessual?.toLowerCase().includes(busca.toLowerCase()) || p.orgaoJulgador?.toLowerCase().includes(busca.toLowerCase()));
    if (filtroTribunal) arr = arr.filter(p => p.tribunal === filtroTribunal);
    if (filtroStatus) arr = arr.filter(p => p.status === filtroStatus);
    if (filtroClasse) arr = arr.filter(p => p.classeProcessual === filtroClasse);
    arr.sort((a, b) => {
      const va = a[sortCol] || ""; const vb = b[sortCol] || "";
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return arr;
  }, [resultados, busca, filtroTribunal, filtroStatus, filtroClasse, sortCol, sortDir]);

  const totalPaginas = Math.ceil(processados.length / PAGE_SIZE);
  const paginaAtual = Math.min(pagina, totalPaginas || 1);
  const paginados = processados.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setPagina(1);
  };

  const toggleSel = (num) => {
    const ns = new Set(selecionados);
    ns.has(num) ? ns.delete(num) : ns.add(num);
    setSelecionados(ns);
  };

  const toggleTodos = () => {
    if (selecionados.size === paginados.length) setSelecionados(new Set());
    else setSelecionados(new Set(paginados.map(p => p.numeroProcesso)));
  };

  const stats = useMemo(() => {
    if (!resultados) return null;
    const ps = resultados.processos;
    const porClasse = {};
    for (const p of ps) {
      if (p.classeProcessual) porClasse[p.classeProcessual] = (porClasse[p.classeProcessual] || 0) + 1;
    }
    const topClasses = Object.entries(porClasse).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const novos = Object.values(badges).filter(b => b === "novo").length;
    const atualizados = Object.values(badges).filter(b => b === "atualizado").length;
    return { total: ps.length, topClasses, novos, atualizados };
  }, [resultados, badges]);

  const SortIcon = ({ col }) => sortCol === col
    ? (sortDir === "asc" ? <ChevronUp style={{ width: 11, height: 11, display: "inline" }} /> : <ChevronDown style={{ width: 11, height: 11, display: "inline" }} />)
    : null;

  const classesUnicas = useMemo(() => {
    if (!resultados) return [];
    return [...new Set(resultados.processos.map(p => p.classeProcessual).filter(Boolean))].sort();
  }, [resultados]);

  const tribunaisUnicos = useMemo(() => {
    if (!resultados) return [];
    return [...new Set(resultados.processos.map(p => p.tribunal))].sort();
  }, [resultados]);

  return (
    <JusTrackLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: ".75rem" }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.6rem", color: "#C9A84C", margin: 0 }}>
              Busca por Advogado
            </h1>
            <p style={{ color: "#8892a4", fontSize: ".85rem", margin: ".25rem 0 0", fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Encontre processos por nome do advogado ou número OAB
            </p>
          </div>
          <Link to="/JusTrackConfiguracoes"
            style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".45rem .85rem", background: "transparent", border: "1px solid #1e2740", color: "#8892a4", textDecoration: "none", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".72rem", fontWeight: 600 }}>
            <Settings style={{ width: 13, height: 13 }} /> Configurações
          </Link>
        </div>

        {/* Toggle modo */}
        <div style={{ display: "flex", background: "#0d1117", border: "1px solid #1e2740", width: "fit-content" }}>
          {[
            { key: "nome", label: "Busca por Nome", icon: User },
            { key: "oab", label: "Busca por OAB", icon: Hash },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setModo(key); setResultados(null); setErro(""); }}
              style={{
                display: "flex", alignItems: "center", gap: ".4rem",
                padding: ".6rem 1.2rem", border: "none", cursor: "pointer",
                fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".78rem",
                background: modo === key ? "#C9A84C" : "transparent",
                color: modo === key ? "#0d1117" : "#8892a4",
                transition: "all .15s"
              }}>
              <Icon style={{ width: 14, height: 14 }} />
              {label}
            </button>
          ))}
        </div>

        {/* Formulário por Nome */}
        {modo === "nome" && (
          <div style={{ background: "#161b27", border: "1px solid #1e2740" }}>
            <div style={{ padding: ".9rem 1.5rem", borderBottom: "1px solid #1e2740", display: "flex", alignItems: "center", gap: ".6rem" }}>
              <User style={{ width: 15, height: 15, color: "#C9A84C" }} />
              <h2 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".9rem", color: "#e8eaf0", margin: 0 }}>
                Buscar por Nome do Advogado
              </h2>
            </div>

            {/* Aviso */}
            <div style={{ margin: "1rem 1.5rem 0", background: "rgba(251,191,36,.06)", border: "1px solid rgba(251,191,36,.2)", padding: ".75rem 1rem", display: "flex", alignItems: "flex-start", gap: ".6rem" }}>
              <AlertTriangle style={{ width: 14, height: 14, color: "#fbbf24", flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".78rem", color: "#fbbf24", margin: 0, lineHeight: 1.5 }}>
                A busca por nome pode trazer resultados imprecisos. Para resultados exatos por OAB, conecte uma API jurídica especializada —{" "}
                <Link to="/JusTrackConfiguracoes" style={{ color: "#C9A84C" }}>ver configurações</Link>.
              </p>
            </div>

            <div style={{ padding: "1rem 1.5rem" }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label style={labelStyle}>Nome do Advogado *</label>
                  <input style={inputStyle} placeholder="Ex: João Silva" value={nomeForm.nomeAdvogado}
                    onChange={e => setNomeForm(f => ({ ...f, nomeAdvogado: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleBuscarPorNome()} />
                </div>
                <div>
                  <label style={labelStyle}>Tribunal (opcional)</label>
                  <select style={{ ...inputStyle, cursor: "pointer" }} value={nomeForm.tribunalNome}
                    onChange={e => setNomeForm(f => ({ ...f, tribunalNome: e.target.value }))}>
                    <option value="">Todos os tribunais</option>
                    {TRIBUNAL_NOMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {buscando && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".35rem" }}>
                    <span style={{ fontSize: ".72rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      {nomeForm.tribunalNome ? `Consultando ${nomeForm.tribunalNome}...` : "Consultando todos os tribunais..."}
                    </span>
                    <span style={{ fontSize: ".72rem", color: "#C9A84C", fontFamily: "'IBM Plex Sans', sans-serif" }}>{progresso}%</span>
                  </div>
                  <div style={{ height: 4, background: "#1e2740" }}>
                    <div style={{ height: "100%", background: "#C9A84C", width: `${progresso}%`, transition: "width .4s ease" }} />
                  </div>
                </div>
              )}

              {erro && (
                <p style={{ color: "#f87171", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".78rem", marginBottom: ".75rem" }}>{erro}</p>
              )}

              <button onClick={handleBuscarPorNome} disabled={buscando || !nomeForm.nomeAdvogado.trim()}
                style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", padding: ".7rem 1.5rem", background: "#C9A84C", border: "none", color: "#0d1117", cursor: buscando || !nomeForm.nomeAdvogado.trim() ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: ".82rem", opacity: buscando || !nomeForm.nomeAdvogado.trim() ? .6 : 1 }}>
                {buscando ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <Search style={{ width: 15, height: 15 }} />}
                {buscando ? "Buscando..." : "Pesquisar"}
              </button>
            </div>
          </div>
        )}

        {/* Formulário por OAB */}
        {modo === "oab" && (
          <div style={{ background: "#161b27", border: "1px solid #1e2740" }}>
            <div style={{ padding: ".9rem 1.5rem", borderBottom: "1px solid #1e2740", display: "flex", alignItems: "center", gap: ".6rem" }}>
              <Hash style={{ width: 15, height: 15, color: "#C9A84C" }} />
              <h2 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".9rem", color: "#e8eaf0", margin: 0 }}>
                Buscar por Número OAB
              </h2>
              {juditKey && (
                <span style={{ marginLeft: "auto", fontSize: ".68rem", background: "rgba(74,222,128,.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,.2)", padding: ".15rem .5rem", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  Judit conectado
                </span>
              )}
            </div>

            {!juditKey ? (
              /* Sem API Key configurada */
              <div style={{ padding: "2rem 1.5rem", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                  <Hash style={{ width: 22, height: 22, color: "#C9A84C" }} />
                </div>
                <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".9rem", color: "#e8eaf0", fontWeight: 600, marginBottom: ".5rem" }}>
                  API não configurada
                </p>
                <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".82rem", color: "#8892a4", marginBottom: "1.5rem", maxWidth: 380, margin: "0 auto 1.5rem" }}>
                  Para buscar processos pelo número de OAB, você precisa de uma API jurídica especializada. A API pública do DataJud não suporta busca por OAB.
                </p>
                <div style={{ display: "flex", gap: ".75rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <Link to="/JusTrackConfiguracoes"
                    style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".65rem 1.25rem", background: "#C9A84C", color: "#0d1117", textDecoration: "none", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: ".8rem" }}>
                    <Settings style={{ width: 14, height: 14 }} /> Configurar API Judit
                  </Link>
                  <button onClick={() => setModo("nome")}
                    style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".65rem 1.25rem", background: "transparent", border: "1px solid #1e2740", color: "#8892a4", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".8rem" }}>
                    <User style={{ width: 14, height: 14 }} /> Buscar por nome do advogado
                  </button>
                </div>
              </div>
            ) : (
              /* Com API Key configurada */
              <div style={{ padding: "1.25rem 1.5rem" }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label style={labelStyle}>Número OAB *</label>
                    <input style={inputStyle} placeholder="Ex: 12345" value={oabForm.numeroOAB}
                      onChange={e => setOabForm(f => ({ ...f, numeroOAB: e.target.value.replace(/\D/g, "") }))}
                      onKeyDown={e => e.key === "Enter" && handleBuscarPorOAB()} />
                  </div>
                  <div>
                    <label style={labelStyle}>Seccional *</label>
                    <select style={{ ...inputStyle, cursor: "pointer" }} value={oabForm.seccional}
                      onChange={e => setOabForm(f => ({ ...f, seccional: e.target.value }))}>
                      <option value="">— UF —</option>
                      {SECCIONAIS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {buscando && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".35rem" }}>
                      <span style={{ fontSize: ".72rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif" }}>Consultando API Judit...</span>
                      <span style={{ fontSize: ".72rem", color: "#C9A84C", fontFamily: "'IBM Plex Sans', sans-serif" }}>{progresso}%</span>
                    </div>
                    <div style={{ height: 4, background: "#1e2740" }}>
                      <div style={{ height: "100%", background: "#C9A84C", width: `${progresso}%`, transition: "width .4s ease" }} />
                    </div>
                  </div>
                )}

                {erro && (
                  <p style={{ color: "#f87171", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".78rem", marginBottom: ".75rem" }}>{erro}</p>
                )}

                <button onClick={handleBuscarPorOAB} disabled={buscando || !oabForm.numeroOAB || !oabForm.seccional}
                  style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", padding: ".7rem 1.5rem", background: "#C9A84C", border: "none", color: "#0d1117", cursor: buscando || !oabForm.numeroOAB || !oabForm.seccional ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: ".82rem", opacity: buscando || !oabForm.numeroOAB || !oabForm.seccional ? .6 : 1 }}>
                  {buscando ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <Search style={{ width: 15, height: 15 }} />}
                  {buscando ? "Buscando via Judit..." : "Buscar por OAB"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resumo de stats */}
        {stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total encontrado", value: stats.total, color: "#C9A84C" },
                { label: "Tribunais", value: resultados.totalTribunais, color: "#60a5fa" },
                { label: "Processos novos", value: stats.novos, color: "#4ade80" },
                { label: "Com novas movimentações", value: stats.atualizados, color: "#fbbf24" },
              ].map(s => (
                <div key={s.label} style={{ background: "#161b27", border: "1px solid #1e2740", padding: "1rem 1.25rem" }}>
                  <p style={{ fontSize: ".68rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".1em", margin: "0 0 .4rem", fontWeight: 600 }}>{s.label}</p>
                  <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: "1.8rem", color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {(stats.novos > 0 || stats.atualizados > 0) && (
              <div style={{ background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.2)", padding: ".75rem 1.25rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".82rem", color: "#C9A84C" }}>
                {stats.novos > 0 && <span>{stats.novos} novo{stats.novos > 1 ? "s" : ""} processo{stats.novos > 1 ? "s" : ""}. </span>}
                {stats.atualizados > 0 && <span>{stats.atualizados} com novas movimentações.</span>}
              </div>
            )}

            {stats.topClasses.length > 0 && (
              <div style={{ background: "#161b27", border: "1px solid #1e2740", padding: "1.25rem 1.5rem" }}>
                <p style={{ ...labelStyle, marginBottom: ".75rem" }}>Top Classes Processuais</p>
                <div className="space-y-2">
                  {stats.topClasses.map(([classe, count]) => {
                    const pct = Math.round((count / stats.total) * 100);
                    return (
                      <div key={classe}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".2rem" }}>
                          <span style={{ fontSize: ".75rem", color: "#e8eaf0", fontFamily: "'IBM Plex Sans', sans-serif" }}>{classe}</span>
                          <span style={{ fontSize: ".75rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif" }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 3, background: "#1e2740" }}>
                          <div style={{ height: "100%", background: "#C9A84C", width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabela de resultados */}
        {resultados && (
          <div style={{ background: "#161b27", border: "1px solid #1e2740" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #1e2740" }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".9rem", color: "#e8eaf0", margin: 0 }}>
                  Resultados — {processados.length} processo{processados.length !== 1 ? "s" : ""}
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {selecionados.size > 0 && (
                    <button onClick={() => salvarProcessos(processados.filter(p => selecionados.has(p.numeroProcesso)))} disabled={salvando}
                      style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".45rem .9rem", background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.3)", color: "#C9A84C", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".72rem" }}>
                      <Save style={{ width: 12, height: 12 }} />Salvar selecionados ({selecionados.size})
                    </button>
                  )}
                  <button onClick={() => salvarProcessos(resultados.processos)} disabled={salvando}
                    style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".45rem .9rem", background: "#C9A84C", border: "none", color: "#0d1117", cursor: salvando ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: ".72rem", opacity: salvando ? .7 : 1 }}>
                    {salvando ? <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} /> : <Save style={{ width: 12, height: 12 }} />}
                    Salvar todos
                  </button>
                </div>
              </div>

              {salvoMsg && (
                <div style={{ marginTop: ".75rem", display: "flex", alignItems: "center", gap: ".5rem", color: "#4ade80", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".78rem" }}>
                  <CheckCircle2 style={{ width: 13, height: 13 }} />{salvoMsg}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                <input style={{ ...inputStyle, padding: ".45rem .7rem", fontSize: ".78rem" }} placeholder="Buscar..." value={busca} onChange={e => { setBusca(e.target.value); setPagina(1); }} />
                <select style={{ ...inputStyle, padding: ".45rem .7rem", fontSize: ".78rem", cursor: "pointer" }} value={filtroTribunal} onChange={e => { setFiltroTribunal(e.target.value); setPagina(1); }}>
                  <option value="">Todos os tribunais</option>
                  {tribunaisUnicos.map(t => <option key={t}>{t}</option>)}
                </select>
                <select style={{ ...inputStyle, padding: ".45rem .7rem", fontSize: ".78rem", cursor: "pointer" }} value={filtroClasse} onChange={e => { setFiltroClasse(e.target.value); setPagina(1); }}>
                  <option value="">Todas as classes</option>
                  {classesUnicas.map(c => <option key={c}>{c}</option>)}
                </select>
                <select style={{ ...inputStyle, padding: ".45rem .7rem", fontSize: ".78rem", cursor: "pointer" }} value={filtroStatus} onChange={e => { setFiltroStatus(e.target.value); setPagina(1); }}>
                  <option value="">Todos os status</option>
                  {["Ativo", "Arquivado", "Suspenso", "Baixado"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e2740" }}>
                    <th style={{ padding: ".65rem 1rem", width: 36 }}>
                      <input type="checkbox" checked={selecionados.size === paginados.length && paginados.length > 0} onChange={toggleTodos} style={{ cursor: "pointer", accentColor: "#C9A84C" }} />
                    </th>
                    {[
                      ["numeroProcesso", "Número"],
                      ["tribunal", "Tribunal"],
                      ["classeProcessual", "Classe"],
                      ["orgaoJulgador", "Órgão"],
                      ["dataDistribuicao", "Ajuizamento"],
                      ["ultimoMovimento", "Último Mov."],
                    ].map(([col, label]) => (
                      <th key={col} onClick={() => toggleSort(col)}
                        style={{ padding: ".65rem 1rem", textAlign: "left", fontSize: ".64rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                        {label} <SortIcon col={col} />
                      </th>
                    ))}
                    <th style={{ padding: ".65rem 1rem", fontSize: ".64rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase" }}>Status</th>
                    <th style={{ padding: ".65rem 1rem", fontSize: ".64rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase" }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((p, i) => {
                    const badge = badges[p.numeroProcesso];
                    const isSel = selecionados.has(p.numeroProcesso);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #1a2035", background: isSel ? "rgba(201,168,76,.04)" : "transparent", transition: "background .1s" }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "#1a2035"; }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                        <td style={{ padding: ".7rem 1rem" }}>
                          <input type="checkbox" checked={isSel} onChange={() => toggleSel(p.numeroProcesso)} style={{ cursor: "pointer", accentColor: "#C9A84C" }} />
                        </td>
                        <td style={{ padding: ".7rem 1rem", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".78rem", color: "#C9A84C", fontWeight: 600 }}>{p.numeroProcesso || "—"}</span>
                            {badge === "novo" && <span style={{ fontSize: ".58rem", background: "rgba(96,165,250,.15)", color: "#60a5fa", border: "1px solid rgba(96,165,250,.3)", padding: ".1rem .4rem", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700 }}>NOVO</span>}
                            {badge === "atualizado" && <span style={{ fontSize: ".58rem", background: "rgba(74,222,128,.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,.3)", padding: ".1rem .4rem", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700 }}>ATUALIZADO</span>}
                          </div>
                        </td>
                        <td style={{ padding: ".7rem 1rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".75rem", color: "#e8eaf0", whiteSpace: "nowrap" }}>{p.tribunal}</td>
                        <td style={{ padding: ".7rem 1rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".75rem", color: "#8892a4", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.classeProcessual || "—"}</td>
                        <td style={{ padding: ".7rem 1rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".75rem", color: "#8892a4", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.orgaoJulgador || "—"}</td>
                        <td style={{ padding: ".7rem 1rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".75rem", color: "#8892a4", whiteSpace: "nowrap" }}>
                          {p.dataDistribuicao ? new Date(p.dataDistribuicao).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td style={{ padding: ".7rem 1rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".75rem", color: "#8892a4", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.ultimoMovimento || "—"}</td>
                        <td style={{ padding: ".7rem 1rem" }}><StatusBadge status={p.status || "Ativo"} /></td>
                        <td style={{ padding: ".7rem 1rem" }}>
                          <button onClick={() => salvarProcessos([p])
                          } style={{ padding: ".35rem .75rem", background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.2)", color: "#C9A84C", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".68rem", whiteSpace: "nowrap" }}>
                            <Save style={{ width: 11, height: 11, display: "inline", marginRight: 3 }} />Salvar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div style={{ padding: ".75rem 1.5rem", borderTop: "1px solid #1e2740", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: ".5rem" }}>
                <span style={{ fontSize: ".72rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  Página {paginaAtual} de {totalPaginas} · {processados.length} resultados
                </span>
                <div style={{ display: "flex", gap: ".3rem" }}>
                  {[
                    [<ChevronsLeft style={{ width: 13, height: 13 }} />, () => setPagina(1), paginaAtual === 1],
                    [<ChevronLeft style={{ width: 13, height: 13 }} />, () => setPagina(p => Math.max(1, p - 1)), paginaAtual === 1],
                    [<ChevronRight style={{ width: 13, height: 13 }} />, () => setPagina(p => Math.min(totalPaginas, p + 1)), paginaAtual === totalPaginas],
                    [<ChevronsRight style={{ width: 13, height: 13 }} />, () => setPagina(totalPaginas), paginaAtual === totalPaginas],
                  ].map(([icon, fn, disabled], i) => (
                    <button key={i} onClick={fn} disabled={disabled}
                      style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid #1e2740", color: disabled ? "#2a3550" : "#8892a4", cursor: disabled ? "not-allowed" : "pointer" }}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </JusTrackLayout>
  );
}
import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Save, CheckCircle2, Loader2, RefreshCw, User, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";
import JusTrackLayout from "@/components/justrack/JusTrackLayout";
import StatusBadge from "@/components/justrack/StatusBadge";

const SECCIONAIS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO","Federal"];

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

export default function JusTrackOAB() {
  const queryClient = useQueryClient();

  // Perfil salvo
  const { data: perfis = [] } = useQuery({
    queryKey: ["perfilOAB"],
    queryFn: () => base44.entities.PerfilOAB.list("-created_date", 1),
  });
  const perfil = perfis[0] || null;

  // Processos salvos (para comparar duplicatas e detectar novos)
  const { data: processosSalvos = [] } = useQuery({
    queryKey: ["processos"],
    queryFn: () => base44.entities.Processo.list("-created_date", 1000),
  });

  const [form, setForm] = useState({ numeroOAB: "", seccional: "", tipo: "Advogado", nomeAdvogado: "" });
  const [buscando, setBuscando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultados, setResultados] = useState(null); // { processos, totalTribunais, tribunais }
  const [badges, setBadges] = useState({}); // numeroProcesso -> "novo" | "atualizado"
  const [salvando, setSalvando] = useState(false);
  const [salvoMsg, setSalvoMsg] = useState("");
  const [selecionados, setSelecionados] = useState(new Set());

  // Filtros tabela
  const [busca, setBusca] = useState("");
  const [filtroTribunal, setFiltroTribunal] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroClasse, setFiltroClasse] = useState("");
  const [sortCol, setSortCol] = useState("dataDistribuicao");
  const [sortDir, setSortDir] = useState("desc");
  const [pagina, setPagina] = useState(1);

  // Pré-preenche form com perfil salvo
  useEffect(() => {
    if (perfil && !form.numeroOAB) {
      setForm({ numeroOAB: perfil.numeroOAB, seccional: perfil.seccional, tipo: perfil.tipo || "Advogado", nomeAdvogado: perfil.nomeAdvogado || "" });
    }
  }, [perfil]);

  const handleBuscar = async () => {
    if (!form.numeroOAB.trim() || !form.seccional) return;
    setBuscando(true); setProgresso(5); setResultados(null); setSalvoMsg(""); setSelecionados(new Set());
    
    // Simula progresso enquanto o backend processa (a chamada é única mas demora)
    const timer = setInterval(() => setProgresso(p => Math.min(p + 3, 92)), 800);

    try {
      const res = await base44.functions.invoke("datajudOABSearch", {
        numeroOAB: form.numeroOAB.trim(),
        seccional: form.seccional,
      });
      clearInterval(timer);
      setProgresso(100);

      const { processos = [], totalTribunais = 0, tribunais = [] } = res.data;

      // Calcular badges novo/atualizado
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

      // Salva/atualiza perfil OAB
      const perfilData = {
        numeroOAB: form.numeroOAB.trim(),
        seccional: form.seccional,
        tipo: form.tipo,
        nomeAdvogado: form.nomeAdvogado,
        ultimaSincronizacao: new Date().toISOString(),
        totalProcessosEncontrados: processos.length,
      };
      if (perfil?.id) {
        await base44.entities.PerfilOAB.update(perfil.id, perfilData);
      } else {
        await base44.entities.PerfilOAB.create(perfilData);
      }
      queryClient.invalidateQueries({ queryKey: ["perfilOAB"] });

    } catch (e) {
      clearInterval(timer);
      setProgresso(0);
      console.error(e);
    } finally {
      setBuscando(false);
      setTimeout(() => setProgresso(0), 1000);
    }
  };

  const salvarProcessos = async (lista) => {
    setSalvando(true); setSalvoMsg("");
    const existentes = new Set(processosSalvos.map(p => p.numeroProcesso));
    const novos = lista.filter(p => !existentes.has(p.numeroProcesso));
    let salvos = 0;
    for (const p of novos) {
      await base44.entities.Processo.create(p);
      salvos++;
    }
    queryClient.invalidateQueries({ queryKey: ["processos"] });
    setSalvoMsg(`${salvos} processo${salvos !== 1 ? "s" : ""} salvo${salvos !== 1 ? "s" : ""}. ${lista.length - salvos} já existiam.`);
    setSalvando(false);
  };

  // Dados filtrados e ordenados
  const processados = useMemo(() => {
    if (!resultados) return [];
    let arr = [...resultados.processos];
    if (busca) arr = arr.filter(p => p.numeroProcesso?.includes(busca) || p.classeProcessual?.toLowerCase().includes(busca.toLowerCase()) || p.orgaoJulgador?.toLowerCase().includes(busca.toLowerCase()));
    if (filtroTribunal) arr = arr.filter(p => p.tribunal === filtroTribunal);
    if (filtroStatus) arr = arr.filter(p => p.status === filtroStatus);
    if (filtroClasse) arr = arr.filter(p => p.classeProcessual === filtroClasse);
    arr.sort((a, b) => {
      const va = a[sortCol] || "";
      const vb = b[sortCol] || "";
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

  // Estatísticas resumo
  const stats = useMemo(() => {
    if (!resultados) return null;
    const ps = resultados.processos;
    const porTribunal = {};
    const porClasse = {};
    for (const p of ps) {
      porTribunal[p.tribunal] = (porTribunal[p.tribunal] || 0) + 1;
      if (p.classeProcessual) porClasse[p.classeProcessual] = (porClasse[p.classeProcessual] || 0) + 1;
    }
    const topClasses = Object.entries(porClasse).sort((a,b) => b[1]-a[1]).slice(0,5);
    const novos = Object.values(badges).filter(b => b === "novo").length;
    const atualizados = Object.values(badges).filter(b => b === "atualizado").length;
    return { total: ps.length, porTribunal, topClasses, novos, atualizados };
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
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.6rem", color: "#C9A84C", margin: 0 }}>
            Minha OAB
          </h1>
          <p style={{ color: "#8892a4", fontSize: ".85rem", margin: ".25rem 0 0", fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Vincule seu número OAB e encontre todos os seus processos automaticamente
          </p>
        </div>

        {/* Formulário OAB */}
        <div style={{ background: "#161b27", border: "1px solid #1e2740" }}>
          <div style={{ padding: ".9rem 1.5rem", borderBottom: "1px solid #1e2740", display: "flex", alignItems: "center", gap: ".6rem" }}>
            <User style={{ width: 15, height: 15, color: "#C9A84C" }} />
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: ".95rem", color: "#e8eaf0", margin: 0 }}>
              {perfil ? `OAB/${perfil.seccional} ${perfil.numeroOAB}` : "Vincular OAB"}
            </h2>
            {perfil && (
              <span style={{ marginLeft: "auto", fontSize: ".68rem", color: "#4a5568", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Última sincronização: {parseRelativeTime(perfil.ultimaSincronizacao)}
              </span>
            )}
          </div>
          <div style={{ padding: "1.25rem 1.5rem" }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="col-span-2 md:col-span-1">
                <label style={labelStyle}>Número OAB *</label>
                <input style={inputStyle} placeholder="Ex: 12345" value={form.numeroOAB} onChange={e => setForm(f => ({ ...f, numeroOAB: e.target.value.replace(/\D/g,"") }))} />
              </div>
              <div>
                <label style={labelStyle}>Seccional *</label>
                <select style={{ ...inputStyle, cursor: "pointer" }} value={form.seccional} onChange={e => setForm(f => ({ ...f, seccional: e.target.value }))}>
                  <option value="">— UF —</option>
                  {SECCIONAIS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tipo</label>
                <select style={{ ...inputStyle, cursor: "pointer" }} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option>Advogado</option>
                  <option>Estagiário</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Nome (opcional)</label>
                <input style={inputStyle} placeholder="Seu nome" value={form.nomeAdvogado} onChange={e => setForm(f => ({ ...f, nomeAdvogado: e.target.value }))} />
              </div>
            </div>

            {/* Barra de progresso */}
            {buscando && (
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
                  <span style={{ fontSize: ".72rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    Consultando tribunais em paralelo...
                  </span>
                  <span style={{ fontSize: ".72rem", color: "#C9A84C", fontFamily: "'IBM Plex Sans', sans-serif" }}>{progresso}%</span>
                </div>
                <div style={{ height: 4, background: "#1e2740", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#C9A84C", width: `${progresso}%`, transition: "width .4s ease" }} />
                </div>
              </div>
            )}

            <button onClick={handleBuscar} disabled={buscando || !form.numeroOAB || !form.seccional}
              style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", padding: ".7rem 1.5rem", background: "#C9A84C", border: "none", color: "#0d1117", cursor: buscando || !form.numeroOAB || !form.seccional ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: ".82rem", opacity: buscando || !form.numeroOAB || !form.seccional ? .6 : 1 }}>
              {buscando ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <Search style={{ width: 15, height: 15 }} />}
              {buscando ? "Buscando em 37 tribunais..." : perfil ? "Sincronizar agora" : "Buscar meus processos"}
            </button>
          </div>
        </div>

        {/* Cards resumo */}
        {stats && (
          <div className="space-y-4">
            {/* Resumo geral */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total encontrado", value: stats.total, color: "#C9A84C" },
                { label: "Tribunais com resultado", value: resultados.totalTribunais, color: "#60a5fa" },
                { label: "Processos novos", value: stats.novos, color: "#4ade80" },
                { label: "Com novas movimentações", value: stats.atualizados, color: "#fbbf24" },
              ].map(s => (
                <div key={s.label} style={{ background: "#161b27", border: "1px solid #1e2740", padding: "1rem 1.25rem" }}>
                  <p style={{ fontSize: ".68rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".1em", margin: "0 0 .4rem", fontWeight: 600 }}>{s.label}</p>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.8rem", color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Resumo textual badges */}
            {(stats.novos > 0 || stats.atualizados > 0) && (
              <div style={{ background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.2)", padding: ".75rem 1.25rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".82rem", color: "#C9A84C" }}>
                {stats.novos > 0 && <span>{stats.novos} novo{stats.novos>1?"s":""} processo{stats.novos>1?"s":""}. </span>}
                {stats.atualizados > 0 && <span>{stats.atualizados} com novas movimentações.</span>}
              </div>
            )}

            {/* Top 5 Classes */}
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
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: ".95rem", color: "#e8eaf0", margin: 0 }}>
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

              {/* Filtros */}
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
                  {["Ativo","Arquivado","Suspenso","Baixado"].map(s => <option key={s}>{s}</option>)}
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
                      <th key={col} onClick={() => toggleSort(col)} style={{ padding: ".65rem 1rem", textAlign: "left", fontSize: ".64rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                        {label} <SortIcon col={col} />
                      </th>
                    ))}
                    <th style={{ padding: ".65rem 1rem", fontSize: ".64rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: ".65rem 1rem", fontSize: ".64rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Ação</th>
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
                          <button onClick={() => salvarProcessos([p])} style={{ padding: ".35rem .75rem", background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.2)", color: "#C9A84C", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".68rem", whiteSpace: "nowrap" }}>
                            <Save style={{ width: 11, height: 11, display: "inline", marginRight: 3 }} />Salvar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div style={{ padding: ".75rem 1.5rem", borderTop: "1px solid #1e2740", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: ".5rem" }}>
                <span style={{ fontSize: ".72rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  Página {paginaAtual} de {totalPaginas} · {processados.length} resultados
                </span>
                <div style={{ display: "flex", gap: ".3rem" }}>
                  {[
                    [<ChevronsLeft style={{ width: 13, height: 13 }} />, () => setPagina(1), paginaAtual === 1],
                    [<ChevronLeft style={{ width: 13, height: 13 }} />, () => setPagina(p => Math.max(1, p-1)), paginaAtual === 1],
                    [<ChevronRight style={{ width: 13, height: 13 }} />, () => setPagina(p => Math.min(totalPaginas, p+1)), paginaAtual === totalPaginas],
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
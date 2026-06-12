import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Newspaper, Search, Star, StarOff, EyeOff, Plus, Sparkles,
  Clock, FileText, Loader2, Bell, Trash2, X,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const sourceLabels = {
  DOU: "Diário Oficial da União", DJE_SP: "DJE São Paulo", DJE_RJ: "DJE Rio de Janeiro",
  DJE_MG: "DJE Minas Gerais", DJE_RS: "DJE Rio Grande do Sul", DJE_PR: "DJE Paraná",
  DJE_BA: "DJE Bahia", OUTROS: "Outros"
};

const categoryLabels = {
  intimacao: "Intimação", sentenca: "Sentença", despacho: "Despacho",
  edital: "Edital", licitacao: "Licitação", nomeacao: "Nomeação",
  exoneracao: "Exoneração", lei: "Lei", decreto: "Decreto",
  portaria: "Portaria", outros: "Outros"
};

const areaLabels = {
  civil: "Civil", criminal: "Criminal", trabalhista: "Trabalhista",
  tributario: "Tributário", familia: "Família", empresarial: "Empresarial",
  consumidor: "Consumidor", previdenciario: "Previdenciário",
  administrativo: "Administrativo", outros: "Outros"
};

const categoryBadgeStyle = {
  intimacao:  { background: "var(--red-bg)",    color: "#991b1b",  border: "var(--red-bd)" },
  sentenca:   { background: "var(--green-bg)",  color: "#166534",  border: "var(--green-bd)" },
  despacho:   { background: "var(--blue-bg)",   color: "#1e40af",  border: "var(--blue-bd)" },
  edital:     { background: "#F5F3FF",          color: "#5b21b6",  border: "#DDD6FE" },
  licitacao:  { background: "var(--yellow-bg)", color: "#854d0e",  border: "var(--yellow-bd)" },
  nomeacao:   { background: "var(--green-bg)",  color: "#166534",  border: "var(--green-bd)" },
  exoneracao: { background: "var(--yellow-bg)", color: "#854d0e",  border: "var(--yellow-bd)" },
  lei:        { background: "var(--blue-bg)",   color: "#1e40af",  border: "var(--blue-bd)" },
  decreto:    { background: "var(--blue-bg)",   color: "#1e40af",  border: "var(--blue-bd)" },
  portaria:   { background: "var(--red-bg)",    color: "#991b1b",  border: "var(--red-bd)" },
  outros:     { background: "var(--surface)",   color: "var(--text-2)", border: "var(--border)" },
};

export default function DiarioMonitor() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("publications");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterArea, setFilterArea] = useState("all");
  const [filterRead, setFilterRead] = useState("all");
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMonitorDialog, setShowMonitorDialog] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pasteContent, setPasteContent] = useState("");

  const { data: publications = [], isLoading: loadingPubs } = useQuery({
    queryKey: ['diario-publications'],
    queryFn: () => base44.entities.DiarioPublication.list('-publication_date'),
  });

  const { data: monitors = [] } = useQuery({
    queryKey: ['diario-monitors'],
    queryFn: () => base44.entities.DiarioMonitor.list('-created_date'),
  });

  const createPublicationMutation = useMutation({
    mutationFn: (data) => base44.entities.DiarioPublication.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['diario-publications'] }); setShowAddDialog(false); setPasteContent(""); },
  });

  const updatePublicationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DiarioPublication.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diario-publications'] }),
  });

  const deletePublicationMutation = useMutation({
    mutationFn: (id) => base44.entities.DiarioPublication.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['diario-publications'] }); setSelectedPublication(null); },
  });

  const createMonitorMutation = useMutation({
    mutationFn: (data) => base44.entities.DiarioMonitor.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['diario-monitors'] }); setShowMonitorDialog(false); },
  });

  const analyzeWithAI = async (content) => {
    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta publicação de diário oficial brasileiro e extraia as informações estruturadas.\n\nPUBLICAÇÃO:\n${content}\n\nExtraia e retorne um JSON com:\n- title: título resumido (máximo 100 caracteres)\n- summary: resumo executivo da publicação (2-3 frases)\n- category: uma das opções [intimacao, sentenca, despacho, edital, licitacao, nomeacao, exoneracao, lei, decreto, portaria, outros]\n- area: área do direito [civil, criminal, trabalhista, tributario, familia, empresarial, consumidor, previdenciario, administrativo, outros]\n- case_number: número do processo se houver\n- parties: array com nomes das partes\n- keywords: array com 3-5 palavras-chave\n- relevance_score: pontuação de 0-100\n- source: fonte provável [DOU, DJE_SP, DJE_RJ, DJE_MG, DJE_RS, DJE_PR, DJE_BA, OUTROS]`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" }, summary: { type: "string" }, category: { type: "string" },
            area: { type: "string" }, case_number: { type: "string" },
            parties: { type: "array", items: { type: "string" } },
            keywords: { type: "array", items: { type: "string" } },
            relevance_score: { type: "number" }, source: { type: "string" }
          }
        }
      });
      await createPublicationMutation.mutateAsync({
        ...result, content, publication_date: new Date().toISOString().split('T')[0], is_read: false, is_starred: false
      });
    } catch (error) {
      console.error("Erro na análise:", error);
      alert("Erro ao analisar publicação. Tente novamente.");
    }
    setIsAnalyzing(false);
  };

  const filteredPublications = publications.filter(pub => {
    const matchesSearch = !searchTerm ||
      pub.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.parties?.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSource = filterSource === "all" || pub.source === filterSource;
    const matchesCategory = filterCategory === "all" || pub.category === filterCategory;
    const matchesArea = filterArea === "all" || pub.area === filterArea;
    const matchesRead = filterRead === "all" ||
      (filterRead === "unread" && !pub.is_read) ||
      (filterRead === "read" && pub.is_read) ||
      (filterRead === "starred" && pub.is_starred);
    return matchesSearch && matchesSource && matchesCategory && matchesArea && matchesRead;
  });

  const stats = {
    total: publications.length,
    unread: publications.filter(p => !p.is_read).length,
    starred: publications.filter(p => p.is_starred).length,
    today: publications.filter(p => p.publication_date === new Date().toISOString().split('T')[0]).length
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--text-1)", letterSpacing: "-0.02em", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-light)", border: "1px solid var(--blue-bd)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Newspaper style={{ width: 18, height: 18, color: "var(--accent)" }} />
              </div>
              Monitor de Diários
            </h1>
            <p style={{ marginTop: 4, color: "var(--text-2)", fontSize: 13, marginBottom: 0 }}>
              Monitoramento inteligente de publicações oficiais
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Dialog open={showMonitorDialog} onOpenChange={setShowMonitorDialog}>
              <DialogTrigger asChild>
                <button className="btn btn-secondary" style={{ fontSize: 13 }}>
                  <Bell style={{ width: 14, height: 14 }} />
                  Alertas
                </button>
              </DialogTrigger>
              <DialogContent style={{ maxWidth: 480 }}>
                <DialogHeader>
                  <DialogTitle>Configurar Monitoramento</DialogTitle>
                </DialogHeader>
                <MonitorForm onSubmit={(data) => createMonitorMutation.mutate(data)} isLoading={createMonitorMutation.isPending} />
              </DialogContent>
            </Dialog>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <button className="btn btn-primary" style={{ fontSize: 13 }}>
                  <Plus style={{ width: 14, height: 14 }} />
                  Adicionar Publicação
                </button>
              </DialogTrigger>
              <DialogContent style={{ maxWidth: 620 }}>
                <DialogHeader>
                  <DialogTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Sparkles style={{ width: 16, height: 16, color: "var(--accent)" }} />
                    Analisar Publicação com IA
                  </DialogTitle>
                </DialogHeader>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>
                    Cole o texto da publicação abaixo. A IA irá classificar e gerar um resumo automaticamente.
                  </p>
                  <Textarea
                    placeholder="Cole aqui o texto da publicação do diário oficial..."
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    style={{ minHeight: 200, resize: "vertical" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => setShowAddDialog(false)}>Cancelar</button>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: 13 }}
                      onClick={() => analyzeWithAI(pasteContent)}
                      disabled={!pasteContent.trim() || isAnalyzing}
                    >
                      {isAnalyzing ? <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> Analisando...</> : <><Sparkles style={{ width: 14, height: 14 }} /> Analisar com IA</>}
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }} className="grid-cols-2 md:grid-cols-4">
          {[
            { label: "Total",      value: stats.total,   icon: FileText, bg: "var(--blue-bg)",   ic: "var(--accent)",   bd: "var(--blue-bd)" },
            { label: "Não Lidas",  value: stats.unread,  icon: EyeOff,   bg: "var(--yellow-bg)", ic: "var(--yellow)",   bd: "var(--yellow-bd)" },
            { label: "Favoritas",  value: stats.starred, icon: Star,     bg: "var(--yellow-bg)", ic: "#EAB308",         bd: "var(--yellow-bd)" },
            { label: "Hoje",       value: stats.today,   icon: Clock,    bg: "var(--green-bg)",  ic: "var(--green)",    bd: "var(--green-bd)" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="app-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, border: `1px solid ${s.bd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 18, height: 18, color: s.ic }} />
                </div>
                <div>
                  <p style={{ fontSize: 24, fontWeight: 700, color: "var(--text-1)", margin: 0, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0, marginTop: 2 }}>{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Tabs ── */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          {/* Tab header */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
            {["publications", "monitors"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "13px 16px", fontSize: 13, fontWeight: 500, border: "none", background: "none",
                  cursor: "pointer", borderBottom: activeTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                  color: activeTab === tab ? "var(--accent)" : "var(--text-2)",
                  marginBottom: -1, transition: "all .15s",
                }}
              >
                {tab === "publications" ? "Publicações" : "Monitoramentos"}
              </button>
            ))}
          </div>

          <div style={{ padding: 20 }}>
            {activeTab === "publications" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Filters */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                    <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--text-3)" }} />
                    <input
                      className="input"
                      placeholder="Buscar por título, processo, partes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingLeft: 32 }}
                    />
                  </div>
                  <Select value={filterSource} onValueChange={setFilterSource}>
                    <SelectTrigger style={{ width: 160, height: 38, fontSize: 13 }}><SelectValue placeholder="Todas Fontes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Fontes</SelectItem>
                      {Object.entries(sourceLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger style={{ width: 160, height: 38, fontSize: 13 }}><SelectValue placeholder="Todas Categorias" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Categorias</SelectItem>
                      {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterArea} onValueChange={setFilterArea}>
                    <SelectTrigger style={{ width: 148, height: 38, fontSize: 13 }}><SelectValue placeholder="Todas Áreas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Áreas</SelectItem>
                      {Object.entries(areaLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterRead} onValueChange={setFilterRead}>
                    <SelectTrigger style={{ width: 130, height: 38, fontSize: 13 }}><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="unread">Não Lidas</SelectItem>
                      <SelectItem value="read">Lidas</SelectItem>
                      <SelectItem value="starred">Favoritas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* List + Detail */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }} className="lg:grid-cols-[1fr_340px] grid-cols-1">
                  {/* List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {loadingPubs ? (
                      [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)
                    ) : filteredPublications.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)" }}>
                        <Newspaper style={{ width: 40, height: 40, margin: "0 auto 12px", color: "var(--text-3)" }} />
                        <p style={{ fontWeight: 600, color: "var(--text-1)", margin: 0 }}>Nenhuma publicação encontrada</p>
                        <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>Adicione publicações para começar o monitoramento</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {filteredPublications.map((pub) => {
                          const isSelected = selectedPublication?.id === pub.id;
                          const catStyle = categoryBadgeStyle[pub.category] || categoryBadgeStyle.outros;
                          return (
                            <motion.div
                              key={pub.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              onClick={() => {
                                setSelectedPublication(pub);
                                if (!pub.is_read) updatePublicationMutation.mutate({ id: pub.id, data: { is_read: true } });
                              }}
                              style={{
                                padding: "14px 16px", borderRadius: "var(--r-md)",
                                border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                                background: isSelected ? "var(--accent-light)" : "var(--card)",
                                cursor: "pointer", transition: "all .15s",
                                boxShadow: isSelected ? "0 0 0 3px var(--accent-glow)" : "var(--sh-xs)",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: !pub.is_read ? "var(--accent)" : "var(--border-2)" }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                    <p style={{ fontWeight: 500, fontSize: 13.5, color: "var(--text-1)", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                      {pub.title}
                                    </p>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); updatePublicationMutation.mutate({ id: pub.id, data: { is_starred: !pub.is_starred } }); }}
                                      style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 2, color: pub.is_starred ? "#EAB308" : "var(--text-3)", minHeight: "unset" }}
                                    >
                                      {pub.is_starred ? <Star style={{ width: 15, height: 15, fill: "currentColor" }} /> : <Star style={{ width: 15, height: 15 }} />}
                                    </button>
                                  </div>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                                    {pub.category && (
                                      <span className="badge" style={{ background: catStyle.background, color: catStyle.color, borderColor: catStyle.border, fontSize: 11 }}>
                                        {categoryLabels[pub.category]}
                                      </span>
                                    )}
                                    {pub.area && (
                                      <span className="badge badge-neutral" style={{ fontSize: 11 }}>{areaLabels[pub.area]}</span>
                                    )}
                                    {pub.relevance_score > 70 && (
                                      <span className="badge badge-red" style={{ fontSize: 11 }}>Alta Relevância</span>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                      <Clock style={{ width: 11, height: 11 }} />
                                      {pub.publication_date && format(new Date(pub.publication_date + 'T12:00:00'), "dd/MM/yyyy")}
                                    </span>
                                    {pub.source && <span>{sourceLabels[pub.source]}</span>}
                                    {pub.case_number && <span style={{ fontFamily: "monospace" }}>{pub.case_number}</span>}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>

                  {/* Detail Panel */}
                  <div>
                    {selectedPublication ? (
                      <div style={{ position: "sticky", top: 80, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)" }}>
                            Detalhes da Publicação
                          </span>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              onClick={() => deletePublicationMutation.mutate(selectedPublication.id)}
                              style={{ padding: 6, background: "none", border: "none", borderRadius: 6, cursor: "pointer", color: "var(--text-3)", minHeight: "unset", transition: "color .15s" }}
                              onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
                              onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}
                            >
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                            <button
                              onClick={() => setSelectedPublication(null)}
                              style={{ padding: 6, background: "none", border: "none", borderRadius: 6, cursor: "pointer", color: "var(--text-3)", minHeight: "unset" }}
                            >
                              <X style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          <div>
                            <p className="text-label" style={{ marginBottom: 4 }}>Título</p>
                            <p style={{ fontSize: 13.5, color: "var(--text-1)", margin: 0 }}>{selectedPublication.title}</p>
                          </div>
                          {selectedPublication.summary && (
                            <div>
                              <p className="text-label" style={{ marginBottom: 4 }}>Resumo IA</p>
                              <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>{selectedPublication.summary}</p>
                            </div>
                          )}
                          {selectedPublication.case_number && (
                            <div>
                              <p className="text-label" style={{ marginBottom: 4 }}>Processo</p>
                              <p style={{ fontSize: 13, fontFamily: "monospace", color: "var(--text-1)", margin: 0 }}>{selectedPublication.case_number}</p>
                            </div>
                          )}
                          {selectedPublication.parties?.length > 0 && (
                            <div>
                              <p className="text-label" style={{ marginBottom: 4 }}>Partes</p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {selectedPublication.parties.map((p, i) => (
                                  <span key={i} className="badge badge-neutral" style={{ fontSize: 11 }}>{p}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedPublication.keywords?.length > 0 && (
                            <div>
                              <p className="text-label" style={{ marginBottom: 4 }}>Palavras-chave</p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {selectedPublication.keywords.map((kw, i) => (
                                  <span key={i} className="badge badge-info" style={{ fontSize: 11 }}>{kw}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="text-label" style={{ marginBottom: 4 }}>Conteúdo Original</p>
                            <div style={{ fontSize: 12.5, maxHeight: 200, overflowY: "auto", padding: "10px 12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text-2)", lineHeight: 1.6 }}>
                              {selectedPublication.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ position: "sticky", top: 80, background: "var(--surface)", border: "1px dashed var(--border-2)", borderRadius: "var(--r-lg)", padding: "40px 24px", textAlign: "center" }}>
                        <FileText style={{ width: 36, height: 36, margin: "0 auto 10px", color: "var(--text-3)" }} />
                        <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>Selecione uma publicação para ver os detalhes</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "monitors" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {monitors.map((monitor) => (
                  <div key={monitor.id} className="app-card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-light)", border: "1px solid var(--blue-bd)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Bell style={{ width: 14, height: 14, color: "var(--accent)" }} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-1)" }}>{monitor.name}</span>
                      </div>
                      <span className={`badge ${monitor.is_active ? "badge-green" : "badge-gray"}`} style={{ fontSize: 10 }}>
                        {monitor.is_active ? "Ativo" : "Pausado"}
                      </span>
                    </div>
                    {monitor.keywords?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                        {monitor.keywords.slice(0, 3).map((kw, i) => (
                          <span key={i} className="badge badge-neutral" style={{ fontSize: 11 }}>{kw}</span>
                        ))}
                        {monitor.keywords.length > 3 && (
                          <span className="badge badge-neutral" style={{ fontSize: 11 }}>+{monitor.keywords.length - 3}</span>
                        )}
                      </div>
                    )}
                    <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>
                      {monitor.last_check ? `Última verificação: ${format(new Date(monitor.last_check), "dd/MM HH:mm")}` : "Nunca verificado"}
                    </p>
                  </div>
                ))}

                {monitors.length === 0 && (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 24px", background: "var(--surface)", border: "1px dashed var(--border-2)", borderRadius: "var(--r-lg)" }}>
                    <Bell style={{ width: 36, height: 36, margin: "0 auto 12px", color: "var(--text-3)" }} />
                    <p style={{ fontWeight: 600, color: "var(--text-1)", margin: 0 }}>Nenhum monitoramento configurado</p>
                    <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4, marginBottom: 16 }}>Configure alertas para receber notificações</p>
                    <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setShowMonitorDialog(true)}>
                      <Plus style={{ width: 14, height: 14 }} />
                      Criar Monitoramento
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MonitorForm({ onSubmit, isLoading }) {
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [caseNumbers, setCaseNumbers] = useState("");
  const [partyNames, setPartyNames] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      case_numbers: caseNumbers.split(',').map(k => k.trim()).filter(Boolean),
      party_names: partyNames.split(',').map(k => k.trim()).filter(Boolean),
      is_active: true, notify_email: true
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[
        { label: "Nome do Monitoramento", val: name, set: setName, ph: "Ex: Processos Trabalhistas", req: true },
        { label: "Palavras-chave (separadas por vírgula)", val: keywords, set: setKeywords, ph: "Ex: intimação, sentença, recurso" },
        { label: "Números de Processos", val: caseNumbers, set: setCaseNumbers, ph: "Ex: 0001234-12.2024.8.26.0100" },
        { label: "Nomes de Partes", val: partyNames, set: setPartyNames, ph: "Ex: João Silva, Empresa XYZ" },
      ].map(f => (
        <div key={f.label}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 5 }}>{f.label}</label>
          <input className="input" value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} required={f.req} />
        </div>
      ))}
      <button type="submit" className="btn btn-primary" disabled={!name || isLoading} style={{ marginTop: 4, fontSize: 13 }}>
        {isLoading ? <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> Criando...</> : <><Bell style={{ width: 14, height: 14 }} /> Criar Monitoramento</>}
      </button>
    </form>
  );
}
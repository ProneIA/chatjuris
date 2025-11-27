import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Newspaper,
  Search,
  Filter,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Plus,
  Sparkles,
  Clock,
  Tag,
  FileText,
  Upload,
  Loader2,
  ChevronRight,
  Bell,
  Settings,
  BookOpen,
  Scale,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  X,
  Trash2,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

const sourceLabels = {
  DOU: "Diário Oficial da União",
  DJE_SP: "DJE São Paulo",
  DJE_RJ: "DJE Rio de Janeiro",
  DJE_MG: "DJE Minas Gerais",
  DJE_RS: "DJE Rio Grande do Sul",
  DJE_PR: "DJE Paraná",
  DJE_BA: "DJE Bahia",
  OUTROS: "Outros"
};

const categoryLabels = {
  intimacao: "Intimação",
  sentenca: "Sentença",
  despacho: "Despacho",
  edital: "Edital",
  licitacao: "Licitação",
  nomeacao: "Nomeação",
  exoneracao: "Exoneração",
  lei: "Lei",
  decreto: "Decreto",
  portaria: "Portaria",
  outros: "Outros"
};

const areaLabels = {
  civil: "Civil",
  criminal: "Criminal",
  trabalhista: "Trabalhista",
  tributario: "Tributário",
  familia: "Família",
  empresarial: "Empresarial",
  consumidor: "Consumidor",
  previdenciario: "Previdenciário",
  administrativo: "Administrativo",
  outros: "Outros"
};

const categoryColors = {
  intimacao: "bg-red-500/10 text-red-500 border-red-500/20",
  sentenca: "bg-green-500/10 text-green-500 border-green-500/20",
  despacho: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  edital: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  licitacao: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  nomeacao: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  exoneracao: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  lei: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  decreto: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  portaria: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  outros: "bg-gray-500/10 text-gray-500 border-gray-500/20"
};

export default function DiarioMonitor({ theme = 'light' }) {
  const isDark = theme === 'dark';
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario-publications'] });
      setShowAddDialog(false);
      setPasteContent("");
    },
  });

  const updatePublicationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DiarioPublication.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario-publications'] });
    },
  });

  const deletePublicationMutation = useMutation({
    mutationFn: (id) => base44.entities.DiarioPublication.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario-publications'] });
      setSelectedPublication(null);
    },
  });

  const createMonitorMutation = useMutation({
    mutationFn: (data) => base44.entities.DiarioMonitor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario-monitors'] });
      setShowMonitorDialog(false);
    },
  });

  const analyzeWithAI = async (content) => {
    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta publicação de diário oficial brasileiro e extraia as informações estruturadas.

PUBLICAÇÃO:
${content}

Extraia e retorne um JSON com:
- title: título resumido (máximo 100 caracteres)
- summary: resumo executivo da publicação (2-3 frases)
- category: uma das opções [intimacao, sentenca, despacho, edital, licitacao, nomeacao, exoneracao, lei, decreto, portaria, outros]
- area: área do direito [civil, criminal, trabalhista, tributario, familia, empresarial, consumidor, previdenciario, administrativo, outros]
- case_number: número do processo se houver (formato CNJ ou antigo)
- parties: array com nomes das partes envolvidas
- keywords: array com 3-5 palavras-chave relevantes
- relevance_score: pontuação de 0-100 baseada na importância/urgência
- source: fonte provável [DOU, DJE_SP, DJE_RJ, DJE_MG, DJE_RS, DJE_PR, DJE_BA, OUTROS]`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            category: { type: "string" },
            area: { type: "string" },
            case_number: { type: "string" },
            parties: { type: "array", items: { type: "string" } },
            keywords: { type: "array", items: { type: "string" } },
            relevance_score: { type: "number" },
            source: { type: "string" }
          }
        }
      });

      const publicationData = {
        ...result,
        content: content,
        publication_date: new Date().toISOString().split('T')[0],
        is_read: false,
        is_starred: false
      };

      await createPublicationMutation.mutateAsync(publicationData);
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
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-semibold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                <Newspaper className="w-5 h-5 text-purple-500" />
              </div>
              Monitor de Diários
            </h1>
            <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
              Monitoramento inteligente de publicações oficiais
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showMonitorDialog} onOpenChange={setShowMonitorDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className={isDark ? 'border-neutral-700' : ''}>
                  <Bell className="w-4 h-4 mr-2" />
                  Alertas
                </Button>
              </DialogTrigger>
              <DialogContent className={`max-w-lg ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}>
                <DialogHeader>
                  <DialogTitle className={isDark ? 'text-white' : ''}>Configurar Monitoramento</DialogTitle>
                </DialogHeader>
                <MonitorForm 
                  isDark={isDark} 
                  onSubmit={(data) => createMonitorMutation.mutate(data)}
                  isLoading={createMonitorMutation.isPending}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Publicação
                </Button>
              </DialogTrigger>
              <DialogContent className={`max-w-2xl ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}>
                <DialogHeader>
                  <DialogTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Analisar Publicação com IA
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    Cole o texto da publicação abaixo. A IA irá classificar, extrair informações relevantes e gerar um resumo automaticamente.
                  </p>
                  <Textarea
                    placeholder="Cole aqui o texto da publicação do diário oficial..."
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    className={`min-h-[200px] ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}`}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => analyzeWithAI(pasteContent)}
                      disabled={!pasteContent.trim() || isAnalyzing}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Analisar com IA
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, icon: FileText, color: "blue" },
            { label: "Não Lidas", value: stats.unread, icon: EyeOff, color: "amber" },
            { label: "Favoritas", value: stats.starred, icon: Star, color: "yellow" },
            { label: "Hoje", value: stats.today, icon: Clock, color: "green" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className={isDark ? 'bg-neutral-900/80 border-neutral-800' : ''}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${stat.color}-500/10`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-500`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
                    <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={isDark ? 'bg-neutral-900 border border-neutral-800' : ''}>
            <TabsTrigger value="publications">Publicações</TabsTrigger>
            <TabsTrigger value="monitors">Monitoramentos</TabsTrigger>
          </TabsList>

          <TabsContent value="publications" className="mt-6 space-y-4">
            {/* Filters */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-slate-200'}`}>
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                    <Input
                      placeholder="Buscar por título, processo, partes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-10 ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}
                    />
                  </div>
                </div>
                
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className={`w-[150px] ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}>
                    <SelectValue placeholder="Fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Fontes</SelectItem>
                    {Object.entries(sourceLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className={`w-[150px] ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterArea} onValueChange={setFilterArea}>
                  <SelectTrigger className={`w-[140px] ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}>
                    <SelectValue placeholder="Área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Áreas</SelectItem>
                    {Object.entries(areaLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterRead} onValueChange={setFilterRead}>
                  <SelectTrigger className={`w-[130px] ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="unread">Não Lidas</SelectItem>
                    <SelectItem value="read">Lidas</SelectItem>
                    <SelectItem value="starred">Favoritas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Publications List */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {loadingPubs ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-32 rounded-xl animate-pulse ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                ) : filteredPublications.length === 0 ? (
                  <div className={`text-center py-16 rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-slate-200'}`}>
                    <Newspaper className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-slate-300'}`} />
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Nenhuma publicação encontrada</p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                      Adicione publicações para começar o monitoramento
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredPublications.map((pub) => (
                      <motion.div
                        key={pub.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onClick={() => {
                          setSelectedPublication(pub);
                          if (!pub.is_read) {
                            updatePublicationMutation.mutate({ id: pub.id, data: { is_read: true } });
                          }
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg ${
                          selectedPublication?.id === pub.id
                            ? isDark ? 'border-purple-500 bg-purple-500/10' : 'border-purple-500 bg-purple-50'
                            : isDark ? 'border-neutral-800 bg-neutral-900/80 hover:border-neutral-700' : 'border-slate-200 bg-white hover:border-slate-300'
                        } ${!pub.is_read ? 'ring-2 ring-purple-500/20' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${!pub.is_read ? 'bg-purple-500' : isDark ? 'bg-neutral-700' : 'bg-slate-300'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className={`font-medium line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {pub.title}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updatePublicationMutation.mutate({ id: pub.id, data: { is_starred: !pub.is_starred } });
                                }}
                                className={`shrink-0 p-1 rounded ${pub.is_starred ? 'text-yellow-500' : isDark ? 'text-neutral-600 hover:text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}
                              >
                                {pub.is_starred ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                              </button>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {pub.category && (
                                <Badge variant="outline" className={categoryColors[pub.category]}>
                                  {categoryLabels[pub.category]}
                                </Badge>
                              )}
                              {pub.area && (
                                <Badge variant="outline" className={isDark ? 'border-neutral-700 text-neutral-400' : ''}>
                                  {areaLabels[pub.area]}
                                </Badge>
                              )}
                              {pub.relevance_score && pub.relevance_score > 70 && (
                                <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                                  Alta Relevância
                                </Badge>
                              )}
                            </div>

                            <div className={`flex items-center gap-4 mt-3 text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {pub.publication_date && format(new Date(pub.publication_date), "dd/MM/yyyy")}
                              </span>
                              {pub.source && (
                                <span>{sourceLabels[pub.source]}</span>
                              )}
                              {pub.case_number && (
                                <span className="font-mono">{pub.case_number}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Detail Panel */}
              <div className="lg:col-span-1">
                {selectedPublication ? (
                  <div className={`sticky top-20 p-5 rounded-xl border ${isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Detalhes da Publicação
                      </h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deletePublicationMutation.mutate(selectedPublication.id)}
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-500 hover:text-red-500' : 'hover:bg-slate-100 text-slate-400 hover:text-red-500'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedPublication(null)}
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-500' : 'hover:bg-slate-100 text-slate-400'}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                          Título
                        </p>
                        <p className={isDark ? 'text-white' : 'text-slate-900'}>{selectedPublication.title}</p>
                      </div>

                      {selectedPublication.summary && (
                        <div>
                          <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                            Resumo IA
                          </p>
                          <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                            {selectedPublication.summary}
                          </p>
                        </div>
                      )}

                      {selectedPublication.case_number && (
                        <div>
                          <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                            Processo
                          </p>
                          <p className={`font-mono text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {selectedPublication.case_number}
                          </p>
                        </div>
                      )}

                      {selectedPublication.parties?.length > 0 && (
                        <div>
                          <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                            Partes
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {selectedPublication.parties.map((party, i) => (
                              <Badge key={i} variant="outline" className={isDark ? 'border-neutral-700' : ''}>
                                {party}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedPublication.keywords?.length > 0 && (
                        <div>
                          <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                            Palavras-chave
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {selectedPublication.keywords.map((kw, i) => (
                              <Badge key={i} variant="secondary" className={isDark ? 'bg-neutral-800 text-neutral-300' : ''}>
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                          Conteúdo Original
                        </p>
                        <div className={`text-sm max-h-60 overflow-y-auto p-3 rounded-lg ${isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-slate-50 text-slate-600'}`}>
                          {selectedPublication.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`sticky top-20 p-8 rounded-xl border text-center ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-slate-200'}`}>
                    <FileText className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-slate-300'}`} />
                    <p className={isDark ? 'text-neutral-500' : 'text-slate-500'}>
                      Selecione uma publicação para ver os detalhes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monitors" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monitors.map((monitor) => (
                <Card key={monitor.id} className={isDark ? 'bg-neutral-900/80 border-neutral-800' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-base flex items-center justify-between ${isDark ? 'text-white' : ''}`}>
                      <span className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-purple-500" />
                        {monitor.name}
                      </span>
                      <Badge variant={monitor.is_active ? "default" : "secondary"} className={monitor.is_active ? 'bg-green-500' : ''}>
                        {monitor.is_active ? 'Ativo' : 'Pausado'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {monitor.keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {monitor.keywords.slice(0, 3).map((kw, i) => (
                          <Badge key={i} variant="outline" className={`text-xs ${isDark ? 'border-neutral-700' : ''}`}>
                            {kw}
                          </Badge>
                        ))}
                        {monitor.keywords.length > 3 && (
                          <Badge variant="outline" className={`text-xs ${isDark ? 'border-neutral-700' : ''}`}>
                            +{monitor.keywords.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                      {monitor.last_check ? `Última verificação: ${format(new Date(monitor.last_check), "dd/MM HH:mm")}` : 'Nunca verificado'}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {monitors.length === 0 && (
                <div className={`col-span-full text-center py-12 rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-slate-200'}`}>
                  <Bell className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-slate-300'}`} />
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Nenhum monitoramento configurado</p>
                  <p className={`text-sm mt-1 mb-4 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                    Configure alertas para receber notificações de novas publicações
                  </p>
                  <Button onClick={() => setShowMonitorDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Monitoramento
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MonitorForm({ isDark, onSubmit, isLoading }) {
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
      is_active: true,
      notify_email: true
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={`text-sm font-medium ${isDark ? 'text-white' : ''}`}>Nome do Monitoramento</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Processos Trabalhistas"
          className={`mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}
          required
        />
      </div>
      <div>
        <label className={`text-sm font-medium ${isDark ? 'text-white' : ''}`}>Palavras-chave (separadas por vírgula)</label>
        <Input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Ex: intimação, sentença, recurso"
          className={`mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}
        />
      </div>
      <div>
        <label className={`text-sm font-medium ${isDark ? 'text-white' : ''}`}>Números de Processos</label>
        <Input
          value={caseNumbers}
          onChange={(e) => setCaseNumbers(e.target.value)}
          placeholder="Ex: 0001234-12.2024.8.26.0100"
          className={`mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}
        />
      </div>
      <div>
        <label className={`text-sm font-medium ${isDark ? 'text-white' : ''}`}>Nomes de Partes</label>
        <Input
          value={partyNames}
          onChange={(e) => setPartyNames(e.target.value)}
          placeholder="Ex: João Silva, Empresa XYZ"
          className={`mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}
        />
      </div>
      <Button type="submit" disabled={!name || isLoading} className="w-full bg-purple-600 hover:bg-purple-700">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
        Criar Monitoramento
      </Button>
    </form>
  );
}
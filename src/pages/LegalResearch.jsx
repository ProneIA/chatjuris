import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  BookOpen,
  Sparkles,
  Star,
  Copy,
  Trash2,
  Save,
  Loader2,
  ExternalLink,
  Scale,
  Gavel,
  FileText,
  Filter,
  BookMarked,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

// Dados completos de tribunais com URLs oficiais
const tribunaisCompleto = [
  { value: "all", label: "Todos os Tribunais", url: null },
  { value: "STF", label: "STF - Supremo Tribunal Federal", url: "https://portal.stf.jus.br/jurisprudencia/" },
  { value: "STJ", label: "STJ - Superior Tribunal de Justiça", url: "https://www.stj.jus.br" },
  { value: "TST", label: "TST - Tribunal Superior do Trabalho", url: "https://jurisprudencia.tst.jus.br/" },
  { value: "TSE", label: "TSE - Tribunal Superior Eleitoral", url: "https://www.tse.jus.br/jurisprudencia/decisoes/jurisprudencia" },
  { value: "STM", label: "STM - Superior Tribunal Militar", url: "https://jurisprudencia.stm.jus.br/" },
  { value: "TRF1", label: "TRF1 - Tribunal Regional Federal 1ª Região", url: "https://www2.cjf.jus.br/jurisprudencia/trf1/" },
  { value: "TRF2", label: "TRF2 - Tribunal Regional Federal 2ª Região", url: "https://www10.trf2.jus.br/consultas/?site=v2_jurisprudencia" },
  { value: "TRF3", label: "TRF3 - Tribunal Regional Federal 3ª Região", url: "https://web.trf3.jus.br/jurisprudencia/" },
  { value: "TRF4", label: "TRF4 - Tribunal Regional Federal 4ª Região", url: "https://jurisprudencia.trf4.jus.br/pesquisa/pesquisa.php?tipo=1" },
  { value: "TRF5", label: "TRF5 - Tribunal Regional Federal 5ª Região", url: "https://julia-pesquisa.trf5.jus.br/julia-pesquisa/#consulta" },
  { value: "TJSP", label: "TJSP - Tribunal de Justiça de São Paulo", url: "https://www.tjsp.jus.br" },
  { value: "TJRJ", label: "TJRJ - Tribunal de Justiça do Rio de Janeiro", url: "https://www.tjrj.jus.br" },
  { value: "TJMG", label: "TJMG - Tribunal de Justiça de Minas Gerais", url: "https://www.tjmg.jus.br" },
  { value: "TJRS", label: "TJRS - Tribunal de Justiça do Rio Grande do Sul", url: "https://www.tjrs.jus.br" },
];

const researchTypes = [
  { id: "jurisprudence", label: "Jurisprudência", icon: Gavel, description: "Decisões judiciais e acórdãos" },
  { id: "law", label: "Legislação", icon: Scale, description: "Leis, códigos e normas" },
  { id: "doctrine", label: "Doutrina", icon: BookMarked, description: "Artigos e obras acadêmicas" },
];

const areas = [
  "Civil", "Criminal", "Trabalhista", "Tributário", "Família", "Empresarial", 
  "Consumidor", "Previdenciário", "Constitucional", "Administrativo"
];

export default function LegalResearch({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("jurisprudence");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedTribunal, setSelectedTribunal] = useState("all");
  const [context, setContext] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [selectedSaved, setSelectedSaved] = useState(null);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const queryClient = useQueryClient();

  // Queries
  const { data: savedResearches = [] } = useQuery({
    queryKey: ['jurisprudences'],
    queryFn: () => base44.entities.Jurisprudence.list('-created_date'),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('title'),
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Jurisprudence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jurisprudences'] });
      toast.success("Pesquisa salva!");
      setActiveTab("library");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Jurisprudence.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jurisprudences'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Jurisprudence.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jurisprudences'] });
      setSelectedSaved(null);
      toast.success("Pesquisa excluída!");
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setCurrentResult(null);

    try {
      const selectedTribunalData = tribunaisCompleto.find(t => t.value === selectedTribunal);
      const tribunalInfo = selectedTribunal !== "all" && selectedTribunalData?.url
        ? `\n\nFONTE OFICIAL PRIORITÁRIA: ${selectedTribunalData.label} - ${selectedTribunalData.url}`
        : '';

      let prompt = "";

      if (searchType === "jurisprudence") {
        prompt = `Você é um especialista em pesquisa jurisprudencial brasileira.

TAREFA: Pesquisar jurisprudências sobre: "${searchQuery}"
${selectedArea ? `\nÁREA DO DIREITO: ${selectedArea}` : ''}
${selectedTribunal !== "all" ? `\nTRIBUNAL ESPECÍFICO: ${selectedTribunalData?.label}` : ''}
${context ? `\n\nCONTEXTO ADICIONAL: ${context}` : ''}
${tribunalInfo}

INSTRUÇÕES:
1. Busque EXCLUSIVAMENTE em fontes oficiais:
   - STF: https://portal.stf.jus.br/jurisprudencia/
   - STJ: https://www.stj.jus.br
   - TST: https://jurisprudencia.tst.jus.br/
   - TRFs, TJs: sites oficiais de cada tribunal

2. Para cada jurisprudência encontrada, forneça:
   - Tribunal
   - Número do processo/acórdão
   - Data da decisão
   - Ementa resumida
   - Relevância para a busca
   - Link oficial

3. Encontre 5-8 jurisprudências relevantes
4. Forneça análise jurídica consolidada
5. Use Markdown formatado

IMPORTANTE: Cite APENAS decisões reais com números de processos verificáveis.`;

      } else if (searchType === "law") {
        prompt = `Você é um especialista em legislação brasileira.

TAREFA: Pesquisar LEIS sobre: "${searchQuery}"
${selectedArea ? `\nÁREA: ${selectedArea}` : ''}
${context ? `\n\nCONTEXTO: ${context}` : ''}

INSTRUÇÕES:
1. Consulte fontes oficiais (Planalto.gov.br, legislação federal/estadual)
2. Para cada lei:
   - Nome completo e número
   - Artigos relevantes
   - Resumo do conteúdo
   - Link oficial
   - Aplicabilidade ao tema

3. Ordene por relevância
4. Análise sobre aplicação prática
5. Use Markdown formatado`;

      } else if (searchType === "doctrine") {
        prompt = `Você é um especialista em doutrina jurídica brasileira.

TAREFA: Pesquisar DOUTRINA sobre: "${searchQuery}"
${selectedArea ? `\nÁREA: ${selectedArea}` : ''}
${context ? `\n\nCONTEXTO: ${context}` : ''}

INSTRUÇÕES:
1. Busque artigos, livros e teses de doutrinadores renomados
2. Para cada referência:
   - Autor(es)
   - Título da obra/artigo
   - Ano
   - Resumo da tese
   - Citação relevante
   - Fonte

3. Priorize fontes atualizadas
4. Síntese das correntes doutrinárias
5. Use Markdown formatado`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
      });

      setCurrentResult({
        query: searchQuery,
        type: searchType,
        area: selectedArea,
        tribunal: selectedTribunal !== "all" ? selectedTribunal : null,
        content: response,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Erro na pesquisa:", error);
      toast.error("Erro ao realizar pesquisa");
    }

    setIsSearching(false);
  };

  const handleSave = () => {
    if (!currentResult) return;

    const titlePrefix = 
      searchType === "jurisprudence" ? "Jurisprudência" :
      searchType === "law" ? "Legislação" : "Doutrina";

    saveMutation.mutate({
      title: `${titlePrefix}: ${currentResult.query}`,
      court: currentResult.tribunal || "outros",
      summary: currentResult.content.substring(0, 500),
      full_text: currentResult.content,
      tags: [currentResult.query, searchType, selectedArea].filter(Boolean),
      source_url: selectedTribunalData?.url || "Pesquisa com IA",
      relevance_score: 85,
      is_favorite: false
    });
  };

  const filteredResearches = savedResearches.filter(r => {
    const matchesSearch = r.title?.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesFavorite = !filterFavorites || r.is_favorite;
    return matchesSearch && matchesFavorite;
  });

  const stats = {
    total: savedResearches.length,
    stf: savedResearches.filter(r => r.court === 'STF').length,
    stj: savedResearches.filter(r => r.court === 'STJ').length,
    favorites: savedResearches.filter(r => r.is_favorite).length,
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-6 py-6 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-3xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Pesquisa Jurídica
              </h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                Jurisprudência, legislação e doutrina com IA - {tribunaisCompleto.length} tribunais disponíveis
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-900' : 'bg-white border'}`}>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Total Salvas</p>
              <p className={`text-2xl font-light mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-900' : 'bg-white border'}`}>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>STF</p>
              <p className={`text-2xl font-light mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.stf}</p>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-900' : 'bg-white border'}`}>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>STJ</p>
              <p className={`text-2xl font-light mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.stj}</p>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-900' : 'bg-white border'}`}>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Favoritas</p>
              <p className={`text-2xl font-light mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.favorites}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={isDark ? 'bg-neutral-900' : 'bg-white border'}>
            <TabsTrigger value="search" className="gap-2">
              <Search className="w-4 h-4" />
              Nova Pesquisa
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Biblioteca ({savedResearches.length})
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Search Form */}
              <div className="lg:col-span-2 space-y-6">
                <div className={`p-6 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                  <div className="space-y-4">
                    {/* Type Selection */}
                    <div>
                      <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                        Tipo de Pesquisa
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {researchTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.id}
                              onClick={() => setSearchType(type.id)}
                              className={`p-4 rounded-lg border-2 transition-all text-left ${
                                searchType === type.id
                                  ? isDark 
                                    ? 'border-blue-500 bg-blue-500/10' 
                                    : 'border-blue-500 bg-blue-50'
                                  : isDark
                                    ? 'border-neutral-700 hover:border-neutral-600'
                                    : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <Icon className={`w-5 h-5 mb-2 ${searchType === type.id ? 'text-blue-500' : isDark ? 'text-neutral-400' : 'text-gray-600'}`} />
                              <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{type.label}</div>
                              <div className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{type.description}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                          Área do Direito
                        </label>
                        <select
                          value={selectedArea}
                          onChange={(e) => setSelectedArea(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300'}`}
                        >
                          <option value="">Todas as áreas</option>
                          {areas.map(area => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                        </select>
                      </div>

                      {searchType === "jurisprudence" && (
                        <div>
                          <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                            Tribunal
                          </label>
                          <select
                            value={selectedTribunal}
                            onChange={(e) => setSelectedTribunal(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300'}`}
                          >
                            {tribunaisCompleto.slice(0, 15).map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                          {selectedTribunal !== "all" && tribunaisCompleto.find(t => t.value === selectedTribunal)?.url && (
                            <a
                              href={tribunaisCompleto.find(t => t.value === selectedTribunal).url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Ver portal oficial
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Search Query */}
                    <div>
                      <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                        Consulta
                      </label>
                      <Textarea
                        placeholder="Ex: Prescrição em contratos de seguro, Danos morais por negativação indevida..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>

                    {/* Context */}
                    <div>
                      <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                        Contexto Adicional (Opcional)
                      </label>
                      <Textarea
                        placeholder="Descreva o contexto do caso ou situação específica..."
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleSearch}
                      disabled={!searchQuery.trim() || isSearching}
                      className="w-full gap-2"
                      size="lg"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Pesquisando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Pesquisar com IA
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Results */}
                <AnimatePresence>
                  {currentResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`p-6 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2">
                          <Badge>{researchTypes.find(t => t.id === currentResult.type)?.label}</Badge>
                          {currentResult.area && <Badge variant="outline">{currentResult.area}</Badge>}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(currentResult.content);
                              toast.success("Copiado!");
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </Button>
                          <Button size="sm" onClick={handleSave}>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                          </Button>
                        </div>
                      </div>

                      <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                {children}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ),
                          }}
                        >
                          {currentResult.content}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Links */}
              <div className={`p-6 rounded-xl border h-fit ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Acesso Rápido aos Tribunais
                </h3>
                <div className="space-y-2">
                  {tribunaisCompleto.slice(1, 11).filter(t => t.url).map(tribunal => (
                    <a
                      key={tribunal.value}
                      href={tribunal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isDark 
                          ? 'border-neutral-700 hover:bg-neutral-800' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {tribunal.label.split(' - ')[0]}
                      </span>
                      <ExternalLink className={`w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Saved List */}
              <div className="lg:col-span-2">
                <div className={`p-6 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Pesquisas Salvas
                    </h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Buscar..."
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Button
                        variant={filterFavorites ? "default" : "outline"}
                        size="icon"
                        onClick={() => setFilterFavorites(!filterFavorites)}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {filteredResearches.map((research) => (
                      <div
                        key={research.id}
                        onClick={() => setSelectedSaved(research)}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedSaved?.id === research.id
                            ? isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'
                            : isDark ? 'border-neutral-700 hover:border-neutral-600' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {research.title}
                              </h4>
                              {research.is_favorite && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline">{research.court || 'Geral'}</Badge>
                              <span className={isDark ? 'text-neutral-500' : 'text-gray-500'}>
                                {new Date(research.created_date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`} />
                        </div>
                      </div>
                    ))}
                    {filteredResearches.length === 0 && (
                      <div className="text-center py-12">
                        <BookOpen className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                        <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                          Nenhuma pesquisa salva
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              {selectedSaved && (
                <div className={`p-6 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Detalhes
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateMutation.mutate({
                          id: selectedSaved.id,
                          data: { is_favorite: !selectedSaved.is_favorite }
                        })}
                      >
                        <Star className={`w-4 h-4 ${selectedSaved.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Deseja excluir esta pesquisa?')) {
                            deleteMutation.mutate(selectedSaved.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                    <ReactMarkdown>{selectedSaved.full_text || selectedSaved.summary}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
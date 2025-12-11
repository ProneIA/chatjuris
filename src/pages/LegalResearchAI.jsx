import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  BookOpen,
  Sparkles,
  Star,
  Copy,
  Download,
  Trash2,
  Plus,
  Filter,
  Clock,
  FileText,
  Scale,
  Gavel,
  BookMarked,
  Loader2,
  ChevronRight,
  ExternalLink,
  Save,
  Tag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const researchTypes = [
  { id: "jurisprudence", label: "Jurisprudência", icon: Gavel },
  { id: "statute", label: "Legislação", icon: Scale },
  { id: "doctrine", label: "Doutrina", icon: BookMarked },
  { id: "general", label: "Geral", icon: Search },
];

const areas = [
  { id: "civil", label: "Civil" },
  { id: "criminal", label: "Criminal" },
  { id: "trabalhista", label: "Trabalhista" },
  { id: "tributario", label: "Tributário" },
  { id: "familia", label: "Família" },
  { id: "empresarial", label: "Empresarial" },
  { id: "consumidor", label: "Consumidor" },
  { id: "previdenciario", label: "Previdenciário" },
  { id: "constitucional", label: "Constitucional" },
  { id: "administrativo", label: "Administrativo" },
  { id: "geral", label: "Geral" },
];

const tribunais = [
  { id: "todos", label: "Todos os Tribunais" },
  { id: "STF", label: "STF - Supremo Tribunal Federal" },
  { id: "STJ", label: "STJ - Superior Tribunal de Justiça" },
  { id: "TST", label: "TST - Tribunal Superior do Trabalho" },
  { id: "TSE", label: "TSE - Tribunal Superior Eleitoral" },
  { id: "STM", label: "STM - Superior Tribunal Militar" },
  { id: "TJSP", label: "TJSP - Tribunal de Justiça de São Paulo" },
  { id: "TJRJ", label: "TJRJ - Tribunal de Justiça do Rio de Janeiro" },
  { id: "TJMG", label: "TJMG - Tribunal de Justiça de Minas Gerais" },
  { id: "TJRS", label: "TJRS - Tribunal de Justiça do Rio Grande do Sul" },
  { id: "TJPR", label: "TJPR - Tribunal de Justiça do Paraná" },
  { id: "TJSC", label: "TJSC - Tribunal de Justiça de Santa Catarina" },
  { id: "TJBA", label: "TJBA - Tribunal de Justiça da Bahia" },
  { id: "TJPE", label: "TJPE - Tribunal de Justiça de Pernambuco" },
  { id: "TJCE", label: "TJCE - Tribunal de Justiça do Ceará" },
  { id: "TJPI", label: "TJPI - Tribunal de Justiça do Piauí" },
  { id: "TJGO", label: "TJGO - Tribunal de Justiça de Goiás" },
  { id: "TJDF", label: "TJDF - Tribunal de Justiça do Distrito Federal" },
  { id: "TJES", label: "TJES - Tribunal de Justiça do Espírito Santo" },
  { id: "TRF1", label: "TRF1 - Tribunal Regional Federal da 1ª Região" },
  { id: "TRF2", label: "TRF2 - Tribunal Regional Federal da 2ª Região" },
  { id: "TRF3", label: "TRF3 - Tribunal Regional Federal da 3ª Região" },
  { id: "TRF4", label: "TRF4 - Tribunal Regional Federal da 4ª Região" },
  { id: "TRF5", label: "TRF5 - Tribunal Regional Federal da 5ª Região" },
];

export default function LegalResearchAI({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");
  const [researchType, setResearchType] = useState("general");
  const [area, setArea] = useState("geral");
  const [isSearching, setIsSearching] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [sortOrder, setSortOrder] = useState("relevant");
  const [tribunal, setTribunal] = useState("todos");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: savedResearches = [] } = useQuery({
    queryKey: ['legal-researches'],
    queryFn: () => base44.entities.LegalResearch.list('-created_date'),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list(),
  });

  const saveResearchMutation = useMutation({
    mutationFn: (data) => base44.entities.LegalResearch.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-researches'] });
      toast.success("Pesquisa salva!");
    },
  });

  const updateResearchMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LegalResearch.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-researches'] });
    },
  });

  const deleteResearchMutation = useMutation({
    mutationFn: (id) => base44.entities.LegalResearch.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-researches'] });
      setSelectedResearch(null);
      toast.success("Pesquisa excluída!");
    },
  });

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setCurrentResult(null);

    try {
      const typeLabel = researchTypes.find(t => t.id === researchType)?.label || "Geral";
      const areaLabel = areas.find(a => a.id === area)?.label || "Geral";

      const yearFilter = minYear || maxYear 
        ? `\nPeríodo: ${minYear ? `a partir de ${minYear}` : ''}${minYear && maxYear ? ' até ' : ''}${maxYear ? `até ${maxYear}` : ''}`
        : '';
      
      const tribunalFilter = researchType === "jurisprudence" && tribunal !== "todos"
        ? `\nTribunal de preferência: ${tribunais.find(t => t.id === tribunal)?.label || tribunal}. PRIORIZE decisões deste tribunal.`
        : '';
      
      const sortInstruction = sortOrder === 'recent' 
        ? '\n\nPRIORIDADE: Dê preferência às decisões e legislações mais RECENTES, ordenando os resultados do mais novo para o mais antigo.'
        : sortOrder === 'oldest'
        ? '\n\nPRIORIDADE: Dê preferência às decisões e legislações mais ANTIGAS, apresentando a evolução histórica do tema.'
        : '\n\nPRIORIDADE: Ordene os resultados por RELEVÂNCIA jurídica, priorizando decisões de tribunais superiores e legislação vigente.';

      const prompt = `Você é um especialista em pesquisa jurídica brasileira. 
      
Realize uma pesquisa completa sobre: "${query}"

Tipo de pesquisa: ${typeLabel}
Área do direito: ${areaLabel}${yearFilter}${tribunalFilter}${sortInstruction}

Forneça uma resposta estruturada com:

1. **Resumo Executivo**: Uma visão geral concisa do tema (2-3 parágrafos)

2. **Fundamentação Legal**: 
   - Artigos de lei relevantes
   - Códigos aplicáveis
   - Constituição Federal (se aplicável)

3. **Jurisprudência Relevante**:
   - Cite 3-5 decisões importantes dos tribunais superiores (STF, STJ, TST)
   - Inclua número do processo, data e ementa resumida
   - Indique a tendência jurisprudencial atual

4. **Doutrina**:
   - Mencione autores e obras relevantes
   - Principais posicionamentos doutrinários

5. **Análise Prática**:
   - Aplicação prática do tema
   - Pontos de atenção
   - Possíveis argumentos favoráveis e contrários

6. **Conclusão e Recomendações**

Formate a resposta em Markdown para melhor visualização.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
      });

      setCurrentResult({
        query,
        research_type: researchType,
        area,
        results_summary: response,
        sources: []
      });

    } catch (error) {
      console.error("Erro na pesquisa:", error);
      toast.error("Erro ao realizar pesquisa");
    }

    setIsSearching(false);
  };

  const handleSaveResearch = () => {
    if (!currentResult) return;
    
    const dataToSave = {
      title: query.slice(0, 100) || "Pesquisa sem título",
      query: currentResult.query || "",
      research_type: currentResult.research_type || "general",
      area: currentResult.area || "geral",
      results_summary: currentResult.results_summary || "",
    };
    
    // Só adiciona sources se não estiver vazio
    if (currentResult.sources && currentResult.sources.length > 0) {
      dataToSave.sources = currentResult.sources;
    }
    
    saveResearchMutation.mutate(dataToSave);
  };

  const handleCopyCitation = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const filteredResearches = savedResearches.filter(r => {
    const matchesSearch = r.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.query?.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesFavorite = !filterFavorites || r.is_favorite;
    return matchesSearch && matchesFavorite;
  });

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Pesquisa Jurídica com IA
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Pesquise jurisprudência, legislação e doutrina com inteligência artificial
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Search Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Box */}
            <div className={`p-6 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <div className="space-y-4">
                {/* Research Type Tabs */}
                <div className="flex flex-wrap gap-2">
                  {researchTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant={researchType === type.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setResearchType(type.id)}
                      className="gap-2"
                    >
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </Button>
                  ))}
                </div>

                {/* Area Select */}
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200'}`}
                >
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>

                {/* Tribunal Select - Only for Jurisprudence */}
                {researchType === "jurisprudence" && (
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      Tribunal de Preferência
                    </label>
                    <select
                      value={tribunal}
                      onChange={(e) => setTribunal(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200'}`}
                    >
                      {tribunais.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Year Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      Ano Mínimo
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 2015"
                      value={minYear}
                      onChange={(e) => setMinYear(e.target.value)}
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      Ano Máximo
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 2025"
                      value={maxYear}
                      onChange={(e) => setMaxYear(e.target.value)}
                      min="1900"
                      max="2025"
                    />
                  </div>
                </div>

                {/* Sort Order */}
                <div>
                  <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Ordenar por
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200'}`}
                  >
                    <option value="relevant">Mais Relevantes</option>
                    <option value="recent">Mais Recentes</option>
                    <option value="oldest">Mais Antigos</option>
                  </select>
                </div>

                {/* Query Input */}
                <div className="relative">
                  <Textarea
                    placeholder="Digite sua consulta jurídica... Ex: 'Quais são os requisitos para concessão de tutela de urgência no novo CPC?'"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[100px] pr-12"
                  />
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={!query.trim() || isSearching}
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
            {currentResult && (
              <div className={`p-6 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Resultado da Pesquisa
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopyCitation(currentResult.results_summary)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                    <Button size="sm" onClick={handleSaveResearch}>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>

                <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                  <ReactMarkdown>{currentResult.results_summary}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Saved Research Details */}
            {selectedResearch && !currentResult && (
              <div className={`p-6 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedResearch.title}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      {new Date(selectedResearch.created_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateResearchMutation.mutate({
                        id: selectedResearch.id,
                        data: { is_favorite: !selectedResearch.is_favorite }
                      })}
                    >
                      <Star className={`w-4 h-4 ${selectedResearch.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCopyCitation(selectedResearch.results_summary)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteResearchMutation.mutate(selectedResearch.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <Badge>{researchTypes.find(t => t.id === selectedResearch.research_type)?.label}</Badge>
                  <Badge variant="outline">{areas.find(a => a.id === selectedResearch.area)?.label}</Badge>
                </div>

                <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                  <ReactMarkdown>{selectedResearch.results_summary}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Saved Researches Sidebar */}
          <div className={`rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
            <div className={`p-4 border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
              <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Pesquisas Salvas
              </h3>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant={filterFavorites ? "default" : "outline"}
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setFilterFavorites(!filterFavorites)}
                >
                  <Star className="w-4 h-4" />
                  Favoritos
                </Button>
              </div>
            </div>

            <div className="divide-y divide-neutral-800 max-h-[500px] overflow-y-auto">
              {filteredResearches.map((research) => (
                <div
                  key={research.id}
                  onClick={() => { setSelectedResearch(research); setCurrentResult(null); }}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedResearch?.id === research.id
                      ? isDark ? 'bg-neutral-800' : 'bg-gray-100'
                      : isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                      {researchTypes.find(t => t.id === research.research_type)?.icon && 
                        React.createElement(researchTypes.find(t => t.id === research.research_type).icon, {
                          className: `w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`
                        })
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {research.title}
                        </h4>
                        {research.is_favorite && (
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        {new Date(research.created_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`} />
                  </div>
                </div>
              ))}
              {filteredResearches.length === 0 && (
                <div className="p-8 text-center">
                  <BookOpen className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Nenhuma pesquisa salva
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
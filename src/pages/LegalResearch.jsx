import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  Star,
  StarOff,
  Copy,
  Check,
  Loader2,
  Filter,
  Clock,
  FileText,
  Scale,
  Bookmark,
  Plus,
  Trash2,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

const legalAreas = [
  { value: "civil", label: "Civil" },
  { value: "criminal", label: "Criminal" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "tributario", label: "Tributário" },
  { value: "familia", label: "Família" },
  { value: "empresarial", label: "Empresarial" },
  { value: "consumidor", label: "Consumidor" },
  { value: "previdenciario", label: "Previdenciário" },
  { value: "constitucional", label: "Constitucional" },
  { value: "administrativo", label: "Administrativo" },
  { value: "outros", label: "Outros" }
];

export default function LegalResearch({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [copiedCitation, setCopiedCitation] = useState(null);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [currentTab, setCurrentTab] = useState("search");

  const { data: researches = [] } = useQuery({
    queryKey: ['legal-researches'],
    queryFn: () => base44.entities.LegalResearch.list('-created_date'),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list(),
  });

  const createResearchMutation = useMutation({
    mutationFn: (data) => base44.entities.LegalResearch.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['legal-researches'] });
      setSelectedResearch(data);
      setCurrentTab("history");
    }
  });

  const updateResearchMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LegalResearch.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-researches'] });
    }
  });

  const deleteResearchMutation = useMutation({
    mutationFn: (id) => base44.entities.LegalResearch.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-researches'] });
      setSelectedResearch(null);
    }
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const prompt = `Você é um assistente jurídico especializado em direito brasileiro. 
Realize uma pesquisa jurídica completa sobre: "${searchQuery}"
${selectedArea ? `Área do direito: ${legalAreas.find(a => a.value === selectedArea)?.label}` : ''}

Forneça:
1. Um resumo executivo da questão jurídica
2. Principais fundamentos legais (leis, artigos, códigos)
3. Jurisprudências relevantes (com número do processo, tribunal e ementa resumida)
4. Doutrinas e entendimentos majoritários
5. Conclusões e recomendações práticas

Formate a resposta de forma clara e organizada.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string", description: "Resumo executivo" },
            legal_basis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  reference: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            jurisprudence: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  court: { type: "string" },
                  case_number: { type: "string" },
                  summary: { type: "string" },
                  date: { type: "string" }
                }
              }
            },
            doctrine: { type: "string" },
            conclusions: { type: "string" }
          }
        }
      });

      const results = [
        ...(response.legal_basis || []).map(item => ({
          type: "legislacao",
          title: item.reference,
          summary: item.description,
          source: item.type,
          citation: item.reference,
          relevance: 90
        })),
        ...(response.jurisprudence || []).map(item => ({
          type: "jurisprudencia",
          title: `${item.court} - ${item.case_number}`,
          summary: item.summary,
          source: item.court,
          citation: `${item.court}, ${item.case_number}`,
          relevance: 85
        }))
      ];

      const aiSummary = `## Resumo\n${response.summary}\n\n## Doutrina\n${response.doctrine}\n\n## Conclusões\n${response.conclusions}`;

      await createResearchMutation.mutateAsync({
        title: searchQuery.slice(0, 100),
        query: searchQuery,
        area: selectedArea || "outros",
        results,
        ai_summary: aiSummary,
        is_favorite: false,
        tags: []
      });

    } catch (error) {
      console.error("Erro na pesquisa:", error);
      alert("Erro ao realizar pesquisa. Tente novamente.");
    }
    
    setIsSearching(false);
  };

  const toggleFavorite = (research) => {
    updateResearchMutation.mutate({
      id: research.id,
      data: { is_favorite: !research.is_favorite }
    });
  };

  const copyCitation = (citation) => {
    navigator.clipboard.writeText(citation);
    setCopiedCitation(citation);
    setTimeout(() => setCopiedCitation(null), 2000);
  };

  const filteredResearches = researches.filter(r => 
    filterFavorites ? r.is_favorite : true
  );

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Pesquisa Jurídica com IA
          </h1>
          <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
            Pesquise jurisprudências, leis e doutrinas com inteligência artificial
          </p>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="search">
              <Search className="w-4 h-4 mr-2" />
              Nova Pesquisa
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="w-4 h-4 mr-2" />
              Histórico ({researches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
                  <Sparkles className="w-5 h-5" />
                  Pesquisa com IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-white' : ''}`}>
                    O que você deseja pesquisar?
                  </label>
                  <Textarea
                    placeholder="Ex: Qual o prazo prescricional para ações de indenização por danos morais no direito do consumidor?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`min-h-[120px] ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}
                  />
                </div>

                <div>
                  <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-white' : ''}`}>
                    Área do Direito (opcional)
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className={`w-full border rounded-lg p-2.5 ${
                      isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Todas as áreas</option>
                    {legalAreas.map(area => (
                      <option key={area.value} value={area.value}>{area.label}</option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className={`w-full py-6 ${isDark ? 'bg-white text-black hover:bg-gray-100' : ''}`}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Pesquisando...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Pesquisar com IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Lista de Pesquisas */}
              <div className="lg:col-span-1">
                <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-base ${isDark ? 'text-white' : ''}`}>
                        Pesquisas Salvas
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilterFavorites(!filterFavorites)}
                        className={filterFavorites ? 'text-yellow-500' : ''}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredResearches.map(research => (
                      <div
                        key={research.id}
                        onClick={() => setSelectedResearch(research)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedResearch?.id === research.id
                            ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                            : isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm truncate ${
                              selectedResearch?.id === research.id
                                ? isDark ? 'text-black' : 'text-white'
                                : isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {research.title}
                            </p>
                            <p className={`text-xs mt-1 ${
                              selectedResearch?.id === research.id
                                ? isDark ? 'text-gray-600' : 'text-gray-300'
                                : isDark ? 'text-neutral-500' : 'text-gray-500'
                            }`}>
                              {format(new Date(research.created_date), "dd/MM/yyyy")}
                            </p>
                          </div>
                          {research.is_favorite && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                          )}
                        </div>
                        {research.area && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {legalAreas.find(a => a.value === research.area)?.label}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {filteredResearches.length === 0 && (
                      <p className={`text-center py-8 text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        Nenhuma pesquisa encontrada
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Detalhes da Pesquisa */}
              <div className="lg:col-span-2">
                {selectedResearch ? (
                  <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className={isDark ? 'text-white' : ''}>
                            {selectedResearch.title}
                          </CardTitle>
                          <p className={`text-sm mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                            {format(new Date(selectedResearch.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(selectedResearch)}
                          >
                            {selectedResearch.is_favorite ? (
                              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            ) : (
                              <StarOff className="w-5 h-5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteResearchMutation.mutate(selectedResearch.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="summary">
                        <TabsList className="mb-4">
                          <TabsTrigger value="summary">Resumo IA</TabsTrigger>
                          <TabsTrigger value="results">
                            Resultados ({selectedResearch.results?.length || 0})
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="summary">
                          <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                            <ReactMarkdown>{selectedResearch.ai_summary}</ReactMarkdown>
                          </div>
                        </TabsContent>

                        <TabsContent value="results" className="space-y-3">
                          {selectedResearch.results?.map((result, idx) => (
                            <div
                              key={idx}
                              className={`p-4 rounded-lg border ${isDark ? 'border-neutral-700 bg-neutral-800' : 'border-gray-200'}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      {result.type === 'jurisprudencia' ? 'Jurisprudência' : 'Legislação'}
                                    </Badge>
                                    <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                                      {result.source}
                                    </span>
                                  </div>
                                  <p className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {result.title}
                                  </p>
                                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                                    {result.summary}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyCitation(result.citation)}
                                >
                                  {copiedCitation === result.citation ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className={`h-full flex items-center justify-center min-h-[400px] ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}>
                    <CardContent className="text-center py-16">
                      <BookOpen className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                      <p className={isDark ? 'text-neutral-500' : 'text-gray-500'}>
                        Selecione uma pesquisa para ver detalhes
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
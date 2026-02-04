import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, ExternalLink, BookOpen, Scale, Gavel, FileText, Copy, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const tribunals = [
  { id: "all", name: "Todos os Tribunais", icon: Scale, url: null },
  
  // Tribunais Superiores
  { id: "stf", name: "STF - Supremo Tribunal Federal", icon: Gavel, url: "https://portal.stf.jus.br/jurisprudencia/" },
  { id: "stj", name: "STJ - Superior Tribunal de Justiça", icon: BookOpen, url: "https://www.stj.jus.br" },
  { id: "tst", name: "TST - Tribunal Superior do Trabalho", icon: FileText, url: "https://jurisprudencia.tst.jus.br/" },
  { id: "tse", name: "TSE - Tribunal Superior Eleitoral", icon: FileText, url: "https://www.tse.jus.br/jurisprudencia/decisoes/jurisprudencia" },
  { id: "stm", name: "STM - Superior Tribunal Militar", icon: FileText, url: "https://jurisprudencia.stm.jus.br/" },
  
  // Tribunais Regionais Federais
  { id: "trf1", name: "TRF1 - Tribunal Regional Federal 1ª Região", icon: FileText, url: "https://www2.cjf.jus.br/jurisprudencia/trf1/" },
  { id: "trf2", name: "TRF2 - Tribunal Regional Federal 2ª Região", icon: FileText, url: "https://www10.trf2.jus.br/consultas/?site=v2_jurisprudencia" },
  { id: "trf3", name: "TRF3 - Tribunal Regional Federal 3ª Região", icon: FileText, url: "https://web.trf3.jus.br/jurisprudencia/" },
  { id: "trf4", name: "TRF4 - Tribunal Regional Federal 4ª Região", icon: FileText, url: "https://jurisprudencia.trf4.jus.br/pesquisa/pesquisa.php?tipo=1" },
  { id: "trf5", name: "TRF5 - Tribunal Regional Federal 5ª Região", icon: FileText, url: "https://julia-pesquisa.trf5.jus.br/julia-pesquisa/#consulta" },
  
  // Tribunais Regionais do Trabalho (principais)
  { id: "trt1", name: "TRT1 - Regional do Trabalho 1ª Região (RJ)", icon: FileText, url: "https://www.trt1.jus.br" },
  { id: "trt2", name: "TRT2 - Regional do Trabalho 2ª Região (SP Capital)", icon: FileText, url: "https://www.trt2.jus.br" },
  { id: "trt3", name: "TRT3 - Regional do Trabalho 3ª Região (MG)", icon: FileText, url: "https://www.trt3.jus.br" },
  { id: "trt4", name: "TRT4 - Regional do Trabalho 4ª Região (RS)", icon: FileText, url: "https://www.trt4.jus.br" },
  { id: "trt15", name: "TRT15 - Regional do Trabalho 15ª Região (SP Interior)", icon: FileText, url: "https://www.trt15.jus.br" },
  
  // Tribunais de Justiça (principais estados)
  { id: "tjsp", name: "TJSP - Tribunal de Justiça de São Paulo", icon: FileText, url: "https://www.tjsp.jus.br" },
  { id: "tjrj", name: "TJRJ - Tribunal de Justiça do Rio de Janeiro", icon: FileText, url: "https://www.tjrj.jus.br" },
  { id: "tjmg", name: "TJMG - Tribunal de Justiça de Minas Gerais", icon: FileText, url: "https://www.tjmg.jus.br" },
  { id: "tjrs", name: "TJRS - Tribunal de Justiça do Rio Grande do Sul", icon: FileText, url: "https://www.tjrs.jus.br" },
  { id: "tjpr", name: "TJPR - Tribunal de Justiça do Paraná", icon: FileText, url: "https://www.tjpr.jus.br" },
  { id: "tjsc", name: "TJSC - Tribunal de Justiça de Santa Catarina", icon: FileText, url: "https://www.tjsc.jus.br" },
  { id: "tjba", name: "TJBA - Tribunal de Justiça da Bahia", icon: FileText, url: "https://www.tjba.jus.br" },
  { id: "tjpe", name: "TJPE - Tribunal de Justiça de Pernambuco", icon: FileText, url: "https://www.tjpe.jus.br" },
  { id: "tjce", name: "TJCE - Tribunal de Justiça do Ceará", icon: FileText, url: "https://www.tjce.jus.br" },
  { id: "tjgo", name: "TJGO - Tribunal de Justiça de Goiás", icon: FileText, url: "https://www.tjgo.jus.br" },
  { id: "tjdft", name: "TJDFT - Tribunal de Justiça do Distrito Federal", icon: FileText, url: "https://www.tjdft.jus.br" }
];

const searchTypes = [
  { id: "keyword", name: "Palavras-chave", description: "Busca simples por termos" },
  { id: "tema", name: "Por Tema", description: "Busca por assunto específico" },
  { id: "case", name: "Caso Similar", description: "Encontrar casos similares ao seu" }
];

export default function JurisprudenceSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTribunal, setSelectedTribunal] = useState("all");
  const [searchType, setSearchType] = useState("keyword");
  const [caseDetails, setCaseDetails] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() && searchType !== 'case') return;
    if (searchType === 'case' && !caseDetails.trim()) return;

    setIsSearching(true);
    setResults(null);

    try {
      let prompt = "";

      if (searchType === 'keyword') {
        prompt = `Você é um assistente jurídico especializado em pesquisa de jurisprudência brasileira.

TAREFA: Pesquisar jurisprudências relevantes sobre: "${searchQuery}"

${selectedTribunal !== 'all' ? `TRIBUNAL ESPECÍFICO: ${tribunals.find(t => t.id === selectedTribunal)?.name}` : 'TODOS OS TRIBUNAIS'}

FONTES OFICIAIS OBRIGATÓRIAS:
- STF: https://portal.stf.jus.br/jurisprudencia/
- STJ: https://www.stj.jus.br
- TST: https://jurisprudencia.tst.jus.br/
- TSE: https://www.tse.jus.br/jurisprudencia/decisoes/jurisprudencia
- TRFs: sites oficiais dos Tribunais Regionais Federais (TRF1 a TRF5)
- TRTs: sites oficiais dos Tribunais Regionais do Trabalho (TRT1 a TRT24)
- TJs: sites oficiais dos Tribunais de Justiça Estaduais
- CJF: https://jurisprudencia.cjf.jus.br/
- JusBrasil (agregador): https://www.jusbrasil.com.br/jurisprudencia/

IMPORTANTE: Priorize fontes OFICIAIS dos tribunais. Busque informações reais e atualizadas.

Retorne um JSON estruturado com:

{
  "summary": "Resumo executivo da pesquisa e principais achados (2-3 parágrafos)",
  "total_found": "Número estimado de jurisprudências encontradas",
  "main_themes": ["Tema 1", "Tema 2", "Tema 3"],
  "jurisprudences": [
    {
      "tribunal": "Nome do tribunal (ex: STF, STJ, TJSP)",
      "number": "Número do processo ou acórdão",
      "date": "Data da decisão",
      "summary": "Ementa resumida",
      "keywords": ["palavra1", "palavra2"],
      "url": "Link para consulta (se disponível)",
      "relevance": "high|medium|low",
      "reasoning": "Por que esta jurisprudência é relevante para a busca"
    }
  ],
  "legal_analysis": "Análise jurídica consolidada das decisões encontradas",
  "practical_tips": ["Dica prática 1", "Dica prática 2"],
  "related_topics": ["Tópico relacionado 1", "Tópico relacionado 2"]
}`;

      } else if (searchType === 'tema') {
        prompt = `Você é um assistente jurídico especializado em pesquisa temática de jurisprudência.

TEMA PESQUISADO: "${searchQuery}"
${selectedTribunal !== 'all' ? `TRIBUNAL: ${tribunals.find(t => t.id === selectedTribunal)?.name}` : ''}

Pesquise jurisprudências organizadas por tema, identificando:
- Entendimentos majoritários
- Súmulas relacionadas
- Teses jurídicas consolidadas
- Divergências jurisprudenciais

Use as fontes: JusBrasil, STJ e STF.

Retorne JSON com a mesma estrutura anterior, mas com foco na análise temática.`;

      } else if (searchType === 'case') {
        prompt = `Você é um assistente jurídico especializado em encontrar precedentes.

DETALHES DO CASO DO USUÁRIO:
${caseDetails}

BUSCA: "${searchQuery}"
${selectedTribunal !== 'all' ? `TRIBUNAL: ${tribunals.find(t => t.id === selectedTribunal)?.name}` : ''}

TAREFA: Encontrar casos SIMILARES que possam servir como precedentes ou referência.

Analise:
- Similaridades fáticas
- Teses jurídicas aplicáveis
- Resultados obtidos
- Estratégias vencedoras

Use fontes: JusBrasil, STJ e STF.

Retorne JSON estruturado com casos similares e análise comparativa.`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            total_found: { type: "string" },
            main_themes: {
              type: "array",
              items: { type: "string" }
            },
            jurisprudences: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tribunal: { type: "string" },
                  number: { type: "string" },
                  date: { type: "string" },
                  summary: { type: "string" },
                  keywords: {
                    type: "array",
                    items: { type: "string" }
                  },
                  url: { type: "string" },
                  relevance: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            },
            legal_analysis: { type: "string" },
            practical_tips: {
              type: "array",
              items: { type: "string" }
            },
            related_topics: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setResults(response);
    } catch (error) {
      console.error("Erro na pesquisa:", error);
      toast.error("Erro ao pesquisar jurisprudências. Tente novamente.");
    }

    setIsSearching(false);
  };

  const relevanceColors = {
    high: "bg-green-100 text-green-800 border-green-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-gray-100 text-gray-800 border-gray-300"
  };

  const relevanceLabels = {
    high: "Alta Relevância",
    medium: "Média Relevância",
    low: "Baixa Relevância"
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Search Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Pesquisa de Jurisprudência</h1>
              <p className="text-sm text-slate-600">STF, STJ, TRFs e outros tribunais</p>
            </div>
          </div>

          {/* Search Type Selection */}
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            {searchTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSearchType(type.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  searchType === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <h3 className="font-semibold text-slate-900 mb-1">{type.name}</h3>
                <p className="text-xs text-slate-600">{type.description}</p>
              </button>
            ))}
          </div>

          {/* Search Form */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Select value={selectedTribunal} onValueChange={setSelectedTribunal}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tribunals.map(t => {
                    const Icon = t.icon;
                    return (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {t.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Digite sua pesquisa (ex: prescrição tributária, dano moral, etc.)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || (!searchQuery.trim() && searchType !== 'case')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Pesquisando...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Pesquisar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {searchType === 'case' && (
              <Textarea
                placeholder="Descreva seu caso: fatos, questão jurídica, partes envolvidas, pedidos..."
                value={caseDetails}
                onChange={(e) => setCaseDetails(e.target.value)}
                rows={4}
                className="w-full"
              />
            )}
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs text-slate-500">Acesso direto aos tribunais:</span>
            <a
              href="https://portal.stf.jus.br/jurisprudencia/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              STF <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.stj.jus.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              STJ <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://jurisprudencia.tst.jus.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              TST <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.tse.jus.br/jurisprudencia/decisoes/jurisprudencia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              TSE <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://jurisprudencia.cjf.jus.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              CJF <ExternalLink className="w-3 h-3" />
            </a>
            {selectedTribunal !== 'all' && tribunals.find(t => t.id === selectedTribunal)?.url && (
              <a
                href={tribunals.find(t => t.id === selectedTribunal).url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 font-semibold"
              >
                Ver {tribunals.find(t => t.id === selectedTribunal).name} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Summary */}
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-6 h-6 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-2">Resumo da Pesquisa</h3>
                      <p className="text-slate-700 leading-relaxed mb-3">{results.summary}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-white">
                          📊 {results.total_found} resultados
                        </Badge>
                        {results.main_themes?.map((theme, idx) => (
                          <Badge key={idx} className="bg-blue-100 text-blue-800">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Jurisprudences */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Gavel className="w-5 h-5" />
                    Jurisprudências Encontradas ({results.jurisprudences?.length || 0})
                  </h3>
                  <div className="space-y-4">
                    {results.jurisprudences?.map((juris, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="p-6 hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Scale className="w-6 h-6 text-slate-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900">{juris.tribunal}</h4>
                                <p className="text-sm text-slate-600 font-mono">{juris.number}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={relevanceColors[juris.relevance]}>
                                {relevanceLabels[juris.relevance]}
                              </Badge>
                              <Badge variant="outline">{juris.date}</Badge>
                            </div>
                          </div>

                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-slate-700 mb-2">Ementa:</h5>
                            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg">
                              {juris.summary}
                            </p>
                          </div>

                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-slate-700 mb-2">Relevância:</h5>
                            <p className="text-sm text-slate-600 italic">{juris.reasoning}</p>
                          </div>

                          {juris.keywords && juris.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {juris.keywords.map((keyword, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            {juris.url && (
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                              >
                                <a href={juris.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Ver Inteiro Teor
                                </a>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(`${juris.tribunal} - ${juris.number}\n${juris.summary}`);
                                toast.success("Jurisprudência copiada!");
                              }}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copiar
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Legal Analysis */}
                {results.legal_analysis && (
                  <Card className="p-6">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Análise Jurídica Consolidada
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{results.legal_analysis}</ReactMarkdown>
                    </div>
                  </Card>
                )}

                {/* Practical Tips */}
                {results.practical_tips && results.practical_tips.length > 0 && (
                  <Card className="p-6 bg-green-50 border-2 border-green-200">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Dicas Práticas
                    </h3>
                    <ul className="space-y-2">
                      {results.practical_tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="text-green-600 mt-0.5">✓</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Related Topics */}
                {results.related_topics && results.related_topics.length > 0 && (
                  <Card className="p-6">
                    <h3 className="font-bold text-slate-900 mb-3">Tópicos Relacionados</h3>
                    <div className="flex flex-wrap gap-2">
                      {results.related_topics.map((topic, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="cursor-pointer hover:bg-blue-50"
                          onClick={() => {
                            setSearchQuery(topic);
                            handleSearch();
                          }}
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!results && !isSearching && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Pesquise Jurisprudências
              </h3>
              <p className="text-slate-600 max-w-md mx-auto">
                Use a busca acima para encontrar decisões relevantes do STF, STJ e outros tribunais.
                A IA analisará e estruturará os resultados para você.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
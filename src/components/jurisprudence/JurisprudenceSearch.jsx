import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Sparkles, Loader2, Star, Save, ExternalLink, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

export default function JurisprudenceSearch({ cases, onSave }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [court, setCourt] = useState("all");
  const [year, setYear] = useState("all");
  const [context, setContext] = useState("");
  const [relatedCase, setRelatedCase] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setResults(null);

    try {
      const courtFilter = court !== "all" ? ` no tribunal ${court}` : "";
      const yearFilter = year !== "all" ? ` do ano ${year}` : "";
      const contextInfo = context ? `\n\nCONTEXTO DO CASO: ${context}` : "";

      const prompt = `Você é um especialista em pesquisa jurisprudencial brasileira. 

TAREFA: Pesquisar jurisprudências${courtFilter}${yearFilter} sobre o seguinte tema:
"${searchTerm}"
${contextInfo}

INSTRUÇÕES:
1. Busque nos principais sites de jurisprudência brasileiros:
   - JusBrasil (https://www.jusbrasil.com.br/jurisprudencia/)
   - STF (https://portal.stf.jus.br/jurisprudencia/)
   - STJ (https://www.stj.jus.br/sites/portalp/Jurisprudencia/)

2. Para cada jurisprudência encontrada, forneça:
   - Título/Ementa resumida
   - Tribunal
   - Número do processo/acórdão
   - Data da decisão (se disponível)
   - Resumo da tese jurídica
   - Relevância para o tema pesquisado
   - Link/fonte

3. Ordene por relevância (mais relevantes primeiro)

4. Encontre 5-10 jurisprudências mais pertinentes

5. No final, forneça uma análise geral das tendências jurisprudenciais encontradas

FORMATO DA RESPOSTA:
Use Markdown formatado, com:
- **Negrito** para títulos e tribunais
- Numeração para cada jurisprudência
- Links clicáveis quando disponíveis
- Seções bem organizadas

Seja específico, cite decisões reais encontradas na internet, e forneça análise jurídica detalhada.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true
      });

      setResults({
        query: searchTerm,
        court: court,
        year: year,
        content: response,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Erro ao pesquisar:", error);
      alert("Erro ao realizar pesquisa. Tente novamente.");
    }

    setIsSearching(false);
  };

  const handleSaveResult = () => {
    if (!results) return;

    const jurisprudenceData = {
      title: `Pesquisa: ${results.query}`,
      court: court !== "all" ? court : "outros",
      summary: results.content.substring(0, 500),
      full_text: results.content,
      tags: [results.query],
      source_url: "Pesquisa com IA - JusBrasil, STF, STJ",
      relevance_score: 85,
      case_id: relatedCase || undefined,
      is_favorite: false
    };

    onSave(jurisprudenceData);
    alert("Jurisprudência salva com sucesso!");
  };

  const courtOptions = [
    { value: "all", label: "Todos os Tribunais" },
    { value: "STF", label: "STF - Supremo Tribunal Federal" },
    { value: "STJ", label: "STJ - Superior Tribunal de Justiça" },
    { value: "TST", label: "TST - Tribunal Superior do Trabalho" },
    { value: "TSE", label: "TSE - Tribunal Superior Eleitoral" },
    { value: "TRF", label: "TRF - Tribunal Regional Federal" },
    { value: "TJ", label: "TJ - Tribunal de Justiça" },
    { value: "TRT", label: "TRT - Tribunal Regional do Trabalho" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search Form */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Pesquisa Inteligente de Jurisprudência
          </CardTitle>
          <p className="text-sm text-slate-600">
            A IA irá buscar nos principais sites: JusBrasil, STF, STJ e outros tribunais
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="searchTerm">O que você está buscando? *</Label>
            <Input
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ex: Prescrição em contratos de seguro, Dano moral em relações de consumo..."
              className="text-base"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="court">Tribunal Específico</Label>
              <Select value={court} onValueChange={setCourt}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {courtOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano da Decisão</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Anos</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                  <SelectItem value="2020">2020</SelectItem>
                  <SelectItem value="2019">2019</SelectItem>
                  <SelectItem value="2018">2018</SelectItem>
                  <SelectItem value="2017">2017</SelectItem>
                  <SelectItem value="2016">2016</SelectItem>
                  <SelectItem value="2015">2015</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relatedCase">Vincular a Processo (Opcional)</Label>
              <Select value={relatedCase} onValueChange={setRelatedCase}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um processo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {cases.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Contexto do Caso (Opcional)</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Descreva brevemente o contexto do seu caso para a IA encontrar jurisprudências mais relevantes..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={!searchTerm.trim() || isSearching}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg h-12"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Pesquisando em múltiplos tribunais...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Pesquisar Jurisprudências
              </>
            )}
          </Button>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">
              💡 Dicas para melhores resultados:
            </p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Use termos jurídicos específicos e precisos</li>
              <li>• Seja claro sobre o tema que está pesquisando</li>
              <li>• Adicione contexto para resultados mais relevantes</li>
              <li>• A IA busca decisões reais dos tribunais via internet</li>
              <li>• Resultados incluem STF, STJ, JusBrasil e outros</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      Resultados da Pesquisa
                    </CardTitle>
                    <p className="text-sm text-slate-600 mt-1">
                      Pesquisa: "{results.query}" {court !== "all" && `- ${court}`} {year !== "all" && `(${year})`}
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveResult}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Pesquisa
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-slate max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-slate-900 mb-4 mt-6">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-semibold text-slate-900 mb-3 mt-5">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold text-slate-800 mb-2 mt-4">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-slate-700 mb-3 leading-relaxed">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-700">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-2 mb-4 text-slate-700">
                          {children}
                        </ol>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-slate-900">
                          {children}
                        </strong>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                        >
                          {children}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-600 my-4">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {results.content}
                  </ReactMarkdown>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Pesquisa realizada em: {new Date(results.timestamp).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Fontes consultadas: JusBrasil, STF, STJ e outros tribunais brasileiros
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
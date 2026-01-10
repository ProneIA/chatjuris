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
  const [searchType, setSearchType] = useState("jurisprudence"); // jurisprudence, law, doctrine
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
      let prompt = "";

      if (searchType === "jurisprudence") {
        const courtFilter = court !== "all" ? ` no tribunal ${court}` : "";
        const yearFilter = year !== "all" ? ` do ano ${year}` : "";
        const contextInfo = context ? `\n\nCONTEXTO DO CASO: ${context}` : "";

        prompt = `Você é um especialista em pesquisa jurisprudencial brasileira. 

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
      } else if (searchType === "law") {
        const contextInfo = context ? `\n\nCONTEXTO: ${context}` : "";

        prompt = `Você é um especialista em legislação brasileira.

TAREFA: Pesquisar LEIS sobre o seguinte tema:
"${searchTerm}"
${contextInfo}

INSTRUÇÕES:
1. Busque leis, códigos, decretos e normas brasileiras relacionadas ao tema
2. Consulte fontes oficiais como Planalto.gov.br e legislação federal/estadual

3. Para cada lei encontrada, forneça:
   - Nome completo da lei
   - Número e ano (ex: Lei 8.078/1990)
   - Artigos relevantes específicos
   - Resumo do conteúdo aplicável
   - Link oficial da legislação
   - Aplicabilidade ao tema pesquisado

4. Ordene por relevância

5. Inclua análise sobre como aplicar essas leis ao tema

FORMATO: Use Markdown bem formatado com links oficiais.`;
      } else if (searchType === "doctrine") {
        const contextInfo = context ? `\n\nCONTEXTO: ${context}` : "";

        prompt = `Você é um especialista em doutrina jurídica brasileira.

TAREFA: Pesquisar DOUTRINA sobre o seguinte tema:
"${searchTerm}"
${contextInfo}

INSTRUÇÕES:
1. Busque artigos, livros, teses e textos de doutrinadores renomados
2. Inclua fontes acadêmicas e publicações jurídicas confiáveis

3. Para cada referência doutrinária, forneça:
   - Autor(es)
   - Título da obra/artigo
   - Ano de publicação
   - Resumo da tese/posicionamento
   - Citação relevante (se disponível)
   - Fonte/link

4. Priorize doutrinadores reconhecidos e fontes atualizadas

5. Forneça uma síntese das principais correntes doutrinárias sobre o tema

FORMATO: Use Markdown formatado com citações e referências completas.`;
      }

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

    const titlePrefix = 
      searchType === "jurisprudence" ? "Jurisprudência" :
      searchType === "law" ? "Legislação" : "Doutrina";

    const jurisprudenceData = {
      title: `${titlePrefix}: ${results.query}`,
      court: searchType === "jurisprudence" && court !== "all" ? court : "outros",
      summary: results.content.substring(0, 500),
      full_text: results.content,
      tags: [results.query, searchType],
      source_url: searchType === "jurisprudence" ? "JusBrasil, STF, STJ" :
                  searchType === "law" ? "Planalto.gov.br, Legislação" :
                  "Doutrina Jurídica",
      relevance_score: 85,
      is_favorite: false
    };
    
    if (relatedCase && relatedCase !== "") {
      jurisprudenceData.case_id = relatedCase;
    }

    onSave(jurisprudenceData);
    alert(`${titlePrefix} salva com sucesso!`);
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
      <Card className="border-2 border-blue-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Pesquisa Inteligente Jurídica
          </CardTitle>
          <p className="text-sm text-gray-600">
            Pesquise jurisprudências, leis e doutrinas com IA
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="searchType" className="text-gray-900">Tipo de Pesquisa *</Label>
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="jurisprudence">Jurisprudência (Decisões dos Tribunais)</SelectItem>
                <SelectItem value="law">Leis e Legislação</SelectItem>
                <SelectItem value="doctrine">Doutrina (Artigos e Livros)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="searchTerm" className="text-gray-900">O que você está buscando? *</Label>
            <Input
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                searchType === "jurisprudence" ? "Ex: Prescrição em contratos de seguro..." :
                searchType === "law" ? "Ex: Código de Defesa do Consumidor sobre publicidade..." :
                "Ex: Teoria da responsabilidade civil objetiva..."
              }
              className="text-base"
            />
          </div>

          {searchType === "jurisprudence" && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="court" className="text-gray-900">Tribunal Específico</Label>
                <Select value={court} onValueChange={setCourt}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {courtOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year" className="text-gray-900">Ano da Decisão</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">Todos os Anos</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2020">2020</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relatedCase" className="text-gray-900">Vincular a Processo (Opcional)</Label>
                <Select value={relatedCase} onValueChange={setRelatedCase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um processo" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
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
          )}

          <div className="space-y-2">
            <Label htmlFor="context" className="text-gray-900">Contexto Adicional (Opcional)</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={
                searchType === "jurisprudence" ? "Descreva o contexto do seu caso..." :
                searchType === "law" ? "Descreva a situação específica..." :
                "Descreva o aspecto doutrinário que deseja aprofundar..."
              }
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
                {searchType === "jurisprudence" ? "Pesquisando tribunais..." :
                 searchType === "law" ? "Pesquisando legislação..." :
                 "Pesquisando doutrina..."}
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                {searchType === "jurisprudence" ? "Pesquisar Jurisprudências" :
                 searchType === "law" ? "Pesquisar Leis" :
                 "Pesquisar Doutrina"}
              </>
            )}
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-900 font-medium mb-2">
              💡 Dicas para melhores resultados:
            </p>
            <ul className="text-xs text-gray-800 space-y-1">
              {searchType === "jurisprudence" && (
                <>
                  <li>• Use termos jurídicos específicos e precisos</li>
                  <li>• A IA busca decisões reais dos tribunais via internet</li>
                  <li>• Fontes: STF, STJ, JusBrasil e outros tribunais</li>
                </>
              )}
              {searchType === "law" && (
                <>
                  <li>• Especifique o assunto ou situação jurídica</li>
                  <li>• A IA busca em Planalto.gov.br e bases legislativas</li>
                  <li>• Retorna artigos e dispositivos legais aplicáveis</li>
                </>
              )}
              {searchType === "doctrine" && (
                <>
                  <li>• Cite autores ou correntes doutrinárias se souber</li>
                  <li>• A IA busca em fontes acadêmicas confiáveis</li>
                  <li>• Retorna posicionamentos de doutrinadores renomados</li>
                </>
              )}
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
            <Card className="border-2 border-green-200 bg-white">
              <CardHeader className="bg-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      Resultados da Pesquisa
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {searchType === "jurisprudence" ? "Jurisprudências" :
                       searchType === "law" ? "Leis" : "Doutrina"}: "{results.query}"
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
              <CardContent className="p-6 bg-white">
                <div className="prose prose-slate max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-5">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-gray-900 mb-3 leading-relaxed">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-2 mb-4 text-gray-900">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-900">
                          {children}
                        </ol>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900">
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
                        <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4 bg-gray-50 py-2">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {results.content}
                  </ReactMarkdown>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    Pesquisa realizada em: {new Date(results.timestamp).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Tipo: {searchType === "jurisprudence" ? "Jurisprudências" :
                           searchType === "law" ? "Legislação" : "Doutrina"}
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
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
1. Busque nos principais sites OFICIAIS de jurisprudência brasileiros:
   - STF: https://portal.stf.jus.br/jurisprudencia/
   - STJ: https://www.stj.jus.br
   - TST: https://jurisprudencia.tst.jus.br/
   - TSE: https://www.tse.jus.br/jurisprudencia/decisoes/jurisprudencia
   - TRFs: sites oficiais dos Tribunais Regionais Federais
   - TRTs: sites oficiais dos Tribunais Regionais do Trabalho
   - TJs: sites oficiais dos Tribunais de Justiça Estaduais
   - JusBrasil: https://www.jusbrasil.com.br/jurisprudencia/ (agregador)

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
    { value: "all", label: "Todos os Tribunais", url: null },
    
    // Tribunais Superiores
    { value: "STF", label: "STF - Supremo Tribunal Federal", url: "https://portal.stf.jus.br/jurisprudencia/" },
    { value: "STJ", label: "STJ - Superior Tribunal de Justiça", url: "https://www.stj.jus.br" },
    { value: "TST", label: "TST - Tribunal Superior do Trabalho", url: "https://jurisprudencia.tst.jus.br/" },
    { value: "TSE", label: "TSE - Tribunal Superior Eleitoral", url: "https://www.tse.jus.br/jurisprudencia/decisoes/jurisprudencia" },
    { value: "STM", label: "STM - Superior Tribunal Militar", url: "https://jurisprudencia.stm.jus.br/" },
    
    // Conselhos
    { value: "CJF", label: "CJF - Conselho da Justiça Federal", url: "https://jurisprudencia.cjf.jus.br/" },
    { value: "CNJ", label: "CNJ - Conselho Nacional de Justiça", url: "https://www.cnj.jus.br/sobre-o-cnj/jurisprudencia/" },
    
    // Tribunais Regionais Federais
    { value: "TRF1", label: "TRF1 - Tribunal Regional Federal 1ª Região", url: "https://www2.cjf.jus.br/jurisprudencia/trf1/" },
    { value: "TRF2", label: "TRF2 - Tribunal Regional Federal 2ª Região", url: "https://www10.trf2.jus.br/consultas/?site=v2_jurisprudencia" },
    { value: "TRF3", label: "TRF3 - Tribunal Regional Federal 3ª Região", url: "https://web.trf3.jus.br/jurisprudencia/" },
    { value: "TRF4", label: "TRF4 - Tribunal Regional Federal 4ª Região", url: "https://jurisprudencia.trf4.jus.br/pesquisa/pesquisa.php?tipo=1" },
    { value: "TRF5", label: "TRF5 - Tribunal Regional Federal 5ª Região", url: "https://julia-pesquisa.trf5.jus.br/julia-pesquisa/#consulta" },
    
    // Tribunais Regionais do Trabalho
    { value: "TRT1", label: "TRT1 - Tribunal Regional do Trabalho 1ª Região (RJ)", url: "https://www.trt1.jus.br" },
    { value: "TRT2", label: "TRT2 - Tribunal Regional do Trabalho 2ª Região (SP Capital)", url: "https://www.trt2.jus.br" },
    { value: "TRT3", label: "TRT3 - Tribunal Regional do Trabalho 3ª Região (MG)", url: "https://www.trt3.jus.br" },
    { value: "TRT4", label: "TRT4 - Tribunal Regional do Trabalho 4ª Região (RS)", url: "https://www.trt4.jus.br" },
    { value: "TRT5", label: "TRT5 - Tribunal Regional do Trabalho 5ª Região (BA)", url: "https://www.trt5.jus.br" },
    { value: "TRT6", label: "TRT6 - Tribunal Regional do Trabalho 6ª Região (PE)", url: "https://www.trt6.jus.br" },
    { value: "TRT7", label: "TRT7 - Tribunal Regional do Trabalho 7ª Região (CE)", url: "https://www.trt7.jus.br" },
    { value: "TRT8", label: "TRT8 - Tribunal Regional do Trabalho 8ª Região (PA/AP)", url: "https://www.trt8.jus.br" },
    { value: "TRT9", label: "TRT9 - Tribunal Regional do Trabalho 9ª Região (PR)", url: "https://www.trt9.jus.br" },
    { value: "TRT10", label: "TRT10 - Tribunal Regional do Trabalho 10ª Região (DF/TO)", url: "https://www.trt10.jus.br" },
    { value: "TRT11", label: "TRT11 - Tribunal Regional do Trabalho 11ª Região (AM/RR)", url: "https://www.trt11.jus.br" },
    { value: "TRT12", label: "TRT12 - Tribunal Regional do Trabalho 12ª Região (SC)", url: "https://www.trt12.jus.br" },
    { value: "TRT13", label: "TRT13 - Tribunal Regional do Trabalho 13ª Região (PB)", url: "https://www.trt13.jus.br" },
    { value: "TRT14", label: "TRT14 - Tribunal Regional do Trabalho 14ª Região (RO/AC)", url: "https://www.trt14.jus.br" },
    { value: "TRT15", label: "TRT15 - Tribunal Regional do Trabalho 15ª Região (SP Interior)", url: "https://www.trt15.jus.br" },
    { value: "TRT16", label: "TRT16 - Tribunal Regional do Trabalho 16ª Região (MA)", url: "https://www.trt16.jus.br" },
    { value: "TRT17", label: "TRT17 - Tribunal Regional do Trabalho 17ª Região (ES)", url: "https://www.trt17.jus.br" },
    { value: "TRT18", label: "TRT18 - Tribunal Regional do Trabalho 18ª Região (GO)", url: "https://www.trt18.jus.br" },
    { value: "TRT19", label: "TRT19 - Tribunal Regional do Trabalho 19ª Região (AL)", url: "https://www.trt19.jus.br" },
    { value: "TRT20", label: "TRT20 - Tribunal Regional do Trabalho 20ª Região (SE)", url: "https://www.trt20.jus.br" },
    { value: "TRT21", label: "TRT21 - Tribunal Regional do Trabalho 21ª Região (RN)", url: "https://www.trt21.jus.br" },
    { value: "TRT22", label: "TRT22 - Tribunal Regional do Trabalho 22ª Região (PI)", url: "https://www.trt22.jus.br" },
    { value: "TRT23", label: "TRT23 - Tribunal Regional do Trabalho 23ª Região (MT)", url: "https://www.trt23.jus.br" },
    { value: "TRT24", label: "TRT24 - Tribunal Regional do Trabalho 24ª Região (MS)", url: "https://www.trt24.jus.br" },
    
    // Tribunais de Justiça Estaduais
    { value: "TJAC", label: "TJAC - Tribunal de Justiça do Acre", url: "https://www.tjac.jus.br" },
    { value: "TJAL", label: "TJAL - Tribunal de Justiça de Alagoas", url: "https://www.tjal.jus.br" },
    { value: "TJAP", label: "TJAP - Tribunal de Justiça do Amapá", url: "https://www.tjap.jus.br" },
    { value: "TJAM", label: "TJAM - Tribunal de Justiça do Amazonas", url: "https://www.tjam.jus.br" },
    { value: "TJBA", label: "TJBA - Tribunal de Justiça da Bahia", url: "https://www.tjba.jus.br" },
    { value: "TJCE", label: "TJCE - Tribunal de Justiça do Ceará", url: "https://www.tjce.jus.br" },
    { value: "TJDFT", label: "TJDFT - Tribunal de Justiça do Distrito Federal", url: "https://www.tjdft.jus.br" },
    { value: "TJES", label: "TJES - Tribunal de Justiça do Espírito Santo", url: "https://www.tjes.jus.br" },
    { value: "TJGO", label: "TJGO - Tribunal de Justiça de Goiás", url: "https://www.tjgo.jus.br" },
    { value: "TJMA", label: "TJMA - Tribunal de Justiça do Maranhão", url: "https://www.tjma.jus.br" },
    { value: "TJMT", label: "TJMT - Tribunal de Justiça de Mato Grosso", url: "https://www.tjmt.jus.br" },
    { value: "TJMS", label: "TJMS - Tribunal de Justiça de Mato Grosso do Sul", url: "https://www.tjms.jus.br" },
    { value: "TJMG", label: "TJMG - Tribunal de Justiça de Minas Gerais", url: "https://www.tjmg.jus.br" },
    { value: "TJPA", label: "TJPA - Tribunal de Justiça do Pará", url: "https://www.tjpa.jus.br" },
    { value: "TJPB", label: "TJPB - Tribunal de Justiça da Paraíba", url: "https://www.tjpb.jus.br" },
    { value: "TJPR", label: "TJPR - Tribunal de Justiça do Paraná", url: "https://www.tjpr.jus.br" },
    { value: "TJPE", label: "TJPE - Tribunal de Justiça de Pernambuco", url: "https://www.tjpe.jus.br" },
    { value: "TJPI", label: "TJPI - Tribunal de Justiça do Piauí", url: "https://www.tjpi.jus.br" },
    { value: "TJRJ", label: "TJRJ - Tribunal de Justiça do Rio de Janeiro", url: "https://www.tjrj.jus.br" },
    { value: "TJRN", label: "TJRN - Tribunal de Justiça do Rio Grande do Norte", url: "https://www.tjrn.jus.br" },
    { value: "TJRS", label: "TJRS - Tribunal de Justiça do Rio Grande do Sul", url: "https://www.tjrs.jus.br" },
    { value: "TJRO", label: "TJRO - Tribunal de Justiça de Rondônia", url: "https://www.tjro.jus.br" },
    { value: "TJRR", label: "TJRR - Tribunal de Justiça de Roraima", url: "https://www.tjrr.jus.br" },
    { value: "TJSC", label: "TJSC - Tribunal de Justiça de Santa Catarina", url: "https://www.tjsc.jus.br" },
    { value: "TJSP", label: "TJSP - Tribunal de Justiça de São Paulo", url: "https://www.tjsp.jus.br" },
    { value: "TJSE", label: "TJSE - Tribunal de Justiça de Sergipe", url: "https://www.tjse.jus.br" },
    { value: "TJTO", label: "TJTO - Tribunal de Justiça de Tocantins", url: "https://www.tjto.jus.br" },
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
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium mb-2">
                  💡 Dicas para melhores resultados:
                </p>
                <ul className="text-xs text-gray-800 space-y-1">
                  {searchType === "jurisprudence" && (
                    <>
                      <li>• Use termos jurídicos específicos e precisos</li>
                      <li>• A IA busca decisões reais dos tribunais via internet</li>
                      <li>• Fontes: STF, STJ, TRFs, TRTs, TJs e outros tribunais</li>
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
              {court !== "all" && courtOptions.find(c => c.value === court)?.url && (
                <a
                  href={courtOptions.find(c => c.value === court).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-1"
                >
                  Acessar {court}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
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
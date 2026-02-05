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
  
  // Tribunais Superiores
  { value: "STF", label: "STF - Supremo Tribunal Federal", url: "https://portal.stf.jus.br/jurisprudencia/" },
  { value: "STJ", label: "STJ - Superior Tribunal de Justiça", url: "https://www.stj.jus.br/sites/portalp/Paginas/Jurisprudencia/Pesquisa-de-Jurisprudencia.aspx" },
  { value: "TST", label: "TST - Tribunal Superior do Trabalho", url: "https://www.tst.jus.br/jurisprudencia" },
  { value: "TSE", label: "TSE - Tribunal Superior Eleitoral", url: "https://www.tse.jus.br/jurisprudencia" },
  { value: "STM", label: "STM - Superior Tribunal Militar", url: "https://www.stm.jus.br/jurisprudencia" },
  
  // TRFs
  { value: "TRF1", label: "TRF1 - Tribunal Regional Federal 1ª Região", url: "https://www.trf1.jus.br/trf1/jurisprudencia" },
  { value: "TRF2", label: "TRF2 - Tribunal Regional Federal 2ª Região", url: "https://www.trf2.jus.br/jurisprudencia" },
  { value: "TRF3", label: "TRF3 - Tribunal Regional Federal 3ª Região", url: "https://www.trf3.jus.br/jurisprudencia" },
  { value: "TRF4", label: "TRF4 - Tribunal Regional Federal 4ª Região", url: "https://jurisprudencia.trf4.jus.br" },
  { value: "TRF5", label: "TRF5 - Tribunal Regional Federal 5ª Região", url: "https://www.trf5.jus.br/jurisprudencia" },
  { value: "TRF6", label: "TRF6 - Tribunal Regional Federal 6ª Região", url: "https://www.trf6.jus.br/jurisprudencia" },
  
  // TJs - Estados
  { value: "TJAC", label: "TJAC - Tribunal de Justiça do Acre", url: "https://jurisprudencia.tjac.jus.br" },
  { value: "TJAL", label: "TJAL - Tribunal de Justiça de Alagoas", url: "https://www.tjal.jus.br/jurisprudencia" },
  { value: "TJAP", label: "TJAP - Tribunal de Justiça do Amapá", url: "https://www.tjap.jus.br/jurisprudencia" },
  { value: "TJAM", label: "TJAM - Tribunal de Justiça do Amazonas", url: "https://www.tjam.jus.br/jurisprudencia" },
  { value: "TJBA", label: "TJBA - Tribunal de Justiça da Bahia", url: "https://jurisprudencia.tjba.jus.br" },
  { value: "TJCE", label: "TJCE - Tribunal de Justiça do Ceará", url: "https://jurisprudencia.tjce.jus.br" },
  { value: "TJDFT", label: "TJDFT - Tribunal de Justiça do Distrito Federal", url: "https://jurisprudencia.tjdft.jus.br" },
  { value: "TJES", label: "TJES - Tribunal de Justiça do Espírito Santo", url: "https://jurisprudencia.tjes.jus.br" },
  { value: "TJGO", label: "TJGO - Tribunal de Justiça de Goiás", url: "https://jurisprudencia.tjgo.jus.br" },
  { value: "TJMA", label: "TJMA - Tribunal de Justiça do Maranhão", url: "https://jurisprudencia.tjma.jus.br" },
  { value: "TJMT", label: "TJMT - Tribunal de Justiça do Mato Grosso", url: "https://jurisprudencia.tjmt.jus.br" },
  { value: "TJMS", label: "TJMS - Tribunal de Justiça do Mato Grosso do Sul", url: "https://jurisprudencia.tjms.jus.br" },
  { value: "TJMG", label: "TJMG - Tribunal de Justiça de Minas Gerais", url: "https://jurisprudencia.tjmg.jus.br" },
  { value: "TJPA", label: "TJPA - Tribunal de Justiça do Pará", url: "https://jurisprudencia.tjpa.jus.br" },
  { value: "TJPB", label: "TJPB - Tribunal de Justiça da Paraíba", url: "https://jurisprudencia.tjpb.jus.br" },
  { value: "TJPR", label: "TJPR - Tribunal de Justiça do Paraná", url: "https://jurisprudencia.tjpr.jus.br" },
  { value: "TJPE", label: "TJPE - Tribunal de Justiça de Pernambuco", url: "https://jurisprudencia.tjpe.jus.br" },
  { value: "TJPI", label: "TJPI - Tribunal de Justiça do Piauí", url: "https://jurisprudencia.tjpi.jus.br" },
  { value: "TJRJ", label: "TJRJ - Tribunal de Justiça do Rio de Janeiro", url: "https://jurisprudencia.tjrj.jus.br" },
  { value: "TJRN", label: "TJRN - Tribunal de Justiça do Rio Grande do Norte", url: "https://jurisprudencia.tjrn.jus.br" },
  { value: "TJRS", label: "TJRS - Tribunal de Justiça do Rio Grande do Sul", url: "https://jurisprudencia.tjrs.jus.br" },
  { value: "TJRO", label: "TJRO - Tribunal de Justiça de Rondônia", url: "https://jurisprudencia.tjro.jus.br" },
  { value: "TJRR", label: "TJRR - Tribunal de Justiça de Roraima", url: "https://jurisprudencia.tjrr.jus.br" },
  { value: "TJSC", label: "TJSC - Tribunal de Justiça de Santa Catarina", url: "https://jurisprudencia.tjsc.jus.br" },
  { value: "TJSP", label: "TJSP - Tribunal de Justiça de São Paulo", url: "https://esaj.tjsp.jus.br/cjsg" },
  { value: "TJSE", label: "TJSE - Tribunal de Justiça de Sergipe", url: "https://jurisprudencia.tjse.jus.br" },
  { value: "TJTO", label: "TJTO - Tribunal de Justiça do Tocantins", url: "https://jurisprudencia.tjto.jus.br" },
  
  // TRTs
  { value: "TRT1", label: "TRT1 - Tribunal Regional do Trabalho 1ª Região", url: "https://www.trt1.jus.br" },
  { value: "TRT2", label: "TRT2 - Tribunal Regional do Trabalho 2ª Região", url: "https://www.trt2.jus.br" },
  { value: "TRT3", label: "TRT3 - Tribunal Regional do Trabalho 3ª Região", url: "https://www.trt3.jus.br" },
  { value: "TRT4", label: "TRT4 - Tribunal Regional do Trabalho 4ª Região", url: "https://www.trt4.jus.br" },
  { value: "TRT5", label: "TRT5 - Tribunal Regional do Trabalho 5ª Região", url: "https://www.trt5.jus.br" },
  { value: "TRT6", label: "TRT6 - Tribunal Regional do Trabalho 6ª Região", url: "https://www.trt6.jus.br" },
  { value: "TRT7", label: "TRT7 - Tribunal Regional do Trabalho 7ª Região", url: "https://www.trt7.jus.br" },
  { value: "TRT8", label: "TRT8 - Tribunal Regional do Trabalho 8ª Região", url: "https://www.trt8.jus.br" },
  { value: "TRT9", label: "TRT9 - Tribunal Regional do Trabalho 9ª Região", url: "https://www.trt9.jus.br" },
  { value: "TRT10", label: "TRT10 - Tribunal Regional do Trabalho 10ª Região", url: "https://www.trt10.jus.br" },
  { value: "TRT11", label: "TRT11 - Tribunal Regional do Trabalho 11ª Região", url: "https://www.trt11.jus.br" },
  { value: "TRT12", label: "TRT12 - Tribunal Regional do Trabalho 12ª Região", url: "https://www.trt12.jus.br" },
  { value: "TRT13", label: "TRT13 - Tribunal Regional do Trabalho 13ª Região", url: "https://www.trt13.jus.br" },
  { value: "TRT14", label: "TRT14 - Tribunal Regional do Trabalho 14ª Região", url: "https://www.trt14.jus.br" },
  { value: "TRT15", label: "TRT15 - Tribunal Regional do Trabalho 15ª Região", url: "https://www.trt15.jus.br" },
  { value: "TRT16", label: "TRT16 - Tribunal Regional do Trabalho 16ª Região", url: "https://www.trt16.jus.br" },
  { value: "TRT17", label: "TRT17 - Tribunal Regional do Trabalho 17ª Região", url: "https://www.trt17.jus.br" },
  { value: "TRT18", label: "TRT18 - Tribunal Regional do Trabalho 18ª Região", url: "https://www.trt18.jus.br" },
  { value: "TRT19", label: "TRT19 - Tribunal Regional do Trabalho 19ª Região", url: "https://www.trt19.jus.br" },
  { value: "TRT20", label: "TRT20 - Tribunal Regional do Trabalho 20ª Região", url: "https://www.trt20.jus.br" },
  { value: "TRT21", label: "TRT21 - Tribunal Regional do Trabalho 21ª Região", url: "https://www.trt21.jus.br" },
  { value: "TRT22", label: "TRT22 - Tribunal Regional do Trabalho 22ª Região", url: "https://www.trt22.jus.br" },
  { value: "TRT23", label: "TRT23 - Tribunal Regional do Trabalho 23ª Região", url: "https://www.trt23.jus.br" },
  { value: "TRT24", label: "TRT24 - Tribunal Regional do Trabalho 24ª Região", url: "https://www.trt24.jus.br" },
  
  // TREs
  { value: "TREAC", label: "TRE-AC - Tribunal Regional Eleitoral do Acre", url: "https://www.tre-ac.jus.br/jurisprudencia" },
  { value: "TREAL", label: "TRE-AL - Tribunal Regional Eleitoral de Alagoas", url: "https://www.tre-al.jus.br/jurisprudencia" },
  { value: "TREAP", label: "TRE-AP - Tribunal Regional Eleitoral do Amapá", url: "https://www.tre-ap.jus.br/jurisprudencia" },
  { value: "TREAM", label: "TRE-AM - Tribunal Regional Eleitoral do Amazonas", url: "https://www.tre-am.jus.br/jurisprudencia" },
  { value: "TREBA", label: "TRE-BA - Tribunal Regional Eleitoral da Bahia", url: "https://www.tre-ba.jus.br/jurisprudencia" },
  { value: "TRECE", label: "TRE-CE - Tribunal Regional Eleitoral do Ceará", url: "https://www.tre-ce.jus.br/jurisprudencia" },
  { value: "TREDF", label: "TRE-DF - Tribunal Regional Eleitoral do Distrito Federal", url: "https://www.tre-df.jus.br/jurisprudencia" },
  { value: "TREES", label: "TRE-ES - Tribunal Regional Eleitoral do Espírito Santo", url: "https://www.tre-es.jus.br/jurisprudencia" },
  { value: "TREGO", label: "TRE-GO - Tribunal Regional Eleitoral de Goiás", url: "https://www.tre-go.jus.br/jurisprudencia" },
  { value: "TREMA", label: "TRE-MA - Tribunal Regional Eleitoral do Maranhão", url: "https://www.tre-ma.jus.br/jurisprudencia" },
  { value: "TREMT", label: "TRE-MT - Tribunal Regional Eleitoral do Mato Grosso", url: "https://www.tre-mt.jus.br/jurisprudencia" },
  { value: "TREMS", label: "TRE-MS - Tribunal Regional Eleitoral do Mato Grosso do Sul", url: "https://www.tre-ms.jus.br/jurisprudencia" },
  { value: "TREMG", label: "TRE-MG - Tribunal Regional Eleitoral de Minas Gerais", url: "https://www.tre-mg.jus.br/jurisprudencia" },
  { value: "TREPA", label: "TRE-PA - Tribunal Regional Eleitoral do Pará", url: "https://www.tre-pa.jus.br/jurisprudencia" },
  { value: "TREPB", label: "TRE-PB - Tribunal Regional Eleitoral da Paraíba", url: "https://www.tre-pb.jus.br/jurisprudencia" },
  { value: "TREPR", label: "TRE-PR - Tribunal Regional Eleitoral do Paraná", url: "https://www.tre-pr.jus.br/jurisprudencia" },
  { value: "TREPE", label: "TRE-PE - Tribunal Regional Eleitoral de Pernambuco", url: "https://www.tre-pe.jus.br/jurisprudencia" },
  { value: "TREPI", label: "TRE-PI - Tribunal Regional Eleitoral do Piauí", url: "https://www.tre-pi.jus.br/jurisprudencia" },
  { value: "TRERJ", label: "TRE-RJ - Tribunal Regional Eleitoral do Rio de Janeiro", url: "https://www.tre-rj.jus.br/jurisprudencia" },
  { value: "TRERN", label: "TRE-RN - Tribunal Regional Eleitoral do Rio Grande do Norte", url: "https://www.tre-rn.jus.br/jurisprudencia" },
  { value: "TRERS", label: "TRE-RS - Tribunal Regional Eleitoral do Rio Grande do Sul", url: "https://www.tre-rs.jus.br/jurisprudencia" },
  { value: "TRERO", label: "TRE-RO - Tribunal Regional Eleitoral de Rondônia", url: "https://www.tre-ro.jus.br/jurisprudencia" },
  { value: "TRERR", label: "TRE-RR - Tribunal Regional Eleitoral de Roraima", url: "https://www.tre-rr.jus.br/jurisprudencia" },
  { value: "TRESC", label: "TRE-SC - Tribunal Regional Eleitoral de Santa Catarina", url: "https://www.tre-sc.jus.br/jurisprudencia" },
  { value: "TRESP", label: "TRE-SP - Tribunal Regional Eleitoral de São Paulo", url: "https://www.tre-sp.jus.br/jurisprudencia" },
  { value: "TRESE", label: "TRE-SE - Tribunal Regional Eleitoral de Sergipe", url: "https://www.tre-se.jus.br/jurisprudencia" },
  { value: "TRETO", label: "TRE-TO - Tribunal Regional Eleitoral do Tocantins", url: "https://www.tre-to.jus.br/jurisprudencia" },
  
  // Justiça Militar Estadual
  { value: "TJMSP", label: "TJMSP - Tribunal de Justiça Militar de São Paulo", url: "https://www.tjmsp.jus.br" },
  { value: "TJMMG", label: "TJMMG - Tribunal de Justiça Militar de Minas Gerais", url: "https://www.tjmmg.jus.br" },
  { value: "TJMRS", label: "TJMRS - Tribunal de Justiça Militar do Rio Grande do Sul", url: "https://www.tjmrs.jus.br" },
  
  // Consultas Unificadas
  { value: "CJF", label: "CJF - Conselho da Justiça Federal (Unificado)", url: "https://jurisprudencia.cjf.jus.br" },
  { value: "CNJ", label: "CNJ - Conselho Nacional de Justiça", url: "https://www.cnj.jus.br" },
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
                            <option value="all">Todos os Tribunais</option>
                            <optgroup label="Tribunais Superiores">
                              {tribunaisCompleto.filter(t => ['STF', 'STJ', 'TST', 'TSE', 'STM'].includes(t.value)).map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Tribunais Regionais Federais">
                              {tribunaisCompleto.filter(t => t.value.startsWith('TRF')).map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Tribunais de Justiça (Estados)">
                              {tribunaisCompleto.filter(t => t.value.startsWith('TJ') && !t.value.startsWith('TJM')).map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Tribunais Regionais do Trabalho">
                              {tribunaisCompleto.filter(t => t.value.startsWith('TRT')).map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Tribunais Regionais Eleitorais">
                              {tribunaisCompleto.filter(t => t.value.startsWith('TRE')).map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Justiça Militar / Consultas Unificadas">
                              {tribunaisCompleto.filter(t => ['TJMSP', 'TJMMG', 'TJMRS', 'CJF', 'CNJ'].includes(t.value)).map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </optgroup>
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
              <div className={`p-6 rounded-xl border h-fit sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Acesso Rápido aos Tribunais
                </h3>
                
                {/* Tribunais Superiores */}
                <div className="mb-4">
                  <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    TRIBUNAIS SUPERIORES
                  </p>
                  <div className="space-y-1">
                    {tribunaisCompleto.filter(t => ['STF', 'STJ', 'TST', 'TSE', 'STM'].includes(t.value)).map(tribunal => (
                      <a
                        key={tribunal.value}
                        href={tribunal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                          isDark 
                            ? 'hover:bg-neutral-800' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {tribunal.value}
                        </span>
                        <ExternalLink className={`w-3 h-3 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                      </a>
                    ))}
                  </div>
                </div>

                {/* TRFs */}
                <div className="mb-4">
                  <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    TRFs
                  </p>
                  <div className="space-y-1">
                    {tribunaisCompleto.filter(t => t.value.startsWith('TRF')).map(tribunal => (
                      <a
                        key={tribunal.value}
                        href={tribunal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                          isDark 
                            ? 'hover:bg-neutral-800' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {tribunal.value}
                        </span>
                        <ExternalLink className={`w-3 h-3 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                      </a>
                    ))}
                  </div>
                </div>

                {/* TJs Principais */}
                <div className="mb-4">
                  <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    TJs PRINCIPAIS
                  </p>
                  <div className="space-y-1">
                    {tribunaisCompleto.filter(t => ['TJSP', 'TJRJ', 'TJMG', 'TJRS', 'TJPR', 'TJSC', 'TJBA', 'TJCE'].includes(t.value)).map(tribunal => (
                      <a
                        key={tribunal.value}
                        href={tribunal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                          isDark 
                            ? 'hover:bg-neutral-800' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {tribunal.value}
                        </span>
                        <ExternalLink className={`w-3 h-3 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Consultas Unificadas */}
                <div>
                  <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    CONSULTAS UNIFICADAS
                  </p>
                  <div className="space-y-1">
                    {tribunaisCompleto.filter(t => ['CJF', 'CNJ'].includes(t.value)).map(tribunal => (
                      <a
                        key={tribunal.value}
                        href={tribunal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                          isDark 
                            ? 'hover:bg-neutral-800' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {tribunal.value}
                        </span>
                        <ExternalLink className={`w-3 h-3 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                      </a>
                    ))}
                  </div>
                </div>

                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    {tribunaisCompleto.length - 1} tribunais disponíveis
                  </p>
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
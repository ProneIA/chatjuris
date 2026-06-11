import React, { useState, useEffect } from "react";
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
  Star,
  Copy,
  Trash2,
  Save,
  Loader2,
  ExternalLink,
  Scale,
  Gavel,
  BookMarked,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/components/common/useDebounce";
import { searchJurisprudence, generateLocalSummary } from "@/utils/searchService";

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
  const isDark = false;
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("jurisprudence");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedTribunal, setSelectedTribunal] = useState("all");
  const [context, setContext] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [searchErrors, setSearchErrors] = useState(null);
  const [savedSet, setSavedSet] = useState(new Set());
  const [selectedSaved, setSelectedSaved] = useState(null);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const debouncedFilter = useDebounce(searchFilter, 300);
  const queryClient = useQueryClient();

  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Queries
  const { data: savedResearches = [] } = useQuery({
    queryKey: ['jurisprudences', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Jurisprudence.filter({ created_by: user.email }, '-created_date', 100);
    },
    enabled: !!user?.email
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Case.filter({ created_by: user.email }, 'title', 100);
    },
    enabled: !!user?.email
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
    setSearchErrors(null);

    try {
      const courtParam = selectedTribunal === "all" ? "todos" : selectedTribunal;
      const areaParam = selectedArea?.toLowerCase() || "geral";

      const data = await searchJurisprudence({
        query: searchQuery,
        court: courtParam,
        area: areaParam,
        page: 1,
        pageSize: 10,
      });

      setCurrentResult({
        query: searchQuery,
        type: searchType,
        area: selectedArea,
        tribunal: selectedTribunal !== "all" ? selectedTribunal : null,
        results: data.results,
        summary: data.summary,
        sources: data.sources_queried,
        timestamp: new Date().toISOString(),
      });

      if (data.errors) setSearchErrors(data.errors);

    } catch (error) {
      console.error("Erro na pesquisa:", error);
      toast.error("Erro ao realizar pesquisa: " + error.message);
    }

    setIsSearching(false);
  };

  const handleSaveResult = async (result) => {
    try {
      await base44.entities.Jurisprudence.create({
        title: result.title,
        court: result.court,
        case_number: result.case_number,
        decision_date: result.decision_date,
        summary: result.summary,
        full_text: result.full_text,
        tags: result.tags,
        source_url: result.source_url,
        relevance_score: result.relevance_score,
        is_favorite: false,
      });
      setSavedSet(prev => new Set([...prev, result.case_number || result.title]));
      queryClient.invalidateQueries({ queryKey: ['jurisprudences'] });
      toast.success("Salvo na biblioteca!");
    } catch (e) {
      toast.error("Erro ao salvar: " + e.message);
    }
  };

  const handleSaveAll = async () => {
    if (!currentResult?.results?.length) return;
    for (const r of currentResult.results) {
      await handleSaveResult(r);
    }
    // Também salva a pesquisa no LegalResearch
    try {
      await base44.entities.LegalResearch.create({
        title: `Pesquisa: ${currentResult.query}`,
        query: currentResult.query,
        research_type: "jurisprudence",
        area: currentResult.area?.toLowerCase() || "geral",
        results_summary: currentResult.summary,
        sources: currentResult.results.map(r => ({
          title: r.title, type: "acordao", court: r.court,
          date: r.decision_date, citation: r.case_number,
          summary: r.summary?.slice(0, 300), url: r.source_url,
          relevance_score: r.relevance_score,
        })),
        tags: [...new Set(currentResult.results.flatMap(r => r.tags || []))].slice(0, 10),
        is_favorite: false,
      });
    } catch {}
    toast.success("Todos os resultados salvos!");
  };



  const filteredResearches = savedResearches.filter(r => {
    const matchesSearch = r.title?.toLowerCase().includes(debouncedFilter.toLowerCase());
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '18px 28px', background: 'var(--card)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
                Pesquisa Jurídica
              </h1>
              <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-2)' }}>
                Busca direta nas APIs oficiais dos tribunais — sem IA · {tribunaisCompleto.length} tribunais disponíveis
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Salvas', value: stats.total },
              { label: 'STF', value: stats.stf },
              { label: 'STJ', value: stats.stj },
              { label: 'Favoritas', value: stats.favorites },
            ].map(({ label, value }) => (
              <div key={label} className="app-card" style={{ padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', margin: '0 0 6px' }}>{label}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
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
                <div style={{ padding: 24, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--card)' }}>
                  <div className="space-y-4">
                    {/* Type Selection */}
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: 'block', color: 'var(--text-2)' }}>
                        Tipo de Pesquisa
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {researchTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.id}
                              onClick={() => setSearchType(type.id)}
                              style={{
                                padding: 16, borderRadius: 'var(--r-md)', border: `2px solid ${searchType === type.id ? 'var(--accent)' : 'var(--border)'}`,
                                background: searchType === type.id ? 'var(--accent-light)' : 'var(--card)',
                                cursor: 'pointer', textAlign: 'left', transition: 'all var(--dur)'
                              }}
                            >
                              <Icon className="w-5 h-5 mb-2" style={{ color: searchType === type.id ? 'var(--accent)' : 'var(--text-2)' }} />
                              <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-1)' }}>{type.label}</div>
                              <div style={{ fontSize: 11, marginTop: 4, color: 'var(--text-3)' }}>{type.description}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: 'block', color: 'var(--text-2)' }}>
                          Área do Direito
                        </label>
                        <select
                          value={selectedArea}
                          onChange={(e) => setSelectedArea(e.target.value)}
                          style={{ width: '100%' }}
                        >
                          <option value="">Todas as áreas</option>
                          {areas.map(area => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: 'block', color: 'var(--text-2)' }}>
                          Período
                        </label>
                        <select
                          value={yearFilter}
                          onChange={(e) => setYearFilter(e.target.value)}
                          style={{ width: '100%' }}
                        >
                          <option value="all">Todos os anos</option>
                          <option value="2026">2026</option>
                          <option value="2025">2025</option>
                          <option value="2024">2024</option>
                          <option value="2023">2023</option>
                          <option value="2022">2022</option>
                          <option value="2021">2021</option>
                          <option value="2020">2020</option>
                          <option value="2019">2019</option>
                          <option value="2018">2018</option>
                          <option value="2017">2017</option>
                          <option value="2016">2016</option>
                          <option value="2015">2015</option>
                          <option value="2010-2015">2010-2015</option>
                          <option value="2000-2010">2000-2010</option>
                        </select>
                      </div>

                      {searchType === "jurisprudence" && (
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: 'block', color: 'var(--text-2)' }}>
                            Tribunal
                          </label>
                          <select
                            value={selectedTribunal}
                            onChange={(e) => setSelectedTribunal(e.target.value)}
                            style={{ width: '100%' }}
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
                              style={{ fontSize: 11, color: 'var(--info)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}
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
                      <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: 'block', color: 'var(--text-2)' }}>
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
                      <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: 'block', color: 'var(--text-2)' }}>
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
                          Buscando nas bases oficiais...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          Pesquisar nos Tribunais
                        </>
                      )}
                    </Button>
                    <p style={{ fontSize: 11, textAlign: 'center', color: 'var(--text-3)' }}>
                      Busca direta nas APIs oficiais — sem IA · sem tokens · dados reais
                    </p>
                  </div>
                </div>

                {/* Results */}
                <AnimatePresence>
                  {currentResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {/* Erros / avisos */}
                      {searchErrors && (
                        <div style={{ padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--warn-border)', fontSize: 11, display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--accent-glow)', color: '#7a6010' }}>
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong>Avisos:</strong> {searchErrors.join(" · ")}
                          </div>
                        </div>
                      )}

                      {/* Resumo */}
                      {currentResult.summary && (
                        <div style={{ padding: 16, borderLeft: '4px solid var(--info)', fontSize: 13, background: 'var(--info-bg)', color: 'var(--text-1)', borderRadius: '0 var(--r-sm) var(--r-sm) 0' }}>
                          <div className="font-semibold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2 text-xs">
                            📋 Resumo da Pesquisa
                            <span className="font-normal text-gray-400">(gerado localmente — sem IA)</span>
                          </div>
                          {currentResult.summary}
                        </div>
                      )}

                      {/* Cabeçalho resultados */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>
                            {currentResult.results?.length || 0} resultado(s)
                          </span>
                          {currentResult.sources?.map(s => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                        <Button size="sm" onClick={handleSaveAll} disabled={!currentResult.results?.length}>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar todos
                        </Button>
                      </div>

                      {/* Cards de resultados */}
                      {currentResult.results?.length > 0 ? (
                        <div className="space-y-3">
                          {currentResult.results.map((r, i) => {
                            const key = r.case_number || r.title;
                            const isSaved = savedSet.has(key);
                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                style={{ padding: 16, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--card)' }}
                              >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.4 }}>{r.title}</h4>
                                  <div className="flex gap-1.5 flex-shrink-0">
                                    <Badge className="text-xs">{r.court}</Badge>
                                    {r.relevance_score >= 70 && (
                                      <Badge variant="outline" className="text-xs text-green-700 border-green-300">Alta rel.</Badge>
                                    )}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, marginBottom: 8, color: 'var(--text-2)' }}>
                                  {r.case_number && <span>Processo: {r.case_number}</span>}
                                  {r.decision_date && <span>Julgado: {r.decision_date.split("-").reverse().join("/")}</span>}
                                  <span>Score: {r.relevance_score}/100</span>
                                </div>

                                {r.summary && (
                                  <p style={{ fontSize: 11, lineHeight: 1.5, marginBottom: 12, color: 'var(--text-2)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.summary}</p>
                                )}

                                {r.tags?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {r.tags.map(tag => (
                                      <span key={tag} style={{ fontSize: 11, padding: '1px 8px', borderRadius: 'var(--r-sm)', background: 'var(--surface)', color: 'var(--text-2)' }}>{tag}</span>
                                    ))}
                                  </div>
                                )}

                                <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                                  {r.source_url && (
                                    <a href={r.source_url} target="_blank" rel="noreferrer"
                                      style={{ fontSize: 11, color: 'var(--info)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                                      <ExternalLink className="w-3 h-3" />
                                      Ver no tribunal
                                    </a>
                                  )}
                                  <button
                                    onClick={() => handleSaveResult(r)}
                                    disabled={isSaved}
                                    style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: isSaved ? 'var(--success)' : 'var(--info)', background: 'none', border: 'none', cursor: 'pointer' }}
                                  >
                                    {isSaved ? <><CheckCircle2 className="w-3 h-3" /> Salvo</> : <><Save className="w-3 h-3" /> Salvar</>}
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: 'var(--text-3)' }}>
                          Nenhum resultado retornado pelas APIs. Tente outros termos ou tribunal.
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Links */}
              <div style={{ padding: 24, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--card)', position: 'sticky', top: 24, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                <h3 style={{ fontWeight: 600, marginBottom: 16, color: 'var(--text-1)', fontSize: 14 }}>
                  Acesso Rápido aos Tribunais
                </h3>
                
                {/* Tribunais Superiores */}
                <div className="mb-4">
                  <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 8, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    TRIBUNAIS SUPERIORES
                  </p>
                  <div className="space-y-1">
                    {tribunaisCompleto.filter(t => ['STF', 'STJ', 'TST', 'TSE', 'STM'].includes(t.value)).map(tribunal => (
                      <a
                        key={tribunal.value}
                        href={tribunal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 'var(--r-sm)', textDecoration: 'none', transition: 'background var(--dur)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: 13, color: 'var(--text-1)' }}>
                          {tribunal.value}
                        </span>
                        <ExternalLink className="w-3 h-3" style={{ color: 'var(--text-3)' }} />
                      </a>
                    ))}
                  </div>
                </div>

                {/* TRFs */}
                <div className="mb-4">
                  <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 8, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    TRFs
                  </p>
                  <div className="space-y-1">
                    {tribunaisCompleto.filter(t => t.value.startsWith('TRF')).map(tribunal => (
                      <a
                        key={tribunal.value}
                        href={tribunal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 'var(--r-sm)', textDecoration: 'none', transition: 'background var(--dur)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: 13, color: 'var(--text-1)' }}>
                          {tribunal.value}
                        </span>
                        <ExternalLink className="w-3 h-3" style={{ color: 'var(--text-3)' }} />
                      </a>
                    ))}
                  </div>
                </div>

                {/* TJs - Todos os Estados */}
                <div className="mb-4">
                  <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 8, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    TJs - TRIBUNAIS ESTADUAIS
                  </p>
                  <div className="space-y-1">
                    {tribunaisCompleto.filter(t => t.value.startsWith('TJ') && !t.value.startsWith('TJM')).map(tribunal => (
                      <a
                        key={tribunal.value}
                        href={tribunal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 'var(--r-sm)', textDecoration: 'none', transition: 'background var(--dur)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: 13, color: 'var(--text-1)' }}>
                          {tribunal.value}
                        </span>
                        <ExternalLink className="w-3 h-3" style={{ color: 'var(--text-3)' }} />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Consultas Unificadas */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 8, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    CONSULTAS UNIFICADAS
                  </p>
                  <div className="space-y-1">
                    {tribunaisCompleto.filter(t => ['CJF', 'CNJ'].includes(t.value)).map(tribunal => (
                      <a
                        key={tribunal.value}
                        href={tribunal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 'var(--r-sm)', textDecoration: 'none', transition: 'background var(--dur)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: 13, color: 'var(--text-1)' }}>
                          {tribunal.value}
                        </span>
                        <ExternalLink className="w-3 h-3" style={{ color: 'var(--text-3)' }} />
                      </a>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
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
                <div style={{ padding: 24, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--card)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 14 }}>
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
                            ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                            : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 style={{ fontWeight: 500, color: 'var(--text-1)', fontSize: 13 }}>
                                {research.title}
                              </h4>
                              {research.is_favorite && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline">{research.court || 'Geral'}</Badge>
                              <span style={{ color: 'var(--text-3)', fontSize: 11 }}>
                                {new Date(research.created_date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
                        </div>
                      </div>
                    ))}
                    {filteredResearches.length === 0 && (
                      <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--border)' }} />
                        <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
                          Nenhuma pesquisa salva
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              {selectedSaved && (
                <div style={{ padding: 24, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--card)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 14 }}>
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

                  <div className="prose prose-sm max-w-none">
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
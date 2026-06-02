import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Newspaper, 
  Plus, 
  Search, 
  Bell, 
  Star, 
  StarOff,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Sparkles,
  FileText,
  Calendar,
  Building2,
  Users,
  X,
  Upload,
  Eye,
  Loader2,
  ArrowRight,
  BookOpen,
  Gavel,
  Scale,
  RefreshCw,
  SlidersHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

import DiaryAnalyzer from "@/components/diary/DiaryAnalyzer";
import PublicationCard from "@/components/diary/PublicationCard";
import PublicationAccordion from "@/components/diary/PublicationAccordion";
import PublicationDetails from "@/components/diary/PublicationDetails";
import MonitoringSetup from "@/components/diary/MonitoringSetup";
import MonitoringDashboard from "@/components/diary/MonitoringDashboard";
import AdvancedSearch from "@/components/diary/AdvancedSearch";
import DiarySearchAnalyzer from "@/components/diary/DiarySearchAnalyzer";

const categoryLabels = {
  intimacao: { label: "Intimação", icon: Bell, color: "orange" },
  sentenca: { label: "Sentença", icon: Gavel, color: "purple" },
  despacho: { label: "Despacho", icon: FileText, color: "blue" },
  edital: { label: "Edital", icon: Newspaper, color: "green" },
  decisao: { label: "Decisão", icon: Scale, color: "red" },
  acordao: { label: "Acórdão", icon: BookOpen, color: "indigo" },
  citacao: { label: "Citação", icon: Users, color: "amber" },
  outros: { label: "Outros", icon: FileText, color: "gray" }
};

const urgencyConfig = {
  alta: { label: "Urgente", color: "red", icon: AlertTriangle },
  media: { label: "Média", color: "yellow", icon: Clock },
  baixa: { label: "Baixa", color: "green", icon: CheckCircle }
};

export default function DiaryMonitor({ theme = 'light' }) {
  const isDark = false;
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("publications");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedUrgency, setSelectedUrgency] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filteredResults, setFilteredResults] = useState(null);
  const [activeFilters, setActiveFilters] = useState(null);
  const [expandedPubId, setExpandedPubId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMonitoringDashboard, setShowMonitoringDashboard] = useState(false);

  const { data: publications = [], isLoading: loadingPubs } = useQuery({
    queryKey: ['diary-publications'],
    queryFn: () => base44.entities.DiaryPublication.list('-publication_date'),
  });

  const { data: monitorings = [], isLoading: loadingMonitorings } = useQuery({
    queryKey: ['diary-monitorings'],
    queryFn: () => base44.entities.DiaryMonitoring.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const updatePublicationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DiaryPublication.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diary-publications'] }),
  });

  // Função de busca precisa com sinônimos
  const searchWithSynonyms = (text, term) => {
    if (!text || !term) return false;
    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase().trim();
    
    // Busca direta
    if (lowerText.includes(lowerTerm)) return true;
    
    // Dicionário de sinônimos jurídicos
    const synonyms = {
      'intimação': ['intimado', 'intimando', 'intimar', 'intimações'],
      'sentença': ['sentenças', 'sentenciado', 'sentenciar', 'julgamento', 'decisão'],
      'despacho': ['despachos', 'despachado', 'despachar'],
      'citação': ['citado', 'citar', 'citações', 'citando'],
      'recurso': ['recursos', 'recorrer', 'recorrido', 'recorrente', 'apelação', 'agravo'],
      'prazo': ['prazos', 'termo', 'vencimento', 'dias'],
      'pagamento': ['pagar', 'pago', 'pagamentos', 'quitação', 'adimplemento'],
      'precatório': ['precatórios', 'requisição', 'rqo', 'requisitório'],
      'execução': ['executar', 'executado', 'execuções', 'executivo'],
      'audiência': ['audiências', 'sessão', 'sessões'],
      'autor': ['autora', 'autores', 'requerente', 'demandante', 'exequente'],
      'réu': ['ré', 'réus', 'requerido', 'demandado', 'executado'],
      'advogado': ['advogados', 'advogada', 'oab', 'patrono', 'procurador'],
      'multa': ['multas', 'astreintes', 'penalidade'],
      'embargo': ['embargos', 'embargar', 'embargado'],
      'tutela': ['tutelas', 'liminar', 'antecipação', 'cautelar'],
      'urgência': ['urgente', 'urgentes', 'emergência', 'emergencial'],
      'trânsito': ['transitado', 'transitar', 'trânsito em julgado'],
      'arquivamento': ['arquivado', 'arquivar', 'arquivo'],
      'petição': ['petições', 'peticionar', 'peticionado', 'manifestação'],
      'contestação': ['contestar', 'contestado', 'defesa'],
      'apelação': ['apelar', 'apelado', 'apelante'],
      'agravo': ['agravos', 'agravar', 'agravante', 'agravado'],
    };
    
    // Verifica sinônimos
    for (const [key, syns] of Object.entries(synonyms)) {
      if (key.includes(lowerTerm) || lowerTerm.includes(key)) {
        for (const syn of syns) {
          if (lowerText.includes(syn)) return true;
        }
      }
      if (syns.some(s => s.includes(lowerTerm) || lowerTerm.includes(s))) {
        if (lowerText.includes(key)) return true;
        for (const syn of syns) {
          if (lowerText.includes(syn)) return true;
        }
      }
    }
    
    return false;
  };
  
  // Extrai termos de busca ativos
  const getActiveSearchTerms = () => {
    const terms = [];
    if (searchTerm) {
      terms.push(...searchTerm.split(/\s+/).filter(t => t.length > 1));
    }
    if (activeFilters?.query) {
      terms.push(...activeFilters.query.split(/\s+/).filter(t => t.length > 1));
    }
    return [...new Set(terms)];
  };

  const basePublications = filteredResults || publications;
  
  const filteredPublications = basePublications.filter(pub => {
    // Busca completa em todos os campos
    const searchableFields = [
      pub.title,
      pub.content,
      pub.original_content,
      pub.ai_summary,
      pub.ai_analysis,
      pub.case_number,
      pub.court,
      pub.source,
      ...(pub.parties_involved || []),
      ...(pub.keywords_matched || [])
    ].filter(Boolean).join(' ');
    
    // Aplica busca com sinônimos para cada termo
    const matchesSearch = !searchTerm || searchTerm.split(/\s+/).every(term => 
      term.length < 2 || searchWithSynonyms(searchableFields, term)
    );
    
    const matchesCategory = selectedCategory === "all" || pub.category === selectedCategory;
    const matchesUrgency = selectedUrgency === "all" || pub.urgency === selectedUrgency;
    const matchesUnread = !showUnreadOnly || !pub.is_read;
    const matchesStarred = !showStarredOnly || pub.is_starred;
    
    return matchesSearch && matchesCategory && matchesUrgency && matchesUnread && matchesStarred;
  });

  const stats = {
    total: publications.length,
    unread: publications.filter(p => !p.is_read).length,
    urgent: publications.filter(p => p.urgency === 'alta').length,
    starred: publications.filter(p => p.is_starred).length
  };

  const toggleStar = (pub) => {
    updatePublicationMutation.mutate({
      id: pub.id,
      data: { is_starred: !pub.is_starred }
    });
  };

  const markAsRead = (pub) => {
    if (!pub.is_read) {
      updatePublicationMutation.mutate({
        id: pub.id,
        data: { is_read: true }
      });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
              Monitor de <span style={{ fontWeight: 600 }}>Diários Oficiais</span>
            </h1>
            <p style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 13 }}>
              Acompanhamento inteligente de publicações com IA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button
              variant={showMonitoringDashboard ? "default" : "outline"}
              onClick={() => setShowMonitoringDashboard(!showMonitoringDashboard)}
            >
              <Bell className="w-4 h-4 mr-2" />
              Monitoramentos
            </Button>
          </div>
        </div>

        {/* Unified Search & Analyzer Panel */}
        <div className="mb-6">
          <DiarySearchAnalyzer
            isDark={isDark}
            monitorings={monitorings}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['diary-publications'] });
            }}
          />
        </div>

        {/* Monitoring Dashboard Panel */}
        {showMonitoringDashboard && (
          <div className="mb-6">
            <MonitoringDashboard
              isDark={isDark}
              monitorings={monitorings}
              publications={publications}
              clients={clients}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['diary-monitorings'] })}
            />
          </div>
        )}

        {/* Advanced Search Panel */}
        {showAdvancedSearch && (
          <AdvancedSearch
            isDark={isDark}
            publications={publications}
            onSearch={(results) => setFilteredResults(results)}
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: stats.total, icon: Newspaper, iconColor: 'var(--info)' },
            { label: "Não Lidas", value: stats.unread, icon: Eye, iconColor: 'var(--warn)' },
            { label: "Urgentes", value: stats.urgent, icon: AlertTriangle, iconColor: 'var(--danger)' },
            { label: "Favoritas", value: stats.starred, icon: Star, iconColor: 'var(--accent)' }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                style={{ padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--main-bg)' }}
              >
                <div className="flex items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
                    <Icon className="w-5 h-5" style={{ color: stat.iconColor }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>{stat.value}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{stat.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 24, background: 'var(--main-bg)' }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <Input
                placeholder="Buscar por título, conteúdo ou número do processo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(categoryLabels).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Urgência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="alta">Urgente</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showUnreadOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Não lidas
              </Button>

              <Button
                variant={showStarredOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowStarredOnly(!showStarredOnly)}
              >
                <Star className="w-4 h-4 mr-1" />
                Favoritas
              </Button>
            </div>
          </div>
        </div>

        {/* Publications List - Accordion Style */}
        <div className="space-y-3">
          {loadingPubs ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))
          ) : filteredPublications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--main-bg)' }}>
              <Newspaper className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border)' }} />
              <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: 'var(--text-primary)' }}>
                Nenhuma publicação encontrada
              </h3>
              <p style={{ fontSize: 13, marginBottom: 16, color: 'var(--text-secondary)' }}>
                Analise um diário oficial para começar
              </p>
              <Button onClick={() => setShowAnalyzer(true)} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Analisar Diário
              </Button>
            </div>
          ) : (
            <AnimatePresence>
              {filteredPublications.map((pub, index) => (
                <PublicationAccordion
                  key={pub.id}
                  publication={pub}
                  isDark={isDark}
                  categoryLabels={categoryLabels}
                  urgencyConfig={urgencyConfig}
                  isExpanded={expandedPubId === pub.id}
                  onToggleExpand={() => setExpandedPubId(expandedPubId === pub.id ? null : pub.id)}
                  onToggleStar={() => toggleStar(pub)}
                  onMarkAsRead={() => markAsRead(pub)}
                  onViewDetails={() => {
                    setSelectedPublication(pub);
                    setShowDetailsModal(true);
                  }}
                  searchTerms={getActiveSearchTerms()}
                  index={index}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Diary Analyzer Modal - Removed, now integrated */}

      {/* MonitoringSetup removed - now using MonitoringDashboard inline */}

      {/* Publication Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Publicação
            </DialogTitle>
          </DialogHeader>
          {selectedPublication && (
            <PublicationDetails
              publication={selectedPublication}
              isDark={isDark}
              categoryLabels={categoryLabels}
              urgencyConfig={urgencyConfig}
              onClose={() => setShowDetailsModal(false)}
              onToggleStar={() => toggleStar(selectedPublication)}
              isModal
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
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
import PublicationDetails from "@/components/diary/PublicationDetails";
import MonitoringSetup from "@/components/diary/MonitoringSetup";
import AdvancedSearch from "@/components/diary/AdvancedSearch";

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
  const isDark = theme === 'dark';
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

  const { data: publications = [], isLoading: loadingPubs } = useQuery({
    queryKey: ['diary-publications'],
    queryFn: () => base44.entities.DiaryPublication.list('-publication_date'),
  });

  const { data: monitorings = [], isLoading: loadingMonitorings } = useQuery({
    queryKey: ['diary-monitorings'],
    queryFn: () => base44.entities.DiaryMonitoring.list('-created_date'),
  });

  const updatePublicationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DiaryPublication.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diary-publications'] }),
  });

  const basePublications = filteredResults || publications;
  
  const filteredPublications = basePublications.filter(pub => {
    const matchesSearch = !searchTerm || 
      pub.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.case_number?.toLowerCase().includes(searchTerm.toLowerCase());
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
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className={`text-2xl md:text-3xl font-light tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Monitor de <span className="font-semibold">Diários Oficiais</span>
            </h1>
            <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
              Acompanhamento inteligente de publicações com IA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAnalyzer(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Analisar Diário
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Busca Avançada
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSetup(true)}
              className={isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : ''}
            >
              <Bell className="w-4 h-4 mr-2" />
              Monitoramentos
            </Button>
          </div>
        </div>

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
            { label: "Total", value: stats.total, icon: Newspaper, color: "blue" },
            { label: "Não Lidas", value: stats.unread, icon: Eye, color: "amber" },
            { label: "Urgentes", value: stats.urgent, icon: AlertTriangle, color: "red" },
            { label: "Favoritas", value: stats.starred, icon: Star, color: "purple" }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div 
                key={i}
                className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${stat.color}-500/10`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-500`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {stat.value}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                      {stat.label}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className={`p-4 rounded-xl border mb-6 ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
              <Input
                placeholder="Buscar por título, conteúdo ou número do processo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}`}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className={`w-[140px] ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}`}>
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
                <SelectTrigger className={`w-[130px] ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}`}>
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
                className={!showUnreadOnly && isDark ? 'border-neutral-700 text-neutral-300' : ''}
              >
                <Eye className="w-4 h-4 mr-1" />
                Não lidas
              </Button>

              <Button
                variant={showStarredOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowStarredOnly(!showStarredOnly)}
                className={!showStarredOnly && isDark ? 'border-neutral-700 text-neutral-300' : ''}
              >
                <Star className="w-4 h-4 mr-1" />
                Favoritas
              </Button>
            </div>
          </div>
        </div>

        {/* Publications List */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {loadingPubs ? (
              Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className={`h-32 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
              ))
            ) : filteredPublications.length === 0 ? (
              <div className={`text-center py-16 rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-slate-200'}`}>
                <Newspaper className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-slate-300'}`} />
                <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Nenhuma publicação encontrada
                </h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
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
                  <PublicationCard
                    key={pub.id}
                    publication={pub}
                    isDark={isDark}
                    categoryLabels={categoryLabels}
                    urgencyConfig={urgencyConfig}
                    onSelect={() => {
                      setSelectedPublication(pub);
                      markAsRead(pub);
                    }}
                    onToggleStar={() => toggleStar(pub)}
                    isSelected={selectedPublication?.id === pub.id}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            {selectedPublication ? (
              <PublicationDetails
                publication={selectedPublication}
                isDark={isDark}
                categoryLabels={categoryLabels}
                urgencyConfig={urgencyConfig}
                onClose={() => setSelectedPublication(null)}
                onToggleStar={() => toggleStar(selectedPublication)}
              />
            ) : (
              <div className={`sticky top-24 p-6 rounded-xl border text-center ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-slate-200'}`}>
                <FileText className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-slate-300'}`} />
                <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                  Selecione uma publicação para ver os detalhes
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diary Analyzer Modal */}
      <DiaryAnalyzer
        open={showAnalyzer}
        onClose={() => setShowAnalyzer(false)}
        isDark={isDark}
        monitorings={monitorings}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['diary-publications'] });
          setShowAnalyzer(false);
        }}
      />

      {/* Monitoring Setup Modal */}
      <MonitoringSetup
        open={showSetup}
        onClose={() => setShowSetup(false)}
        isDark={isDark}
        monitorings={monitorings}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['diary-monitorings'] })}
      />
    </div>
  );
}
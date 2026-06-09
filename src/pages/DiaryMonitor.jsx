import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Newspaper, Plus, Search, Bell, Star, Clock, AlertTriangle,
  CheckCircle, Sparkles, FileText, Eye, BookOpen, Gavel, Scale,
  Users, SlidersHorizontal, RefreshCw
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

import DiarySearchAnalyzer from "@/components/diary/DiarySearchAnalyzer";
import PublicationAccordion from "@/components/diary/PublicationAccordion";
import PublicationDetails from "@/components/diary/PublicationDetails";
import MonitoringDashboard from "@/components/diary/MonitoringDashboard";
import AdvancedSearch from "@/components/diary/AdvancedSearch";

import {
  AppPage, PageHeader, KPIGrid, StatCard, AppCard, AppContent,
  AppBadge, EmptyState, AppButton, SearchBar, AppModal
} from "@/components/ds";

const categoryLabels = {
  intimacao: { label: "Intimação",  icon: Bell,      color: "orange"  },
  sentenca:  { label: "Sentença",   icon: Gavel,     color: "purple"  },
  despacho:  { label: "Despacho",   icon: FileText,  color: "blue"    },
  edital:    { label: "Edital",     icon: Newspaper, color: "green"   },
  decisao:   { label: "Decisão",    icon: Scale,     color: "red"     },
  acordao:   { label: "Acórdão",    icon: BookOpen,  color: "indigo"  },
  citacao:   { label: "Citação",    icon: Users,     color: "amber"   },
  outros:    { label: "Outros",     icon: FileText,  color: "gray"    },
};

const urgencyConfig = {
  alta:  { label: "Urgente", color: "red",    icon: AlertTriangle },
  media: { label: "Média",   color: "yellow", icon: Clock         },
  baixa: { label: "Baixa",   color: "green",  icon: CheckCircle   },
};

export default function DiaryMonitor() {
  const queryClient = useQueryClient();

  const [searchTerm,      setSearchTerm]      = useState("");
  const [selectedCat,     setSelectedCat]     = useState("all");
  const [selectedUrgency, setSelectedUrgency] = useState("all");
  const [showUnreadOnly,  setShowUnreadOnly]  = useState(false);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [selectedPub,     setSelectedPub]     = useState(null);
  const [showDetails,     setShowDetails]     = useState(false);
  const [showMonitoring,  setShowMonitoring]  = useState(false);
  const [showAdvSearch,   setShowAdvSearch]   = useState(false);
  const [filteredResults, setFilteredResults] = useState(null);
  const [activeFilters,   setActiveFilters]   = useState(null);
  const [expandedId,      setExpandedId]      = useState(null);

  const { data: publications = [], isLoading } = useQuery({
    queryKey: ["diary-publications"],
    queryFn: () => base44.entities.DiaryPublication.list("-publication_date"),
  });
  const { data: monitorings = [] } = useQuery({
    queryKey: ["diary-monitorings"],
    queryFn: () => base44.entities.DiaryMonitoring.list("-created_date"),
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("name"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DiaryPublication.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diary-publications"] }),
  });

  // Search with synonyms
  const searchWithSynonyms = (text, term) => {
    if (!text || !term) return false;
    const t = text.toLowerCase(), q = term.toLowerCase().trim();
    if (t.includes(q)) return true;
    const dict = {
      intimação: ["intimado","intimando","intimar"],
      sentença:  ["sentenças","julgamento","decisão"],
      recurso:   ["recursos","apelação","agravo"],
      audiência: ["audiências","sessão"],
    };
    for (const [key, syns] of Object.entries(dict)) {
      if (key.includes(q) || q.includes(key)) {
        if (syns.some(s => t.includes(s))) return true;
      }
    }
    return false;
  };

  const baseList = filteredResults || publications;
  const filtered = baseList.filter((pub) => {
    const fields = [pub.title, pub.content, pub.case_number, pub.court, pub.source,
      ...(pub.parties_involved || [])].filter(Boolean).join(" ");
    const matchSearch   = !searchTerm || searchTerm.split(/\s+/).every(t => t.length < 2 || searchWithSynonyms(fields, t));
    const matchCat      = selectedCat     === "all" || pub.category === selectedCat;
    const matchUrgency  = selectedUrgency === "all" || pub.urgency  === selectedUrgency;
    const matchUnread   = !showUnreadOnly  || !pub.is_read;
    const matchStarred  = !showStarredOnly || pub.is_starred;
    return matchSearch && matchCat && matchUrgency && matchUnread && matchStarred;
  });

  const stats = {
    total:   publications.length,
    unread:  publications.filter(p => !p.is_read).length,
    starred: publications.filter(p => p.is_starred).length,
    today:   publications.filter(p => {
      if (!p.publication_date) return false;
      return format(new Date(p.publication_date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
    }).length,
  };

  const toggleStar   = (pub) => updateMutation.mutate({ id: pub.id, data: { is_starred: !pub.is_starred } });
  const markAsRead   = (pub) => { if (!pub.is_read) updateMutation.mutate({ id: pub.id, data: { is_read: true } }); };

  const getSearchTerms = () => {
    const terms = [];
    if (searchTerm)          terms.push(...searchTerm.split(/\s+/).filter(t => t.length > 1));
    if (activeFilters?.query) terms.push(...activeFilters.query.split(/\s+/).filter(t => t.length > 1));
    return [...new Set(terms)];
  };

  return (
    <AppPage>
      <PageHeader
        title="Monitor de Diários"
        subtitle="Monitoramento inteligente de publicações oficiais"
        icon={Newspaper}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <AppButton
              variant={showAdvSearch ? "primary" : "secondary"}
              icon={SlidersHorizontal}
              onClick={() => setShowAdvSearch(!showAdvSearch)}
            >
              Filtros
            </AppButton>
            <AppButton
              variant={showMonitoring ? "primary" : "secondary"}
              icon={Bell}
              onClick={() => setShowMonitoring(!showMonitoring)}
            >
              Alertas
            </AppButton>
            <AppButton
              variant="primary"
              icon={Plus}
              onClick={() => {}}
            >
              Adicionar Publicação
            </AppButton>
          </div>
        }
      />

      {/* KPIs */}
      <KPIGrid cols={4}>
        <StatCard icon={FileText}     label="Total"     value={stats.total}   sub="publicações"    color="var(--accent)"  loading={isLoading} />
        <StatCard icon={Eye}          label="Não Lidas" value={stats.unread}  sub="pendentes"      color="var(--warning)" loading={isLoading} />
        <StatCard icon={Star}         label="Favoritas" value={stats.starred} sub="marcadas"       color="var(--yellow)"  loading={isLoading} />
        <StatCard icon={Clock}        label="Hoje"      value={stats.today}   sub="novas hoje"     color="var(--success)" loading={isLoading} />
      </KPIGrid>

      <AppContent style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Analyzer */}
        <DiarySearchAnalyzer
          isDark={false}
          monitorings={monitorings}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["diary-publications"] })}
        />

        {/* Monitoring panel */}
        {showMonitoring && (
          <MonitoringDashboard
            isDark={false}
            monitorings={monitorings}
            publications={publications}
            clients={clients}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["diary-monitorings"] })}
          />
        )}

        {/* Advanced Search */}
        {showAdvSearch && (
          <AdvancedSearch
            isDark={false}
            publications={publications}
            onSearch={setFilteredResults}
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
          />
        )}

        {/* Filters bar */}
        <AppCard noPad>
          <div style={{ padding: "14px 20px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <SearchBar
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, processo, partes..."
              style={{ flex: 1, minWidth: 200 }}
            />

            <Select value={selectedCat} onValueChange={setSelectedCat}>
              <SelectTrigger style={{ width: 150, minHeight: 38, fontSize: 13 }}>
                <SelectValue placeholder="Todas Fontes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Fontes</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCat} onValueChange={setSelectedCat}>
              <SelectTrigger style={{ width: 150, minHeight: 38, fontSize: 13 }}>
                <SelectValue placeholder="Todas Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categoria</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
              <SelectTrigger style={{ width: 130, minHeight: 38, fontSize: 13 }}>
                <SelectValue placeholder="Todas Áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Áreas</SelectItem>
                <SelectItem value="alta">Urgente</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={showUnreadOnly ? "unread" : showStarredOnly ? "starred" : "all"} onValueChange={v => {
              setShowUnreadOnly(v === "unread");
              setShowStarredOnly(v === "starred");
            }}>
              <SelectTrigger style={{ width: 110, minHeight: 38, fontSize: 13 }}>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unread">Não lidos</SelectItem>
                <SelectItem value="starred">Favoritos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AppCard>

        {/* Publications list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: "var(--r-lg)" }} />
            ))
          ) : filtered.length === 0 ? (
            <AppCard>
              <EmptyState
                icon={Newspaper}
                title="Nenhuma publicação encontrada"
                description="Adicione publicações para começar o monitoramento"
              />
            </AppCard>
          ) : (
            <AnimatePresence>
              {filtered.map((pub, index) => (
                <PublicationAccordion
                  key={pub.id}
                  publication={pub}
                  isDark={false}
                  categoryLabels={categoryLabels}
                  urgencyConfig={urgencyConfig}
                  isExpanded={expandedId === pub.id}
                  onToggleExpand={() => setExpandedId(expandedId === pub.id ? null : pub.id)}
                  onToggleStar={() => toggleStar(pub)}
                  onMarkAsRead={() => markAsRead(pub)}
                  onViewDetails={() => { setSelectedPub(pub); setShowDetails(true); }}
                  searchTerms={getSearchTerms()}
                  index={index}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </AppContent>

      {/* Details modal */}
      <AppModal open={showDetails} onOpenChange={setShowDetails} size="lg">
        <AppModal.Header title="Detalhes da Publicação" onClose={() => setShowDetails(false)} />
        <AppModal.Body>
          {selectedPub && (
            <PublicationDetails
              publication={selectedPub}
              isDark={false}
              categoryLabels={categoryLabels}
              urgencyConfig={urgencyConfig}
              onClose={() => setShowDetails(false)}
              onToggleStar={() => toggleStar(selectedPub)}
              isModal
            />
          )}
        </AppModal.Body>
      </AppModal>
    </AppPage>
  );
}
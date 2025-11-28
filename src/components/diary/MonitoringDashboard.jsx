import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Bell, 
  Plus, 
  X, 
  Trash2, 
  Search,
  Users,
  FileText,
  Loader2,
  Check,
  Mail,
  AlertTriangle,
  Clock,
  Calendar,
  FolderOpen,
  Activity,
  TrendingUp,
  Eye,
  Settings,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Sparkles,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, isAfter } from "date-fns";

const CATEGORIES = [
  { id: "intimacao", label: "Intimação" },
  { id: "sentenca", label: "Sentença" },
  { id: "despacho", label: "Despacho" },
  { id: "edital", label: "Edital" },
  { id: "decisao", label: "Decisão" },
  { id: "acordao", label: "Acórdão" },
  { id: "citacao", label: "Citação" },
  { id: "outros", label: "Outros" }
];

const URGENCIES = [
  { id: "alta", label: "Urgente", color: "red" },
  { id: "media", label: "Média", color: "yellow" },
  { id: "baixa", label: "Baixa", color: "green" }
];

export default function MonitoringDashboard({ 
  isDark, 
  monitorings, 
  publications,
  clients = [],
  onRefresh 
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showForm, setShowForm] = useState(false);
  const [editingMonitoring, setEditingMonitoring] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [expandedMonitoringId, setExpandedMonitoringId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    group_name: "",
    client_id: "",
    keywords: [],
    client_names: [],
    case_numbers: [],
    courts: [],
    notify_categories: [],
    notify_urgencies: ["alta", "media"],
    is_active: true,
    notification_email: true,
    notification_push: false,
    notify_urgent_only: false,
    notify_with_deadlines: true,
    email_frequency: "instant"
  });

  const [inputValues, setInputValues] = useState({
    keyword: "",
    client: "",
    case: "",
    court: ""
  });

  // Estatísticas agregadas
  const stats = useMemo(() => {
    const activeCount = monitorings.filter(m => m.is_active).length;
    const inactiveCount = monitorings.length - activeCount;
    
    const recentDate = subDays(new Date(), 7);
    const recentMatches = monitorings.filter(m => 
      m.last_match_at && isAfter(new Date(m.last_match_at), recentDate)
    ).length;
    
    const totalPublicationsFound = monitorings.reduce((sum, m) => 
      sum + (m.publications_found || 0), 0
    );

    const withEmail = monitorings.filter(m => m.notification_email).length;
    const withPush = monitorings.filter(m => m.notification_push).length;

    return {
      total: monitorings.length,
      active: activeCount,
      inactive: inactiveCount,
      recentMatches,
      totalPublicationsFound,
      withEmail,
      withPush
    };
  }, [monitorings]);

  // Grupos únicos
  const groups = useMemo(() => {
    const groupSet = new Set();
    monitorings.forEach(m => {
      if (m.group_name) groupSet.add(m.group_name);
    });
    return Array.from(groupSet);
  }, [monitorings]);

  // Monitoramentos filtrados por grupo
  const filteredMonitorings = useMemo(() => {
    if (selectedGroup === "all") return monitorings;
    if (selectedGroup === "ungrouped") return monitorings.filter(m => !m.group_name);
    return monitorings.filter(m => m.group_name === selectedGroup);
  }, [monitorings, selectedGroup]);

  // Monitoramentos agrupados
  const groupedMonitorings = useMemo(() => {
    const grouped = {};
    monitorings.forEach(m => {
      const group = m.group_name || "Sem Grupo";
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(m);
    });
    return grouped;
  }, [monitorings]);

  const addItem = (field, inputField) => {
    const value = inputValues[inputField].trim();
    if (value && !formData[field].includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value]
      }));
      setInputValues(prev => ({ ...prev, [inputField]: "" }));
    }
  };

  const removeItem = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(v => v !== value)
    }));
  };

  const toggleArrayItem = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      group_name: "",
      client_id: "",
      keywords: [],
      client_names: [],
      case_numbers: [],
      courts: [],
      notify_categories: [],
      notify_urgencies: ["alta", "media"],
      is_active: true,
      notification_email: true,
      notification_push: false,
      notify_urgent_only: false,
      notify_with_deadlines: true,
      email_frequency: "instant"
    });
    setInputValues({ keyword: "", client: "", case: "", court: "" });
    setEditingMonitoring(null);
    setShowForm(false);
  };

  const handleEdit = (monitoring) => {
    setFormData({
      name: monitoring.name || "",
      group_name: monitoring.group_name || "",
      client_id: monitoring.client_id || "",
      keywords: monitoring.keywords || [],
      client_names: monitoring.client_names || [],
      case_numbers: monitoring.case_numbers || [],
      courts: monitoring.courts || [],
      notify_categories: monitoring.notify_categories || [],
      notify_urgencies: monitoring.notify_urgencies || ["alta", "media"],
      is_active: monitoring.is_active ?? true,
      notification_email: monitoring.notification_email ?? true,
      notification_push: monitoring.notification_push ?? false,
      notify_urgent_only: monitoring.notify_urgent_only ?? false,
      notify_with_deadlines: monitoring.notify_with_deadlines ?? true,
      email_frequency: monitoring.email_frequency || "instant"
    });
    setEditingMonitoring(monitoring);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Informe um nome para o monitoramento");
      return;
    }

    setIsLoading(true);
    try {
      const dataToSave = { ...formData };
      
      // Remove campos vazios
      if (!dataToSave.group_name) delete dataToSave.group_name;
      if (!dataToSave.client_id) delete dataToSave.client_id;

      if (editingMonitoring) {
        await base44.entities.DiaryMonitoring.update(editingMonitoring.id, dataToSave);
        toast.success("Monitoramento atualizado!");
      } else {
        await base44.entities.DiaryMonitoring.create(dataToSave);
        toast.success("Monitoramento criado!");
      }
      
      onRefresh();
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar monitoramento");
    }
    setIsLoading(false);
  };

  const deleteMonitoring = async (id) => {
    if (!confirm("Excluir este monitoramento?")) return;
    try {
      await base44.entities.DiaryMonitoring.delete(id);
      toast.success("Monitoramento excluído");
      onRefresh();
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const toggleActive = async (monitoring) => {
    try {
      await base44.entities.DiaryMonitoring.update(monitoring.id, {
        is_active: !monitoring.is_active
      });
      onRefresh();
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Painel de Monitoramentos
            </h3>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Novo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-slate-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Activity className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Ativos</span>
          </div>
          <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.active}</p>
        </div>
        <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-slate-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Matches (7d)</span>
          </div>
          <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.recentMatches}</p>
        </div>
        <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-slate-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <FileText className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Publicações</span>
          </div>
          <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.totalPublicationsFound}</p>
        </div>
        <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-slate-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Mail className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Com Email</span>
          </div>
          <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.withEmail}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className={`w-full ${isDark ? 'bg-neutral-800' : 'bg-slate-100'}`}>
          <TabsTrigger value="overview" className="flex-1">Visão Geral</TabsTrigger>
          <TabsTrigger value="groups" className="flex-1">Por Grupo</TabsTrigger>
          <TabsTrigger value="list" className="flex-1">Lista</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {groups.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {groups.map(group => {
                const groupMonitorings = monitorings.filter(m => m.group_name === group);
                const activeInGroup = groupMonitorings.filter(m => m.is_active).length;
                return (
                  <div 
                    key={group}
                    onClick={() => { setSelectedGroup(group); setActiveTab("list"); }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isDark 
                        ? 'bg-neutral-800/50 border-neutral-700 hover:border-purple-500' 
                        : 'bg-slate-50 border-slate-200 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FolderOpen className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {group}
                      </span>
                    </div>
                    <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                      {activeInGroup}/{groupMonitorings.length} ativos
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {monitorings.filter(m => !m.group_name).length > 0 && (
            <div 
              onClick={() => { setSelectedGroup("ungrouped"); setActiveTab("list"); }}
              className={`p-3 rounded-lg border cursor-pointer ${
                isDark 
                  ? 'bg-neutral-800/30 border-neutral-700 hover:border-neutral-600' 
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                + {monitorings.filter(m => !m.group_name).length} monitoramento(s) sem grupo
              </div>
            </div>
          )}
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="mt-4 space-y-4">
          {Object.entries(groupedMonitorings).map(([groupName, groupItems]) => (
            <div key={groupName} className={`rounded-lg border ${isDark ? 'bg-neutral-800/30 border-neutral-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`p-3 border-b ${isDark ? 'border-neutral-700' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{groupName}</span>
                  </div>
                  <Badge variant="outline">{groupItems.length}</Badge>
                </div>
              </div>
              <div className="divide-y divide-inherit">
                {groupItems.map(mon => (
                  <div key={mon.id} className={`p-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <Switch checked={mon.is_active} onCheckedChange={() => toggleActive(mon)} />
                      <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{mon.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {mon.publications_found > 0 && (
                        <Badge className="bg-purple-500/20 text-purple-500 border-0 text-xs">
                          {mon.publications_found}
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(mon)}>
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* List Tab */}
        <TabsContent value="list" className="mt-4 space-y-3 pb-4">
          {/* Filter by Group */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={selectedGroup === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedGroup("all")}
            >
              Todos
            </Button>
            {groups.map(group => (
              <Button 
                key={group}
                variant={selectedGroup === group ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedGroup(group)}
              >
                {group}
              </Button>
            ))}
            {monitorings.some(m => !m.group_name) && (
              <Button 
                variant={selectedGroup === "ungrouped" ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedGroup("ungrouped")}
              >
                Sem Grupo
              </Button>
            )}
          </div>

          {/* Monitoring List */}
          {filteredMonitorings.map(mon => (
            <div 
              key={mon.id}
              className={`rounded-lg border transition-colors ${
                isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div 
                className="p-3 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedMonitoringId(expandedMonitoringId === mon.id ? null : mon.id)}
              >
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={mon.is_active} 
                    onCheckedChange={(e) => { e.stopPropagation(); toggleActive(mon); }} 
                  />
                  <div>
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{mon.name}</h4>
                    {mon.group_name && (
                      <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                        {mon.group_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {mon.publications_found > 0 && (
                    <Badge className="bg-purple-500/20 text-purple-500 border-0 text-xs">
                      {mon.publications_found} pub
                    </Badge>
                  )}
                  {expandedMonitoringId === mon.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>

              {expandedMonitoringId === mon.id && (
                <div className={`p-3 border-t ${isDark ? 'border-neutral-700' : 'border-slate-200'}`}>
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {mon.keywords?.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <Search className="w-3 h-3 mr-1" />{kw}
                      </Badge>
                    ))}
                    {mon.case_numbers?.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-mono">{c}</Badge>
                    ))}
                  </div>

                  {/* Notification Summary */}
                  <div className={`text-xs space-y-1 mb-3 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    {mon.notification_email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email: {mon.email_frequency}</div>}
                    {mon.notification_push && <div className="flex items-center gap-1"><Bell className="w-3 h-3" /> Push ativo</div>}
                    {mon.notify_urgencies?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> 
                        Urgência: {mon.notify_urgencies.join(", ")}
                      </div>
                    )}
                    {mon.notify_categories?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Filter className="w-3 h-3" /> 
                        Categorias: {mon.notify_categories.join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(mon)}>
                      <Settings className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500" onClick={() => deleteMonitoring(mon.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Excluir
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredMonitorings.length === 0 && (
            <div className={`text-center py-8 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum monitoramento neste grupo</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl ${isDark ? 'bg-neutral-900' : 'bg-white'}`}>
            <div className={`p-4 border-b sticky top-0 z-10 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {editingMonitoring ? 'Editar Monitoramento' : 'Novo Monitoramento'}
                </h3>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Name and Group */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-medium mb-1 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    Nome *
                  </label>
                  <Input
                    placeholder="Ex: Processos Cliente X"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                  />
                </div>
                <div>
                  <label className={`text-sm font-medium mb-1 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    Grupo/Projeto
                  </label>
                  <Input
                    placeholder="Ex: Projeto ABC"
                    value={formData.group_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, group_name: e.target.value }))}
                    className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                    list="groups-list"
                  />
                  <datalist id="groups-list">
                    {groups.map(g => <option key={g} value={g} />)}
                  </datalist>
                </div>
              </div>

              {/* Client */}
              {clients.length > 0 && (
                <div>
                  <label className={`text-sm font-medium mb-1 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    Vincular a Cliente
                  </label>
                  <Select value={formData.client_id} onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}>
                    <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhum</SelectItem>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Keywords */}
              <div>
                <label className={`text-sm font-medium mb-1 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Palavras-chave
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar palavra-chave"
                    value={inputValues.keyword}
                    onChange={(e) => setInputValues(prev => ({ ...prev, keyword: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('keywords', 'keyword')}
                    className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                  />
                  <Button variant="outline" onClick={() => addItem('keywords', 'keyword')}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.keywords.map((kw, i) => (
                    <Badge key={i} className="gap-1">
                      {kw}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('keywords', kw)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Case Numbers */}
              <div>
                <label className={`text-sm font-medium mb-1 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Números de Processos
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="0000000-00.0000.0.00.0000"
                    value={inputValues.case}
                    onChange={(e) => setInputValues(prev => ({ ...prev, case: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('case_numbers', 'case')}
                    className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                  />
                  <Button variant="outline" onClick={() => addItem('case_numbers', 'case')}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.case_numbers.map((c, i) => (
                    <Badge key={i} variant="outline" className="gap-1 font-mono text-xs">
                      {c}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('case_numbers', c)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Notification Granular Settings */}
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className={`font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Bell className="w-4 h-4" /> Configurações de Notificação
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Email</span>
                    <Switch checked={formData.notification_email} onCheckedChange={(v) => setFormData(prev => ({ ...prev, notification_email: v }))} />
                  </div>

                  {formData.notification_email && (
                    <Select value={formData.email_frequency} onValueChange={(v) => setFormData(prev => ({ ...prev, email_frequency: v }))}>
                      <SelectTrigger className={`w-full ${isDark ? 'bg-neutral-700 border-neutral-600 text-white' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">Instantâneo</SelectItem>
                        <SelectItem value="daily">Resumo Diário</SelectItem>
                        <SelectItem value="weekly">Resumo Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Push no App</span>
                    <Switch checked={formData.notification_push} onCheckedChange={(v) => setFormData(prev => ({ ...prev, notification_push: v }))} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Notificar Prazos</span>
                    <Switch checked={formData.notify_with_deadlines} onCheckedChange={(v) => setFormData(prev => ({ ...prev, notify_with_deadlines: v }))} />
                  </div>

                  {/* Urgencies */}
                  <div>
                    <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      Níveis de Urgência
                    </label>
                    <div className="flex gap-2">
                      {URGENCIES.map(u => (
                        <Button
                          key={u.id}
                          variant={formData.notify_urgencies.includes(u.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleArrayItem('notify_urgencies', u.id)}
                          className={formData.notify_urgencies.includes(u.id) ? `bg-${u.color}-500` : ''}
                        >
                          {u.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      Categorias (deixe vazio para todas)
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {CATEGORIES.map(cat => (
                        <Badge
                          key={cat.id}
                          variant={formData.notify_categories.includes(cat.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleArrayItem('notify_categories', cat.id)}
                        >
                          {cat.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  {editingMonitoring ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
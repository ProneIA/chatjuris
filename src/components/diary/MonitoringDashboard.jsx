import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bell, Plus, X, Trash2, Search, Users, FileText, Loader2,
  Check, Mail, AlertTriangle, FolderOpen, Activity, TrendingUp,
  ChevronDown, ChevronUp, Settings, Filter, Clock
} from "lucide-react";
import { toast } from "sonner";
import { subDays, isAfter } from "date-fns";

const CATEGORIES = [
  { id: "intimacao", label: "Intimação" }, { id: "sentenca", label: "Sentença" },
  { id: "despacho",  label: "Despacho"  }, { id: "edital",   label: "Edital"   },
  { id: "decisao",   label: "Decisão"   }, { id: "acordao",  label: "Acórdão"  },
  { id: "citacao",   label: "Citação"   }, { id: "outros",   label: "Outros"   },
];
const URGENCIES = [
  { id: "alta",  label: "Urgente" },
  { id: "media", label: "Média"   },
  { id: "baixa", label: "Baixa"   },
];

const EMPTY_FORM = {
  name: "", group_name: "", client_id: "",
  keywords: [], client_names: [], case_numbers: [], courts: [],
  notify_categories: [], notify_urgencies: ["alta", "media"],
  is_active: true, notification_email: true, notification_push: false,
  notify_urgent_only: false, notify_with_deadlines: true, email_frequency: "instant"
};

export default function MonitoringDashboard({ monitorings, publications = [], clients = [], onRefresh }) {
  const [activeTab,             setActiveTab]             = useState("overview");
  const [showForm,              setShowForm]              = useState(false);
  const [editingMonitoring,     setEditingMonitoring]     = useState(null);
  const [isLoading,             setIsLoading]             = useState(false);
  const [selectedGroup,         setSelectedGroup]         = useState("all");
  const [expandedMonitoringId,  setExpandedMonitoringId]  = useState(null);
  const [formData,              setFormData]              = useState(EMPTY_FORM);
  const [inputValues,           setInputValues]           = useState({ keyword: "", client: "", case: "", court: "" });

  const stats = useMemo(() => {
    const activeCount = monitorings.filter(m => m.is_active).length;
    const recentDate  = subDays(new Date(), 7);
    const recentMatches = monitorings.filter(m => m.last_match_at && isAfter(new Date(m.last_match_at), recentDate)).length;
    const totalPublicationsFound = monitorings.reduce((s, m) => s + (m.publications_found || 0), 0);
    return { total: monitorings.length, active: activeCount, inactive: monitorings.length - activeCount, recentMatches, totalPublicationsFound, withEmail: monitorings.filter(m => m.notification_email).length };
  }, [monitorings]);

  const groups = useMemo(() => {
    const s = new Set();
    monitorings.forEach(m => { if (m.group_name) s.add(m.group_name); });
    return Array.from(s);
  }, [monitorings]);

  const filteredMonitorings = useMemo(() => {
    if (selectedGroup === "all") return monitorings;
    if (selectedGroup === "ungrouped") return monitorings.filter(m => !m.group_name);
    return monitorings.filter(m => m.group_name === selectedGroup);
  }, [monitorings, selectedGroup]);

  const groupedMonitorings = useMemo(() => {
    const grouped = {};
    monitorings.forEach(m => {
      const g = m.group_name || "Sem Grupo";
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(m);
    });
    return grouped;
  }, [monitorings]);

  const addItem = (field, inputField) => {
    const value = inputValues[inputField].trim();
    if (value && !formData[field].includes(value)) {
      setFormData(p => ({ ...p, [field]: [...p[field], value] }));
      setInputValues(p => ({ ...p, [inputField]: "" }));
    }
  };
  const removeItem      = (field, value)  => setFormData(p => ({ ...p, [field]: p[field].filter(v => v !== value) }));
  const toggleArrayItem = (field, value)  => setFormData(p => ({
    ...p, [field]: p[field].includes(value) ? p[field].filter(v => v !== value) : [...p[field], value]
  }));

  const resetForm = () => { setFormData(EMPTY_FORM); setInputValues({ keyword: "", client: "", case: "", court: "" }); setEditingMonitoring(null); setShowForm(false); };

  const handleEdit = (mon) => {
    setFormData({
      name: mon.name || "", group_name: mon.group_name || "", client_id: mon.client_id || "",
      keywords: mon.keywords || [], client_names: mon.client_names || [],
      case_numbers: mon.case_numbers || [], courts: mon.courts || [],
      notify_categories: mon.notify_categories || [], notify_urgencies: mon.notify_urgencies || ["alta", "media"],
      is_active: mon.is_active ?? true, notification_email: mon.notification_email ?? true,
      notification_push: mon.notification_push ?? false, notify_urgent_only: mon.notify_urgent_only ?? false,
      notify_with_deadlines: mon.notify_with_deadlines ?? true, email_frequency: mon.email_frequency || "instant"
    });
    setEditingMonitoring(mon);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error("Informe um nome para o monitoramento"); return; }
    setIsLoading(true);
    try {
      const dataToSave = { ...formData };
      if (!dataToSave.group_name) delete dataToSave.group_name;
      if (!dataToSave.client_id)  delete dataToSave.client_id;
      if (editingMonitoring) {
        await base44.entities.DiaryMonitoring.update(editingMonitoring.id, dataToSave);
        toast.success("Monitoramento atualizado!");
      } else {
        await base44.entities.DiaryMonitoring.create(dataToSave);
        toast.success("Monitoramento criado!");
      }
      onRefresh();
      resetForm();
    } catch { toast.error("Erro ao salvar monitoramento"); }
    setIsLoading(false);
  };

  const deleteMonitoring = async (id) => {
    if (!confirm("Excluir este monitoramento?")) return;
    try { await base44.entities.DiaryMonitoring.delete(id); toast.success("Excluído"); onRefresh(); }
    catch { toast.error("Erro ao excluir"); }
  };

  const toggleActive = async (mon) => {
    try { await base44.entities.DiaryMonitoring.update(mon.id, { is_active: !mon.is_active }); onRefresh(); }
    catch { toast.error("Erro ao atualizar"); }
  };

  const TABS = ["overview", "groups", "list"];
  const TAB_LABELS = { overview: "Visão Geral", groups: "Por Grupo", list: "Lista" };

  return (
    <div className="app-card">
      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={16} style={{ color: "var(--accent)" }} />
          </div>
          <h3 style={{ fontWeight: 600, fontSize: 14, color: "var(--text-1)", margin: 0 }}>Painel de Monitoramentos</h3>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ fontSize: 12 }}>
          <Plus size={13} /> Novo
        </button>
      </div>

      {/* KPI mini row */}
      <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, borderBottom: "1px solid var(--border)" }}>
        {[
          { icon: Activity,    label: "Ativos",       value: stats.active,                color: "var(--green)"  },
          { icon: TrendingUp,  label: "Matches (7d)", value: stats.recentMatches,         color: "var(--accent)" },
          { icon: FileText,    label: "Publicações",  value: stats.totalPublicationsFound, color: "var(--accent)" },
          { icon: Mail,        label: "Com Email",    value: stats.withEmail,             color: "var(--yellow)" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ padding: "10px 12px", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Icon size={13} style={{ color }} />
              <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>{label}</span>
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text-1)", margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs nav */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 14px", fontSize: 13, fontWeight: 500,
              color: activeTab === tab ? "var(--accent)" : "var(--text-2)",
              borderBottom: activeTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1, transition: "all var(--dur)",
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 20px" }}>
        {/* Overview */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {groups.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                {groups.map(group => {
                  const groupMons = monitorings.filter(m => m.group_name === group);
                  return (
                    <div key={group} onClick={() => { setSelectedGroup(group); setActiveTab("list"); }}
                      className="app-card"
                      style={{ padding: 12, cursor: "pointer", transition: "box-shadow var(--dur), transform var(--dur)" }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--sh-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <FolderOpen size={13} style={{ color: "var(--accent)" }} />
                        <span style={{ fontWeight: 500, fontSize: 13, color: "var(--text-1)" }}>{group}</span>
                      </div>
                      <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>
                        {groupMons.filter(m => m.is_active).length}/{groupMons.length} ativos
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            {monitorings.filter(m => !m.group_name).length > 0 && (
              <div onClick={() => { setSelectedGroup("ungrouped"); setActiveTab("list"); }}
                style={{ padding: "10px 14px", borderRadius: "var(--r-md)", border: "1px solid var(--border)", cursor: "pointer", background: "var(--surface)", fontSize: 13, color: "var(--text-2)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-2)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
              >
                + {monitorings.filter(m => !m.group_name).length} monitoramento(s) sem grupo
              </div>
            )}
            {monitorings.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-3)" }}>
                <Bell size={36} style={{ margin: "0 auto 10px", opacity: 0.25 }} />
                <p style={{ fontSize: 13, margin: 0 }}>Nenhum monitoramento criado</p>
              </div>
            )}
          </div>
        )}

        {/* Groups */}
        {activeTab === "groups" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(groupedMonitorings).map(([groupName, groupItems]) => (
              <div key={groupName} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <FolderOpen size={14} style={{ color: "var(--accent)" }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-1)" }}>{groupName}</span>
                  </div>
                  <span className="badge badge-neutral">{groupItems.length}</span>
                </div>
                {groupItems.map(mon => (
                  <div key={mon.id} style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Switch checked={mon.is_active} onCheckedChange={() => toggleActive(mon)} />
                      <span style={{ fontSize: 13, color: "var(--text-1)" }}>{mon.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {mon.publications_found > 0 && <span className="badge badge-blue">{mon.publications_found}</span>}
                      <button onClick={() => handleEdit(mon)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", minHeight: "unset", padding: 4 }}>
                        <Settings size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {activeTab === "list" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["all", ...groups, ...(monitorings.some(m => !m.group_name) ? ["ungrouped"] : [])].map(g => (
                <button key={g}
                  onClick={() => setSelectedGroup(g)}
                  className={selectedGroup === g ? "btn btn-primary" : "btn btn-secondary"}
                  style={{ fontSize: 12, padding: "5px 12px", minHeight: 30 }}>
                  {g === "all" ? "Todos" : g === "ungrouped" ? "Sem Grupo" : g}
                </button>
              ))}
            </div>

            {filteredMonitorings.map(mon => (
              <div key={mon.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--card)" }}>
                <div
                  style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                  onClick={() => setExpandedMonitoringId(expandedMonitoringId === mon.id ? null : mon.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Switch checked={mon.is_active} onCheckedChange={e => { e.stopPropagation?.(); toggleActive(mon); }} />
                    <div>
                      <h4 style={{ fontWeight: 500, fontSize: 13, color: "var(--text-1)", margin: 0 }}>{mon.name}</h4>
                      {mon.group_name && <span style={{ fontSize: 11, color: "var(--text-3)" }}>{mon.group_name}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {mon.publications_found > 0 && <span className="badge badge-blue">{mon.publications_found} pub</span>}
                    {expandedMonitoringId === mon.id ? <ChevronUp size={14} style={{ color: "var(--text-3)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-3)" }} />}
                  </div>
                </div>

                {expandedMonitoringId === mon.id && (
                  <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", gap: 10 }}>
                    {(mon.keywords?.length > 0 || mon.case_numbers?.length > 0) && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {mon.keywords?.map((kw, i) => <span key={i} className="badge badge-blue" style={{ fontSize: 11 }}><Search size={10} /> {kw}</span>)}
                        {mon.case_numbers?.map((c, i) => <span key={i} className="badge badge-neutral" style={{ fontSize: 11, fontFamily: "monospace" }}>{c}</span>)}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", flexDirection: "column", gap: 3 }}>
                      {mon.notification_email && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Mail size={11} /> Email: {mon.email_frequency}</span>}
                      {mon.notification_push && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Bell size={11} /> Push ativo</span>}
                      {mon.notify_urgencies?.length > 0 && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><AlertTriangle size={11} /> Urgência: {mon.notify_urgencies.join(", ")}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-secondary" onClick={() => handleEdit(mon)} style={{ fontSize: 12 }}><Settings size={13} /> Editar</button>
                      <button className="btn btn-danger" onClick={() => deleteMonitoring(mon.id)} style={{ fontSize: 12 }}><Trash2 size={13} /> Excluir</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredMonitorings.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-3)" }}>
                <Bell size={32} style={{ margin: "0 auto 10px", opacity: 0.2 }} />
                <p style={{ fontSize: 13, margin: 0 }}>Nenhum monitoramento neste grupo</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.45)", backdropFilter: "blur(2px)" }}>
          <div style={{ width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", background: "var(--card)", borderRadius: "var(--r-xl)", boxShadow: "var(--sh-xl)" }}>
            {/* Modal Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--card)", zIndex: 1 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--text-1)", margin: 0 }}>
                {editingMonitoring ? 'Editar Monitoramento' : 'Novo Monitoramento'}
              </h3>
              <button onClick={resetForm} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", minHeight: "unset", padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Name & Group */}
              <div className="form-row">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nome *</label>
                  <input placeholder="Ex: Processos Cliente X" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Grupo/Projeto</label>
                  <input placeholder="Ex: Projeto ABC" value={formData.group_name} onChange={e => setFormData(p => ({ ...p, group_name: e.target.value }))} list="groups-list" />
                  <datalist id="groups-list">{groups.map(g => <option key={g} value={g} />)}</datalist>
                </div>
              </div>

              {/* Client */}
              {clients.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Vincular a Cliente</label>
                  <Select value={formData.client_id} onValueChange={v => setFormData(p => ({ ...p, client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Keywords */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Palavras-chave</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="Adicionar palavra-chave" value={inputValues.keyword}
                    onChange={e => setInputValues(p => ({ ...p, keyword: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addItem('keywords', 'keyword')} style={{ flex: 1 }} />
                  <button className="btn btn-secondary" onClick={() => addItem('keywords', 'keyword')} style={{ flexShrink: 0 }}><Plus size={13} /></button>
                </div>
                {formData.keywords.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {formData.keywords.map((kw, i) => (
                      <span key={i} className="badge badge-blue" style={{ cursor: "pointer" }} onClick={() => removeItem('keywords', kw)}>
                        {kw} <X size={10} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Case Numbers */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Números de Processos</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="0000000-00.0000.0.00.0000" value={inputValues.case}
                    onChange={e => setInputValues(p => ({ ...p, case: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addItem('case_numbers', 'case')} style={{ flex: 1 }} />
                  <button className="btn btn-secondary" onClick={() => addItem('case_numbers', 'case')} style={{ flexShrink: 0 }}><Plus size={13} /></button>
                </div>
                {formData.case_numbers.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {formData.case_numbers.map((c, i) => (
                      <span key={i} className="badge badge-neutral" style={{ fontFamily: "monospace", cursor: "pointer", fontSize: 11 }} onClick={() => removeItem('case_numbers', c)}>
                        {c} <X size={10} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notification settings */}
              <div style={{ padding: "14px 16px", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                <h4 style={{ fontWeight: 600, fontSize: 13, color: "var(--text-1)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
                  <Bell size={14} style={{ color: "var(--accent)" }} /> Configurações de Notificação
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { key: "notification_email",   label: "Email"           },
                    { key: "notification_push",    label: "Push no App"     },
                    { key: "notify_with_deadlines",label: "Notificar Prazos"},
                  ].map(({ key, label }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "var(--text-1)" }}>{label}</span>
                      <Switch checked={formData[key]} onCheckedChange={v => setFormData(p => ({ ...p, [key]: v }))} />
                    </div>
                  ))}

                  {formData.notification_email && (
                    <Select value={formData.email_frequency} onValueChange={v => setFormData(p => ({ ...p, email_frequency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">Instantâneo</SelectItem>
                        <SelectItem value="daily">Resumo Diário</SelectItem>
                        <SelectItem value="weekly">Resumo Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Níveis de Urgência</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      {URGENCIES.map(u => (
                        <button key={u.id} onClick={() => toggleArrayItem('notify_urgencies', u.id)}
                          className={formData.notify_urgencies.includes(u.id) ? "btn btn-primary" : "btn btn-secondary"}
                          style={{ fontSize: 12, padding: "4px 12px", minHeight: 28 }}>
                          {u.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Categorias (vazio = todas)</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => toggleArrayItem('notify_categories', cat.id)}
                          className={formData.notify_categories.includes(cat.id) ? "btn btn-primary" : "btn btn-secondary"}
                          style={{ fontSize: 11, padding: "3px 10px", minHeight: 26 }}>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                <button className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  {editingMonitoring ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
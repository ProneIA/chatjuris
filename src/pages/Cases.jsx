import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, FolderOpen, Loader2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import CaseCard from "@/components/cases/CaseCard";
import { useDebounce } from "@/components/common/useDebounce";
import PullToRefresh from "@/components/mobile/PullToRefresh";

export default function Cases({ theme = 'light' }) {
  const isDark = false;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    case_number: "",
    client_id: "",
    client_name: "",
    area: "",
    status: "new",
    priority: "medium",
    court: "",
    opposing_party: "",
    start_date: "",
    deadline: "",
    value: 0
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: cases = [], isLoading, refetch } = useQuery({
    queryKey: ['cases', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const result = await base44.entities.Case.filter({ created_by: user.email }, '-created_date');
      return result;
    },
    enabled: !!user?.email,
    refetchOnMount: true
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Client.filter({ created_by: user.email }, 'name');
    },
    enabled: !!user?.email
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingCase) {
        return await base44.entities.Case.update(editingCase.id, data);
      } else {
        return await base44.entities.Case.create(data);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases'] });
      await refetch();
      toast.success(editingCase ? "Processo atualizado!" : "Processo criado com sucesso!");
      setShowForm(false);
      setEditingCase(null);
      resetForm();
    },
    onError: (error) => {
      console.error("Erro ao salvar processo:", error);
      toast.error("Erro ao salvar processo");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Case.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases'] });
      await refetch();
      toast.success("Processo excluído!");
    }
  });

  const handleSave = () => {
    if (!formData.title || !formData.area || !formData.client_id) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const selectedClient = clients.find(c => c.id === formData.client_id);
    const dataToSave = {
      ...formData,
      client_name: selectedClient?.name || formData.client_name,
      value: formData.value ? parseFloat(formData.value) : 0
    };

    saveMutation.mutate(dataToSave);
  };

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem);
    setFormData({
      title: caseItem.title || "",
      description: caseItem.description || "",
      case_number: caseItem.case_number || "",
      client_id: caseItem.client_id || "",
      client_name: caseItem.client_name || "",
      area: caseItem.area || "",
      status: caseItem.status || "new",
      priority: caseItem.priority || "medium",
      court: caseItem.court || "",
      opposing_party: caseItem.opposing_party || "",
      start_date: caseItem.start_date || "",
      deadline: caseItem.deadline || "",
      value: caseItem.value || 0
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      case_number: "",
      client_id: "",
      client_name: "",
      area: "",
      status: "new",
      priority: "medium",
      court: "",
      opposing_party: "",
      start_date: "",
      deadline: "",
      value: 0
    });
  };

  const filteredCases = cases.filter(c =>
    c.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.case_number?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)" }}>
        <Loader2 style={{ width: 28, height: 28, color: "var(--ink-4)" }} className="animate-spin" />
      </div>
    );
  }

  const activeCases = cases.filter(c => c.status === "in_progress").length;
  const urgentCases = cases.filter(c => c.priority === "urgent").length;
  const closedCases = cases.filter(c => c.status === "closed").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)", fontFamily: "var(--font-sans)" }}>
      <PageHeader
        title="Processos"
        sub={`${cases.length} processo(s) cadastrado(s)`}
        actions={
          <button
            className="btn-primary"
            onClick={() => { setEditingCase(null); resetForm(); setShowForm(true); }}
          >
            <Plus size={14} />
            Novo Processo
          </button>
        }
      />

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: "var(--ink-6)", gap: 1, borderBottom: "1px solid var(--ink-6)" }} className="lg:grid-cols-4 grid-cols-2">
        <StatCard title="Total" value={cases.length} sub="processos" accentColor="ink" loading={isLoading} />
        <StatCard title="Em andamento" value={activeCases} sub="ativos" accentColor="ok" status={activeCases > 0 ? { label: "Ativos", ok: true } : null} loading={isLoading} />
        <StatCard title="Urgentes" value={urgentCases} sub="prioridade alta" accentColor={urgentCases > 0 ? "danger" : "neutral"} status={urgentCases > 0 ? { label: "Ação requerida", danger: true } : { label: "Em dia", ok: true }} loading={isLoading} />
        <StatCard title="Concluídos" value={closedCases} sub="encerrados" accentColor="neutral" loading={isLoading} />
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 20, maxWidth: 480 }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--ink-4)" }} />
          <input
            placeholder="Buscar processos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1px solid var(--ink-5)", background: "var(--white)", fontSize: 12, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }}
          />
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 style={{ width: 24, height: 24, color: "var(--ink-4)" }} className="animate-spin" />
          </div>
        ) : filteredCases.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", border: "1px solid var(--ink-6)", background: "var(--white)" }}>
            <FolderOpen style={{ width: 40, height: 40, color: "var(--ink-5)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-2)", marginBottom: 6 }}>Nenhum processo encontrado</p>
            <p style={{ fontSize: 12, color: "var(--ink-4)", marginBottom: 16 }}>
              {cases.length === 0 ? "Crie seu primeiro processo" : "Nenhum resultado para sua busca"}
            </p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>+ Criar processo</button>
          </div>
        ) : (
          <PullToRefresh onRefresh={refetch} isDark={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1" style={{ background: "var(--ink-6)" }}>
              {filteredCases.map((caseItem) => (
                <CaseCard
                  key={caseItem.id}
                  caseItem={caseItem}
                  onClick={() => navigate(createPageUrl("CaseDetails") + "?id=" + caseItem.id)}
                  theme="light"
                />
              ))}
            </div>
          </PullToRefresh>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
            <DialogHeader>
              <DialogTitle>{editingCase ? "Editar Processo" : "Novo Processo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Ação de indenização"
                  style={{ fontSize: 16, minHeight: 44 }}
                />
              </div>

              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger style={{ minHeight: 44 }}>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Área *</Label>
                  <Select value={formData.area} onValueChange={(value) => setFormData({ ...formData, area: value })}>
                    <SelectTrigger style={{ minHeight: 44 }}>
                      <SelectValue placeholder="Selecione a área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="civil">Cível</SelectItem>
                      <SelectItem value="criminal">Criminal</SelectItem>
                      <SelectItem value="trabalhista">Trabalhista</SelectItem>
                      <SelectItem value="tributario">Tributário</SelectItem>
                      <SelectItem value="familia">Família</SelectItem>
                      <SelectItem value="empresarial">Empresarial</SelectItem>
                      <SelectItem value="consumidor">Consumidor</SelectItem>
                      <SelectItem value="previdenciario">Previdenciário</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Número do Processo</Label>
                  <Input
                    value={formData.case_number}
                    onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                    placeholder="0000000-00.0000.0.00.0000"
                    style={{ fontSize: 16, minHeight: 44 }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger style={{ minHeight: 44 }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="in_progress">Em andamento</SelectItem>
                      <SelectItem value="waiting">Aguardando</SelectItem>
                      <SelectItem value="closed">Concluído</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger style={{ minHeight: 44 }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vara/Tribunal</Label>
                <Input
                  value={formData.court}
                  onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  placeholder="Ex: 1ª Vara Cível de São Paulo"
                  style={{ fontSize: 16, minHeight: 44 }}
                />
              </div>

              <div className="space-y-2">
                <Label>Parte Contrária</Label>
                <Input
                  value={formData.opposing_party}
                  onChange={(e) => setFormData({ ...formData, opposing_party: e.target.value })}
                  placeholder="Nome da parte contrária"
                  style={{ fontSize: 16, minHeight: 44 }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    style={{ fontSize: 16, minHeight: 44 }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prazo</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    style={{ fontSize: 16, minHeight: 44 }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Valor da Causa (R$)</Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0.00"
                  style={{ fontSize: 16, minHeight: 44 }}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes do processo..."
                  rows={4}
                  style={{ fontSize: 16 }}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowForm(false)} style={{ minHeight: 44 }}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending} style={{ minHeight: 44 }}>
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
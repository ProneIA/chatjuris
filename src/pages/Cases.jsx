import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, FolderOpen } from "lucide-react";
import CaseCard from "@/components/cases/CaseCard";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import { useDebounce } from "@/components/common/useDebounce";
import { AppPage, PageHeader, StatCard, KPIGrid, SearchBar, EmptyState, LoadingSpinner, AppContent, AppButton, AppModal, AppField } from "@/components/ds";

export default function Cases() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [formData, setFormData] = useState(emptyForm());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  function emptyForm() {
    return {
      title: "", description: "", case_number: "", client_id: "", client_name: "",
      area: "", status: "new", priority: "medium", court: "", opposing_party: "",
      start_date: "", deadline: "", value: 0,
    };
  }

  const { data: cases = [], isLoading, refetch } = useQuery({
    queryKey: ["cases", user?.email],
    queryFn: () => base44.entities.Case.filter({ created_by: user.email }, "-created_date"),
    enabled: !!user?.email,
    refetchOnMount: true,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", user?.email],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }, "name"),
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingCase
        ? base44.entities.Case.update(editingCase.id, data)
        : base44.entities.Case.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cases"] });
      await refetch();
      toast.success(editingCase ? "Processo atualizado!" : "Processo criado!");
      setShowForm(false);
      setEditingCase(null);
      setFormData(emptyForm());
    },
    onError: () => toast.error("Erro ao salvar processo"),
  });

  const handleSave = () => {
    if (!formData.title || !formData.area || !formData.client_id) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    const selectedClient = clients.find((c) => c.id === formData.client_id);
    saveMutation.mutate({
      ...formData,
      client_name: selectedClient?.name || formData.client_name,
      value: formData.value ? parseFloat(formData.value) : 0,
    });
  };

  const handleEdit = (item) => {
    setEditingCase(item);
    setFormData({
      title: item.title || "", description: item.description || "",
      case_number: item.case_number || "", client_id: item.client_id || "",
      client_name: item.client_name || "", area: item.area || "",
      status: item.status || "new", priority: item.priority || "medium",
      court: item.court || "", opposing_party: item.opposing_party || "",
      start_date: item.start_date || "", deadline: item.deadline || "",
      value: item.value || 0,
    });
    setShowForm(true);
  };

  const filtered = cases.filter(
    (c) =>
      c.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.case_number?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.client_name?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const activeCases = cases.filter((c) => c.status === "in_progress").length;
  const urgentCases = cases.filter((c) => c.priority === "urgent").length;
  const closedCases = cases.filter((c) => c.status === "closed").length;

  if (!user) return <LoadingSpinner />;

  return (
    <AppPage>
      <PageHeader
        title="Processos"
        subtitle={`${cases.length} processo(s) cadastrado(s)`}
        icon={FolderOpen}
        actions={
          <AppButton variant="primary" icon={Plus} onClick={() => { setEditingCase(null); setFormData(emptyForm()); setShowForm(true); }}>
            Novo Processo
          </AppButton>
        }
      />

      {/* KPI */}
      <KPIGrid cols={4}>
        <StatCard icon={FolderOpen} label="Total"        value={cases.length}  sub="processos"           color="var(--accent)"  loading={isLoading} />
        <StatCard icon={FolderOpen} label="Em andamento" value={activeCases}   sub="ativos"              color="var(--success)" loading={isLoading} />
        <StatCard icon={FolderOpen} label="Urgentes"     value={urgentCases}   sub="prioridade alta"     color="var(--danger)"  loading={isLoading} />
        <StatCard icon={FolderOpen} label="Concluídos"   value={closedCases}   sub="encerrados"          color="var(--text-muted)" loading={isLoading} />
      </KPIGrid>

      <AppContent>
        <SearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar processos..."
          style={{ marginBottom: 20 }}
        />

        {isLoading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div
            style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 16, overflow: "hidden",
            }}
          >
            <EmptyState
              icon={FolderOpen}
              title="Nenhum processo encontrado"
              description={cases.length === 0 ? "Crie seu primeiro processo" : "Nenhum resultado para sua busca"}
              action={
                cases.length === 0 && (
                  <button className="btn-accent" onClick={() => setShowForm(true)}>
                    + Criar processo
                  </button>
                )
              }
            />
          </div>
        ) : (
          <PullToRefresh onRefresh={refetch} isDark={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <CaseCard
                  key={item.id}
                  caseItem={item}
                  onClick={() => navigate(createPageUrl("CaseDetails") + "?id=" + item.id)}
                  theme="light"
                />
              ))}
            </div>
          </PullToRefresh>
        )}
      </AppContent>

      {/* Form Modal */}
      <AppModal open={showForm} onOpenChange={setShowForm} size="lg">
        <AppModal.Header
          title={editingCase ? "Editar Processo" : "Novo Processo"}
          onClose={() => setShowForm(false)}
        />
        <AppModal.Body>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AppField label="Título" required>
              <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Ação de indenização" />
            </AppField>
            <AppField label="Cliente" required>
              <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </AppField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <AppField label="Área" required>
                <Select value={formData.area} onValueChange={(v) => setFormData({ ...formData, area: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione a área" /></SelectTrigger>
                  <SelectContent>
                    {["civil","criminal","trabalhista","tributario","familia","empresarial","consumidor","previdenciario","outros"].map((a) => (
                      <SelectItem key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AppField>
              <AppField label="Número do Processo">
                <input value={formData.case_number} onChange={(e) => setFormData({ ...formData, case_number: e.target.value })} placeholder="0000000-00.0000.0.00.0000" />
              </AppField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <AppField label="Status">
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="waiting">Aguardando</SelectItem>
                    <SelectItem value="closed">Concluído</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </AppField>
              <AppField label="Prioridade">
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </AppField>
            </div>
            <AppField label="Vara/Tribunal">
              <input value={formData.court} onChange={(e) => setFormData({ ...formData, court: e.target.value })} placeholder="Ex: 1ª Vara Cível de São Paulo" />
            </AppField>
            <AppField label="Parte Contrária">
              <input value={formData.opposing_party} onChange={(e) => setFormData({ ...formData, opposing_party: e.target.value })} placeholder="Nome da parte contrária" />
            </AppField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <AppField label="Data de Início">
                <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
              </AppField>
              <AppField label="Prazo">
                <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
              </AppField>
            </div>
            <AppField label="Valor da Causa (R$)">
              <input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder="0.00" />
            </AppField>
            <AppField label="Descrição">
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Detalhes do processo..." rows={4} />
            </AppField>
          </div>
        </AppModal.Body>
        <AppModal.Footer>
          <AppButton variant="ghost" onClick={() => setShowForm(false)}>Cancelar</AppButton>
          <AppButton variant="primary" loading={saveMutation.isPending} onClick={handleSave}>Salvar</AppButton>
        </AppModal.Footer>
      </AppModal>
    </AppPage>
  );
}
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, FolderOpen, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import CaseCard from "@/components/cases/CaseCard";

export default function Cases({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
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
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Processos
            </h1>
            <p className={`mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
              {cases.length} processo(s) encontrado(s)
            </p>
          </div>
          <Button 
            onClick={() => {
              setEditingCase(null);
              resetForm();
              setShowForm(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Processo
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar processos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white'}`}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredCases.length === 0 ? (
          <div className={`text-center py-20 border-2 border-dashed rounded-xl ${isDark ? 'border-neutral-800' : 'border-gray-300'}`}>
            <FolderOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
            <h3 className={`text-xl font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Nenhum processo encontrado
            </h3>
            <p className={`mt-2 mb-6 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              {cases.length === 0 ? "Crie seu primeiro processo" : "Nenhum resultado para sua busca"}
            </p>
            <Button onClick={() => setShowForm(true)}>
              Criar processo
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseItem={caseItem}
                onClick={() => navigate(createPageUrl("CaseDetails") + "?id=" + caseItem.id)}
                theme={theme}
              />
            ))}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                />
              </div>

              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Área *</Label>
                  <Select value={formData.area} onValueChange={(value) => setFormData({ ...formData, area: value })}>
                    <SelectTrigger>
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
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
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
                    <SelectTrigger>
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
                />
              </div>

              <div className="space-y-2">
                <Label>Parte Contrária</Label>
                <Input
                  value={formData.opposing_party}
                  onChange={(e) => setFormData({ ...formData, opposing_party: e.target.value })}
                  placeholder="Nome da parte contrária"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prazo</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes do processo..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
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
    </div>
  );
}
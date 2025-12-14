import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FolderOpen, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import CaseCard from "@/components/cases/CaseCard";
import CaseDetails from "@/components/cases/CaseDetails";

export default function Cases({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    client_name: "",
    area: "civil",
    status: "new",
    priority: "medium",
    description: "",
    court: "",
    opposing_party: "",
    start_date: "",
    deadline: ""
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: cases = [], refetch } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const result = await base44.entities.Case.list('-created_date');
      return result;
    }
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (!data.title?.trim() || !data.client_id) {
        throw new Error("Título e cliente são obrigatórios");
      }

      const cleanData = {
        title: data.title.trim(),
        client_id: data.client_id,
        client_name: data.client_name || "",
        area: data.area,
        status: data.status,
        priority: data.priority,
        description: data.description || "",
        court: data.court || "",
        opposing_party: data.opposing_party || "",
        start_date: data.start_date || "",
        deadline: data.deadline || ""
      };

      if (editingCase) {
        return await base44.entities.Case.update(editingCase.id, cleanData);
      }
      return await base44.entities.Case.create(cleanData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases'] });
      await refetch();
      toast.success(editingCase ? "✅ Processo atualizado!" : "✅ Processo criado!");
      setShowForm(false);
      setEditingCase(null);
      resetForm();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Case.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setSelectedCase(null);
      toast.success("Processo excluído");
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      client_id: "",
      client_name: "",
      area: "civil",
      status: "new",
      priority: "medium",
      description: "",
      court: "",
      opposing_party: "",
      start_date: "",
      deadline: ""
    });
  };

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem);
    setFormData({
      title: caseItem.title || "",
      client_id: caseItem.client_id || "",
      client_name: caseItem.client_name || "",
      area: caseItem.area || "civil",
      status: caseItem.status || "new",
      priority: caseItem.priority || "medium",
      description: caseItem.description || "",
      court: caseItem.court || "",
      opposing_party: caseItem.opposing_party || "",
      start_date: caseItem.start_date || "",
      deadline: caseItem.deadline || ""
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const filteredCases = cases.filter(c =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-neutral-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Processos</h1>
            <p className="text-gray-500 mt-1">Gerencie seus processos jurídicos</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            Novo Processo
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Buscar processos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            {filteredCases.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-xl">
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium">Nenhum processo encontrado</h3>
                <p className="text-gray-500 mt-2 mb-6">Crie seu primeiro processo</p>
                <Button variant="outline" onClick={() => setShowForm(true)}>
                  Criar processo
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCases.map((caseItem) => (
                  <CaseCard
                    key={caseItem.id}
                    caseData={caseItem}
                    onClick={() => setSelectedCase(caseItem)}
                    onEdit={() => handleEdit(caseItem)}
                    theme={theme}
                  />
                ))}
              </div>
            )}
          </div>

          {selectedCase && (
            <CaseDetails
              caseData={selectedCase}
              onClose={() => setSelectedCase(null)}
              onEdit={() => handleEdit(selectedCase)}
              onDelete={() => {
                if (confirm("Excluir este processo?")) {
                  deleteMutation.mutate(selectedCase.id);
                }
              }}
              theme={theme}
            />
          )}
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCase ? "Editar Processo" : "Novo Processo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cliente * {clients.length === 0 && <span className="text-red-500 text-xs">(Cadastre um cliente primeiro)</span>}</Label>
                  <Select value={formData.client_id} onValueChange={(v) => {
                    const client = clients.find(c => c.id === v);
                    setFormData({ ...formData, client_id: v, client_name: client?.name || "" });
                  }}>
                    <SelectTrigger className={!formData.client_id ? "border-red-300" : ""}>
                      <SelectValue placeholder="Selecione um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!formData.client_id && <p className="text-xs text-red-500">Obrigatório selecionar um cliente</p>}
                </div>
                <div className="space-y-2">
                  <Label>Área *</Label>
                  <Select value={formData.area} onValueChange={(v) => setFormData({ ...formData, area: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="civil">Cível</SelectItem>
                      <SelectItem value="criminal">Criminal</SelectItem>
                      <SelectItem value="trabalhista">Trabalhista</SelectItem>
                      <SelectItem value="tributario">Tributário</SelectItem>
                      <SelectItem value="familia">Família</SelectItem>
                      <SelectItem value="empresarial">Empresarial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="waiting">Aguardando</SelectItem>
                      <SelectItem value="closed">Encerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
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
                <div className="space-y-2">
                  <Label>Vara/Tribunal</Label>
                  <Input
                    value={formData.court}
                    onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parte Contrária</Label>
                  <Input
                    value={formData.opposing_party}
                    onChange={(e) => setFormData({ ...formData, opposing_party: e.target.value })}
                  />
                </div>
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
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingCase(null); }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : editingCase ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
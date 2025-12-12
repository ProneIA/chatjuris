import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Folder,
  FileText,
  Calendar,
  DollarSign,
  User,
  Clock,
  AlertCircle,
  Loader2,
  X
} from "lucide-react";
import { toast } from "sonner";

const areas = [
  { value: "civil", label: "Civil" },
  { value: "criminal", label: "Criminal" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "tributario", label: "Tributário" },
  { value: "familia", label: "Família" },
  { value: "empresarial", label: "Empresarial" },
  { value: "consumidor", label: "Consumidor" },
  { value: "previdenciario", label: "Previdenciário" },
  { value: "outros", label: "Outros" },
];

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  waiting: "bg-orange-100 text-orange-800",
  closed: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function Cases({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    client_name: "",
    case_number: "",
    area: "",
    status: "new",
    priority: "medium",
    description: "",
    court: "",
    opposing_party: "",
    start_date: "",
    deadline: "",
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: cases = [], refetch } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const result = await base44.entities.Case.list('-created_date');
      console.log("⚖️ Processos carregados:", result.length);
      return result;
    },
    enabled: !!user
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    enabled: !!user
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formData.title.trim() || !formData.area) {
        throw new Error("Título e área são obrigatórios");
      }

      const dataToSave = {
        title: formData.title.trim(),
        client_name: formData.client_name.trim() || "Não informado",
        case_number: formData.case_number.trim(),
        area: formData.area,
        status: formData.status,
        priority: formData.priority,
        description: formData.description.trim(),
        court: formData.court.trim(),
        opposing_party: formData.opposing_party.trim(),
        start_date: formData.start_date || null,
        deadline: formData.deadline || null,
        client_id: "" // optional
      };

      console.log("💾 Salvando processo:", dataToSave);

      if (selectedCase) {
        const result = await base44.entities.Case.update(selectedCase.id, dataToSave);
        console.log("✅ Processo atualizado:", result.id);
        return result;
      } else {
        const result = await base44.entities.Case.create(dataToSave);
        console.log("✅ Processo criado:", result.id);
        return result;
      }
    },
    onSuccess: async () => {
      await refetch();
      setShowForm(false);
      setSelectedCase(null);
      resetForm();
      toast.success(selectedCase ? "Processo atualizado!" : "Processo criado!");
    },
    onError: (e) => {
      console.error("❌ Erro:", e);
      toast.error("Erro ao salvar processo");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Case.delete(id),
    onSuccess: () => {
      refetch();
      setSelectedCase(null);
      toast.success("Processo excluído");
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      client_name: "",
      case_number: "",
      area: "",
      status: "new",
      priority: "medium",
      description: "",
      court: "",
      opposing_party: "",
      start_date: "",
      deadline: "",
    });
  };

  const handleEdit = (caseItem) => {
    setSelectedCase(caseItem);
    setFormData({
      title: caseItem.title || "",
      client_name: caseItem.client_name || "",
      case_number: caseItem.case_number || "",
      area: caseItem.area || "",
      status: caseItem.status || "new",
      priority: caseItem.priority || "medium",
      description: caseItem.description || "",
      court: caseItem.court || "",
      opposing_party: caseItem.opposing_party || "",
      start_date: caseItem.start_date || "",
      deadline: caseItem.deadline || "",
    });
    setShowForm(true);
  };

  const filteredCases = cases.filter(c =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.case_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: cases.length,
    active: cases.filter(c => c.status === 'in_progress').length,
    urgent: cases.filter(c => c.priority === 'urgent').length,
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Processos
            </h1>
            <p className={`${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              {stats.total} total • {stats.active} em andamento • {stats.urgent} urgentes
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setSelectedCase(null);
              setShowForm(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Processo
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar processos..."
            className="pl-10"
          />
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>{selectedCase ? "Editar Processo" : "Novo Processo"}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedCase(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Ação de Cobrança"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Input
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      placeholder="Nome do cliente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nº do Processo</Label>
                    <Input
                      value={formData.case_number}
                      onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                      placeholder="Ex: 0000000-00.0000.0.00.0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Área *</Label>
                    <Select
                      value={formData.area}
                      onValueChange={(v) => setFormData({ ...formData, area: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((a) => (
                          <SelectItem key={a.value} value={a.value}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
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
                    <Select
                      value={formData.priority}
                      onValueChange={(v) => setFormData({ ...formData, priority: v })}
                    >
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
                    <Label>Prazo Importante</Label>
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
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedCase(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {selectedCase ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cases Grid */}
        {filteredCases.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum processo encontrado</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases.map((caseItem) => (
              <Card
                key={caseItem.id}
                className="hover:shadow-lg transition cursor-pointer"
                onClick={() => handleEdit(caseItem)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg line-clamp-1">{caseItem.title}</h3>
                    <Badge className={priorityColors[caseItem.priority]}>
                      {caseItem.priority}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {caseItem.client_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {caseItem.client_name}
                      </div>
                    )}
                    {caseItem.case_number && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {caseItem.case_number}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      {areas.find(a => a.value === caseItem.area)?.label}
                    </div>
                    {caseItem.deadline && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="w-4 h-4" />
                        Prazo: {new Date(caseItem.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t flex justify-between items-center">
                    <Badge className={statusColors[caseItem.status]}>
                      {caseItem.status === 'new' && 'Novo'}
                      {caseItem.status === 'in_progress' && 'Em Andamento'}
                      {caseItem.status === 'waiting' && 'Aguardando'}
                      {caseItem.status === 'closed' && 'Encerrado'}
                    </Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(caseItem.created_date).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
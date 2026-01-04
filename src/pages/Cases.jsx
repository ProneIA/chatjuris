import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Search, Plus, FolderOpen, FileText, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Cases({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    case_number: "",
    client_id: "",
    client_name: "",
    area: "",
    status: "new",
    priority: "medium",
    description: "",
    court: "",
    opposing_party: "",
    start_date: "",
    deadline: "",
    value: ""
  });

  // Buscar usuário
  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Buscar processos
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases', user?.email],
    queryFn: () => base44.entities.Case.list('-created_date'),
    enabled: !!user?.email
  });

  // Buscar clientes para o select
  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.email],
    queryFn: () => base44.entities.Client.list(),
    enabled: !!user?.email
  });

  // Criar/Atualizar processo
  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success("Processo criado com sucesso!");
      setShowForm(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao salvar processo");
      console.error(error);
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      case_number: "",
      client_id: "",
      client_name: "",
      area: "",
      status: "new",
      priority: "medium",
      description: "",
      court: "",
      opposing_party: "",
      start_date: "",
      deadline: "",
      value: ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.client_id || !formData.area) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setFormData({
      ...formData,
      client_id: clientId,
      client_name: client?.name || ""
    });
  };

  // Filtrar processos
  const filteredCases = cases.filter(c => 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-100 text-blue-700",
      in_progress: "bg-yellow-100 text-yellow-700",
      waiting: "bg-purple-100 text-purple-700",
      closed: "bg-gray-100 text-gray-700",
      archived: "bg-gray-100 text-gray-500"
    };
    return colors[status] || colors.new;
  };

  const getStatusLabel = (status) => {
    const labels = {
      new: "Novo",
      in_progress: "Em Andamento",
      waiting: "Aguardando",
      closed: "Encerrado",
      archived: "Arquivado"
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-gray-100 text-gray-600",
      medium: "bg-blue-100 text-blue-600",
      high: "bg-orange-100 text-orange-600",
      urgent: "bg-red-100 text-red-600"
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Processos
            </h1>
            <p className={`mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
              {cases.length} processo(s) encontrado(s)
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Processo
          </Button>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar processos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white'}`}
            />
          </div>
        </div>

        {/* Lista de Processos */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
            <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
              Carregando processos...
            </p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className={`text-center py-20 border-2 border-dashed rounded-xl ${isDark ? 'border-neutral-800' : 'border-gray-300'}`}>
            <FolderOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-neutral-600' : 'text-gray-300'}`} />
            <h3 className={`text-xl font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {cases.length === 0 ? "Nenhum processo cadastrado" : "Nenhum resultado encontrado"}
            </h3>
            <p className={`mb-6 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
              {cases.length === 0 ? "Crie seu primeiro processo" : "Tente outro termo de busca"}
            </p>
            {cases.length === 0 && (
              <Button onClick={() => setShowForm(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Criar Processo
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases.map((caseItem) => (
              <Card
                key={caseItem.id}
                onClick={() => navigate(createPageUrl("CaseDetails") + "?id=" + caseItem.id)}
                className={`p-5 cursor-pointer hover:shadow-lg transition-all ${
                  isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white hover:border-indigo-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {caseItem.title}
                    </h3>
                    {caseItem.case_number && (
                      <p className={`text-sm flex items-center gap-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        <FileText className="w-3 h-3" />
                        {caseItem.case_number}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(caseItem.status)}`}>
                    {getStatusLabel(caseItem.status)}
                  </span>
                </div>

                <div className="space-y-2">
                  {caseItem.client_name && (
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      Cliente: {caseItem.client_name}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(caseItem.priority)}`}>
                      {caseItem.priority === 'low' ? 'Baixa' :
                       caseItem.priority === 'medium' ? 'Média' :
                       caseItem.priority === 'high' ? 'Alta' : 'Urgente'}
                    </span>
                    {caseItem.area && (
                      <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-700'}`}>
                        {caseItem.area}
                      </span>
                    )}
                  </div>

                  {caseItem.deadline && (
                    <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                      <Calendar className="w-3 h-3" />
                      Prazo: {new Date(caseItem.deadline).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Criação */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Novo Processo
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>
                    Título * <span className="text-red-500">obrigatório</span>
                  </Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Ação Trabalhista - Horas Extras"
                    className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>
                    Número do Processo
                  </Label>
                  <Input
                    value={formData.case_number}
                    onChange={(e) => setFormData({...formData, case_number: e.target.value})}
                    placeholder="0000000-00.0000.0.00.0000"
                    className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>
                    Cliente * <span className="text-red-500">obrigatório</span>
                  </Label>
                  <Select value={formData.client_id} onValueChange={handleClientChange} required>
                    <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}>
                      <SelectValue placeholder="Selecione um cliente" />
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

                <div className="space-y-2">
                  <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>
                    Área do Direito * <span className="text-red-500">obrigatório</span>
                  </Label>
                  <Select value={formData.area} onValueChange={(v) => setFormData({...formData, area: v})} required>
                    <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}>
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
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="waiting">Aguardando</SelectItem>
                      <SelectItem value="closed">Encerrado</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                    <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}>
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
                <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o caso..."
                  className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Vara/Tribunal</Label>
                  <Input
                    value={formData.court}
                    onChange={(e) => setFormData({...formData, court: e.target.value})}
                    placeholder="Ex: 5ª Vara Cível"
                    className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Parte Contrária</Label>
                  <Input
                    value={formData.opposing_party}
                    onChange={(e) => setFormData({...formData, opposing_party: e.target.value})}
                    placeholder="Nome da parte contrária"
                    className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Data de Início</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Prazo</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Valor da Causa</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    placeholder="0.00"
                    className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                  />
                </div>
              </div>

              <div className={`p-3 rounded-lg flex items-start gap-2 ${isDark ? 'bg-blue-950/30 border border-blue-900/50' : 'bg-blue-50 border border-blue-200'}`}>
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                  <strong>Informações Sigilosas:</strong> Este processo será visível apenas para você. 
                  Seus dados estão protegidos conforme a LGPD.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Criar Processo'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, X, Save, Loader2 } from "lucide-react";
import CaseCard from "../components/cases/CaseCard";
import CaseDetails from "../components/cases/CaseDetails";
import FolderSidebar from "../components/cases/FolderSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Cases({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    client_name: "",
    area: "civil",
    status: "new",
    priority: "medium",
    case_number: "",
    court: "",
    opposing_party: "",
    description: "",
    start_date: "",
    deadline: "",
    value: ""
  });

  const casesPerPage = 12;
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Reset form when editing case changes
  useEffect(() => {
    if (editingCase) {
      setFormData({
        title: editingCase.title || "",
        client_id: editingCase.client_id || "",
        client_name: editingCase.client_name || "",
        area: editingCase.area || "civil",
        status: editingCase.status || "new",
        priority: editingCase.priority || "medium",
        case_number: editingCase.case_number || "",
        court: editingCase.court || "",
        opposing_party: editingCase.opposing_party || "",
        description: editingCase.description || "",
        start_date: editingCase.start_date || "",
        deadline: editingCase.deadline || "",
        value: editingCase.value ? String(editingCase.value) : ""
      });
    } else {
      setFormData({
        title: "",
        client_id: "",
        client_name: "",
        area: "civil",
        status: "new",
        priority: "medium",
        case_number: "",
        court: "",
        opposing_party: "",
        description: "",
        start_date: "",
        deadline: "",
        value: ""
      });
    }
  }, [editingCase]);

  const { data: rawCases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
  });

  // Normaliza os dados dos casos (alguns podem vir com dados dentro de 'data')
  const cases = rawCases.map(c => {
    if (c.data && c.data.title) {
      return { id: c.id, created_date: c.created_date, created_by: c.created_by, ...c.data };
    }
    return c;
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: () => base44.entities.Folder.list('order'),
  });

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_name: client ? client.name : ""
    }));
  };

  const handleSaveCase = async () => {
    // Validação
    if (!formData.title.trim()) {
      toast.error("Preencha o título do processo");
      return;
    }
    if (!formData.client_id) {
      toast.error("Selecione um cliente");
      return;
    }
    if (!formData.area) {
      toast.error("Selecione a área do direito");
      return;
    }

    setIsSaving(true);

    // Monta dados para salvar
    const dataToSave = {
      title: formData.title.trim(),
      client_id: formData.client_id,
      client_name: formData.client_name,
      area: formData.area,
      status: formData.status,
      priority: formData.priority
    };

    if (formData.case_number?.trim()) dataToSave.case_number = formData.case_number.trim();
    if (formData.court?.trim()) dataToSave.court = formData.court.trim();
    if (formData.opposing_party?.trim()) dataToSave.opposing_party = formData.opposing_party.trim();
    if (formData.description?.trim()) dataToSave.description = formData.description.trim();
    if (formData.start_date) dataToSave.start_date = formData.start_date;
    if (formData.deadline) dataToSave.deadline = formData.deadline;
    if (formData.value?.trim() && !isNaN(parseFloat(formData.value))) {
      dataToSave.value = parseFloat(formData.value);
    }

    try {
      if (editingCase) {
        await base44.entities.Case.update(editingCase.id, dataToSave);
        toast.success("Processo atualizado com sucesso!");
      } else {
        await base44.entities.Case.create(dataToSave);
        toast.success("Processo salvo com sucesso!");
      }
      
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowForm(false);
      setEditingCase(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar processo: " + (error.message || "Tente novamente"));
    } finally {
      setIsSaving(false);
    }
  };

  const createFolderMutation = useMutation({
    mutationFn: (data) => base44.entities.Folder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success("Pasta criada!");
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Folder.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders'] }),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id) => base44.entities.Folder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      if (selectedFolder && typeof selectedFolder === 'string') {
        setSelectedFolder(null);
      }
      toast.success("Pasta excluída!");
    },
  });

  const moveCaseToFolderMutation = useMutation({
    mutationFn: ({ caseId, folderId }) => base44.entities.Case.update(caseId, { folder_id: folderId || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success("Processo movido!");
    },
  });

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = 
      caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFolder = true;
    if (selectedFolder === 'unfiled') {
      matchesFolder = !caseItem.folder_id;
    } else if (selectedFolder) {
      matchesFolder = caseItem.folder_id === selectedFolder;
    }

    return matchesSearch && matchesFolder;
  });

  const totalPages = Math.ceil(filteredCases.length / casesPerPage);
  const startIndex = (currentPage - 1) * casesPerPage;
  const paginatedCases = filteredCases.slice(startIndex, startIndex + casesPerPage);

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem);
    setShowForm(true);
    setSelectedCase(null);
  };

  const handleMoveToFolder = (caseId, folderId) => {
    moveCaseToFolderMutation.mutate({ caseId, folderId });
  };

  const caseCounts = {
    total: cases.length,
    unfiled: cases.filter(c => !c.folder_id).length
  };
  folders.forEach(folder => {
    caseCounts[folder.id] = cases.filter(c => c.folder_id === folder.id).length;
  });

  const stats = {
    total: cases.length,
    active: cases.filter(c => c.status === 'in_progress').length,
    new: cases.filter(c => c.status === 'new').length,
    urgent: cases.filter(c => c.priority === 'urgent').length,
  };

  return (
    <div className={`h-full flex ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <FolderSidebar
        folders={folders}
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        onCreateFolder={(data) => createFolderMutation.mutate(data)}
        onUpdateFolder={(id, data) => updateFolderMutation.mutate({ id, data })}
        onDeleteFolder={(id) => deleteFolderMutation.mutate(id)}
        caseCounts={caseCounts}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={`border-b px-6 py-6 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {selectedFolder === 'unfiled' 
                  ? 'Processos sem Pasta'
                  : selectedFolder
                  ? folders.find(f => f.id === selectedFolder)?.name || 'Processos'
                  : 'Todos os Processos'}
              </h1>
              <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                {filteredCases.length} {filteredCases.length === 1 ? 'processo' : 'processos'}
              </p>
            </div>
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingCase(null);
                setSelectedCase(null);
              }}
              className={isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Processo
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className={`border rounded-lg p-4 ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200 bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Total</p>
              <p className={`text-2xl font-light mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
            </div>
            <div className={`border rounded-lg p-4 ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200 bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Em Andamento</p>
              <p className={`text-2xl font-light mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.active}</p>
            </div>
            <div className={`border rounded-lg p-4 ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200 bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Novos</p>
              <p className={`text-2xl font-light mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.new}</p>
            </div>
            <div className={`border rounded-lg p-4 ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200 bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Urgentes</p>
              <p className={`text-2xl font-light mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.urgent}</p>
            </div>
          </div>

          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
            <Input
              placeholder="Buscar por título, número do processo ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
            />
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
          {showForm ? (
            <Card className="max-w-3xl mx-auto border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle>{editingCase ? 'Editar Processo' : 'Novo Processo'}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingCase(null); }}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Título do Processo *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="Ex: Ação de Cobrança"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Número do Processo</Label>
                      <Input
                        value={formData.case_number}
                        onChange={(e) => setFormData({...formData, case_number: e.target.value})}
                        placeholder="0000000-00.0000.0.00.0000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cliente *</Label>
                      <Select value={formData.client_id} onValueChange={handleClientChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.length > 0 ? (
                            clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="_none" disabled>
                              Nenhum cliente cadastrado
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {clients.length === 0 && (
                        <p className="text-xs text-amber-600">Cadastre um cliente primeiro</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Área do Direito *</Label>
                      <Select value={formData.area} onValueChange={(v) => setFormData({...formData, area: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="civil">Civil</SelectItem>
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
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger>
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
                      <Label>Prioridade</Label>
                      <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
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
                        onChange={(e) => setFormData({...formData, court: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Parte Contrária</Label>
                      <Input
                        value={formData.opposing_party}
                        onChange={(e) => setFormData({...formData, opposing_party: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Prazo Importante</Label>
                      <Input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Valor da Causa (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.value}
                        onChange={(e) => setFormData({...formData, value: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => { setShowForm(false); setEditingCase(null); }} 
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveCase}
                      disabled={isSaving || clients.length === 0} 
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {editingCase ? 'Atualizar' : 'Salvar'} Processo
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className={`h-32 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />
              ))}
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <div className={`w-16 h-16 border rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'border-neutral-800' : 'border-gray-300'}`}>
                <Search className={`w-8 h-8 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Nenhum processo encontrado
              </h3>
              <p className={isDark ? 'text-neutral-500' : 'text-gray-500'}>
                Crie um novo processo para começar
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {paginatedCases.map((caseItem) => (
                <CaseCard
                  key={caseItem.id}
                  caseItem={caseItem}
                  isSelected={selectedCase?.id === caseItem.id}
                  onClick={() => setSelectedCase(caseItem)}
                  folders={folders}
                  currentFolderId={selectedFolder}
                  onMoveToFolder={handleMoveToFolder}
                />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Mostrando {startIndex + 1}-{Math.min(startIndex + casesPerPage, filteredCases.length)} de {filteredCases.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedCase && !showForm && (
        <CaseDetails
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
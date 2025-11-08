import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Folder as FolderIcon } from "lucide-react";
import CaseList from "../components/cases/CaseList";
import CaseForm from "../components/cases/CaseForm";
import CaseDetails from "../components/cases/CaseDetails";
import FolderSidebar from "../components/cases/FolderSidebar";
import CaseCard from "../components/cases/CaseCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Cases() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showFolderSidebar, setShowFolderSidebar] = useState(true);
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: () => base44.entities.Folder.list('order'),
  });

  const createCaseMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowForm(false);
      setEditingCase(null);
    },
  });

  const updateCaseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Case.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowForm(false);
      setEditingCase(null);
      setSelectedCase(null);
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: (data) => base44.entities.Folder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Folder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id) => base44.entities.Folder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setSelectedFolder(null);
    },
  });

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = 
      caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFolder = selectedFolder === null || caseItem.folder_id === selectedFolder;

    return matchesSearch && matchesFolder;
  });

  const handleSubmit = (data) => {
    // Add folder_id if a folder is selected
    const dataWithFolder = selectedFolder ? { ...data, folder_id: selectedFolder } : data;
    
    if (editingCase) {
      updateCaseMutation.mutate({ id: editingCase.id, data: dataWithFolder });
    } else {
      createCaseMutation.mutate(dataWithFolder);
    }
  };

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem);
    setShowForm(true);
    setSelectedCase(null);
  };

  const handleMoveToFolder = (caseItem, folderId) => {
    updateCaseMutation.mutate({
      id: caseItem.id,
      data: { ...caseItem, folder_id: folderId }
    });
  };

  const stats = {
    total: cases.length,
    active: cases.filter(c => c.status === 'in_progress').length,
    new: cases.filter(c => c.status === 'new').length,
    urgent: cases.filter(c => c.priority === 'urgent').length,
  };

  const selectedFolderData = folders.find(f => f.id === selectedFolder);

  return (
    <div className="h-full flex">
      {/* Folder Sidebar */}
      {showFolderSidebar && (
        <FolderSidebar
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          onCreateFolder={(data) => createFolderMutation.mutate(data)}
          onUpdateFolder={(id, data) => updateFolderMutation.mutate({ id, data })}
          onDeleteFolder={(id) => {
            if (confirm('Tem certeza que deseja excluir esta pasta? Os processos não serão excluídos.')) {
              deleteFolderMutation.mutate(id);
            }
          }}
          cases={cases}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFolderSidebar(!showFolderSidebar)}
              >
                <FolderIcon className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {selectedFolderData ? selectedFolderData.name : 'Todos os Processos'}
                </h1>
                <p className="text-slate-600 mt-1">
                  {selectedFolderData 
                    ? `${filteredCases.length} processos nesta pasta`
                    : 'Gerencie seus processos jurídicos'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingCase(null);
                setSelectedCase(null);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Processo
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Em Andamento</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{stats.active}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Novos</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{stats.new}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium">Urgentes</p>
              <p className="text-2xl font-bold text-red-900 mt-1">{stats.urgent}</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por título, número do processo ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {showForm ? (
            <CaseForm
              caseData={editingCase}
              clients={clients}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingCase(null);
              }}
              isLoading={createCaseMutation.isPending || updateCaseMutation.isPending}
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))
              ) : filteredCases.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <FolderIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 text-lg">
                    {selectedFolder 
                      ? 'Nenhum processo nesta pasta'
                      : 'Nenhum processo encontrado'}
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    {selectedFolder 
                      ? 'Mova processos para esta pasta ou crie um novo'
                      : 'Crie seu primeiro processo para começar'}
                  </p>
                </div>
              ) : (
                filteredCases.map((caseItem) => (
                  <CaseCard
                    key={caseItem.id}
                    caseData={caseItem}
                    isSelected={selectedCase?.id === caseItem.id}
                    onClick={() => setSelectedCase(caseItem)}
                    folders={folders}
                    onMoveToFolder={(folderId) => handleMoveToFolder(caseItem, folderId)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details Sidebar */}
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
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import CaseCard from "../components/cases/CaseCard";
import CaseForm from "../components/cases/CaseForm";
import CaseDetails from "../components/cases/CaseDetails";
import FolderSidebar from "../components/cases/FolderSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import PlanLimitGuard from "../components/common/PlanLimitGuard";

export default function Cases({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState(null);
  const casesPerPage = 12;
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

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

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      let subs = await base44.entities.Subscription.filter({ user_id: user.id });
      if (subs.length === 0) {
        subs = await base44.entities.Subscription.filter({ user_id: user.email });
      }
      return subs[0] || null;
    },
    enabled: !!user?.id
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
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      if (selectedFolder && typeof selectedFolder === 'string') {
        setSelectedFolder(null);
      }
    },
  });

  const moveCaseToFolderMutation = useMutation({
    mutationFn: ({ caseId, folderId }) => {
      const caseData = cases.find(c => c.id === caseId);
      return base44.entities.Case.update(caseId, { 
        ...caseData, 
        folder_id: folderId || undefined 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
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

  const handleSubmit = (data) => {
    if (editingCase) {
      updateCaseMutation.mutate({ id: editingCase.id, data });
    } else {
      createCaseMutation.mutate(data);
    }
  };

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
      {/* Folder Sidebar */}
      <FolderSidebar
        folders={folders}
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        onCreateFolder={(data) => createFolderMutation.mutate(data)}
        onUpdateFolder={(id, data) => updateFolderMutation.mutate({ id, data })}
        onDeleteFolder={(id) => deleteFolderMutation.mutate(id)}
        caseCounts={caseCounts}
      />

      {/* Main Content */}
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
                {selectedFolder && ' nesta pasta'}
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
            <PlanLimitGuard
              subscription={subscription}
              currentCount={cases.length}
              limitCount={3}
              entityName="processos"
            >
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
            </PlanLimitGuard>
          ) : isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32 rounded-xl bg-neutral-800" />
              ))}
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border border-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-neutral-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhum processo encontrado
              </h3>
              <p className="text-neutral-500">
                {searchTerm 
                  ? 'Tente ajustar os filtros de busca'
                  : selectedFolder === 'unfiled'
                  ? 'Não há processos sem pasta'
                  : 'Crie um novo processo para começar'}
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
                  <p className="text-sm text-neutral-500">
                    Mostrando {startIndex + 1}-{Math.min(startIndex + casesPerPage, filteredCases.length)} de {filteredCases.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border-neutral-800 text-white hover:bg-neutral-800"
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 ${currentPage === pageNum ? 'bg-white text-black' : 'border-neutral-800 text-white hover:bg-neutral-800'}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="border-neutral-800 text-white hover:bg-neutral-800"
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
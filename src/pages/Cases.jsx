import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import CaseList from "../components/cases/CaseList";
import CaseForm from "../components/cases/CaseForm";
import CaseDetails from "../components/cases/CaseDetails";

export default function Cases() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [filterArea, setFilterArea] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowForm(false);
      setEditingCase(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Case.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowForm(false);
      setEditingCase(null);
      setSelectedCase(null);
    },
  });

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = 
      caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = filterArea === "all" || caseItem.area === filterArea;
    const matchesStatus = filterStatus === "all" || caseItem.status === filterStatus;

    return matchesSearch && matchesArea && matchesStatus;
  });

  const handleSubmit = (data) => {
    if (editingCase) {
      updateMutation.mutate({ id: editingCase.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem);
    setShowForm(true);
    setSelectedCase(null);
  };

  const stats = {
    total: cases.length,
    active: cases.filter(c => c.status === 'in_progress').length,
    new: cases.filter(c => c.status === 'new').length,
    urgent: cases.filter(c => c.priority === 'urgent').length,
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Processos</h1>
              <p className="text-slate-600 mt-1">Gerencie seus processos jurídicos</p>
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
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          ) : (
            <CaseList
              cases={filteredCases}
              isLoading={isLoading}
              onSelectCase={setSelectedCase}
              selectedCase={selectedCase}
            />
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
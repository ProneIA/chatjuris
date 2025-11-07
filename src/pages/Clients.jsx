import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2, User as UserIcon } from "lucide-react";
import ClientList from "../components/clients/ClientList";
import ClientForm from "../components/clients/ClientForm";
import ClientDetails from "../components/clients/ClientDetails";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowForm(false);
      setEditingClient(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowForm(false);
      setEditingClient(null);
      setSelectedClient(null);
    },
  });

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf_cnpj?.includes(searchTerm)
  );

  const handleSubmit = (data) => {
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setShowForm(true);
    setSelectedClient(null);
  };

  const activeClients = clients.filter(c => c.status === 'active').length;
  const individualClients = clients.filter(c => c.type === 'individual').length;
  const companyClients = clients.filter(c => c.type === 'company').length;

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
              <p className="text-slate-600 mt-1">Gerencie seus clientes</p>
            </div>
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingClient(null);
                setSelectedClient(null);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Total Ativos</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{activeClients}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <UserIcon className="w-4 h-4" />
                <p className="text-sm font-medium">Pessoas Físicas</p>
              </div>
              <p className="text-2xl font-bold text-purple-900">{individualClients}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Building2 className="w-4 h-4" />
                <p className="text-sm font-medium">Pessoas Jurídicas</p>
              </div>
              <p className="text-2xl font-bold text-green-900">{companyClients}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome, email ou CPF/CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {showForm ? (
            <ClientForm
              client={editingClient}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingClient(null);
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          ) : (
            <ClientList
              clients={filteredClients}
              isLoading={isLoading}
              onSelectClient={setSelectedClient}
              selectedClient={selectedClient}
            />
          )}
        </div>
      </div>

      {/* Details Sidebar */}
      {selectedClient && !showForm && (
        <ClientDetails
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
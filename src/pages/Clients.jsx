import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2, User as UserIcon } from "lucide-react";
import ClientList from "../components/clients/ClientList";
import ClientForm from "../components/clients/ClientForm";
import ClientDetails from "../components/clients/ClientDetails";
import PlanLimitGuard from "../components/common/PlanLimitGuard";

export default function Clients({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
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
    <div className={`h-full flex ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={`border-b px-6 py-6 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>Clientes</h1>
              <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Gerencie seus clientes</p>
            </div>
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingClient(null);
                setSelectedClient(null);
              }}
              className={isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`border rounded-lg p-4 ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200 bg-white'}`}>
              <p className={`text-sm mb-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Total Ativos</p>
              <p className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeClients}</p>
            </div>
            <div className={`border rounded-lg p-4 ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200 bg-white'}`}>
              <div className={`flex items-center gap-2 mb-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                <UserIcon className="w-4 h-4" />
                <p className="text-sm">Pessoas Físicas</p>
              </div>
              <p className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>{individualClients}</p>
            </div>
            <div className={`border rounded-lg p-4 ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200 bg-white'}`}>
              <div className={`flex items-center gap-2 mb-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                <Building2 className="w-4 h-4" />
                <p className="text-sm">Pessoas Jurídicas</p>
              </div>
              <p className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>{companyClients}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
            <Input
              placeholder="Buscar por nome, email ou CPF/CNPJ..."
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
              currentCount={clients.length}
              limitCount={3}
              entityName="clientes"
            >
              <ClientForm
                client={editingClient}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingClient(null);
                }}
                isLoading={createMutation.isPending || updateMutation.isPending}
              />
            </PlanLimitGuard>
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
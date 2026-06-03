import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Building2, User as UserIcon } from "lucide-react";
import ClientList from "../components/clients/ClientList";
import ClientForm from "../components/clients/ClientForm";
import ClientDetails from "../components/clients/ClientDetails";
import { useDebounce } from "@/components/common/useDebounce";
import { AppPage, PageHeader, StatCard, KPIGrid, SearchBar, AppContent, AppButton } from "@/components/ds";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", user?.email],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clients"] }); setShowForm(false); setEditingClient(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clients"] }); setShowForm(false); setEditingClient(null); setSelectedClient(null); },
  });

  const filtered = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.cpf_cnpj?.includes(debouncedSearch)
  );

  const handleSubmit = (data) => {
    if (editingClient) updateMutation.mutate({ id: editingClient.id, data });
    else createMutation.mutate(data);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setShowForm(true);
    setSelectedClient(null);
  };

  const activeClients     = clients.filter((c) => c.status === "active").length;
  const individualClients = clients.filter((c) => c.type === "individual").length;
  const companyClients    = clients.filter((c) => c.type === "company").length;

  return (
    <AppPage>
      <PageHeader
        title="Clientes"
        subtitle="Gerencie seus clientes"
        icon={Users}
        actions={
          <AppButton variant="primary" icon={Plus} onClick={() => { setShowForm(true); setEditingClient(null); setSelectedClient(null); }}>
            Novo Cliente
          </AppButton>
        }
      />

      {/* KPI */}
      <KPIGrid cols={3}>
        <StatCard icon={Users}    label="Ativos"          value={activeClients}     sub="clientes ativos"    color="var(--success)" loading={isLoading} />
        <StatCard icon={UserIcon} label="Pessoas Físicas" value={individualClients} sub="pessoa física"      color="var(--accent)"  loading={isLoading} />
        <StatCard icon={Building2}label="Jurídicas"       value={companyClients}    sub="pessoa jurídica"    color="var(--warning)" loading={isLoading} />
      </KPIGrid>

      <AppContent style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <SearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, email ou CPF/CNPJ..."
        />

        <div style={{ display: "flex", gap: 20, flex: 1 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {showForm ? (
              <ClientForm
                client={editingClient}
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditingClient(null); }}
                isLoading={createMutation.isPending || updateMutation.isPending}
              />
            ) : (
              <ClientList
                clients={filtered}
                isLoading={isLoading}
                onSelectClient={setSelectedClient}
                selectedClient={selectedClient}
              />
            )}
          </div>

          {selectedClient && !showForm && (
            <ClientDetails
              client={selectedClient}
              onClose={() => setSelectedClient(null)}
              onEdit={handleEdit}
              theme="light"
            />
          )}
        </div>
      </AppContent>
    </AppPage>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Building2, User as UserIcon } from "lucide-react";
import ClientList from "../components/clients/ClientList";
import ClientForm from "../components/clients/ClientForm";
import ClientDetails from "../components/clients/ClientDetails";
import { useDebounce } from "@/components/common/useDebounce";

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
    queryKey: ['clients', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Client.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email
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
    client.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    client.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    client.cpf_cnpj?.includes(debouncedSearch)
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

  const S = {
    bg: "var(--surface)",
    card: "var(--main-bg)",
    border: "var(--border)",
    textPrimary: "var(--text-primary)",
    textSecondary: "var(--text-secondary)",
    accent: "var(--ink)",
    accentHover: "#333333",
    radius: "var(--radius-sm)",
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: S.bg }}>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Header */}
          <div style={{ borderBottom: `1px solid ${S.border}`, padding: "20px 24px", background: S.bg }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: S.textPrimary, margin: 0 }}>Clientes</h1>
                <p style={{ fontSize: "0.875rem", color: S.textSecondary, marginTop: 4 }}>Gerencie seus clientes</p>
              </div>
              <button
                onClick={() => { setShowForm(true); setEditingClient(null); setSelectedClient(null); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: S.accent, color: "#fff", border: "none",
                  borderRadius: S.radius, padding: "9px 16px",
                  fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
                  transition: "background 0.15s", flexShrink: 0,
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={e => e.currentTarget.style.background = S.accentHover}
                onMouseLeave={e => e.currentTarget.style.background = S.accent}
              >
                <Plus style={{ width: 16, height: 16 }} />
                <span>Novo Cliente</span>
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Ativos", value: activeClients, icon: null },
                { label: "Físicas", value: individualClients, icon: UserIcon },
                { label: "Jurídicas", value: companyClients, icon: Building2 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} style={{
                  background: S.card, border: `1px solid ${S.border}`,
                  borderRadius: S.radius, padding: "12px 16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    {Icon && <Icon style={{ width: 14, height: 14, color: S.textSecondary, flexShrink: 0 }} />}
                    <p style={{ fontSize: "0.75rem", fontWeight: 500, color: S.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{label}</p>
                  </div>
                  <p style={{ fontSize: "2rem", fontWeight: 700, color: S.textPrimary, margin: 0, lineHeight: 1 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginTop: 16 }}>
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: S.textSecondary }} />
              <input
                placeholder="Buscar por nome, email ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px 9px 38px",
                  background: S.card, border: `1px solid ${S.border}`,
                  borderRadius: S.radius, fontSize: "0.875rem",
                  color: S.textPrimary, outline: "none", boxSizing: "border-box",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px 24px" }}>
            {showForm ? (
              <ClientForm
                client={editingClient}
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditingClient(null); }}
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
            theme="light"
          />
        )}
      </div>
    </div>
  );
}
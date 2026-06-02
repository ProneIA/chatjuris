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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--surface)", fontFamily: "var(--font-sans)" }}>

      {/* ── Cabeçalho editorial ── */}
      <div style={{ background: "var(--white)", borderBottom: "1px solid var(--ink-6)", padding: "28px 32px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 400, marginBottom: 4, letterSpacing: "0.02em" }}>Escritório</p>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, fontSize: 28, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
              Clientes
            </h1>
            <p style={{ marginTop: 6, fontSize: 11, color: "var(--ink-4)" }}>Gerencie sua carteira de clientes</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingClient(null); setSelectedClient(null); }}
            className="btn-primary"
          >
            <Plus style={{ width: 14, height: 14 }} />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", background: "var(--ink-6)", gap: 1, borderBottom: "1px solid var(--ink-6)" }}>
        {[
          { label: "Ativos", value: activeClients, accentColor: "var(--ok)" },
          { label: "Pessoas Físicas", value: individualClients, accentColor: "var(--ink)" },
          { label: "Pessoas Jurídicas", value: companyClients, accentColor: "var(--warn)" },
        ].map(({ label, value, accentColor }) => (
          <div key={label} style={{ background: "var(--white)", padding: "20px 22px 18px", borderBottom: `2px solid ${accentColor}` }}>
            <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-4)", margin: "0 0 12px" }}>{label}</p>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 600, lineHeight: 1, color: "var(--ink)", letterSpacing: "-0.04em" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div style={{ background: "var(--white)", borderBottom: "1px solid var(--ink-6)", padding: "12px 28px" }}>
        <div style={{ position: "relative", maxWidth: 480 }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--ink-4)" }} />
          <input
            placeholder="Buscar por nome, email ou CPF/CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: "1px solid var(--ink-5)", background: "var(--white)", fontSize: 12, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }}
          />
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 28px 24px" }}>
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
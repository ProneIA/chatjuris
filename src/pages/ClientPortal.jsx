import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Plus,
  Search,
  Mail,
  Eye,
  Copy,
  ExternalLink,
  MessageSquare,
  FileText,
  Bell,
  Settings,
  MoreVertical,
  Send,
  Paperclip,
  Check,
  X,
  RefreshCw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const S = {
  bg: "#f5f5f4", card: "#ffffff", border: "#e7e5e4",
  textPrimary: "#1c1917", textSecondary: "#78716c",
  accent: "#1a1a1a", accentHover: "#333333", radius: 6,
};

export default function ClientPortal({ theme = 'light' }) {
  const isDark = false;
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    title: "",
    content: "",
    update_type: "general",
    case_id: ""
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: portals = [] } = useQuery({
    queryKey: ['client-portals'],
    queryFn: () => base44.entities.ClientPortalAccess.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['client-messages', selectedPortal?.id],
    queryFn: () => base44.entities.ClientMessage.filter({ client_portal_id: selectedPortal.id }, 'created_date'),
    enabled: !!selectedPortal,
  });

  const { data: updates = [] } = useQuery({
    queryKey: ['case-updates', selectedPortal?.case_ids],
    queryFn: async () => {
      if (!selectedPortal?.case_ids?.length) return [];
      const allUpdates = [];
      for (const caseId of selectedPortal.case_ids) {
        const caseUpdates = await base44.entities.CaseUpdate.filter({ case_id: caseId, is_visible_to_client: true });
        allUpdates.push(...caseUpdates);
      }
      return allUpdates.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!selectedPortal?.case_ids?.length,
  });

  const createPortalMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientPortalAccess.create({
      ...data,
      access_token: crypto.randomUUID(),
      permissions: {
        view_documents: true,
        view_updates: true,
        send_messages: true,
        upload_documents: false
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portals'] });
      setShowCreateDialog(false);
      toast.success("Portal criado com sucesso!");
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content) => base44.entities.ClientMessage.create({
      case_id: selectedPortal.case_ids[0],
      client_portal_id: selectedPortal.id,
      sender_type: "lawyer",
      sender_name: user?.full_name,
      sender_email: user?.email,
      content,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-messages'] });
      setNewMessage("");
    },
  });

  const togglePortalMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.ClientPortalAccess.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-portals'] }),
  });

  const createUpdateMutation = useMutation({
    mutationFn: (data) => base44.entities.CaseUpdate.create({
      ...data,
      author_name: user?.full_name,
      author_email: user?.email,
      is_visible_to_client: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-updates'] });
      setShowUpdateDialog(false);
      setUpdateForm({ title: "", content: "", update_type: "general", case_id: "" });
      toast.success("Atualização criada com sucesso!");
    },
  });

  const filteredPortals = portals.filter(p =>
    p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.client_email?.toLowerCase().includes(search.toLowerCase())
  );

  const copyPortalLink = (portal) => {
    const link = `${window.location.origin}/ClientAccess?token=${portal.access_token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  return (
    <div style={{ minHeight: "100vh", padding: 24, background: S.bg, fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: S.textPrimary, margin: 0 }}>Portal do Cliente</h1>
            <p style={{ fontSize: "0.875rem", color: S.textSecondary, marginTop: 4 }}>Gerencie o acesso dos seus clientes aos casos</p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: S.accent, color: "#fff", border: "none",
              borderRadius: S.radius, padding: "9px 16px",
              fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
              transition: "background 0.15s", fontFamily: "var(--font-sans)",
            }}
            onMouseEnter={e => e.currentTarget.style.background = S.accentHover}
            onMouseLeave={e => e.currentTarget.style.background = S.accent}
          >
            <Plus style={{ width: 16, height: 16 }} />
            Criar Acesso
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Portais Ativos", value: portals.filter(p => p.is_active).length, icon: Users },
            { label: "Mensagens", value: messages.length, icon: MessageSquare },
            { label: "Atualizações", value: updates.length, icon: Bell },
            { label: "Clientes", value: clients.length, icon: Users },
          ].map((stat, i) => (
            <div key={i} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: S.radius, padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 500, color: S.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>{stat.label}</p>
              <p style={{ fontSize: "2rem", fontWeight: 700, color: S.textPrimary, margin: 0, lineHeight: 1 }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }} className="lg:grid-cols-3-auto">
          {/* Portal List */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: S.radius, overflow: "hidden" }}>
            <div style={{ padding: 16, borderBottom: `1px solid ${S.border}` }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div style={{ maxHeight: 600, overflowY: "auto" }}>
              {filteredPortals.map((portal) => (
                <div
                  key={portal.id}
                  onClick={() => setSelectedPortal(portal)}
                  style={{
                    padding: 16, cursor: "pointer",
                    borderBottom: `1px solid ${S.border}`,
                    background: selectedPortal?.id === portal.id ? S.bg : S.card,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (selectedPortal?.id !== portal.id) e.currentTarget.style.background = S.bg; }}
                  onMouseLeave={e => { if (selectedPortal?.id !== portal.id) e.currentTarget.style.background = S.card; }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 500, color: S.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "0 0 2px", fontSize: "0.875rem" }}>
                        {portal.client_name}
                      </p>
                      <p style={{ fontSize: "0.8rem", color: S.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                        {portal.client_email}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={portal.is_active ? "default" : "secondary"} className="text-xs">
                          {portal.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                          {portal.case_ids?.length || 0} caso(s)
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => copyPortalLink(portal)}>
                          <Copy className="w-4 h-4 mr-2" /> Copiar Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePortalMutation.mutate({ id: portal.id, is_active: !portal.is_active })}>
                          {portal.is_active ? <X className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                          {portal.is_active ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {filteredPortals.length === 0 && (
                <div style={{ padding: 32, textAlign: "center" }}>
                  <Users style={{ width: 40, height: 40, margin: "0 auto 12px", color: S.border }} />
                  <p style={{ fontSize: "0.875rem", color: S.textSecondary }}>Nenhum portal encontrado</p>
                </div>
              )}
            </div>
          </div>

          {/* Portal Details */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: S.radius, overflow: "hidden" }}>
            {selectedPortal ? (
              <Tabs defaultValue="messages" className="h-full">
                <div style={{ padding: 16, borderBottom: `1px solid ${S.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <h2 style={{ fontWeight: 600, color: S.textPrimary, margin: "0 0 2px", fontSize: "0.95rem" }}>
                        {selectedPortal.client_name}
                      </h2>
                      <p style={{ fontSize: "0.8rem", color: S.textSecondary, margin: 0 }}>
                        {selectedPortal.client_email}
                      </p>
                    </div>
                    <button
                      onClick={() => copyPortalLink(selectedPortal)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "transparent", border: `1px solid ${S.border}`,
                        borderRadius: S.radius, padding: "7px 12px",
                        fontSize: "0.8rem", color: S.textPrimary, cursor: "pointer",
                        transition: "border-color 0.15s", fontFamily: "var(--font-sans)",
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = S.accent}
                      onMouseLeave={e => e.currentTarget.style.borderColor = S.border}
                    >
                      <ExternalLink style={{ width: 14, height: 14 }} />
                      Copiar Link
                    </button>
                  </div>
                  <TabsList>
                    <TabsTrigger value="messages">Mensagens</TabsTrigger>
                    <TabsTrigger value="updates">Atualizações</TabsTrigger>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="messages" className="p-0 h-[450px] flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'lawyer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender_type === 'lawyer'
                            ? 'bg-blue-600 text-white'
                            : isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.sender_type === 'lawyer' ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(msg.created_date).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="h-full flex items-center justify-center">
                        <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                          Nenhuma mensagem ainda
                        </p>
                      </div>
                    )}
                  </div>
                  <div className={`p-4 border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && newMessage.trim() && sendMessageMutation.mutate(newMessage)}
                      />
                      <Button
                        onClick={() => newMessage.trim() && sendMessageMutation.mutate(newMessage)}
                        disabled={!newMessage.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="updates" className="p-4 max-h-[500px] overflow-y-auto">
                  <div className="flex justify-end mb-4">
                    <Button onClick={() => setShowUpdateDialog(true)} size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Nova Atualização
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {updates.map((update) => (
                      <div key={update.id} className={`p-4 rounded-lg border ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: S.radius,
                            background: S.bg, border: `1px solid ${S.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <Bell style={{ width: 14, height: 14, color: S.textSecondary }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: 500, color: S.textPrimary, margin: "0 0 4px", fontSize: "0.875rem" }}>{update.title}</h4>
                            <p style={{ fontSize: "0.8rem", color: S.textSecondary, margin: "0 0 6px", lineHeight: 1.5 }}>{update.content}</p>
                            <p style={{ fontSize: "0.75rem", color: S.textSecondary, margin: 0 }}>
                              {new Date(update.created_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {updates.length === 0 && (
                      <p className={`text-center py-8 text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        Nenhuma atualização visível ao cliente
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="p-4">
                  <div className="space-y-4">
                    <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Permissões</h3>
                    {Object.entries(selectedPortal.permissions || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                          {key === 'view_documents' && 'Visualizar documentos'}
                          {key === 'view_updates' && 'Visualizar atualizações'}
                          {key === 'send_messages' && 'Enviar mensagens'}
                          {key === 'upload_documents' && 'Enviar documentos'}
                        </span>
                        <Badge variant={value ? "default" : "secondary"}>
                          {value ? "Permitido" : "Bloqueado"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div style={{ height: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <Users style={{ width: 48, height: 48, margin: "0 auto 12px", color: S.border }} />
                  <p style={{ color: S.textSecondary, fontSize: "0.875rem" }}>Selecione um portal para ver detalhes</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Portal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Acesso ao Portal</DialogTitle>
          </DialogHeader>
          <CreatePortalForm
            clients={clients}
            cases={cases}
            onSubmit={(data) => createPortalMutation.mutate(data)}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Create Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Atualização</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Caso</label>
              <select
                value={updateForm.case_id}
                onChange={(e) => setUpdateForm({ ...updateForm, case_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              >
                <option value="">Selecione um caso</option>
                {(selectedPortal?.case_ids || []).map(caseId => {
                  const caseData = cases.find(c => c.id === caseId);
                  return caseData ? (
                    <option key={caseId} value={caseId}>{caseData.title}</option>
                  ) : null;
                })}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Tipo</label>
              <select
                value={updateForm.update_type}
                onChange={(e) => setUpdateForm({ ...updateForm, update_type: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              >
                <option value="general">Geral</option>
                <option value="status_change">Mudança de Status</option>
                <option value="document_added">Documento Adicionado</option>
                <option value="hearing_scheduled">Audiência Agendada</option>
                <option value="deadline">Prazo Importante</option>
                <option value="milestone">Marco Importante</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={updateForm.title}
                onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                placeholder="Ex: Processo avançou para fase de instrução"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={updateForm.content}
                onChange={(e) => setUpdateForm({ ...updateForm, content: e.target.value })}
                placeholder="Descreva a atualização..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createUpdateMutation.mutate(updateForm)}
                disabled={!updateForm.case_id || !updateForm.title || !updateForm.content || createUpdateMutation.isPending}
              >
                Criar Atualização
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreatePortalForm({ clients, cases, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    client_id: "",
    client_email: "",
    client_name: "",
    case_ids: []
  });

  const selectedClient = clients.find(c => c.id === formData.client_id);

  useEffect(() => {
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        client_email: selectedClient.email,
        client_name: selectedClient.name
      }));
    }
  }, [selectedClient]);

  const clientCases = cases.filter(c => c.client_id === formData.client_id);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Cliente</label>
        <select
          value={formData.client_id}
          onChange={(e) => setFormData({ ...formData, client_id: e.target.value, case_ids: [] })}
          className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
        >
          <option value="">Selecione um cliente</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </div>

      {formData.client_id && (
        <>
          <div>
            <label className="text-sm font-medium">Email de acesso</label>
            <Input
              value={formData.client_email}
              onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
              placeholder="email@cliente.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Casos com acesso</label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {clientCases.map(c => (
                <label key={c.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.case_ids.includes(c.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, case_ids: [...formData.case_ids, c.id] });
                      } else {
                        setFormData({ ...formData, case_ids: formData.case_ids.filter(id => id !== c.id) });
                      }
                    }}
                  />
                  <span className="text-sm">{c.title}</span>
                </label>
              ))}
              {clientCases.length === 0 && (
                <p className="text-sm text-gray-500">Nenhum caso encontrado para este cliente</p>
              )}
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button
          onClick={() => onSubmit(formData)}
          disabled={!formData.client_id || !formData.client_email || formData.case_ids.length === 0}
        >
          Criar Portal
        </Button>
      </div>
    </div>
  );
}
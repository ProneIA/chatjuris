import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, Plus, Search, Mail, Eye, Copy, ExternalLink,
  MessageSquare, FileText, Bell, Settings, MoreVertical,
  Send, Check, X, RefreshCw
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AppPage, PageHeader, KPIGrid, StatCard, AppCard, AppContent,
  AppBadge, EmptyState, AppButton
} from "@/components/ds";

export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateForm, setUpdateForm] = useState({ title: "", content: "", update_type: "general", case_id: "" });
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

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
      const all = [];
      for (const caseId of selectedPortal.case_ids) {
        const u = await base44.entities.CaseUpdate.filter({ case_id: caseId, is_visible_to_client: true });
        all.push(...u);
      }
      return all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!selectedPortal?.case_ids?.length,
  });

  const createPortalMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientPortalAccess.create({
      ...data,
      access_token: crypto.randomUUID(),
      permissions: { view_documents: true, view_updates: true, send_messages: true, upload_documents: false }
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['client-portals'] }); setShowCreateDialog(false); toast.success("Portal criado!"); },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content) => base44.entities.ClientMessage.create({
      case_id: selectedPortal.case_ids[0], client_portal_id: selectedPortal.id,
      sender_type: "lawyer", sender_name: user?.full_name, sender_email: user?.email, content,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['client-messages'] }); setNewMessage(""); },
  });

  const togglePortalMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.ClientPortalAccess.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-portals'] }),
  });

  const createUpdateMutation = useMutation({
    mutationFn: (data) => base44.entities.CaseUpdate.create({
      ...data, author_name: user?.full_name, author_email: user?.email, is_visible_to_client: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-updates'] });
      setShowUpdateDialog(false);
      setUpdateForm({ title: "", content: "", update_type: "general", case_id: "" });
      toast.success("Atualização criada!");
    },
  });

  const filteredPortals = portals.filter(p =>
    p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.client_email?.toLowerCase().includes(search.toLowerCase())
  );

  const copyPortalLink = (portal) => {
    navigator.clipboard.writeText(`${window.location.origin}/ClientAccess?token=${portal.access_token}`);
    toast.success("Link copiado!");
  };

  return (
    <AppPage>
      <PageHeader
        title="Portal do Cliente"
        subtitle="Gerencie o acesso dos seus clientes aos casos"
        icon={Users}
        actions={
          <AppButton variant="primary" icon={Plus} onClick={() => setShowCreateDialog(true)}>
            Criar Acesso
          </AppButton>
        }
      />

      <KPIGrid cols={4}>
        <StatCard icon={Users}        label="Portais Ativos"  value={portals.filter(p => p.is_active).length} sub="ativos"    color="var(--accent)"  />
        <StatCard icon={MessageSquare} label="Mensagens"      value={messages.length}                          sub="recebidas" color="var(--success)" />
        <StatCard icon={Bell}          label="Atualizações"   value={updates.length}                           sub="enviadas"  color="var(--warning)" />
        <StatCard icon={Users}         label="Clientes"       value={clients.length}                           sub="cadastrados" color="var(--info)"  />
      </KPIGrid>

      <AppContent>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
          {/* Lista */}
          <AppCard noPad>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--text-3)" }} />
                <input
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg)", color: "var(--text-1)", outline: "none" }}
                />
              </div>
            </div>
            <div style={{ maxHeight: 560, overflowY: "auto" }}>
              {filteredPortals.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center" }}>
                  <Users style={{ width: 36, height: 36, margin: "0 auto 10px", color: "var(--border)" }} />
                  <p style={{ fontSize: 13, color: "var(--text-2)" }}>Nenhum portal encontrado</p>
                </div>
              ) : filteredPortals.map((portal) => (
                <div
                  key={portal.id}
                  onClick={() => setSelectedPortal(portal)}
                  style={{
                    padding: "14px 16px", cursor: "pointer",
                    borderBottom: "1px solid var(--border)",
                    background: selectedPortal?.id === portal.id ? "var(--bg)" : "var(--card)",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { if (selectedPortal?.id !== portal.id) e.currentTarget.style.background = "var(--bg)"; }}
                  onMouseLeave={e => { if (selectedPortal?.id !== portal.id) e.currentTarget.style.background = "var(--card)"; }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 500, color: "var(--text-1)", fontSize: 13, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {portal.client_name}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-2)", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {portal.client_email}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <AppBadge variant={portal.is_active ? "success" : "neutral"}>
                          {portal.is_active ? "Ativo" : "Inativo"}
                        </AppBadge>
                        <span style={{ fontSize: 11, color: "var(--text-3)" }}>{portal.case_ids?.length || 0} caso(s)</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-3)", minHeight: "unset" }}>
                          <MoreVertical style={{ width: 15, height: 15 }} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => copyPortalLink(portal)}>
                          <Copy style={{ width: 14, height: 14, marginRight: 8 }} /> Copiar Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePortalMutation.mutate({ id: portal.id, is_active: !portal.is_active })}>
                          {portal.is_active ? <X style={{ width: 14, height: 14, marginRight: 8 }} /> : <Check style={{ width: 14, height: 14, marginRight: 8 }} />}
                          {portal.is_active ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </AppCard>

          {/* Detalhes */}
          <AppCard noPad>
            {selectedPortal ? (
              <Tabs defaultValue="messages" className="h-full">
                <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <p style={{ fontWeight: 600, color: "var(--text-1)", fontSize: 14, margin: 0 }}>{selectedPortal.client_name}</p>
                      <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>{selectedPortal.client_email}</p>
                    </div>
                    <button
                      onClick={() => copyPortalLink(selectedPortal)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "6px 12px", fontSize: 12, color: "var(--text-1)", cursor: "pointer", minHeight: "unset" }}
                    >
                      <ExternalLink style={{ width: 12, height: 12 }} /> Copiar Link
                    </button>
                  </div>
                  <TabsList>
                    <TabsTrigger value="messages">Mensagens</TabsTrigger>
                    <TabsTrigger value="updates">Atualizações</TabsTrigger>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="messages" style={{ display: "flex", flexDirection: "column", height: 440, margin: 0 }}>
                  <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                    {messages.map((msg) => (
                      <div key={msg.id} style={{ display: "flex", justifyContent: msg.sender_type === 'lawyer' ? "flex-end" : "flex-start" }}>
                        <div style={{ maxWidth: "70%", borderRadius: 10, padding: "10px 14px", background: msg.sender_type === 'lawyer' ? "var(--accent)" : "var(--bg)", color: msg.sender_type === 'lawyer' ? "#fff" : "var(--text-1)" }}>
                          <p style={{ fontSize: 13, margin: 0 }}>{msg.content}</p>
                          <p style={{ fontSize: 10, marginTop: 4, opacity: 0.7, margin: 0 }}>{new Date(msg.created_date).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <p style={{ fontSize: 13, color: "var(--text-2)" }}>Nenhuma mensagem ainda</p>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
                    <input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && newMessage.trim() && sendMessageMutation.mutate(newMessage)}
                      style={{ flex: 1, padding: "8px 12px", fontSize: 13, border: "1px solid var(--border)", borderRadius: "var(--r-md)", outline: "none", background: "var(--bg)", color: "var(--text-1)" }}
                    />
                    <AppButton variant="primary" onClick={() => newMessage.trim() && sendMessageMutation.mutate(newMessage)} disabled={!newMessage.trim()}>
                      <Send style={{ width: 14, height: 14 }} />
                    </AppButton>
                  </div>
                </TabsContent>

                <TabsContent value="updates" style={{ padding: 16, margin: 0, maxHeight: 480, overflowY: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                    <AppButton variant="primary" icon={Plus} onClick={() => setShowUpdateDialog(true)}>
                      Nova Atualização
                    </AppButton>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {updates.map((u) => (
                      <div key={u.id} style={{ padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg)" }}>
                        <p style={{ fontWeight: 500, color: "var(--text-1)", fontSize: 13, margin: "0 0 4px" }}>{u.title}</p>
                        <p style={{ fontSize: 12, color: "var(--text-2)", margin: "0 0 6px", lineHeight: 1.5 }}>{u.content}</p>
                        <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>{new Date(u.created_date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    ))}
                    {updates.length === 0 && <p style={{ textAlign: "center", padding: 32, fontSize: 13, color: "var(--text-2)" }}>Nenhuma atualização visível ao cliente</p>}
                  </div>
                </TabsContent>

                <TabsContent value="settings" style={{ padding: 16, margin: 0 }}>
                  <p style={{ fontWeight: 500, color: "var(--text-1)", fontSize: 14, marginBottom: 12 }}>Permissões</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {Object.entries(selectedPortal.permissions || {}).map(([key, value]) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: "var(--text-1)" }}>
                          {key === 'view_documents' && 'Visualizar documentos'}
                          {key === 'view_updates' && 'Visualizar atualizações'}
                          {key === 'send_messages' && 'Enviar mensagens'}
                          {key === 'upload_documents' && 'Enviar documentos'}
                        </span>
                        <AppBadge variant={value ? "success" : "neutral"}>{value ? "Permitido" : "Bloqueado"}</AppBadge>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div style={{ height: 480, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                <Users style={{ width: 40, height: 40, color: "var(--border)" }} />
                <p style={{ fontSize: 13, color: "var(--text-2)" }}>Selecione um portal para ver detalhes</p>
              </div>
            )}
          </AppCard>
        </div>
      </AppContent>

      {/* Dialogs */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar Acesso ao Portal</DialogTitle></DialogHeader>
          <CreatePortalForm clients={clients} cases={cases} onSubmit={(d) => createPortalMutation.mutate(d)} onCancel={() => setShowCreateDialog(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Atualização</DialogTitle></DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)", display: "block", marginBottom: 6 }}>Caso</label>
              <select value={updateForm.case_id} onChange={(e) => setUpdateForm({ ...updateForm, case_id: e.target.value })} style={{ width: "100%" }}>
                <option value="">Selecione um caso</option>
                {(selectedPortal?.case_ids || []).map(caseId => {
                  const c = cases.find(x => x.id === caseId);
                  return c ? <option key={caseId} value={caseId}>{c.title}</option> : null;
                })}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)", display: "block", marginBottom: 6 }}>Título</label>
              <Input value={updateForm.title} onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })} placeholder="Ex: Processo avançou para fase de instrução" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)", display: "block", marginBottom: 6 }}>Descrição</label>
              <Textarea value={updateForm.content} onChange={(e) => setUpdateForm({ ...updateForm, content: e.target.value })} placeholder="Descreva a atualização..." rows={4} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8 }}>
              <AppButton variant="secondary" onClick={() => setShowUpdateDialog(false)}>Cancelar</AppButton>
              <AppButton variant="primary" onClick={() => createUpdateMutation.mutate(updateForm)} disabled={!updateForm.case_id || !updateForm.title || !updateForm.content}>
                Criar Atualização
              </AppButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppPage>
  );
}

function CreatePortalForm({ clients, cases, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({ client_id: "", client_email: "", client_name: "", case_ids: [] });
  const selectedClient = clients.find(c => c.id === formData.client_id);

  useEffect(() => {
    if (selectedClient) setFormData(p => ({ ...p, client_email: selectedClient.email, client_name: selectedClient.name }));
  }, [selectedClient]);

  const clientCases = cases.filter(c => c.client_id === formData.client_id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)", display: "block", marginBottom: 6 }}>Cliente</label>
        <select value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value, case_ids: [] })} style={{ width: "100%" }}>
          <option value="">Selecione um cliente</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {formData.client_id && (
        <>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)", display: "block", marginBottom: 6 }}>Email de acesso</label>
            <Input value={formData.client_email} onChange={(e) => setFormData({ ...formData, client_email: e.target.value })} placeholder="email@cliente.com" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)", display: "block", marginBottom: 6 }}>Casos com acesso</label>
            <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {clientCases.map(c => (
                <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={formData.case_ids.includes(c.id)}
                    onChange={(e) => setFormData({ ...formData, case_ids: e.target.checked ? [...formData.case_ids, c.id] : formData.case_ids.filter(id => id !== c.id) })} />
                  <span style={{ fontSize: 13, color: "var(--text-1)" }}>{c.title}</span>
                </label>
              ))}
              {clientCases.length === 0 && <p style={{ fontSize: 12, color: "var(--text-2)" }}>Nenhum caso encontrado</p>}
            </div>
          </div>
        </>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8 }}>
        <AppButton variant="secondary" onClick={onCancel}>Cancelar</AppButton>
        <AppButton variant="primary" onClick={() => onSubmit(formData)} disabled={!formData.client_id || !formData.client_email || formData.case_ids.length === 0}>
          Criar Portal
        </AppButton>
      </div>
    </div>
  );
}
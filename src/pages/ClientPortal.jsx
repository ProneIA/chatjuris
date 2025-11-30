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

export default function ClientPortal({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [newMessage, setNewMessage] = useState("");
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
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Portal do Cliente
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Gerencie o acesso dos seus clientes aos casos
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Criar Acesso
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Portais Ativos", value: portals.filter(p => p.is_active).length, icon: Users },
            { label: "Mensagens", value: messages.length, icon: MessageSquare },
            { label: "Atualizações", value: updates.length, icon: Bell },
            { label: "Clientes", value: clients.length, icon: Users },
          ].map((stat, i) => (
            <div key={i} className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                  <stat.icon className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Portal List */}
          <div className={`lg:col-span-1 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
            <div className="p-4 border-b border-neutral-800">
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
            <div className="divide-y divide-neutral-800 max-h-[600px] overflow-y-auto">
              {filteredPortals.map((portal) => (
                <div
                  key={portal.id}
                  onClick={() => setSelectedPortal(portal)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedPortal?.id === portal.id
                      ? isDark ? 'bg-neutral-800' : 'bg-gray-100'
                      : isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {portal.client_name}
                      </p>
                      <p className={`text-sm truncate ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
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
                <div className="p-8 text-center">
                  <Users className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Nenhum portal encontrado
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Portal Details */}
          <div className={`lg:col-span-2 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
            {selectedPortal ? (
              <Tabs defaultValue="messages" className="h-full">
                <div className={`p-4 border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedPortal.client_name}
                      </h2>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        {selectedPortal.client_email}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => copyPortalLink(selectedPortal)}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Copiar Link
                    </Button>
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
                  <div className="space-y-4">
                    {updates.map((update) => (
                      <div key={update.id} className={`p-4 rounded-lg border ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            update.update_type === 'milestone' ? 'bg-green-500/20 text-green-500' :
                            update.update_type === 'deadline' ? 'bg-red-500/20 text-red-500' :
                            'bg-blue-500/20 text-blue-500'
                          }`}>
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{update.title}</h4>
                            <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>{update.content}</p>
                            <p className={`text-xs mt-2 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
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
              <div className="h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <Users className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  <p className={`${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Selecione um portal para ver detalhes
                  </p>
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
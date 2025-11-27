import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Send, 
  Plus, 
  Eye,
  Mail,
  Key,
  Copy,
  Check,
  MessageSquare,
  FileText,
  Calendar,
  Search,
  MoreVertical,
  Trash2,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClientPortal({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);
  const [newAccess, setNewAccess] = useState({ client_id: "", cases: [] });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list(),
  });

  const { data: portalAccesses = [] } = useQuery({
    queryKey: ['portal-accesses'],
    queryFn: () => base44.entities.ClientPortalAccess.list(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['client-messages', selectedClient?.client_id],
    queryFn: () => base44.entities.ClientMessage.filter({ client_id: selectedClient?.client_id }, '-created_date'),
    enabled: !!selectedClient,
  });

  const createAccessMutation = useMutation({
    mutationFn: async (data) => {
      const client = clients.find(c => c.id === data.client_id);
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      return base44.entities.ClientPortalAccess.create({
        client_id: data.client_id,
        client_email: client.email,
        client_name: client.name,
        access_token: token,
        allowed_cases: data.cases,
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-accesses'] });
      setShowCreateDialog(false);
      setNewAccess({ client_id: "", cases: [] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-messages'] });
    }
  });

  const deleteAccessMutation = useMutation({
    mutationFn: (id) => base44.entities.ClientPortalAccess.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-accesses'] });
      setSelectedClient(null);
    }
  });

  const [messageInput, setMessageInput] = useState("");

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedClient) return;
    sendMessageMutation.mutate({
      client_id: selectedClient.client_id,
      sender_type: "lawyer",
      sender_name: user?.full_name || "Advogado",
      sender_email: user?.email,
      content: messageInput,
      is_read: false
    });
    setMessageInput("");
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredAccesses = portalAccesses.filter(a => 
    a.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.client_email?.toLowerCase().includes(search.toLowerCase())
  );

  const clientCases = selectedClient ? 
    cases.filter(c => selectedClient.allowed_cases?.includes(c.id)) : [];

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Portal do Cliente
            </h1>
            <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              Gerencie o acesso dos seus clientes
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className={isDark ? 'bg-white text-black hover:bg-gray-100' : ''}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Acesso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Acesso do Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Cliente</label>
                  <select
                    value={newAccess.client_id}
                    onChange={(e) => setNewAccess({ ...newAccess, client_id: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.filter(c => !portalAccesses.find(p => p.client_id === c.id)).map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Casos com Acesso</label>
                  <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                    {cases.filter(c => c.client_id === newAccess.client_id).map(caseItem => (
                      <label key={caseItem.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAccess.cases.includes(caseItem.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewAccess({ ...newAccess, cases: [...newAccess.cases, caseItem.id] });
                            } else {
                              setNewAccess({ ...newAccess, cases: newAccess.cases.filter(id => id !== caseItem.id) });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{caseItem.title}</span>
                      </label>
                    ))}
                    {cases.filter(c => c.client_id === newAccess.client_id).length === 0 && (
                      <p className="text-sm text-gray-500">Selecione um cliente primeiro</p>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={() => createAccessMutation.mutate(newAccess)}
                  disabled={!newAccess.client_id || createAccessMutation.isPending}
                  className="w-full"
                >
                  Criar Acesso
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-blue-100'}`}>
                  <Users className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {portalAccesses.length}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Acessos Ativos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-green-100'}`}>
                  <MessageSquare className={`w-5 h-5 ${isDark ? 'text-white' : 'text-green-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {messages.filter(m => !m.is_read && m.sender_type === 'client').length}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Não Lidas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lista de Acessos */}
          <div className="lg:col-span-1">
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`pl-10 ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredAccesses.map(access => (
                  <div
                    key={access.id}
                    onClick={() => setSelectedClient(access)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedClient?.id === access.id
                        ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                        : isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium text-sm ${
                          selectedClient?.id === access.id 
                            ? isDark ? 'text-black' : 'text-white'
                            : isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {access.client_name}
                        </p>
                        <p className={`text-xs ${
                          selectedClient?.id === access.id
                            ? isDark ? 'text-gray-600' : 'text-gray-300'
                            : isDark ? 'text-neutral-500' : 'text-gray-500'
                        }`}>
                          {access.client_email}
                        </p>
                      </div>
                      <Badge variant={access.is_active ? "default" : "secondary"} className="text-xs">
                        {access.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filteredAccesses.length === 0 && (
                  <p className={`text-center py-8 text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Nenhum acesso encontrado
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detalhes e Chat */}
          <div className="lg:col-span-2">
            {selectedClient ? (
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={isDark ? 'text-white' : ''}>
                        {selectedClient.client_name}
                      </CardTitle>
                      <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        {selectedClient.client_email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToken(selectedClient.access_token)}
                        className={isDark ? 'border-neutral-700' : ''}
                      >
                        {copiedToken === selectedClient.access_token ? (
                          <Check className="w-4 h-4 mr-2" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        Token
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAccessMutation.mutate(selectedClient.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="messages">
                    <TabsList className="mb-4">
                      <TabsTrigger value="messages">Mensagens</TabsTrigger>
                      <TabsTrigger value="cases">Casos ({clientCases.length})</TabsTrigger>
                      <TabsTrigger value="info">Informações</TabsTrigger>
                    </TabsList>

                    <TabsContent value="messages" className="space-y-4">
                      <div className={`h-80 overflow-y-auto rounded-lg p-4 space-y-3 ${
                        isDark ? 'bg-neutral-800' : 'bg-gray-50'
                      }`}>
                        {messages.map(msg => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender_type === 'lawyer' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] p-3 rounded-lg ${
                              msg.sender_type === 'lawyer'
                                ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                : isDark ? 'bg-neutral-700 text-white' : 'bg-white text-gray-900'
                            }`}>
                              <p className="text-sm">{msg.content}</p>
                              <p className={`text-xs mt-1 ${
                                msg.sender_type === 'lawyer'
                                  ? isDark ? 'text-gray-500' : 'text-gray-400'
                                  : isDark ? 'text-neutral-400' : 'text-gray-500'
                              }`}>
                                {format(new Date(msg.created_date), "dd/MM HH:mm")}
                              </p>
                            </div>
                          </div>
                        ))}
                        {messages.length === 0 && (
                          <p className={`text-center py-8 text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                            Nenhuma mensagem ainda
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Digite sua mensagem..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}
                        />
                        <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="cases" className="space-y-3">
                      {clientCases.map(caseItem => (
                        <div
                          key={caseItem.id}
                          className={`p-4 rounded-lg border ${isDark ? 'border-neutral-700 bg-neutral-800' : 'border-gray-200'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {caseItem.title}
                              </p>
                              <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                                {caseItem.case_number || 'Sem número'}
                              </p>
                            </div>
                            <Badge>{caseItem.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="info">
                      <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Key className={`w-5 h-5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                            <div>
                              <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Token de Acesso</p>
                              <p className={`text-sm font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {selectedClient.access_token}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className={`w-5 h-5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                            <div>
                              <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Criado em</p>
                              <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {format(new Date(selectedClient.created_date), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className={`h-full flex items-center justify-center ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}>
                <CardContent className="text-center py-16">
                  <Users className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  <p className={isDark ? 'text-neutral-500' : 'text-gray-500'}>
                    Selecione um cliente para ver detalhes
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
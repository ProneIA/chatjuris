import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Scale,
  MessageSquare,
  FileText,
  Bell,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Loader2,
  Shield,
  Heart
} from "lucide-react";
import { formatLocalDate, formatLocalDateTime } from "@/components/common/DateFormatter";
import { toast } from "sonner";

export default function ClientAccess() {
  const [accessToken, setAccessToken] = useState(null);
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  // Extrair token da URL
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const token = pathParts[pathParts.length - 1];
    if (token && token !== 'ClientAccess') {
      setAccessToken(token);
    } else {
      // Tentar pegar do query param
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get('token');
      if (tokenParam) {
        setAccessToken(tokenParam);
      }
    }
    setLoading(false);
  }, []);

  // Buscar dados do portal
  const { data: portals = [], isLoading: loadingPortal } = useQuery({
    queryKey: ['client-portal-access', accessToken],
    queryFn: () => base44.entities.ClientPortalAccess.filter({ access_token: accessToken }),
    enabled: !!accessToken,
  });

  useEffect(() => {
    if (portals.length > 0) {
      setPortal(portals[0]);
      // Atualizar último acesso
      base44.entities.ClientPortalAccess.update(portals[0].id, {
        last_access: new Date().toISOString()
      });
    }
  }, [portals]);

  // Buscar casos do cliente
  const { data: cases = [] } = useQuery({
    queryKey: ['client-cases', portal?.case_ids],
    queryFn: async () => {
      if (!portal?.case_ids?.length) return [];
      const allCases = [];
      for (const caseId of portal.case_ids) {
        try {
          const caseData = await base44.entities.Case.filter({ id: caseId });
          if (caseData.length > 0) {
            // Normalizar dados
            const c = caseData[0];
            if (c.data && c.data.title) {
              allCases.push({ id: c.id, ...c.data });
            } else if (c.title) {
              allCases.push(c);
            }
          }
        } catch (e) {
          console.error('Erro ao buscar caso:', e);
        }
      }
      return allCases;
    },
    enabled: !!portal?.case_ids?.length,
  });

  // Buscar mensagens
  const { data: messages = [] } = useQuery({
    queryKey: ['client-messages', portal?.id],
    queryFn: () => base44.entities.ClientMessage.filter({ client_portal_id: portal.id }, 'created_date'),
    enabled: !!portal?.id,
  });

  // Buscar atualizações
  const { data: updates = [] } = useQuery({
    queryKey: ['client-updates', portal?.case_ids],
    queryFn: async () => {
      if (!portal?.case_ids?.length) return [];
      const allUpdates = [];
      for (const caseId of portal.case_ids) {
        try {
          const caseUpdates = await base44.entities.CaseUpdate.filter({ 
            case_id: caseId, 
            is_visible_to_client: true 
          });
          allUpdates.push(...caseUpdates);
        } catch (e) {
          console.error('Erro ao buscar atualizações:', e);
        }
      }
      return allUpdates.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!portal?.case_ids?.length,
  });

  // Enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: (content) => base44.entities.ClientMessage.create({
      case_id: portal.case_ids[0],
      client_portal_id: portal.id,
      sender_type: "client",
      sender_name: portal.client_name,
      sender_email: portal.client_email,
      content,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-messages'] });
      setNewMessage("");
      toast.success("Mensagem enviada com sucesso!");
    },
  });



  const statusLabels = {
    new: { label: "Novo", color: "bg-emerald-100 text-emerald-700", icon: Clock },
    in_progress: { label: "Em Andamento", color: "bg-blue-100 text-blue-700", icon: Loader2 },
    waiting: { label: "Aguardando", color: "bg-amber-100 text-amber-700", icon: Clock },
    closed: { label: "Encerrado", color: "bg-gray-100 text-gray-700", icon: CheckCircle2 },
    archived: { label: "Arquivado", color: "bg-gray-100 text-gray-500", icon: FileText },
  };

  // Tela de carregamento
  if (loading || loadingPortal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600">Carregando seu portal...</p>
        </div>
      </div>
    );
  }

  // Tela de acesso inválido
  if (!accessToken || (portals.length === 0 && !loadingPortal)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Acesso Inválido</h2>
            <p className="text-slate-600 mb-6">
              O link de acesso que você está tentando usar não é válido ou expirou. 
              Por favor, entre em contato com seu advogado para obter um novo link.
            </p>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">
                Se você acredita que isso é um erro, verifique se copiou o link completo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Portal inativo
  if (portal && !portal.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Acesso Temporariamente Suspenso</h2>
            <p className="text-slate-600">
              Seu acesso ao portal está temporariamente suspenso. 
              Entre em contato com seu advogado para mais informações.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">Portal do Cliente</h1>
                <p className="text-xs text-slate-500">Acompanhe seus processos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{portal?.client_name}</p>
                <p className="text-xs text-slate-500">{portal?.client_email}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Boas-vindas */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  Olá, {portal?.client_name?.split(' ')[0]}! 👋
                </h2>
                <p className="text-blue-100 max-w-xl">
                  Bem-vindo ao seu portal personalizado. Aqui você pode acompanhar o andamento 
                  dos seus processos, receber atualizações e se comunicar diretamente com sua equipe jurídica.
                </p>
              </div>
              <div className="hidden md:block">
                <Heart className="w-12 h-12 text-blue-200 opacity-50" />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-blue-500/30">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">{cases.length} processo(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="text-sm">{updates.length} atualização(ões)</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">{messages.length} mensagem(ns)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navegação por abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-slate-200 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg">
              <FileText className="w-4 h-4 mr-2" />
              Meus Processos
            </TabsTrigger>
            <TabsTrigger value="updates" className="rounded-lg">
              <Bell className="w-4 h-4 mr-2" />
              Atualizações
              {updates.length > 0 && (
                <Badge className="ml-2 bg-blue-600">{updates.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-lg">
              <MessageSquare className="w-4 h-4 mr-2" />
              Mensagens
            </TabsTrigger>
          </TabsList>

          {/* Aba de Processos */}
          <TabsContent value="overview" className="space-y-4">
            {cases.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Nenhum processo vinculado ao seu portal ainda.</p>
                </CardContent>
              </Card>
            ) : (
              cases.map((caseItem) => {
                const status = statusLabels[caseItem.status] || statusLabels.new;
                const StatusIcon = status.icon;
                
                return (
                  <Card key={caseItem.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={status.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                            {caseItem.priority === 'urgent' && (
                              <Badge variant="destructive">Urgente</Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-1">
                            {caseItem.title}
                          </h3>
                          {caseItem.case_number && (
                            <p className="text-sm text-slate-500 font-mono">
                              Nº {caseItem.case_number}
                            </p>
                          )}
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                          <Scale className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>

                      {caseItem.description && (
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                          {caseItem.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Área</p>
                          <p className="text-sm font-medium text-slate-900 capitalize">
                            {caseItem.area || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Tribunal/Vara</p>
                          <p className="text-sm font-medium text-slate-900">
                            {caseItem.court || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Início</p>
                          <p className="text-sm font-medium text-slate-900">
                            {caseItem.start_date 
                              ? formatLocalDate(caseItem.start_date)
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Valor da Causa</p>
                          <p className="text-sm font-medium text-slate-900">
                            {caseItem.value 
                              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(caseItem.value)
                              : '-'}
                          </p>
                        </div>
                      </div>

                      {caseItem.deadline && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-amber-600" />
                          <div>
                            <p className="text-xs text-amber-600 font-medium">Próximo Prazo Importante</p>
                            <p className="text-sm text-amber-800">
                              {formatLocalDate(caseItem.deadline, "dd 'de' MMMM 'de' yyyy")}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Aba de Atualizações */}
          <TabsContent value="updates" className="space-y-4">
            {updates.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Nenhuma atualização disponível no momento.</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Você será notificado quando houver novidades nos seus processos.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {updates.map((update) => (
                  <Card key={update.id} className="border-0 shadow-lg">
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          update.update_type === 'milestone' ? 'bg-emerald-100' :
                          update.update_type === 'deadline' ? 'bg-red-100' :
                          update.update_type === 'hearing_scheduled' ? 'bg-purple-100' :
                          'bg-blue-100'
                        }`}>
                          {update.update_type === 'milestone' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : update.update_type === 'deadline' ? (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <Bell className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-semibold text-slate-900">{update.title}</h4>
                            <span className="text-xs text-slate-500">
                              {formatLocalDate(update.created_date)}
                            </span>
                          </div>
                          <p className="text-slate-600 text-sm">{update.content}</p>
                          {update.author_name && (
                            <p className="text-xs text-slate-400 mt-2">
                              Por: {update.author_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba de Mensagens */}
          <TabsContent value="messages">
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Converse com sua Equipe Jurídica
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Área de mensagens */}
                <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Nenhuma mensagem ainda</p>
                        <p className="text-sm text-slate-400 mt-1">
                          Envie uma mensagem para iniciar a conversa
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${
                          msg.sender_type === 'client'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-md'
                            : 'bg-white text-slate-900 rounded-2xl rounded-bl-md shadow-sm border border-slate-100'
                        } p-4`}>
                          {msg.sender_type !== 'client' && (
                            <p className="text-xs font-medium text-blue-600 mb-1">
                              {msg.sender_name || 'Equipe Jurídica'}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-2 ${
                            msg.sender_type === 'client' ? 'text-blue-200' : 'text-slate-400'
                          }`}>
                            {formatLocalDateTime(msg.created_date, "dd/MM 'às' HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Campo de envio */}
                {portal?.permissions?.send_messages !== false && (
                  <div className="p-4 border-t border-slate-100 bg-white">
                    <div className="flex gap-3">
                      <Textarea
                        placeholder="Digite sua mensagem aqui..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[60px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && newMessage.trim()) {
                            e.preventDefault();
                            sendMessageMutation.mutate(newMessage);
                          }
                        }}
                      />
                      <Button
                        onClick={() => newMessage.trim() && sendMessageMutation.mutate(newMessage)}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Pressione Enter para enviar ou Shift+Enter para nova linha
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>

        {/* Rodapé com contato */}
        <div className="mt-12 mb-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Precisa de ajuda?</h3>
                  <p className="text-slate-300 text-sm">
                    Nossa equipe está pronta para atendê-lo. Entre em contato!
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                    <Phone className="w-4 h-4 mr-2" />
                    Ligar
                  </Button>
                  <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Copyright */}
        <div className="text-center py-6 text-sm text-slate-400">
          <p>Portal seguro • Seus dados estão protegidos</p>
          <p className="mt-1">© {new Date().getFullYear()} Juris - Todos os direitos reservados</p>
        </div>
      </main>
    </div>
  );
}
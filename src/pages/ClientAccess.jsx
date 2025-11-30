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
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Phone,
  Mail,
  User,
  Briefcase,
  Calendar,
  Shield,
  Heart,
  Loader2,
  ArrowRight,
  Bell
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function ClientAccess() {
  const [accessToken, setAccessToken] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  // Pegar token da URL
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const token = pathParts[pathParts.length - 1];
    if (token && token !== 'ClientAccess') {
      setAccessToken(token);
    }
  }, []);

  // Buscar dados do portal
  const { data: portalAccess, isLoading: loadingPortal } = useQuery({
    queryKey: ['client-access', accessToken],
    queryFn: async () => {
      const portals = await base44.entities.ClientPortalAccess.filter({ access_token: accessToken });
      return portals[0] || null;
    },
    enabled: !!accessToken,
  });

  // Buscar casos do cliente
  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['client-cases', portalAccess?.case_ids],
    queryFn: async () => {
      if (!portalAccess?.case_ids?.length) return [];
      const allCases = [];
      for (const caseId of portalAccess.case_ids) {
        try {
          const caseData = await base44.entities.Case.filter({ id: caseId });
          if (caseData[0]) allCases.push(caseData[0]);
        } catch (e) {
          console.error(e);
        }
      }
      return allCases;
    },
    enabled: !!portalAccess?.case_ids?.length,
  });

  // Buscar atualizações
  const { data: updates = [] } = useQuery({
    queryKey: ['client-updates', portalAccess?.case_ids],
    queryFn: async () => {
      if (!portalAccess?.case_ids?.length) return [];
      const allUpdates = [];
      for (const caseId of portalAccess.case_ids) {
        const caseUpdates = await base44.entities.CaseUpdate.filter({ 
          case_id: caseId, 
          is_visible_to_client: true 
        });
        allUpdates.push(...caseUpdates);
      }
      return allUpdates.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!portalAccess?.case_ids?.length,
  });

  // Buscar mensagens
  const { data: messages = [] } = useQuery({
    queryKey: ['client-messages', portalAccess?.id],
    queryFn: () => base44.entities.ClientMessage.filter({ client_portal_id: portalAccess.id }, 'created_date'),
    enabled: !!portalAccess?.id,
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !portalAccess) return;
    
    setIsSending(true);
    try {
      await base44.entities.ClientMessage.create({
        case_id: portalAccess.case_ids[0],
        client_portal_id: portalAccess.id,
        sender_type: "client",
        sender_name: portalAccess.client_name,
        sender_email: portalAccess.client_email,
        content: newMessage.trim(),
      });
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['client-messages'] });
      toast.success("Mensagem enviada com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsSending(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      new: { label: "Novo", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
      in_progress: { label: "Em Andamento", color: "bg-blue-100 text-blue-800", icon: Clock },
      waiting: { label: "Aguardando", color: "bg-amber-100 text-amber-800", icon: AlertCircle },
      closed: { label: "Concluído", color: "bg-gray-100 text-gray-800", icon: CheckCircle2 },
      archived: { label: "Arquivado", color: "bg-gray-100 text-gray-500", icon: FileText },
    };
    return statusMap[status] || statusMap.new;
  };

  // Loading state
  if (loadingPortal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando seu portal...</p>
        </div>
      </div>
    );
  }

  // Portal não encontrado ou inativo
  if (!accessToken || !portalAccess || !portalAccess.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Scale className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Portal do Cliente
          </h1>
          <p className="text-gray-600 mb-6">
            {!accessToken 
              ? "Por favor, utilize o link fornecido pelo seu advogado para acessar o portal."
              : "Este acesso não está disponível. Entre em contato com seu advogado para obter um novo link."}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Acesso seguro e confidencial</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Portal do Cliente</h1>
                <p className="text-sm text-gray-500">Acompanhe seu processo</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">{portalAccess.client_name}</p>
              <p className="text-sm text-gray-500">{portalAccess.client_email}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Heart className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Olá, {portalAccess.client_name?.split(' ')[0]}! 👋
                </h2>
                <p className="text-blue-100 leading-relaxed">
                  Seja bem-vindo(a) ao seu portal exclusivo. Aqui você pode acompanhar todas as atualizações 
                  do seu processo e entrar em contato conosco de forma rápida e segura. Estamos trabalhando 
                  para defender seus interesses da melhor forma possível.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{cases.length}</p>
                  <p className="text-sm text-gray-500">Processo(s) em acompanhamento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{updates.length}</p>
                  <p className="text-sm text-gray-500">Atualização(ões) recentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
                  <p className="text-sm text-gray-500">Mensagem(ns) trocadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cases" className="space-y-6">
          <TabsList className="bg-white border shadow-sm p-1">
            <TabsTrigger value="cases" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Meus Processos
            </TabsTrigger>
            <TabsTrigger value="updates" className="gap-2">
              <Bell className="w-4 h-4" />
              Atualizações
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Contato
            </TabsTrigger>
          </TabsList>

          {/* Tab: Casos */}
          <TabsContent value="cases">
            <div className="space-y-4">
              {loadingCases ? (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-500">Carregando processos...</p>
                  </CardContent>
                </Card>
              ) : cases.length === 0 ? (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-8 text-center">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum processo encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                cases.map((caseItem) => {
                  const statusInfo = getStatusInfo(caseItem.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <Card key={caseItem.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
                                <Scale className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {caseItem.title || caseItem.data?.title}
                                </h3>
                                {(caseItem.case_number || caseItem.data?.case_number) && (
                                  <p className="text-sm text-gray-500 font-mono mb-2">
                                    Nº {caseItem.case_number || caseItem.data?.case_number}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  <Badge className={statusInfo.color}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusInfo.label}
                                  </Badge>
                                  <Badge variant="outline" className="capitalize">
                                    {caseItem.area || caseItem.data?.area}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="md:text-right space-y-2">
                            {(caseItem.court || caseItem.data?.court) && (
                              <div className="flex items-center gap-2 md:justify-end text-sm text-gray-600">
                                <Briefcase className="w-4 h-4" />
                                {caseItem.court || caseItem.data?.court}
                              </div>
                            )}
                            {caseItem.created_date && (
                              <div className="flex items-center gap-2 md:justify-end text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                Desde {format(new Date(caseItem.created_date), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                            )}
                          </div>
                        </div>

                        {(caseItem.description || caseItem.data?.description) && (
                          <p className="mt-4 text-gray-600 text-sm bg-gray-50 rounded-lg p-4">
                            {caseItem.description || caseItem.data?.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Tab: Atualizações */}
          <TabsContent value="updates">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Histórico de Atualizações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {updates.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhuma atualização disponível ainda</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Você será notificado quando houver novidades em seu processo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {updates.map((update, index) => (
                      <div 
                        key={update.id} 
                        className={`relative pl-6 pb-6 ${index !== updates.length - 1 ? 'border-l-2 border-gray-200' : ''}`}
                      >
                        <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{update.title}</h4>
                            <span className="text-xs text-gray-500">
                              {format(new Date(update.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">{update.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Contato */}
          <TabsContent value="contact">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Chat */}
              <Card className="border-0 shadow-md">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Enviar Mensagem
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Messages List */}
                  <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center">
                        <div>
                          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Nenhuma mensagem ainda</p>
                          <p className="text-xs text-gray-400">Envie sua primeira mensagem abaixo</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                            msg.sender_type === 'client'
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white text-gray-900 border rounded-bl-md'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${
                              msg.sender_type === 'client' ? 'text-blue-200' : 'text-gray-400'
                            }`}>
                              {format(new Date(msg.created_date), "dd/MM HH:mm")}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t bg-white">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Digite sua mensagem aqui..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[60px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Pressione Enter para enviar ou Shift+Enter para nova linha
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Info Card */}
              <div className="space-y-4">
                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Seu Advogado</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Estamos à disposição para esclarecer qualquer dúvida sobre seu processo.
                        </p>
                        <div className="space-y-2">
                          <a 
                            href="mailto:contato@escritorio.com"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Mail className="w-4 h-4" />
                            Enviar email
                          </a>
                          <a 
                            href="tel:+5511999999999"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Phone className="w-4 h-4" />
                            Ligar agora
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      Seu processo está seguro
                    </h3>
                    <ul className="space-y-3 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>Acompanhamos cada etapa do seu processo</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>Você será notificado de todas as movimentações importantes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>Seus dados são protegidos com sigilo profissional</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>Atendimento humanizado e personalizado</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-amber-50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Dúvidas frequentes?
                    </h3>
                    <p className="text-sm text-amber-700 mb-3">
                      Se tiver alguma dúvida sobre o andamento do seu processo, não hesite em nos contatar. 
                      Estamos aqui para ajudar!
                    </p>
                    <Button 
                      variant="outline" 
                      className="border-amber-300 text-amber-800 hover:bg-amber-100"
                      onClick={() => {
                        const tabsElement = document.querySelector('[data-state="active"]');
                        if (tabsElement) {
                          setNewMessage("Olá, gostaria de tirar uma dúvida sobre meu processo.");
                        }
                      }}
                    >
                      Enviar mensagem
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t bg-white/80 backdrop-blur-sm py-6">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scale className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Portal do Cliente</span>
          </div>
          <p className="text-sm text-gray-500">
            Seu acesso seguro e confidencial para acompanhar seu processo jurídico
          </p>
          <p className="text-xs text-gray-400 mt-2">
            © {new Date().getFullYear()} - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Smartphone, CheckCircle2, AlertCircle, ExternalLink, Bot, Clock, Users, Zap, Settings, Save, Plus, X, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function WhatsAppBot({ theme }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [newService, setNewService] = useState("");
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  
  const [formData, setFormData] = useState({
    agent_name: "",
    greeting_message: "",
    office_name: "",
    office_hours: "Segunda a Sexta, 9h às 18h",
    services_offered: [],
    custom_instructions: "",
    collect_appointment_info: true,
    response_tone: "profissional",
    is_active: false
  });

  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: async () => {
      const configs = await base44.entities.WhatsAppAgentConfig.filter({});
      return configs[0] || null;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (config) {
      setFormData({
        agent_name: config.agent_name || "",
        greeting_message: config.greeting_message || "",
        office_name: config.office_name || "",
        office_hours: config.office_hours || "Segunda a Sexta, 9h às 18h",
        services_offered: config.services_offered || [],
        custom_instructions: config.custom_instructions || "",
        collect_appointment_info: config.collect_appointment_info !== false,
        response_tone: config.response_tone || "profissional",
        is_active: config.is_active || false
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (config) {
        return await base44.entities.WhatsAppAgentConfig.update(config.id, data);
      } else {
        return await base44.entities.WhatsAppAgentConfig.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['whatsapp-config']);
      toast.success('Configurações salvas com sucesso!');
      setShowConfig(false);
    }
  });

  const handleSave = async () => {
    if (!formData.agent_name || !formData.office_name) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    saveMutation.mutate(formData);
  };

  const addService = () => {
    if (newService.trim()) {
      setFormData({
        ...formData,
        services_offered: [...formData.services_offered, newService.trim()]
      });
      setNewService("");
    }
  };

  const removeService = (index) => {
    setFormData({
      ...formData,
      services_offered: formData.services_offered.filter((_, i) => i !== index)
    });
  };

  const webhookUrl = `${Deno.env.get('PUBLIC_URL') || window.location.origin}/api/functions/whatsappWebhook`;

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copiado!');
  };

  const features = [
    {
      icon: Users,
      title: "Recepção Personalizada",
      description: "Configure a mensagem de boas-vindas e o nome do assistente"
    },
    {
      icon: MessageSquare,
      title: "Respostas Automáticas",
      description: "Defina os serviços e horários que o assistente informará"
    },
    {
      icon: Clock,
      title: "Coleta de Agendamentos",
      description: "Configure se deseja coletar informações para agendamentos"
    },
    {
      icon: Zap,
      title: "Tom Personalizável",
      description: "Escolha entre tom formal, amigável ou profissional"
    }
  ];

  if (isLoading || configLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (showConfig) {
    return (
      <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Configurar Assistente WhatsApp
            </h1>
            <Button variant="outline" onClick={() => setShowConfig(false)}>
              Voltar
            </Button>
          </div>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="agent_name">Nome do Assistente *</Label>
                <Input
                  id="agent_name"
                  value={formData.agent_name}
                  onChange={(e) => setFormData({...formData, agent_name: e.target.value})}
                  placeholder="Ex: Assistente Jurídico"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="office_name">Nome do Escritório *</Label>
                <Input
                  id="office_name"
                  value={formData.office_name}
                  onChange={(e) => setFormData({...formData, office_name: e.target.value})}
                  placeholder="Ex: Silva & Advogados"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="office_hours">Horário de Atendimento</Label>
                <Input
                  id="office_hours"
                  value={formData.office_hours}
                  onChange={(e) => setFormData({...formData, office_hours: e.target.value})}
                  placeholder="Ex: Segunda a Sexta, 9h às 18h"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="response_tone">Tom das Respostas</Label>
                <Select 
                  value={formData.response_tone} 
                  onValueChange={(value) => setFormData({...formData, response_tone: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="amigavel">Amigável</SelectItem>
                    <SelectItem value="profissional">Profissional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Mensagem de Boas-Vindas
              </CardTitle>
              <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                Personalize a primeira mensagem que os clientes receberão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.greeting_message}
                onChange={(e) => setFormData({...formData, greeting_message: e.target.value})}
                placeholder="Ex: Olá! Seja bem-vindo ao nosso escritório. Como posso ajudá-lo hoje?"
                rows={4}
              />
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Serviços Oferecidos
              </CardTitle>
              <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                Liste os serviços que seu escritório oferece
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="Ex: Direito Civil"
                  onKeyPress={(e) => e.key === 'Enter' && addService()}
                />
                <Button onClick={addService} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.services_offered.map((service, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {service}
                    <button onClick={() => removeService(index)} className="ml-1 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Instruções Personalizadas
              </CardTitle>
              <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                Adicione instruções específicas para o comportamento do assistente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.custom_instructions}
                onChange={(e) => setFormData({...formData, custom_instructions: e.target.value})}
                placeholder="Ex: Sempre mencionar que temos consultoria gratuita na primeira visita..."
                rows={5}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowConfig(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
              <MessageSquare className="w-7 h-7 text-green-600" />
            </div>
          </div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Meu Assistente WhatsApp
          </h1>
          <p className={`text-lg ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            Configure e conecte seu assistente virtual personalizado
          </p>
        </motion.div>

        {!config ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
              <CardHeader className="text-center">
                <Bot className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                  Configure Seu Primeiro Assistente
                </CardTitle>
                <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                  Personalize seu assistente virtual antes de conectar ao WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button size="lg" onClick={() => setShowConfig(true)} className="bg-green-600 hover:bg-green-700">
                  <Settings className="w-5 h-5 mr-2" />
                  Começar Configuração
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                        {config.agent_name}
                      </CardTitle>
                      <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                        {config.office_name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={config.is_active ? "text-green-600 border-green-600" : "text-yellow-600 border-yellow-600"}>
                        {config.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                        {config.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Horário de Atendimento
                    </p>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      {config.office_hours}
                    </p>
                  </div>

                  {config.services_offered?.length > 0 && (
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Serviços Oferecidos
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {config.services_offered.map((service, idx) => (
                          <Badge key={idx} variant="secondary">{service}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button 
                      size="lg" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setShowSetupDialog(true)}
                    >
                      <Smartphone className="w-5 h-5 mr-2" />
                      Como Conectar Meu WhatsApp
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                    
                    {config?.whatsapp_phone_number_id && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-medium">WhatsApp Conectado</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          Seu número está recebendo mensagens automaticamente
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
                <CardHeader>
                  <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                    Funcionalidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                            <feature.icon className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {feature.title}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Dialog de Configuração */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">🚀 Conectar Seu Número WhatsApp Business</DialogTitle>
            <DialogDescription>
              Configure seu próprio número brasileiro com IA em 3 passos simples
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8">
            {/* Passo 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
                <h3 className="font-semibold text-lg">Criar Aplicação no Meta for Developers</h3>
              </div>
              
              <div className="ml-11 space-y-3">
                <p className="text-sm text-gray-600">
                  Acesse o portal da Meta e crie sua aplicação WhatsApp Business:
                </p>
                
                <a 
                  href="https://developers.facebook.com/apps/create/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Meta for Developers
                </a>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Dentro do portal:</p>
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Clique em "Create App" (Criar aplicativo)</li>
                    <li>Escolha tipo: <strong>"Business"</strong></li>
                    <li>Preencha nome do app (ex: "Assistente Escritório")</li>
                    <li>Na lista de produtos, adicione <strong>"WhatsApp"</strong></li>
                    <li>Configure seu número de telefone brasileiro</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</div>
                <h3 className="font-semibold text-lg">Copiar Credenciais da API</h3>
              </div>
              
              <div className="ml-11 space-y-3">
                <p className="text-sm text-gray-600">
                  No painel do Meta, vá em <strong>WhatsApp → API Setup</strong> e copie:
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-900 mb-2">📋 Informações necessárias:</p>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li><strong>Temporary Access Token</strong> → Gere um token permanente</li>
                    <li><strong>Phone Number ID</strong> → Copie o ID do dropdown</li>
                    <li><strong>WhatsApp Business Account ID</strong> → Copie se disponível</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">3</div>
                <h3 className="font-semibold text-lg">Configurar Webhook</h3>
              </div>
              
              <div className="ml-11 space-y-3">
                <p className="text-sm text-gray-600 mb-2">
                  No Meta, vá em <strong>WhatsApp → Configuration → Webhook</strong>:
                </p>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">URL do Callback (cole no Meta)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={webhookUrl} readOnly className="font-mono text-xs bg-gray-50" />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                      >
                        {copiedField === 'webhook' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">No painel da Meta:</p>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Cole a URL do webhook acima</li>
                      <li>Cole o mesmo "Token de Verificação" que você definiu</li>
                      <li>Clique em "Verify and Save"</li>
                      <li>Em "Webhook fields", marque: <strong>messages</strong></li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            {/* Status da conexão */}
            {config?.whatsapp_phone_number_id && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">WhatsApp Conectado com Sucesso!</span>
                </div>
                <p className="text-sm text-green-600">
                  Seu número está ativo. Teste enviando uma mensagem para verificar.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setShowSetupDialog(false)}
                className="flex-1"
              >
                Fechar
              </Button>
              <a 
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Documentação Meta
                </Button>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
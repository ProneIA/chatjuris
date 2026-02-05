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
    is_active: false,
    whatsapp_access_token: "",
    whatsapp_phone_number_id: "",
    whatsapp_webhook_verify_token: "",
    whatsapp_business_account_id: ""
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
        is_active: config.is_active || false,
        whatsapp_access_token: config.whatsapp_access_token || "",
        whatsapp_phone_number_id: config.whatsapp_phone_number_id || "",
        whatsapp_webhook_verify_token: config.whatsapp_webhook_verify_token || "",
        whatsapp_business_account_id: config.whatsapp_business_account_id || ""
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

  const webhookUrl = `${window.location.origin}/api/functions/whatsappWebhook`;

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

          {/* Configuração WhatsApp API */}
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Smartphone className="w-5 h-5" />
                Credenciais WhatsApp Business API
              </CardTitle>
              <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                Configure as credenciais do seu número
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Token de Acesso Permanente *</Label>
                <Input
                  value={formData.whatsapp_access_token || ''}
                  onChange={(e) => setFormData({...formData, whatsapp_access_token: e.target.value})}
                  placeholder="Cole o token da Meta aqui"
                  type="password"
                />
              </div>

              <div>
                <Label>Phone Number ID *</Label>
                <Input
                  value={formData.whatsapp_phone_number_id || ''}
                  onChange={(e) => setFormData({...formData, whatsapp_phone_number_id: e.target.value})}
                  placeholder="ID do seu número WhatsApp"
                />
              </div>

              <div>
                <Label>Token de Verificação do Webhook *</Label>
                <Input
                  value={formData.whatsapp_webhook_verify_token || ''}
                  onChange={(e) => setFormData({...formData, whatsapp_webhook_verify_token: e.target.value})}
                  placeholder="Crie um token único (ex: meu_token_123)"
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                  Use o mesmo token ao configurar o webhook na Meta
                </p>
              </div>

              <div>
                <Label>Business Account ID (opcional)</Label>
                <Input
                  value={formData.whatsapp_business_account_id || ''}
                  onChange={(e) => setFormData({...formData, whatsapp_business_account_id: e.target.value})}
                  placeholder="ID da conta business"
                />
              </div>

              <div>
                <Label>URL do Webhook (copie para a Meta)</Label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-xs bg-gray-100" />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                  >
                    {copiedField === 'webhook' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowSetupDialog(true)}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Ver Guia Passo a Passo
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowConfig(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Tudo'}
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
            Conecte seu número brasileiro com IA
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
                  Configure Seu Assistente WhatsApp
                </CardTitle>
                <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                  Use seu próprio número brasileiro com IA personalizada
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
                      {config?.whatsapp_phone_number_id ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Conectado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Não Conectado
                        </Badge>
                      )}
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

                  {!config?.whatsapp_phone_number_id && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900 mb-1">
                            WhatsApp não conectado
                          </p>
                          <p className="text-xs text-yellow-800">
                            Configure as credenciais do WhatsApp Business API para ativar seu assistente
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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

      {/* Dialog de Setup */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">🚀 Conectar Seu Número WhatsApp Business</DialogTitle>
            <DialogDescription>
              Configure seu próprio número brasileiro com IA em 3 passos
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
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Crie uma <strong>"Business App"</strong></li>
                    <li>Adicione o produto <strong>"WhatsApp"</strong></li>
                    <li>Configure seu <strong>número brasileiro</strong></li>
                    <li>Vá para <strong>WhatsApp → API Setup</strong></li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</div>
                <h3 className="font-semibold text-lg">Copiar Credenciais</h3>
              </div>
              
              <div className="ml-11 space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-900 mb-2">📋 No Meta, copie:</p>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li><strong>Access Token</strong> (gere um permanente)</li>
                    <li><strong>Phone Number ID</strong></li>
                    <li>Crie um <strong>Token de Verificação</strong> único</li>
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
                <div>
                  <Label className="text-xs text-gray-500">Cole esta URL no Meta (Configuration → Webhook)</Label>
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
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Vá em <strong>WhatsApp → Configuration → Webhook</strong></li>
                    <li>Cole a URL acima</li>
                    <li>Cole seu Token de Verificação</li>
                    <li>Clique <strong>"Verify and Save"</strong></li>
                    <li>Marque o campo: <strong>messages</strong></li>
                  </ol>
                </div>
              </div>
            </div>

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
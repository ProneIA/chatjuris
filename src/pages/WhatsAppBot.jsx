import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Smartphone, CheckCircle2, AlertCircle, ExternalLink, Bot, Clock, Users, Zap, Settings, Save, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function WhatsAppBot({ theme }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [newService, setNewService] = useState("");
  
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

  const agentName = 'whatsapp_assistant';
  const whatsappURL = base44.agents.getWhatsAppConnectURL(agentName);

  const syncAgent = async () => {
    try {
      await base44.functions.invoke('syncWhatsAppAgent');
      toast.success('Configurações sincronizadas! Conecte seu WhatsApp.');
    } catch (error) {
      toast.error('Erro ao sincronizar: ' + error.message);
    }
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
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={syncAgent}
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Sincronizar Configurações
                    </Button>
                    <a href={whatsappURL} target="_blank" rel="noopener noreferrer" className="block">
                      <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <Smartphone className="w-5 h-5 mr-2" />
                        Conectar WhatsApp Business
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
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
    </div>
  );
}
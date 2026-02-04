import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Smartphone, CheckCircle2, AlertCircle, ExternalLink, Bot, Clock, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function WhatsAppBot({ theme }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isDark = theme === 'dark';

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const whatsappURL = base44.agents.getWhatsAppConnectURL('whatsapp_receptionist');

  const features = [
    {
      icon: Users,
      title: "Recepção Automática",
      description: "Recepciona clientes 24/7 de forma profissional e amigável"
    },
    {
      icon: MessageSquare,
      title: "Responde Dúvidas",
      description: "Responde perguntas gerais sobre serviços e horários de atendimento"
    },
    {
      icon: Clock,
      title: "Coleta Agendamentos",
      description: "Coleta informações para agendamentos que serão confirmados pela equipe"
    },
    {
      icon: Zap,
      title: "Informativos",
      description: "Compartilha novidades e informações relevantes do escritório"
    }
  ];

  const steps = [
    "Clique no botão 'Conectar WhatsApp' abaixo",
    "Você será redirecionado para autorizar a conexão",
    "Escaneie o QR Code com seu WhatsApp Business",
    "Pronto! O assistente já está ativo e pronto para atender"
  ];

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
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
            Assistente WhatsApp
          </h1>
          <p className={`text-lg ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            Recepcionista virtual inteligente para seu escritório
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                    Status da Conexão
                  </CardTitle>
                  <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                    Conecte seu WhatsApp Business para ativar o assistente
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Aguardando Conexão
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <Bot className={`w-5 h-5 mt-0.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <div>
                    <p className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Assistente Configurado
                    </p>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      O agente de IA está pronto. Conecte seu WhatsApp para ativá-lo.
                    </p>
                  </div>
                </div>
              </div>

              <a
                href={whatsappURL}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button 
                  size="lg" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  Conectar WhatsApp Business
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>

              <p className={`text-xs text-center ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                Você será redirecionado para fazer login e autorizar a conexão
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Funcionalidades do Assistente
              </CardTitle>
              <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                O que o assistente virtual pode fazer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
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
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* How to Connect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Como Conectar
              </CardTitle>
              <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                Siga estes passos simples para ativar o assistente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-sm font-medium ${isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
                      {index + 1}
                    </div>
                    <p className={`pt-0.5 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Important Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Observações Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={`flex items-start gap-2 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span>O assistente NÃO tem acesso a dados de clientes ou processos, garantindo privacidade</span>
              </div>
              <div className={`flex items-start gap-2 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span>Agendamentos coletados pelo assistente precisam ser confirmados manualmente pela equipe</span>
              </div>
              <div className={`flex items-start gap-2 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span>O assistente funciona 24/7, mesmo quando você estiver offline</span>
              </div>
              <div className={`flex items-start gap-2 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span>Você precisa de uma conta WhatsApp Business para conectar</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
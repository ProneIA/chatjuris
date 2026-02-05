import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Copy, Check, Sparkles, AlertCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function WhatsAppBot({ theme }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const generateMessage = async () => {
    setGeneratingMessage(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente especializado em comunicação jurídica profissional.

Crie uma mensagem de WhatsApp para um cliente de escritório de advocacia. A mensagem deve:
- Ser profissional mas acessível
- Estar em português brasileiro
- Ser clara e objetiva
- Ter entre 100-200 caracteres
- Ser sobre atualizações processuais, agendamentos ou esclarecimentos gerais

Gere uma mensagem aleatória que um advogado poderia enviar a um cliente.`,
        response_json_schema: {
          type: "object",
          properties: {
            mensagem: { type: "string" }
          }
        }
      });

      setMessageText(response.mensagem);
      toast.success('Mensagem gerada!');
    } catch (error) {
      toast.error('Erro ao gerar mensagem');
      console.error(error);
    } finally {
      setGeneratingMessage(false);
    }
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
    toast.success('Mensagem copiada!');
  };

  const messageTemplates = [
    {
      title: "Atualização de Processo",
      text: "Olá! Temos boas notícias sobre seu processo. Houve uma movimentação favorável. Gostaria de agendar uma conversa para explicar os detalhes?"
    },
    {
      title: "Lembrete de Documentação",
      text: "Oi! Passando para lembrar dos documentos que precisamos para dar andamento ao seu caso. Pode nos enviar até o final da semana?"
    },
    {
      title: "Confirmação de Agendamento",
      text: "Confirmando nosso encontro para amanhã às 14h. Qualquer imprevisto, por favor nos avise com antecedência."
    },
    {
      title: "Resposta Geral",
      text: "Olá! Recebi sua mensagem e já estou analisando. Retorno em breve com uma resposta detalhada. Qualquer urgência, pode ligar."
    }
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
      <div className="max-w-4xl mx-auto space-y-6">
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
            Mensagens WhatsApp
          </h1>
          <p className={`text-lg ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            Crie mensagens profissionais para seus clientes
          </p>
        </motion.div>

        {/* Aviso de Funcionalidade Futura */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>
                  <strong>Em Breve:</strong> Funcionalidade Automática
                </p>
                <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                  No futuro, esta ferramenta enviará mensagens automaticamente via WhatsApp Business API. 
                  Por enquanto, copie e cole manualmente as mensagens geradas.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Editor de Mensagem */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Criar Mensagem
              </CardTitle>
              <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                Escreva ou gere uma mensagem com IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Digite sua mensagem aqui ou clique em 'Gerar com IA'..."
                rows={6}
                className={isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white'}
              />

              <div className="flex gap-2">
                <Button 
                  onClick={generateMessage} 
                  disabled={generatingMessage}
                  variant="outline"
                  className="flex-1"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generatingMessage ? 'Gerando...' : 'Gerar com IA'}
                </Button>
                <Button 
                  onClick={copyMessage} 
                  disabled={!messageText}
                  className="flex-1"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Mensagem
                    </>
                  )}
                </Button>
              </div>

              <div className={`text-xs text-right ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                {messageText.length} caracteres
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Templates Prontos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Templates Prontos
              </CardTitle>
              <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                Clique para usar um modelo pré-definido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {messageTemplates.map((template, index) => (
                  <div
                    key={index}
                    onClick={() => setMessageText(template.text)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                      isDark 
                        ? 'bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <h3 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {template.title}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      {template.text.slice(0, 80)}...
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dicas de Uso */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Dicas de Comunicação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 shrink-0"></div>
                  <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    Seja claro e objetivo nas mensagens
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 shrink-0"></div>
                  <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    Mantenha um tom profissional mas acessível
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 shrink-0"></div>
                  <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    Responda sempre dentro do horário comercial
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 shrink-0"></div>
                  <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    Evite jargões jurídicos complexos em mensagens rápidas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}